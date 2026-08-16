import json
import re
import datetime
from functools import wraps

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .models import Exercise, WorkoutSession
from .security import rate_limit

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_]{3,30}$")
MAX_EXERCISE_NAME_LENGTH = 120
MAX_SETS = 100
MAX_REPS = 500
MAX_WEIGHT = 2000.0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def json_body(request):
    """Safely decode JSON body with maximum size guard (50KB limit)."""
    if len(request.body or b"") > 50 * 1024:
        return None
    try:
        return json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def login_required_json(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "authentication required"}, status=401)
        return view(request, *args, **kwargs)

    return wrapper


def exercise_to_dict(e: Exercise):
    return {
        "id": e.id,
        "name": e.name,
        "sets": e.sets,
        "reps": e.reps,
        "weight": e.weight,
    }


def _iso(value):
    """Normalise date/datetime objects or strings to ISO format."""
    if value is None:
        return None
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def session_to_dict(s: WorkoutSession):
    exercises = list(s.exercises.all())
    volume = sum(e.sets * e.reps * e.weight for e in exercises)
    total_sets = sum(e.sets for e in exercises)
    total_reps = sum(e.sets * e.reps for e in exercises)
    return {
        "id": s.id,
        "date": _iso(s.date),
        "created_at": _iso(s.created_at),
        "exercises": [exercise_to_dict(e) for e in exercises],
        "exercise_count": len(exercises),
        "total_sets": total_sets,
        "total_reps": total_reps,
        "volume": round(volume, 2),
    }


def parse_date(date_str):
    if not date_str:
        return None
    try:
        if isinstance(date_str, datetime.date):
            return date_str
        d = datetime.date.fromisoformat(str(date_str).strip())
        # Enforce sane range
        if datetime.date(2000, 1, 1) <= d <= datetime.date(2100, 1, 1):
            return d
        return None
    except (ValueError, TypeError):
        return None


def sanitize_string(val, max_len=MAX_EXERCISE_NAME_LENGTH):
    if not val or not isinstance(val, str):
        return ""
    # Strip null bytes and normalize whitespace
    cleaned = val.replace("\x00", "").strip()
    return cleaned[:max_len]


# ---------------------------------------------------------------------------
# Page (serves the React SPA)
# ---------------------------------------------------------------------------
@ensure_csrf_cookie
def index(request):
    from django.shortcuts import render

    return render(request, "index.html")


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
@require_http_methods(["POST"])
@rate_limit("register", limit=5, window_seconds=300)
def api_register(request):
    data = json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid payload"}, status=400)

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return JsonResponse({"error": "username and password required"}, status=400)

    if not USERNAME_REGEX.match(username):
        return JsonResponse(
            {
                "error": "username must be 3-30 characters long and contain only letters, numbers, and underscores"
            },
            status=400,
        )

    if User.objects.filter(username__iexact=username).exists():
        return JsonResponse({"error": "username already taken"}, status=409)

    try:
        validate_password(password)
    except DjangoValidationError as exc:
        return JsonResponse({"error": list(exc.messages)}, status=400)

    user = User.objects.create_user(username=username, password=password)
    login(request, user)
    return JsonResponse(
        {"user": {"id": user.id, "username": user.username}}, status=201
    )


@require_http_methods(["POST"])
@rate_limit("login", limit=5, window_seconds=60)
def api_login(request):
    data = json_body(request)
    if data is None:
        return JsonResponse({"error": "invalid payload"}, status=400)

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"error": "invalid credentials"}, status=401)
    login(request, user)
    return JsonResponse({"user": {"id": user.id, "username": user.username}})


@require_http_methods(["POST"])
@login_required_json
def api_logout(request):
    logout(request)
    return JsonResponse({"ok": True})


@login_required_json
def api_me(request):
    user = request.user
    return JsonResponse({"user": {"id": user.id, "username": user.username}})


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------
@login_required_json
def api_sessions(request):
    if request.method == "POST":
        data = json_body(request)
        if data is None:
            return JsonResponse({"error": "invalid payload"}, status=400)

        raw_date = data.get("date")
        d = parse_date(raw_date)
        if not d:
            return JsonResponse(
                {"error": "valid date required (YYYY-MM-DD between 2000 and 2100)"},
                status=400,
            )

        session = WorkoutSession.objects.create(owner=request.user, date=d)
        
        # Optional bulk add exercises
        initial_exercises = data.get("exercises")
        if isinstance(initial_exercises, list):
            for ex in initial_exercises[:50]:  # Cap at 50 exercises per session
                name = sanitize_string(ex.get("name"))
                if name:
                    try:
                        sets = min(MAX_SETS, max(1, int(ex.get("sets", 1) or 1)))
                        reps = min(MAX_REPS, max(1, int(ex.get("reps", 1) or 1)))
                        weight = min(MAX_WEIGHT, max(0.0, float(ex.get("weight", 0) or 0)))
                        Exercise.objects.create(
                            session=session,
                            name=name,
                            sets=sets,
                            reps=reps,
                            weight=weight,
                        )
                    except (ValueError, TypeError):
                        pass

        # Refetch with prefetch
        session = (
            WorkoutSession.objects.filter(id=session.id)
            .prefetch_related("exercises")
            .first()
        )
        return JsonResponse(session_to_dict(session), status=201)

    sessions = (
        WorkoutSession.objects.filter(owner=request.user)
        .prefetch_related("exercises")
        .order_by("-date", "-created_at")[:200]  # Paginated/capped for performance
    )
    return JsonResponse({"sessions": [session_to_dict(s) for s in sessions]})


@login_required_json
def api_session_detail(request, session_id):
    session = (
        WorkoutSession.objects.filter(owner=request.user, id=session_id)
        .prefetch_related("exercises")
        .first()
    )
    if session is None:
        return JsonResponse({"error": "not found"}, status=404)

    if request.method in ["PUT", "PATCH"]:
        data = json_body(request)
        if data is None:
            return JsonResponse({"error": "invalid payload"}, status=400)

        raw_date = data.get("date")
        if raw_date:
            d = parse_date(raw_date)
            if not d:
                return JsonResponse({"error": "invalid date format"}, status=400)
            session.date = d
            session.save()
        return JsonResponse(session_to_dict(session))

    return JsonResponse(session_to_dict(session))


@login_required_json
@require_http_methods(["POST"])
def api_session_duplicate(request, session_id):
    """Duplicate an existing workout session with all its exercises."""
    source_session = (
        WorkoutSession.objects.filter(owner=request.user, id=session_id)
        .prefetch_related("exercises")
        .first()
    )
    if source_session is None:
        return JsonResponse({"error": "session not found"}, status=404)

    data = json_body(request) or {}
    target_date = parse_date(data.get("date")) or datetime.date.today()

    new_session = WorkoutSession.objects.create(owner=request.user, date=target_date)

    exercises_to_create = [
        Exercise(
            session=new_session,
            name=ex.name,
            sets=ex.sets,
            reps=ex.reps,
            weight=ex.weight,
        )
        for ex in source_session.exercises.all()
    ]
    if exercises_to_create:
        Exercise.objects.bulk_create(exercises_to_create)

    new_session = (
        WorkoutSession.objects.filter(id=new_session.id)
        .prefetch_related("exercises")
        .first()
    )
    return JsonResponse(session_to_dict(new_session), status=201)


@login_required_json
@require_http_methods(["DELETE"])
def api_session_delete(request, session_id):
    deleted, _ = WorkoutSession.objects.filter(
        owner=request.user, id=session_id
    ).delete()
    if not deleted:
        return JsonResponse({"error": "not found"}, status=404)
    return JsonResponse({"ok": True})


# ---------------------------------------------------------------------------
# Exercises
# ---------------------------------------------------------------------------
@login_required_json
def api_session_exercises(request, session_id):
    session = WorkoutSession.objects.filter(
        owner=request.user, id=session_id
    ).first()
    if session is None:
        return JsonResponse({"error": "session not found"}, status=404)

    if request.method == "POST":
        data = json_body(request)
        if data is None:
            return JsonResponse({"error": "invalid payload"}, status=400)

        name = sanitize_string(data.get("name"))
        if not name:
            return JsonResponse({"error": "exercise name required"}, status=400)
        try:
            sets = min(MAX_SETS, max(1, int(data.get("sets", 1) or 1)))
            reps = min(MAX_REPS, max(1, int(data.get("reps", 1) or 1)))
            weight = min(MAX_WEIGHT, max(0.0, float(data.get("weight", 0) or 0)))
        except (ValueError, TypeError):
            return JsonResponse(
                {"error": "sets/reps must be integers, weight must be a number"},
                status=400,
            )

        exercise = Exercise.objects.create(
            session=session,
            name=name,
            sets=sets,
            reps=reps,
            weight=weight,
        )
        return JsonResponse(exercise_to_dict(exercise), status=201)

    return JsonResponse(
        {"exercises": [exercise_to_dict(e) for e in session.exercises.all()]}
    )


@login_required_json
def api_exercise_detail(request, session_id, exercise_id):
    """Update or retrieve an individual exercise."""
    exercise = Exercise.objects.filter(
        session__owner=request.user, session_id=session_id, id=exercise_id
    ).first()
    if exercise is None:
        return JsonResponse({"error": "exercise not found"}, status=404)

    if request.method in ["PUT", "PATCH"]:
        data = json_body(request)
        if data is None:
            return JsonResponse({"error": "invalid payload"}, status=400)

        if "name" in data:
            name = sanitize_string(data.get("name"))
            if not name:
                return JsonResponse({"error": "exercise name cannot be empty"}, status=400)
            exercise.name = name
        if "sets" in data:
            try:
                exercise.sets = min(MAX_SETS, max(1, int(data.get("sets", 1))))
            except (ValueError, TypeError):
                return JsonResponse({"error": "sets must be an integer >= 1"}, status=400)
        if "reps" in data:
            try:
                exercise.reps = min(MAX_REPS, max(1, int(data.get("reps", 1))))
            except (ValueError, TypeError):
                return JsonResponse({"error": "reps must be an integer >= 1"}, status=400)
        if "weight" in data:
            try:
                exercise.weight = min(MAX_WEIGHT, max(0.0, float(data.get("weight", 0))))
            except (ValueError, TypeError):
                return JsonResponse({"error": "weight must be a positive number"}, status=400)

        exercise.save()
        return JsonResponse(exercise_to_dict(exercise))

    return JsonResponse(exercise_to_dict(exercise))


@login_required_json
@require_http_methods(["DELETE"])
def api_exercise_delete(request, session_id, exercise_id):
    deleted, _ = Exercise.objects.filter(
        session__owner=request.user, session_id=session_id, id=exercise_id
    ).delete()
    if not deleted:
        return JsonResponse({"error": "not found"}, status=404)
    return JsonResponse({"ok": True})


# ---------------------------------------------------------------------------
# Stats & Insights
# ---------------------------------------------------------------------------
@login_required_json
def api_stats(request):
    """Provide summary analytics for the user: total workouts, volume, streak, PRs."""
    user = request.user
    sessions = list(
        WorkoutSession.objects.filter(owner=user)
        .prefetch_related("exercises")
        .order_by("-date")[:100]
    )

    total_workouts = len(sessions)
    total_volume = 0.0
    total_sets = 0
    total_reps = 0

    exercise_prs = {}

    for s in sessions:
        for ex in s.exercises.all():
            vol = ex.sets * ex.reps * ex.weight
            total_volume += vol
            total_sets += ex.sets
            total_reps += ex.sets * ex.reps

            norm_name = ex.name.strip().title()
            if norm_name not in exercise_prs or ex.weight > exercise_prs[norm_name]["weight"]:
                estimated_1rm = ex.weight * (1 + (ex.reps / 30.0)) if ex.reps > 1 else ex.weight
                exercise_prs[norm_name] = {
                    "exercise": norm_name,
                    "weight": ex.weight,
                    "reps": ex.reps,
                    "sets": ex.sets,
                    "estimated_1rm": round(estimated_1rm, 1),
                    "date": _iso(s.date),
                }

    top_prs = sorted(
        exercise_prs.values(), key=lambda x: (x["weight"], x["estimated_1rm"]), reverse=True
    )[:6]

    unique_dates = sorted(
        list(set(s.date for s in sessions)), reverse=True
    )
    streak = 0
    if unique_dates:
        today = datetime.date.today()
        if unique_dates[0] == today or unique_dates[0] == today - datetime.timedelta(days=1):
            curr = unique_dates[0]
            streak = 1
            for d in unique_dates[1:]:
                if curr - d == datetime.timedelta(days=1):
                    streak += 1
                    curr = d
                else:
                    break

    today = datetime.date.today()
    start_of_week = today - datetime.timedelta(days=today.weekday())
    start_of_month = datetime.date(today.year, today.month, 1)

    workouts_this_week = sum(1 for s in sessions if s.date >= start_of_week)
    workouts_this_month = sum(1 for s in sessions if s.date >= start_of_month)

    return JsonResponse(
        {
            "total_workouts": total_workouts,
            "total_volume": round(total_volume, 1),
            "total_sets": total_sets,
            "total_reps": total_reps,
            "streak_days": streak,
            "workouts_this_week": workouts_this_week,
            "workouts_this_month": workouts_this_month,
            "top_prs": top_prs,
        }
    )

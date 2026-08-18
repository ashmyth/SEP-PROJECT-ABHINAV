"""API views for the workouts app: auth, workouts, stats."""

from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Exercise, WorkoutSession
from .permissions import IsOwnerOrDenied
from .serializers import WorkoutSessionSerializer


# --------------------------------------------------------------------------
# Authentication
# --------------------------------------------------------------------------
class RegisterView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""
        confirm = request.data.get("confirm_password") or ""

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if password != confirm:
            return Response(
                {"detail": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(username__iexact=username).exists():
            return Response(
                {"detail": "That username is already taken."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            user = User.objects.create_user(
                username=username, email=email, password=password
            )
            token = Token.objects.create(user=user)

        return Response(
            {
                "token": token.key,
                "user": {"id": user.id, "username": user.username, "email": user.email},
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        from django.contrib.auth import authenticate

        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {"detail": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": {"id": user.id, "username": user.username, "email": user.email},
            }
        )


class LogoutView(APIView):
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"detail": "Logged out."}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    def get(self, request):
        user = request.user
        return Response(
            {"id": user.id, "username": user.username, "email": user.email}
        )


# --------------------------------------------------------------------------
# Workouts
# --------------------------------------------------------------------------
class WorkoutListCreateView(APIView):
    """List the authenticated user's workouts, or create a new one."""

    def get(self, request):
        qs = WorkoutSession.objects.filter(owner=request.user)
        date_filter = request.query_params.get("date")
        if date_filter:
            qs = qs.filter(date=date_filter)
        serializer = WorkoutSessionSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = WorkoutSessionSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WorkoutDetailView(APIView):
    permission_classes = [IsOwnerOrDenied]

    def get_object(self, pk, user):
        return get_object_or_404(WorkoutSession, pk=pk, owner=user)

    def get(self, request, pk):
        workout = self.get_object(pk, request.user)
        self.check_object_permissions(request, workout)
        serializer = WorkoutSessionSerializer(workout)
        return Response(serializer.data)

    def put(self, request, pk):
        workout = self.get_object(pk, request.user)
        self.check_object_permissions(request, workout)
        serializer = WorkoutSessionSerializer(
            workout, data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request, pk):
        workout = self.get_object(pk, request.user)
        self.check_object_permissions(request, workout)
        serializer = WorkoutSessionSerializer(
            workout, data=request.data, partial=True, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        workout = self.get_object(pk, request.user)
        self.check_object_permissions(request, workout)
        workout.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
def workout_stats(request):
    """Aggregate statistics derived from the authenticated user's data."""
    sessions = WorkoutSession.objects.filter(owner=request.user)
    total_workouts = sessions.count()

    from datetime import date, timedelta

    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    this_week = sessions.filter(date__gte=start_of_week).count()

    exercises = Exercise.objects.filter(session__owner=request.user)
    total_exercises = exercises.count()
    total_sets = exercises.aggregate(s=Sum("sets"))["s"] or 0

    total_volume = sum(
        (float(e.sets) * float(e.reps) * float(e.weight)) for e in exercises
    )

    return Response(
        {
            "total_workouts": total_workouts,
            "this_week": this_week,
            "total_exercises": total_exercises,
            "total_sets": total_sets,
            "total_volume": round(total_volume, 2),
        }
    )

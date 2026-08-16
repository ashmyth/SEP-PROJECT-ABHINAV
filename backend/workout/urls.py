from django.urls import path

from . import views

urlpatterns = [
    path("register/", views.api_register, name="register"),
    path("login/", views.api_login, name="login"),
    path("logout/", views.api_logout, name="logout"),
    path("me/", views.api_me, name="me"),
    path("stats/", views.api_stats, name="stats"),
    path("sessions/", views.api_sessions, name="sessions"),
    path(
        "sessions/<int:session_id>/",
        views.api_session_detail,
        name="session-detail",
    ),
    path(
        "sessions/<int:session_id>/duplicate/",
        views.api_session_duplicate,
        name="session-duplicate",
    ),
    path(
        "sessions/<int:session_id>/delete/",
        views.api_session_delete,
        name="session-delete",
    ),
    path(
        "sessions/<int:session_id>/exercises/",
        views.api_session_exercises,
        name="session-exercises",
    ),
    path(
        "sessions/<int:session_id>/exercises/<int:exercise_id>/",
        views.api_exercise_detail,
        name="exercise-detail",
    ),
    path(
        "sessions/<int:session_id>/exercises/<int:exercise_id>/delete/",
        views.api_exercise_delete,
        name="exercise-delete",
    ),
]

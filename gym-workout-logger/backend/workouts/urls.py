"""URL routes for workouts."""

from django.urls import path

from . import views

urlpatterns = [
    path("workouts/", views.WorkoutListCreateView.as_view(), name="workout-list"),
    path(
        "workouts/<int:pk>/",
        views.WorkoutDetailView.as_view(),
        name="workout-detail",
    ),
    path("workouts/stats/", views.workout_stats, name="workout-stats"),
]

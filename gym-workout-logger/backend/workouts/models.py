"""Database models for the workouts app."""

from django.contrib.auth.models import User
from django.db import models


class WorkoutSession(models.Model):
    """A single training session owned by a user, on a given date."""

    date = models.DateField()
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="workout_sessions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.owner.username} — {self.date}"


class Exercise(models.Model):
    """An exercise performed within a workout session."""

    name = models.CharField(max_length=100)
    sets = models.PositiveIntegerField()
    reps = models.PositiveIntegerField()
    weight = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        default=0,
    )
    session = models.ForeignKey(
        WorkoutSession,
        on_delete=models.CASCADE,
        related_name="exercises",
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.name} ({self.sets} x {self.reps})"

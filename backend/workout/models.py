from django.contrib.auth.models import User
from django.db import models


class WorkoutSession(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"Session {self.date} ({self.owner})"


class Exercise(models.Model):
    session = models.ForeignKey(
        WorkoutSession, on_delete=models.CASCADE, related_name="exercises"
    )
    name = models.CharField(max_length=120)
    sets = models.PositiveIntegerField(default=1)
    reps = models.PositiveIntegerField(default=1)
    weight = models.FloatField(default=0)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.name} {self.sets}x{self.reps} @ {self.weight}"

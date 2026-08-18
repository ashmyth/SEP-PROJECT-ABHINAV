"""Django admin configuration for the workouts app."""

from django.contrib import admin

from .models import Exercise, WorkoutSession


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ("date", "owner", "created_at", "exercise_count")
    list_filter = ("date", "owner")
    search_fields = ("owner__username", "date")
    ordering = ("-date",)

    @admin.display(description="Exercises")
    def exercise_count(self, obj):
        return obj.exercises.count()


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ("name", "session", "sets", "reps", "weight", "owner")
    list_filter = ("session__date", "name")
    search_fields = ("name",)

    @admin.display(description="Owner")
    def owner(self, obj):
        return obj.session.owner

from django.contrib import admin

from .models import Exercise, WorkoutSession


class ExerciseInline(admin.TabularInline):
    model = Exercise
    extra = 0


@admin.register(WorkoutSession)
class WorkoutSessionAdmin(admin.ModelAdmin):
    list_display = ("date", "owner", "created_at")
    list_filter = ("date", "owner")
    inlines = [ExerciseInline]


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ("name", "session", "sets", "reps", "weight")
    list_filter = ("name",)

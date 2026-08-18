"""Permission classes for the workouts app."""

from rest_framework import permissions

from .models import WorkoutSession


class IsOwnerOrDenied(permissions.BasePermission):
    """Object-level permission: only the owner may access a workout."""

    def has_object_permission(self, request, view, obj):
        if isinstance(obj, WorkoutSession):
            return obj.owner == request.user
        return obj.session.owner == request.user

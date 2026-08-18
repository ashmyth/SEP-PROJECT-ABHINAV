"""Serializers for the workouts app."""

from rest_framework import serializers

from .models import Exercise, WorkoutSession


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ("id", "name", "sets", "reps", "weight")


class WorkoutSessionSerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True)

    class Meta:
        model = WorkoutSession
        fields = ("id", "date", "owner", "exercises", "created_at", "updated_at")
        read_only_fields = ("owner", "created_at", "updated_at")

    def validate_exercises(self, value):
        if not value:
            raise serializers.ValidationError(
                "A workout needs at least one exercise."
            )
        return value

    def validate(self, attrs):
        # Validate each nested exercise explicitly (sets/reps > 0, name present).
        for ex in attrs.get("exercises", []):
            if not ex.get("name", "").strip():
                raise serializers.ValidationError(
                    {"exercises": "Every exercise needs a name."}
                )
            if int(ex.get("sets", 0)) <= 0:
                raise serializers.ValidationError(
                    {"exercises": "Sets must be greater than zero."}
                )
            if int(ex.get("reps", 0)) <= 0:
                raise serializers.ValidationError(
                    {"exercises": "Reps must be greater than zero."}
                )
            if float(ex.get("weight", 0)) < 0:
                raise serializers.ValidationError(
                    {"exercises": "Weight cannot be negative."}
                )
        return attrs

    def create(self, validated_data):
        from django.db import transaction

        exercises_data = validated_data.pop("exercises")
        with transaction.atomic():
            session = WorkoutSession.objects.create(
                owner=self.context["request"].user, **validated_data
            )
            for ex in exercises_data:
                Exercise.objects.create(session=session, **ex)
        return session

    def update(self, instance, validated_data):
        from django.db import transaction

        exercises_data = validated_data.pop("exercises", None)
        with transaction.atomic():
            instance.date = validated_data.get("date", instance.date)
            instance.save()
            if exercises_data is not None:
                # Replace the exercise set so edits/deletes/additions are reflected.
                instance.exercises.all().delete()
                for ex in exercises_data:
                    Exercise.objects.create(session=instance, **ex)
        return instance

import datetime
from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, Client

from .models import WorkoutSession, Exercise


class WorkoutSecurityAndApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = Client()
        self.user = User.objects.create_user(
            username="athlete1", password="StrongPassword123!"
        )
        self.other_user = User.objects.create_user(
            username="athlete2", password="StrongPassword123!"
        )

    def test_register_validation(self):
        # Valid registration
        res = self.client.post(
            "/api/register/",
            data={"username": "new_lifter", "password": "ComplexPassword999!"},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.json()["user"]["username"], "new_lifter")

        # Invalid username: special characters / script injection
        res_xss = self.client.post(
            "/api/register/",
            data={"username": "<script>alert(1)</script>", "password": "ComplexPassword999!"},
            content_type="application/json",
        )
        self.assertEqual(res_xss.status_code, 400)

        # Invalid username: spaces
        res_space = self.client.post(
            "/api/register/",
            data={"username": "bad user name", "password": "ComplexPassword999!"},
            content_type="application/json",
        )
        self.assertEqual(res_space.status_code, 400)

        # Duplicate username
        res_dup = self.client.post(
            "/api/register/",
            data={"username": "athlete1", "password": "ComplexPassword999!"},
            content_type="application/json",
        )
        self.assertEqual(res_dup.status_code, 409)

    def test_rate_limiting_on_login(self):
        cache.clear()
        # Fire 5 attempts (allowed)
        for _ in range(5):
            res = self.client.post(
                "/api/login/",
                data={"username": "athlete1", "password": "WrongPassword!"},
                content_type="application/json",
            )
            self.assertIn(res.status_code, [401, 200])

        # 6th attempt should trigger 429 Too Many Requests
        res_throttled = self.client.post(
            "/api/login/",
            data={"username": "athlete1", "password": "WrongPassword!"},
            content_type="application/json",
        )
        self.assertEqual(res_throttled.status_code, 429)
        self.assertIn("Retry-After", res_throttled.headers)

    def test_security_headers(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(res.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(res.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin")
        self.assertIn("default-src 'self'", res.headers.get("Content-Security-Policy", ""))
        self.assertEqual(res.headers.get("Cross-Origin-Opener-Policy"), "same-origin")

    def test_unauthenticated_access_denied(self):
        res = self.client.get("/api/sessions/")
        self.assertEqual(res.status_code, 401)
        self.assertEqual(res.json()["error"], "authentication required")

    def test_session_lifecycle_and_bounds(self):
        self.client.force_login(self.user)

        # Create session with valid and clamped values
        res = self.client.post(
            "/api/sessions/",
            data={
                "date": "2026-08-16",
                "exercises": [
                    {"name": "Bench Press", "sets": 3, "reps": 10, "weight": 80.0},
                    {"name": "Incline DB Press", "sets": 3, "reps": 12, "weight": 24.0},
                ],
            },
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        session_id = data["id"]
        self.assertEqual(data["exercise_count"], 2)
        self.assertEqual(data["volume"], 3264.0)

        # Update exercise with bounds check
        ex_id = data["exercises"][0]["id"]
        update_res = self.client.put(
            f"/api/sessions/{session_id}/exercises/{ex_id}/",
            data={"sets": 4, "reps": 10, "weight": 85.0},
            content_type="application/json",
        )
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.json()["weight"], 85.0)

        # Duplicate session
        dup_res = self.client.post(
            f"/api/sessions/{session_id}/duplicate/",
            data={"date": "2026-08-18"},
            content_type="application/json",
        )
        self.assertEqual(dup_res.status_code, 201)
        self.assertEqual(dup_res.json()["exercise_count"], 2)

    def test_user_data_isolation(self):
        self.client.force_login(self.user)
        s = WorkoutSession.objects.create(owner=self.user, date=datetime.date.today())
        e = Exercise.objects.create(session=s, name="Pullups", sets=3, reps=10, weight=0.0)

        # Switch to other_user
        self.client.force_login(self.other_user)
        # Attempt to read, delete or modify User 1's workout
        res = self.client.get(f"/api/sessions/{s.id}/")
        self.assertEqual(res.status_code, 404)

        res_del = self.client.delete(f"/api/sessions/{s.id}/delete/")
        self.assertEqual(res_del.status_code, 404)

        res_ex_del = self.client.delete(f"/api/sessions/{s.id}/exercises/{e.id}/delete/")
        self.assertEqual(res_ex_del.status_code, 404)

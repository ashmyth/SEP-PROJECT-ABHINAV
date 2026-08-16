"""
Django settings for workout_project project.
Production-hardened configuration following OWASP and vibe-security guidelines.
"""

import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
import dj_database_url

# Build paths inside the project: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------------------
# Core Security Settings
# ---------------------------------------------------------------------------
DEBUG = os.environ.get("DJANGO_DEBUG", "True").strip().lower() in ("true", "1", "yes")

# Secret key: Read from environment or fallback safely for local development only
_env_secret_key = os.environ.get("DJANGO_SECRET_KEY")
if _env_secret_key:
    SECRET_KEY = _env_secret_key
elif DEBUG:
    SECRET_KEY = "django-insecure-dev-only-local-key-never-use-in-production-12345"
else:
    raise ImproperlyConfigured(
        "DJANGO_SECRET_KEY environment variable must be set when DEBUG=False in production."
    )

# Allowed hosts
_allowed_hosts_env = os.environ.get("DJANGO_ALLOWED_HOSTS")
if _allowed_hosts_env:
    ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts_env.split(",") if h.strip()]
elif DEBUG:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]", "testserver"]
else:
    ALLOWED_HOSTS = []

# CSRF trusted origins
_csrf_origins_env = os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS")
if _csrf_origins_env:
    CSRF_TRUSTED_ORIGINS = [o.strip() for o in _csrf_origins_env.split(",") if o.strip()]
elif DEBUG:
    CSRF_TRUSTED_ORIGINS = ["http://localhost:8000", "http://127.0.0.1:8000"]
else:
    CSRF_TRUSTED_ORIGINS = []


# ---------------------------------------------------------------------------
# Application Definition
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "workout",
]

# Sibling frontend directory
FRONTEND_DIR = BASE_DIR.parent / "frontend"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "workout.security.SecurityHeadersMiddleware",  # Production CSP & Security Headers
    "whitenoise.middleware.WhiteNoiseMiddleware",  # Efficient static file serving in production
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "workout_project.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [FRONTEND_DIR],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "workout_project.wsgi.application"


# ---------------------------------------------------------------------------
# Database — configured via DATABASE_URL in production (e.g. Postgres on Render)
# ---------------------------------------------------------------------------
DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"
    )
}


# ---------------------------------------------------------------------------
# In-Memory Cache (for rate limiting and throttling)
# ---------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "wod-log-cache",
    }
}


# ---------------------------------------------------------------------------
# Password Validation & Security Policies
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# ---------------------------------------------------------------------------
# Cookie & Transport Security
# ---------------------------------------------------------------------------
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 60 * 60 * 24 * 14  # 14 days session expiry
SESSION_COOKIE_SECURE = not DEBUG

# CSRF token must be readable by JS via cookie for Fetch requests, but SameSite is Lax
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = not DEBUG

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

if not DEBUG:
    SECURE_HSTS_SECONDS = 31536000  # 1 year HSTS
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    if os.environ.get("DJANGO_SECURE_SSL_REDIRECT", "False").lower() in ("true", "1"):
        SECURE_SSL_REDIRECT = True


# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# ---------------------------------------------------------------------------
# Static Files
# ---------------------------------------------------------------------------
STATIC_URL = "static/"
STATICFILES_DIRS = [FRONTEND_DIR]
STATIC_ROOT = BASE_DIR / "staticfiles"
# Whitenoise compresses static assets; run `collectstatic` for production builds.
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"

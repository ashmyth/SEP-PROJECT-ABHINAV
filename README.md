# Gym Workout Logger

A Django REST Framework backend for tracking gym workouts, exercises, sets, and progress.

## Structure

```
SEP-PROJECT-ABHINAV/
└── gym-workout-logger/
    └── backend/
        ├── config/          # Django project settings and root URLs
        ├── workouts/        # Workout tracking app (models, views, serializers)
        ├── manage.py
        └── requirements.txt
```

## Quick Start

### 1. Set Up Virtual Environment

```bash
cd gym-workout-logger/backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run Migrations & Start Server

```bash
python manage.py migrate
python manage.py runserver
```

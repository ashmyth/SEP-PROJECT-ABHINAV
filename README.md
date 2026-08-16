# WOD Log — High Performance Workout Tracker

A self-contained **gym / workout logger** where athletes log training sessions (date,
exercises, sets, reps, weight), track progressive overload, view analytics, and stay
motivated with streaks, PR tracking, and a rest timer.

Built as a **single Django application** that also serves the React frontend — no
separate Node build server (Vite/Next) is required. The whole app runs with
`python manage.py runserver`.

---

## Tech Stack

| Layer        | Technology |
|--------------|------------|
| Backend      | **Django 6** (Python) — JSON API + auth + static/SPA serving |
| Frontend     | **React 18** written with `React.createElement` (no JSX, no Babel) |
| Styling      | **Tailwind CSS 3** (compiled via the Tailwind CLI) |
| Motion       | **Framer Motion** (micro-interactions, list transitions, scroll reveals) + **canvas-confetti** |
| Data         | SQLite by default, swappable to Postgres via `DATABASE_URL` |

### No runtime CDN dependency
React, ReactDOM, Framer Motion, and canvas-confetti are **vendored locally** under
`frontend/vendor/` as UMD bundles and loaded with plain `<script>` tags. The app does
not depend on esm.sh / unpkg at runtime, so it works fully offline and never shows a
blank white screen due to a failed third-party fetch.

---

## Features

- **Authentication** — register, log in, log out. Every session and exercise is scoped
  to its owner.
- **Workout sessions** — create a session for any date and attach multiple exercises.
- **Exercises** — name, sets, reps, and weight (per exercise row, added dynamically).
- **Dashboard analytics** — total volume lifted (kg), sessions this month, current
  training streak, and top personal records (PRs).
- **Rest timer** — preset intervals (60s / 90s / 120s) between sets.
- **Units toggle** — kilograms / pounds.
- **Motion & polish** — Framer Motion page/list transitions, animated counters, and
  confetti on milestone moments. A graceful error overlay replaces any blank white
  screen if the app ever fails to boot.

---

## Project Structure

```
.
├── backend/                      # Django project
│   ├── manage.py
│   ├── requirements.txt          # Django, whitenoise, dj-database-url
│   ├── workout_project/          # settings, urls, wsgi/asgi
│   │   └── settings.py           # env-driven, production-hardened
│   └── workout/                  # the app
│       ├── models.py             # WorkoutSession, Exercise
│       ├── views.py              # JSON API + index view
│       ├── urls.py               # /api/* routes
│       ├── security.py           # CSP + security headers middleware
│       └── migrations/
├── frontend/                     # React SPA (no build step for JS)
│   ├── index.html                # SPA shell, loads vendored libs + CSS
│   ├── app.js                    # the entire React app (React.createElement)
│   ├── input.css                 # Tailwind source + design tokens
│   ├── tailwind.config.js        # OKLCH palette + Inter/Barlow fonts
│   ├── dist/output.css           # compiled CSS (committed)
│   └── vendor/                   # React, ReactDOM, Framer Motion, confetti (UMD)
└── package.json                  # root convenience scripts
```

---

## Getting Started

### Prerequisites
- Python 3.13+
- Node.js + npm (only needed to (re)build Tailwind CSS)
- pip

### 1. Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
python manage.py migrate
```

### 2. Frontend (Tailwind CSS)
```bash
cd frontend
npm install                 # installs tailwindcss
npm run build               # compiles input.css -> dist/output.css (minified)
# npm run dev              # watch mode while editing styles
```

### 3. Run
```bash
# from the repo root
npm start                   # runs: python backend/manage.py runserver 8000
```
Then open **http://localhost:8000**.

> The root `package.json` also exposes `npm run dev`, `npm run build`, and
> `npm test` (`python backend/manage.py test workout`).

---

## How It Works

- Django serves `frontend/index.html` at `/` (the SPA shell) and all frontend assets
  from `frontend/` as static files.
- `frontend/app.js` is a classic script that uses the **globals** provided by the
  vendored UMD bundles (`React`, `ReactDOM`, `Motion`, `confetti`) — no ES module
  imports, no transpilation step.
- REST-style JSON calls go to `/api/*`. The CSRF token is read from the
  `csrftoken` cookie and sent as the `X-CSRFToken` header (the index view is
  decorated with `@ensure_csrf_cookie`).
- Tailwind scans `frontend/app.js` (and `index.html`) via `content` in
  `tailwind.config.js`, so utility classes used in `app.js` are compiled into
  `dist/output.css`.

---

## API Reference

All endpoints are JSON. Auth endpoints are public; everything else requires a logged-in
session (returns `401` otherwise).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register/` | Create account (`username`, `password`) |
| POST | `/api/login/` | Log in (`username`, `password`) |
| POST | `/api/logout/` | Log out |
| GET  | `/api/me/` | Current user (or `401`) |
| GET  | `/api/sessions/` | List the owner's sessions (with exercises) |
| POST | `/api/sessions/` | Create a session (`date`) |
| GET  | `/api/sessions/<id>/` | Session detail |
| POST | `/api/sessions/<id>/exercises/` | Add an exercise (`name`, `sets`, `reps`, `weight`) |
| DELETE | `/api/sessions/<id>/delete/` | Delete a session |
| DELETE | `/api/sessions/<id>/exercises/<eid>/delete/` | Delete an exercise |

---

## Production Deployment

The settings are already production-hardened. Configure via environment variables:

| Variable | Purpose | Default (dev) |
|----------|---------|---------------|
| `DJANGO_SECRET_KEY` | Signing key (required in prod) | insecure dev key |
| `DJANGO_DEBUG` | Debug mode (`true`/`false`) | `true` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hosts | `localhost,127.0.0.1` |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Comma-separated origins | localhost:8000 |
| `DATABASE_URL` | DB connection string | SQLite (`db.sqlite3`) |

Example:
```bash
export DJANGO_DEBUG=false
export DJANGO_SECRET_KEY="$(python -c 'import secrets;print(secrets.token_urlsafe(50))')"
export DJANGO_ALLOWED_HOSTS="wodlog.example.com"
export DATABASE_URL="postgres://user:pass@host:5432/wodlog"
python backend/manage.py migrate
python backend/manage.py collectstatic --noinput   # gathers static for whitenoise
```

Static files are served efficiently by **whitenoise** (`CompressedStaticFilesStorage`),
and transport security (HSTS, secure cookies, CSP, `X-Content-Type-Options`, referrer
policy) is enforced via `workout/security.py`. Run the app behind gunicorn/uWSGI in
production (whitenoise handles static delivery, so no separate static server is needed).

---

## Development Notes

- **Editing styles:** change `frontend/input.css` / `tailwind.config.js`, then
  `npm run build` (or `npm run dev` to watch). The compiled `dist/output.css` is
  committed so the app works without a build step.
- **Editing the UI:** everything lives in `frontend/app.js`. Components are plain
  functions returning `React.createElement(...)` trees — no JSX tooling required.
- **Adding backend features:** extend `workout/models.py`, `views.py`, and `urls.py`,
  then `python manage.py makemigrations && python manage.py migrate`.
- **Tests:** `python backend/manage.py test workout`.

---

## License

MIT

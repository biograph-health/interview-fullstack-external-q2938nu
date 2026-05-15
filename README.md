# Cedar & Stone Steakhouse Reservation Booker

## Apps

- `apps/diner-web` - customer-facing Next.js app (`/`, `/book-reservation`, `/view-reservations`, `/login`) with Auth.js + PostHog baseline.
- `apps/restaurant-console` - restaurant-facing Next.js app with separate management-token access patterns.
- `apps/api` - FastAPI backend with SQLAlchemy + Alembic migrations, auth, availability APIs, user reservation APIs, and pytest tests.

## One-liner to run everything locally (including DB)

Before the interview, make sure Docker Desktop is installed and running. Setup instructions: [Install Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/).

## Local setup script (fixtures + run all apps)

```bash
pnpm local:setup-and-run
```

What it does:
- starts Postgres in Docker
- installs JS and Python dependencies
- runs Alembic migrations
- seeds representative fixtures (tables, users, and sample reservations)
- starts all three apps together via Turbo on different ports:
  - API: `8000`
  - Diner web: `3000`
  - Restaurant console: `3001`
  - Postgres: `55432`

Endpoints:
- Diner web: `http://localhost:3000`
- Restaurant console: `http://localhost:3001`
- API: `http://localhost:8000/api`

## Local auth setup (easy mode)

1. Open `http://localhost:3000/login`.
2. Click **Use demo account** to sign in instantly.
3. Or create an account with your own username/password.
4. Continue to `/book-reservation`.

Demo credentials seeded automatically on startup:
- Username: `demo-user`
- Password: `demo12345`

## Backend API overview

- `GET /api/availability/dates?start=YYYY-MM-DD&stop=YYYY-MM-DD&seats=2`
- `GET /api/availability/times?date=YYYY-MM-DD&seats=2`
- `POST /api/user/reservation` (Bearer token from login)
- `GET /api/user/reservation` (Bearer token)
- `DELETE /api/user/reservation/{id}` (Bearer token)
- `GET /api/management/reservations/upcoming-week` (header `X-Management-Token`)
- `POST /api/auth/register`
- `POST /api/auth/login`

## Testing

```bash
cd apps/api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
pytest
```

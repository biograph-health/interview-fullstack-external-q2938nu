#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
API_ENV_FILE="$API_DIR/.env.local"
LOCAL_COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.local.yml)
USE_DOCKER_APP_RUN="${USE_DOCKER_APP_RUN:-0}"

ensure_env_file() {
  local target_file="$1"
  local example_file="$2"

  if [ -f "$target_file" ]; then
    return
  fi

  if [ ! -f "$example_file" ]; then
    echo "Missing env example file: $example_file"
    exit 1
  fi

  echo "Creating $(basename "$target_file") from $(basename "$example_file")..."
  cp "$example_file" "$target_file"
}

for cmd in docker python3; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd"
    exit 1
  fi
done

if ! command -v pnpm >/dev/null 2>&1; then
  if ! command -v corepack >/dev/null 2>&1; then
    echo "Missing required command: pnpm (or corepack)"
    exit 1
  fi
  corepack enable
  corepack prepare pnpm@10.4.1 --activate
fi
PNPM_CMD="pnpm"

if [ "$USE_DOCKER_APP_RUN" != "1" ]; then
  NODE_VERSION="$(node -v 2>/dev/null || true)"
  if [ -z "$NODE_VERSION" ]; then
    echo "Node.js not found. Falling back to Docker app run mode."
    USE_DOCKER_APP_RUN="1"
  else
    if ! python3 - "$NODE_VERSION" <<'PY'
import sys
version = sys.argv[1].lstrip("v")
parts = [int(x) for x in version.split(".")[:3]]
minimum = [18, 18, 0]
sys.exit(0 if parts >= minimum else 1)
PY
    then
      echo "Detected Node.js ${NODE_VERSION}. Next.js requires >=18.18.0. Falling back to Docker app run mode."
      USE_DOCKER_APP_RUN="1"
    fi
  fi
fi

cd "$ROOT_DIR"

ensure_env_file "$ROOT_DIR/apps/api/.env.local" "$ROOT_DIR/apps/api/.env.example"
ensure_env_file "$ROOT_DIR/apps/diner-web/.env.local" "$ROOT_DIR/apps/diner-web/.env.example"
ensure_env_file "$ROOT_DIR/apps/restaurant-console/.env.local" "$ROOT_DIR/apps/restaurant-console/.env.example"

if [ "$USE_DOCKER_APP_RUN" = "1" ]; then
  echo "Launching all apps via Docker Compose (db + api + diner-web + restaurant-console)..."
  docker compose "${LOCAL_COMPOSE_FILES[@]}" up --build db api diner-web restaurant-console
  exit 0
fi

echo "Starting PostgreSQL container..."
docker compose up -d db

echo "Waiting for PostgreSQL to accept connections..."
until docker compose exec -T db pg_isready -U postgres -d reservations >/dev/null 2>&1; do
  sleep 1
done

if [ "$(docker compose exec -T db psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='reservations'" | tr -d '[:space:]')" != "1" ]; then
  echo "Creating reservations database..."
  docker compose exec -T db psql -U postgres -c "CREATE DATABASE reservations;"
fi

echo "Installing monorepo dependencies..."
$PNPM_CMD install

if [ ! -d "$API_DIR/.venv" ]; then
  echo "Creating Python virtualenv..."
  python3 -m venv "$API_DIR/.venv"
fi

echo "Installing API dependencies..."
source "$API_DIR/.venv/bin/activate"
pip install -r "$API_DIR/requirements.txt"

if [ -f "$API_ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$API_ENV_FILE"
  set +a
fi

echo "Running API migrations..."
(
  cd "$API_DIR"
  alembic upgrade head
  python -m app.seed
)

echo "Database fixtures ready."
echo "Launching API (8000), diner-web (3000), and restaurant-console (3001)..."
echo "Set TURBOPACK=1 before running this script to use Turbopack in both Next.js apps."

$PNPM_CMD dev

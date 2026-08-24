#!/usr/bin/env bash
# Abort if production env is incomplete or still uses placeholders.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT/backend/.env.production}"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: missing $ENV_FILE"
  echo "Copy .env.production.example → backend/.env.production and fill secrets."
  exit 1
fi

fail() { echo "ERROR: $1"; exit 1; }

get() {
  grep -E "^${1}=" "$ENV_FILE" | tail -n1 | cut -d= -f2- | sed 's/^"//;s/"$//'
}

APP_ENV=$(get APP_ENV)
APP_DEBUG=$(get APP_DEBUG)
APP_KEY=$(get APP_KEY)
APP_URL=$(get APP_URL)
DB_PASSWORD=$(get DB_PASSWORD)
REDIS_PASSWORD=$(get REDIS_PASSWORD)

[ "$APP_ENV" = "production" ] || fail "APP_ENV must be production (got '$APP_ENV')"
[ "$APP_DEBUG" = "false" ] || fail "APP_DEBUG must be false"
[ -n "$APP_KEY" ] && [ "$APP_KEY" != "base64:" ] || fail "APP_KEY is empty — run: php artisan key:generate --env=production"
echo "$APP_URL" | grep -q '^https://' || fail "APP_URL must be https://..."

case "$DB_PASSWORD" in
  ""|*YOUR_*|*CHANGE_ME*|*password_2026*) fail "DB_PASSWORD is a placeholder" ;;
esac
case "$REDIS_PASSWORD" in
  ""|*YOUR_*|*CHANGE_ME*|*secret_redis*) fail "REDIS_PASSWORD is a placeholder" ;;
esac

echo "Preflight OK: $ENV_FILE"

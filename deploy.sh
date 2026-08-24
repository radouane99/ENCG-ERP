#!/usr/bin/env bash
# ENCG ERP — production deploy (VPS + Docker Compose)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

BRANCH="${DEPLOY_BRANCH:-docker-v2}"
SKIP_GIT=0
SKIP_FRONTEND=0

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [--no-git] [--skip-frontend] [branch]

  --no-git          Do not git fetch/checkout/pull (CI already updated the tree)
  --skip-frontend   Reuse existing frontend/dist
  branch            Default: docker-v2 (or DEPLOY_BRANCH)
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --no-git) SKIP_GIT=1 ;;
    --skip-frontend) SKIP_FRONTEND=1 ;;
    -h|--help) usage; exit 0 ;;
    *) BRANCH="$1" ;;
  esac
  shift
done

ENV_FILE="$ROOT/backend/.env.production"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml)

echo "==> ENCG ERP deploy (branch=$BRANCH)"

if [ "$SKIP_GIT" -eq 0 ]; then
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE missing. Copy .env.production.example and fill secrets."
  exit 1
fi

if ! grep -qE '^APP_KEY=base64:.+' "$ENV_FILE"; then
  echo "==> Generating APP_KEY"
  if command -v php >/dev/null 2>&1; then
    (cd backend && php artisan key:generate --env=production --force)
  else
    echo "ERROR: APP_KEY empty and php is not installed on the host."
    echo "Set APP_KEY in backend/.env.production then re-run."
    exit 1
  fi
fi

bash "$ROOT/scripts/deploy-preflight.sh" "$ENV_FILE"

if [ -f "$ROOT/certbot/conf/live/encg-erp/fullchain.pem" ] \
   || [ -f "$ROOT/certbot/conf/live/${SSL_DOMAIN:-erp.encg-fes.ac.ma}/fullchain.pem" ]; then
  export NGINX_CONF=prod.conf
else
  export NGINX_CONF=prod-bootstrap.conf
  echo "==> No TLS cert yet — Nginx HTTP bootstrap. After DNS points here: ./scripts/provision-ssl.sh"
fi

if [ "$SKIP_FRONTEND" -eq 0 ]; then
  echo "==> Building frontend"
  (cd frontend && npm ci && npm run build)
fi

echo "==> Starting stack"
"${COMPOSE[@]}" up -d --build --remove-orphans

echo "==> Waiting for Postgres"
for i in $(seq 1 30); do
  if docker exec encg_prod_postgres pg_isready -U "$(grep -E '^DB_USERNAME=' "$ENV_FILE" | cut -d= -f2)" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  [ "$i" -eq 30 ] && echo "ERROR: Postgres not ready" && exit 1
done

echo "==> Laravel migrate + optimize"
docker exec encg_prod_backend composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
docker exec encg_prod_backend php artisan migrate --force --no-interaction
docker exec encg_prod_backend php artisan storage:link || true
docker exec encg_prod_backend php artisan optimize:clear
docker exec encg_prod_backend php artisan config:cache
docker exec encg_prod_backend php artisan route:cache
docker exec encg_prod_backend php artisan view:cache
docker exec encg_prod_backend php artisan event:cache

echo "==> Restart queue worker"
"${COMPOSE[@]}" restart queue-worker scheduler

echo "==> Health"
docker exec encg_prod_backend php artisan --version
echo "OK — stack is up. Check https://$(grep -E '^APP_URL=' "$ENV_FILE" | cut -d= -f2 | sed 's#https://##')/up"
echo "Nginx conf: $NGINX_CONF"

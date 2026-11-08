#!/usr/bin/env bash
# Deploy only digest-addressed images. Rollback requires backward-compatible schema changes.
set -euo pipefail
umask 077

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p .deploy/backups
command -v flock >/dev/null
exec 9>.deploy/deploy.lock
flock -n 9 || { echo "Another release operation is running." >&2; exit 1; }

rollback=0
case "${1:-}" in
  --release) release_file="${2:?A release manifest is required}" ;;
  --rollback)
    release_file="$ROOT/.deploy/previous.env"
    if [ -f .deploy/pending.env ]; then release_file="$ROOT/.deploy/current.env"; fi
    rollback=1
    ;;
  *) echo "Usage: deploy.sh --release manifest.env | --rollback" >&2; exit 1 ;;
esac
[ -f "$release_file" ] || { echo "Release manifest not found." >&2; exit 1; }

read_value() {
  local key="$1"
  [ "$(grep -c "^$key=" "$release_file")" = 1 ] || return 1
  grep "^$key=" "$release_file" | cut -d= -f2-
}
export ERP_BACKEND_IMAGE
export ERP_WEB_IMAGE
export ERP_RELEASE_COMMIT
ERP_BACKEND_IMAGE=$(read_value ERP_BACKEND_IMAGE)
ERP_WEB_IMAGE=$(read_value ERP_WEB_IMAGE)
ERP_RELEASE_COMMIT=$(read_value ERP_RELEASE_COMMIT)
image_pattern='^[a-z0-9.-]+(:[0-9]+)?/[a-z0-9_./-]+@sha256:[a-f0-9]{64}$'
[[ "$ERP_BACKEND_IMAGE" =~ $image_pattern && "$ERP_WEB_IMAGE" =~ $image_pattern ]] ||
  { echo "Both images must use registry digest references." >&2; exit 1; }
[[ "$ERP_RELEASE_COMMIT" =~ ^[a-f0-9]{40}$ ]] || { echo "Invalid release commit." >&2; exit 1; }

git diff --quiet && git diff --cached --quiet
git cat-file -e "$ERP_RELEASE_COMMIT^{commit}"
printf 'ERP_RELEASE_COMMIT=%s\nERP_BACKEND_IMAGE=%s\nERP_WEB_IMAGE=%s\n' \
  "$ERP_RELEASE_COMMIT" "$ERP_BACKEND_IMAGE" "$ERP_WEB_IMAGE" > .deploy/pending.env
git checkout --detach "$ERP_RELEASE_COMMIT"
ENV_FILE="$ROOT/backend/.env.production"
bash scripts/deploy-preflight.sh "$ENV_FILE"
[ -f certbot/conf/live/encg-erp/fullchain.pem ] &&
  [ -f certbot/conf/live/encg-erp/privkey.pem ] ||
  { echo "Provision the production TLS certificate before deploying a release." >&2; exit 1; }
export NGINX_CONF=prod.conf
COMPOSE=(docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml -f docker-compose.release.yml)
"${COMPOSE[@]}" config --quiet
"${COMPOSE[@]}" pull backend nginx queue-worker scheduler reverb operations-alerts certbot
"${COMPOSE[@]}" up -d --wait --wait-timeout 120 postgres redis

if "${COMPOSE[@]}" ps --status running --services | grep -qx backend; then
  "${COMPOSE[@]}" exec -T backend php artisan down --retry=60
fi
"${COMPOSE[@]}" stop queue-worker scheduler operations-alerts

# Read non-secret database identifiers from the database container.
export PG_CONTAINER=encg_prod_postgres
export DB_USERNAME
export DB_DATABASE
DB_USERNAME=$(docker exec "$PG_CONTAINER" printenv POSTGRES_USER)
DB_DATABASE=$(docker exec "$PG_CONTAINER" printenv POSTGRES_DB)
export BACKUP_DIR="$ROOT/.deploy/backups"
bash scripts/backup-postgres.sh
storage_backup="$BACKUP_DIR/storage_$(date +%Y%m%d_%H%M%S)_$$.tar.gz"
trap 'rm -f "$storage_backup.partial"' EXIT
"${COMPOSE[@]}" run --rm --no-deps -T backend tar -czf - -C /var/www/html/storage app > "$storage_backup.partial"
gzip -t "$storage_backup.partial"
mv "$storage_backup.partial" "$storage_backup"

if [ "$rollback" -eq 0 ]; then
  "${COMPOSE[@]}" run --rm --no-deps -T backend php artisan migrate --force --no-interaction
else
  echo "Restoring previous application images against the current database schema."
fi
"${COMPOSE[@]}" up -d --no-deps backend reverb
"${COMPOSE[@]}" exec -T backend php artisan optimize:clear
"${COMPOSE[@]}" exec -T backend php artisan config:cache
"${COMPOSE[@]}" exec -T backend php artisan route:cache
"${COMPOSE[@]}" exec -T backend php artisan view:cache
"${COMPOSE[@]}" exec -T backend php artisan event:cache
"${COMPOSE[@]}" exec -T backend php artisan up
"${COMPOSE[@]}" up -d --wait --wait-timeout 180 backend reverb nginx queue-worker scheduler operations-alerts certbot
"${COMPOSE[@]}" exec -T backend php artisan operations:check-deployment-queue --timeout=90
"${COMPOSE[@]}" exec -T scheduler php artisan schedule:list >/dev/null
app_url=$(grep '^APP_URL=' "$ENV_FILE" | tail -n1 | cut -d= -f2- | sed 's/^"//;s/"$//')
bash scripts/release-smoke.sh "$app_url"

# Promote the manifest only after all probes succeed.
manifest=$(mktemp "$ROOT/.deploy/release.XXXXXX")
printf 'ERP_RELEASE_COMMIT=%s\nERP_BACKEND_IMAGE=%s\nERP_WEB_IMAGE=%s\n' \
  "$ERP_RELEASE_COMMIT" "$ERP_BACKEND_IMAGE" "$ERP_WEB_IMAGE" > "$manifest"
if [ -f .deploy/current.env ] && ! cmp -s .deploy/current.env "$manifest"; then
  cp .deploy/current.env .deploy/previous.env
fi
mv "$manifest" .deploy/current.env
rm .deploy/pending.env
echo "Release verified and recorded: $ERP_RELEASE_COMMIT"

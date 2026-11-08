#!/usr/bin/env bash
set -euo pipefail
umask 077
STAMP=$(date +%Y%m%d_%H%M%S)_$$
OUT_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/encg_erp_${STAMP}.sql.gz"

pg_container="${PG_CONTAINER:-}"
if [ -n "$pg_container" ]; then
  docker inspect "$pg_container" >/dev/null
elif docker ps --format '{{.Names}}' | grep -qx 'encg_prod_postgres'; then
  pg_container=encg_prod_postgres
elif docker ps --format '{{.Names}}' | grep -qx 'encg_postgres'; then
  pg_container=encg_postgres
fi

USER_NAME="${DB_USERNAME:-encg_prod_user}"
DB_NAME="${DB_DATABASE:-encg_erp}"
partial="$FILE.partial"
trap 'rm -f "$partial"' EXIT

if [ -n "$pg_container" ]; then
  docker exec "$pg_container" pg_dump -U "$USER_NAME" "$DB_NAME" | gzip > "$partial"
else
  PGPASSWORD="${DB_PASSWORD:?}" pg_dump -h "${DB_HOST:-127.0.0.1}" -U "$USER_NAME" "$DB_NAME" | gzip > "$partial"
fi
gzip -t "$partial"
mv "$partial" "$FILE"

echo "Backup written: $FILE"

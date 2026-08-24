#!/usr/bin/env bash
set -euo pipefail
# Backup PostgreSQL from the docker-compose stack (or PGHOST).
STAMP=$(date +%Y%m%d_%H%M%S)
OUT_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/encg_erp_${STAMP}.sql.gz"

if docker ps --format '{{.Names}}' | grep -q '^encg_postgres$'; then
  docker exec encg_postgres pg_dump -U "${DB_USERNAME:-encg_user}" "${DB_DATABASE:-encg_erp}" | gzip > "$FILE"
else
  PGPASSWORD="${DB_PASSWORD:?}" pg_dump -h "${DB_HOST:-127.0.0.1}" -U "${DB_USERNAME:-encg_user}" "${DB_DATABASE:-encg_erp}" | gzip > "$FILE"
fi

echo "Backup written: $FILE"

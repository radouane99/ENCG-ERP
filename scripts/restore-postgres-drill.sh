#!/usr/bin/env bash
# Restore the latest gzip dump into a throwaway database, smoke-test, then drop it.
set -euo pipefail
DUMP="${1:-}"
if [ -z "$DUMP" ]; then
  DUMP=$(ls -1t backups/encg_erp_*.sql.gz 2>/dev/null | head -n 1 || true)
fi
if [ -z "$DUMP" ] || [ ! -f "$DUMP" ]; then
  echo "Usage: $0 path/to/backup.sql.gz"
  exit 1
fi

DRILL_DB="${DRILL_DB:-encg_erp_drill}"
USER_NAME="${DB_USERNAME:-encg_prod_user}"

psql_in() {
  if docker ps --format '{{.Names}}' | grep -qx 'encg_prod_postgres'; then
    docker exec -i encg_prod_postgres psql -U "$USER_NAME" -d postgres "$@"
  elif docker ps --format '{{.Names}}' | grep -qx 'encg_postgres'; then
    docker exec -i encg_postgres psql -U "$USER_NAME" -d postgres "$@"
  else
    PGPASSWORD="${DB_PASSWORD:?}" psql -h "${DB_HOST:-127.0.0.1}" -U "$USER_NAME" -d postgres "$@"
  fi
}

echo "Creating $DRILL_DB from $DUMP"
psql_in -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DRILL_DB';" || true
psql_in -c "DROP DATABASE IF EXISTS $DRILL_DB;"
psql_in -c "CREATE DATABASE $DRILL_DB OWNER $USER_NAME;"

if docker ps --format '{{.Names}}' | grep -qx 'encg_prod_postgres'; then
  gunzip -c "$DUMP" | docker exec -i encg_prod_postgres psql -U "$USER_NAME" -d "$DRILL_DB" >/dev/null
elif docker ps --format '{{.Names}}' | grep -qx 'encg_postgres'; then
  gunzip -c "$DUMP" | docker exec -i encg_postgres psql -U "$USER_NAME" -d "$DRILL_DB" >/dev/null
else
  gunzip -c "$DUMP" | PGPASSWORD="${DB_PASSWORD:?}" psql -h "${DB_HOST:-127.0.0.1}" -U "$USER_NAME" -d "$DRILL_DB" >/dev/null
fi

if docker ps --format '{{.Names}}' | grep -qx 'encg_prod_backend'; then
  docker exec -e DB_DATABASE="$DRILL_DB" encg_prod_backend php artisan test --filter=StudentTest || true
elif docker ps --format '{{.Names}}' | grep -q '^encg_backend$'; then
  docker exec -e DB_DATABASE="$DRILL_DB" encg_backend php artisan test --filter=StudentTest || true
fi

psql_in -c "DROP DATABASE IF EXISTS $DRILL_DB;"
echo "Restore drill completed (database dropped)."

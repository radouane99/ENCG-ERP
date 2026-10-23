#!/usr/bin/env bash
# Restore into a fresh isolated database; never run application tests against a backup.
set -euo pipefail
DUMP="${1:?Usage: restore-postgres-drill.sh path/to/backup.sql.gz}"
[ -f "$DUMP" ] || { echo "Backup not found" >&2; exit 1; }
DRILL_DB="${DRILL_DB:-encg_erp_drill_$(date +%Y%m%d_%H%M%S)}"
USER_NAME="${DB_USERNAME:-encg_prod_user}"
[[ "$DRILL_DB" =~ ^encg_erp_drill_[0-9_]+$ ]] || { echo "Unsafe drill database name" >&2; exit 1; }
[[ "$USER_NAME" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] || { echo "Invalid database role" >&2; exit 1; }
[ "$DRILL_DB" != "${DB_DATABASE:-encg_erp}" ] || exit 1

pg_container="${PG_CONTAINER:-}"
if [ -z "$pg_container" ]; then
  for candidate in encg_prod_postgres encg_postgres; do
    if docker ps --format '{{.Names}}' | grep -qx "$candidate"; then pg_container="$candidate"; break; fi
  done
fi
psql_in() {
  local database="$1"; shift
  if [ -n "$pg_container" ]; then
    docker exec -i "$pg_container" psql -X -v ON_ERROR_STOP=1 -U "$USER_NAME" -d "$database" "$@"
  else
    PGPASSWORD="${DB_PASSWORD:?}" psql -X -v ON_ERROR_STOP=1 -h "${DB_HOST:-127.0.0.1}" -U "$USER_NAME" -d "$database" "$@"
  fi
}
created=0
cleanup() {
  if [ "$created" -eq 1 ]; then psql_in postgres -c "DROP DATABASE \"$DRILL_DB\";"; fi
}
trap cleanup EXIT
# CREATE fails if the name exists: never terminate sessions or replace somebody else's database.
psql_in postgres -c "CREATE DATABASE \"$DRILL_DB\" OWNER \"$USER_NAME\";"
created=1
gunzip -c "$DUMP" | psql_in "$DRILL_DB" >/dev/null
tables=$(psql_in "$DRILL_DB" -At -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';")
[ "$tables" -ge "${DRILL_MIN_TABLES:-100}" ] || { echo "Restored schema is incomplete" >&2; exit 1; }
psql_in "$DRILL_DB" -c 'SELECT count(*) AS users FROM users; SELECT count(*) AS students FROM students; SELECT count(*) AS grades FROM grades;'
echo "Restore verified: $tables tables. Isolated drill database will be removed."

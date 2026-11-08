#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT

for script in deploy.sh scripts/deploy-release.sh scripts/release-smoke.sh scripts/backup-postgres.sh; do
  bash -n "$script"
done
cat > "$temporary/production.env" <<'EOF'
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
APP_URL=https://erp.example.test
DB_DATABASE=encg_release_test
DB_USERNAME=encg_release_test
DB_PASSWORD=synthetic-validation-only
REDIS_PASSWORD=synthetic-validation-only
EOF
export ERP_PRODUCTION_ENV_FILE="$temporary/production.env"
ERP_BACKEND_IMAGE="ghcr.io/example/erp/backend@sha256:$(printf 'a%.0s' {1..64})"
ERP_WEB_IMAGE="ghcr.io/example/erp/web@sha256:$(printf 'b%.0s' {1..64})"
export ERP_BACKEND_IMAGE ERP_WEB_IMAGE
export RELEASE_TEST_APP_KEY=base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
docker compose --env-file "$ERP_PRODUCTION_ENV_FILE" -f docker-compose.prod.yml -f docker-compose.release.yml config --quiet
docker compose -f docker-compose.release-test.yml config --quiet

#!/usr/bin/env bash
# Issue or renew Let's Encrypt cert, then switch Nginx to HTTPS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DOMAIN="${SSL_DOMAIN:-erp.encg-fes.ac.ma}"
EMAIL="${SSL_EMAIL:-contact@encg-fes.ac.ma}"
COMPOSE=(docker compose --env-file backend/.env.production -f docker-compose.prod.yml)

echo "Issuing certificate for $DOMAIN ..."
"${COMPOSE[@]}" run --rm --entrypoint certbot certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --non-interactive

LIVE="$ROOT/certbot/conf/live/$DOMAIN"
ALIAS="$ROOT/certbot/conf/live/encg-erp"
if [ -f "$LIVE/fullchain.pem" ]; then
  mkdir -p "$(dirname "$ALIAS")"
  ln -sfn "$DOMAIN" "$ALIAS"
fi

export NGINX_CONF=prod.conf
"${COMPOSE[@]}" up -d nginx
docker exec encg_prod_nginx nginx -s reload
echo "HTTPS active for $DOMAIN"

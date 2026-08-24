#!/bin/sh
set -e
cd /var/www/html

if [ -f composer.json ]; then
  mkdir -p vendor storage/logs bootstrap/cache
  if [ ! -d vendor/sentry/sentry-laravel ] && command -v composer >/dev/null 2>&1; then
    composer install --no-interaction --prefer-dist --no-scripts || true
  fi
  chown -R www:www vendor storage bootstrap/cache 2>/dev/null || true
fi

exec "$@"

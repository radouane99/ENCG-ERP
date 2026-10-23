#!/bin/sh
set -e
cd /var/www/html

if [ -f composer.json ]; then
  mkdir -p vendor storage/logs bootstrap/cache
  if [ "${APP_ENV:-local}" = "production" ]; then
    test -f vendor/autoload.php || { echo "Production image is missing Composer dependencies" >&2; exit 1; }
  elif [ ! -d vendor/sentry/sentry-laravel ] && command -v composer >/dev/null 2>&1; then
    composer install --no-interaction --prefer-dist --no-scripts
  fi
  if [ "${APP_ENV:-local}" != "production" ]; then
    chown -R www:www vendor storage bootstrap/cache 2>/dev/null || true
  fi
fi

exec "$@"

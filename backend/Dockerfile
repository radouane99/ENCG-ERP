# ─────────────────────────────────────────────────────────────
# NOTE: This Dockerfile is kept for backward-compatibility only.
#
# The canonical development image is defined at:
#   ../docker/php/Dockerfile
#
# The docker-compose.yml at the project root uses that file.
# Build this image only if you need a standalone backend image
# without the full compose stack.
# ─────────────────────────────────────────────────────────────
FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    bash curl git zip unzip \
    libzip-dev libpng-dev libjpeg-turbo-dev freetype-dev \
    icu-dev oniguruma-dev libxml2-dev postgresql-dev \
    linux-headers $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo pdo_pgsql pgsql mbstring exif pcntl bcmath gd zip intl xml opcache sockets \
    && pecl install redis && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS \
    && rm -rf /tmp/pear

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN addgroup -g 1000 -S www && adduser -u 1000 -S www -G www

WORKDIR /var/www/html

USER www

EXPOSE 9000
CMD ["php-fpm"]

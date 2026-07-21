FROM php:8.4-fpm-alpine

ARG PHP_VERSION=8.4

# ── System dependencies ──────────────────────────────────────
RUN apk add --no-cache \
    bash \
    curl \
    git \
    zip \
    unzip \
    libzip-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    icu-dev \
    oniguruma-dev \
    libxml2-dev \
    postgresql-dev \
    linux-headers \
    $PHPIZE_DEPS

# ── PHP extensions ────────────────────────────────────────────
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
        intl \
        xml \
        opcache \
        sockets

# ── PECL extensions ───────────────────────────────────────────
RUN pecl install redis \
    && docker-php-ext-enable redis

# ── Xdebug (dev only — disabled by default) ───────────────────
RUN pecl install xdebug \
    && docker-php-ext-enable xdebug \
    && echo "xdebug.mode=off" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

# ── Composer 2 ───────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ── Non-root user ────────────────────────────────────────────
RUN addgroup -g 1000 -S www \
    && adduser -u 1000 -S www -G www

# ── Working directory ─────────────────────────────────────────
WORKDIR /var/www/html

# Fix permissions so www can write to storage & cache
RUN mkdir -p /var/www/html/storage/logs \
             /var/www/html/storage/framework/cache \
             /var/www/html/storage/framework/sessions \
             /var/www/html/storage/framework/views \
             /var/www/html/bootstrap/cache \
    && chown -R www:www /var/www/html

USER www

EXPOSE 9000
CMD ["php-fpm"]

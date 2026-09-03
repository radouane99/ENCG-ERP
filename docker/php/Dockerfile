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
    postgresql-client \
    linux-headers \
    $PHPIZE_DEPS \
    # ── OCR & PDF tools (FREE, local) ────────────────────────
    tesseract-ocr \
    tesseract-ocr-data-fra \
    tesseract-ocr-data-ara \
    tesseract-ocr-data-eng \
    poppler-utils \
    ghostscript \
    imagemagick \
    imagemagick-pdf \
    imagemagick-dev

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

COPY --chown=www:www backend/composer.json backend/composer.lock /var/www/html/

# Fix permissions so www can write to storage, cache and vendor
RUN mkdir -p /var/www/html/storage/logs \
             /var/www/html/storage/framework/cache \
             /var/www/html/storage/framework/sessions \
             /var/www/html/storage/framework/views \
             /var/www/html/bootstrap/cache \
             /var/www/html/vendor \
    && chown -R www:www /var/www/html

USER www
RUN composer install --no-interaction --prefer-dist --no-scripts --no-autoloader \
    && composer dump-autoload --no-interaction --optimize || true

COPY docker/php/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
USER root
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
USER www

EXPOSE 9000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["php-fpm"]

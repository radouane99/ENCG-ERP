# ---------------------------------------------------------
# STAGE 1: Build React Frontend
# ---------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy package.json and package-lock.json
COPY frontend/package*.json ./
RUN npm ci

# Copy the rest of the frontend source
COPY frontend/ ./
# Build the production React assets
RUN npm run build

# ---------------------------------------------------------
# STAGE 2: Build Laravel API
# ---------------------------------------------------------
FROM php:8.2-fpm-alpine AS backend-builder

# Install system dependencies
RUN apk add --no-cache \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    oniguruma-dev \
    nodejs \
    npm

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd intl

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app/backend

# Copy composer files
COPY backend/composer.json backend/composer.lock ./
# Install php dependencies without scripts first (for caching)
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist

# Copy the rest of the backend source
COPY backend/ ./

# Generate optimized autoload files and run scripts
RUN composer dump-autoload --optimize && \
    composer run-script post-root-package-install || true && \
    composer run-script post-create-project-cmd || true

# Copy frontend build into Laravel's public directory
COPY --from=frontend-builder /app/frontend/dist /app/backend/public/frontend

# Optimize Laravel for production
RUN php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

# Set permissions for Laravel storage
RUN chown -R www-data:www-data /app/backend/storage /app/backend/bootstrap/cache && \
    chmod -R 775 /app/backend/storage /app/backend/bootstrap/cache

# ---------------------------------------------------------
# STAGE 3: Final Production Image (PHP-FPM)
# ---------------------------------------------------------
FROM php:8.2-fpm-alpine

# Re-install extensions in the final image
RUN apk add --no-cache libpng libxml2 oniguruma \
    && apk add --no-cache --virtual .build-deps libpng-dev libxml2-dev oniguruma-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd intl \
    && apk del .build-deps

WORKDIR /var/www/html

# Copy application from builder
COPY --from=backend-builder /app/backend /var/www/html

# Ensure permissions are correct
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]

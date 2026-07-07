# Stage 1: Build Frontend
FROM node:20-alpine as frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend Dependencies
FROM composer:2.7 as backend-builder
WORKDIR /app
COPY backend/composer.json backend/composer.lock ./
# Install dependencies optimized for production (no dev, optimize autoloader)
RUN composer install --no-dev --optimize-autoloader --no-scripts
COPY backend/ ./
RUN composer run post-autoload-dump

# Stage 3: Final Production Image
FROM php:8.3-fpm-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    freetype-dev \
    libjpeg-turbo-dev \
    oniguruma-dev \
    icu-dev

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd intl zip opcache

# Set working directory
WORKDIR /var/www/html

# Copy Laravel backend code from builder
COPY --from=backend-builder /app /var/www/html

# Copy built React frontend to Laravel public directory (or Nginx will serve it)
# In this architecture, we put the React build inside public/app or handle via Nginx
# For simplicity, we just copy it to public/dist
COPY --from=frontend-builder /app/dist /var/www/html/public/dist

# Set permissions for Laravel
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Production OPcache settings
RUN echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.memory_consumption=256" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.interned_strings_buffer=16" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.max_accelerated_files=20000" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini \
    && echo "opcache.validate_timestamps=0" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini

# Expose port 9000 and start php-fpm server
EXPOSE 9000
CMD ["php-fpm"]

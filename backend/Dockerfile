FROM  php:8.4-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    libpq-dev

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# We don't copy the code here if we want to mount it as a volume in dev,
# but for production we should copy it.
# COPY . /var/www/html
# RUN composer install --no-interaction --optimize-autoloader --no-dev
# RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# For development via docker-compose, we just expose the port
EXPOSE 9000
CMD ["php-fpm"]

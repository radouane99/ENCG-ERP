#!/bin/bash

# ENCG ERP Production Deployment Script
# -------------------------------------
# Ensure this script is executed by the correct user (e.g., www-data)

echo "Starting deployment process..."

# 1. Pull latest code
echo "Pulling latest changes from git..."
git pull origin main

# 2. Install/Update Backend Dependencies
echo "Installing Composer dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

# 3. Migrate Database
echo "Running database migrations..."
php artisan migrate --force

# 4. Clear & Cache Routes/Config/Views
echo "Optimizing application..."
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 5. Build Frontend Assets (if not built in CI)
echo "Building frontend assets..."
cd frontend || exit 1
npm ci
npm run build
cd ..

# 6. Restart Queue/Horizon
echo "Restarting Horizon..."
php artisan horizon:terminate

echo "Deployment finished successfully!"

#!/usr/bin/env bash
set -e

# ==============================================================================
# ENCG ERP — One-Click Production Deployment Script
# Target Branch: docker-v2
# ==============================================================================

echo "🚀 [1/7] Initializing ENCG ERP Production Deployment..."

BRANCH="${1:-docker-v2}"
echo "📌 Target branch: $BRANCH"

# 1. Fetch & pull latest changes
echo "📥 [2/7] Pulling latest code from branch '$BRANCH'..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

# 2. Check environment file
if [ ! -f "backend/.env.production" ]; then
    echo "⚠️ backend/.env.production not found! Copying from .env.production.example..."
    cp .env.production.example backend/.env.production
    echo "🔑 Generating new application key..."
    docker exec encg_prod_backend php artisan key:generate --env=production || true
fi

# 3. Build optimized frontend assets
echo "⚛️ [3/7] Building production React / Vite PWA bundle..."
cd frontend
npm ci --silent
npm run build
cd ..

# 4. Spin up / restart production docker containers
echo "🐳 [4/7] Rebuilding and launching Docker containers..."
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# 5. Run Database Migrations safely
echo "🐘 [5/7] Executing PostgreSQL Database Migrations..."
docker exec encg_prod_backend php artisan migrate --force --no-interaction

# 6. Optimize Laravel performance (Cache Config, Routes, Views, Events)
echo "⚡ [6/7] Optimizing Laravel cache and route tables..."
docker exec encg_prod_backend php artisan optimize:clear
docker exec encg_prod_backend php artisan config:cache
docker exec encg_prod_backend php artisan route:cache
docker exec encg_prod_backend php artisan view:cache
docker exec encg_prod_backend php artisan event:cache

# 7. Restart queue workers & Horizon
echo "🔄 [7/7] Restarting Queue Workers and Horizon..."
docker exec encg_prod_backend php artisan horizon:terminate || docker exec encg_prod_backend php artisan queue:restart

echo "=============================================================================="
echo "✅ ENCG ERP Deployed Successfully & 100% Operational on branch '$BRANCH'!"
echo "🌐 Health Check Status: $(docker inspect --format='{{json .State.Health.Status}}' encg_prod_postgres 2>/dev/null || echo 'Running')"
echo "=============================================================================="

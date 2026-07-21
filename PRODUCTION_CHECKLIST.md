# ENCG ERP - Production Readiness Checklist

This document outlines the required steps, checks, and configurations before going live with the ENCG ERP system.

## 1. Environment Configuration (`.env.production`)
- [ ] `APP_ENV=production` is set.
- [ ] `APP_DEBUG=false` is STRICTLY set.
- [ ] `APP_KEY` is generated (`php artisan key:generate`).
- [ ] `APP_URL` and `FRONTEND_URL` accurately reflect the production domain.
- [ ] Database credentials (`DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) are correct.
- [ ] Redis credentials (`REDIS_HOST`, `REDIS_PASSWORD`) are configured.
- [ ] `CACHE_STORE=redis`, `SESSION_DRIVER=redis`, `QUEUE_CONNECTION=redis` are set.
- [ ] Mail server settings (SMTP, Mailgun, etc.) are valid.
- [ ] `AI_DRIVER` is explicitly configured and does not point to a local `stub` driver.
  - Production must set `AI_DRIVER` to a supported provider (e.g., `gemini`) and ensure API keys are present.

## 2. Infrastructure (Redis & Horizon)
- [ ] Redis server is installed, running, and accessible by the application.
- [ ] Laravel Horizon is installed. `config/horizon.php` has appropriate worker counts (e.g., supervisor-1 configuration matches server capacity).
- [ ] Horizon Daemon is managed by a process monitor (e.g., Supervisor) to keep `php artisan horizon` running continuously in the background.

## 3. Deployment Script
- [ ] `deploy.sh` is present in the repository root.
- [ ] Execute `chmod +x deploy.sh` to make the deployment script executable.
- [ ] Ensure the script runs:
  - `composer install --no-dev --optimize-autoloader`
  - `php artisan migrate --force`
  - `php artisan optimize`
  - `php artisan horizon:terminate`
  - Frontend asset compilation (`npm run build`)

## 4. File Permissions & Storage
- [ ] Ensure the `storage` and `bootstrap/cache` directories are writable by the web server user (e.g., `www-data` or `nginx`).
  ```bash
  sudo chown -R www-data:www-data storage bootstrap/cache
  sudo chmod -R 775 storage bootstrap/cache
  ```
- [ ] Run `php artisan storage:link` to create the symbolic link for Spatie MediaLibrary and public assets.

## 5. Security & Performance (Web Server)
- [ ] Nginx/Apache configuration properly points to `backend/public/` for the API and serves the React build directory for the Frontend.
- [ ] SSL/TLS certificate is installed (e.g., Let's Encrypt / Certbot).
- [ ] Enforce HTTPS redirection in the Nginx/Apache config.
- [ ] Rate limiting is configured properly in `RouteServiceProvider` or `bootstrap/app.php` to prevent brute-force attacks on the API.

## 6. Critical Routes Audit (Manual Verification)
Before announcing Go-Live, perform manual testing on the following critical paths:
- [ ] **Authentication Flow:** Login, Logout, Social Auth (Google), Token refresh/expiration handling.
- [ ] **Role Management:** Admin can assign roles; restricted users cannot access admin routes (assert 403 Forbidden).
- [ ] **File Uploads:** Test profile picture or document uploads to verify Spatie MediaLibrary paths and storage permissions.
- [ ] **Queues:** Trigger an asynchronous job (like sending an email or generating a report) and verify it completes successfully in the Horizon Dashboard (`/horizon`).

## 7. Stateless Architecture Check
- [ ] Ensure no local session files or local cache files are being relied upon across scaled instances.
- [ ] Verify CSRF token and Sanctum stateful domains (`SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`) are perfectly aligned with the production frontend URL.

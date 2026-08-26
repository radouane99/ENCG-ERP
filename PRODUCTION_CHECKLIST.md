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
- [ ] Mail: Resend + `MAIL_FROM_ADDRESS=noreply@encg-fes.ac.ma` (verified domain).
- [ ] `AI_DRIVER` is explicitly configured and does not point to a local `stub` driver.
  - Production must set `AI_DRIVER` to a supported provider (e.g., `gemini`) and ensure API keys are present.

## 2. Infrastructure (Redis & Horizon)
- [ ] Redis server is installed, running, and accessible by the application.
- [ ] Laravel Horizon is installed. `config/horizon.php` has appropriate worker counts (e.g., supervisor-1 configuration matches server capacity).
- [ ] Horizon Daemon is managed by a process monitor (e.g., Supervisor) to keep `php artisan horizon` running continuously in the background.

## 3. Deployment / Container Execution
- [ ] `backend/.env.production` exists, `APP_DEBUG=false`, no placeholder passwords (`./scripts/deploy-preflight.sh`).
- [ ] `docker compose --env-file backend/.env.production -f docker-compose.prod.yml` is the source of truth (same secrets for Postgres, Redis, Laravel).
- [ ] First boot uses HTTP bootstrap; TLS via `./scripts/provision-ssl.sh` then HTTPS (`prod.conf`).
- [ ] Deploy: `./deploy.sh docker-v2` (or GitHub Action **workflow_dispatch** only — never auto-deploy on push).
- [ ] After deploy: `migrate --force`, `storage:link`, `config/route/view:cache`, Horizon restarted.
- [ ] Services: nginx, backend, postgres, redis, queue-worker, scheduler.

## 4. File Permissions & Storage
- [ ] Ensure the `storage` and `bootstrap/cache` directories are writable by the web server user (e.g., `www-data` or `nginx`).
  ```bash
  sudo chown -R www-data:www-data storage bootstrap/cache
  sudo chmod -R 775 storage bootstrap/cache
  ```
- [ ] Run `php artisan storage:link` to create the symbolic link for Spatie MediaLibrary and public assets.

## 4b. Secrets & git
- [ ] `backend/.env` and `frontend/.env` are **not** committed (see root `.gitignore`).
- [ ] Production secrets live only in the server env / secret store, never in the repo.

## 5. Security & Performance (Web Server)
- [ ] Nginx/Apache configuration properly points to `backend/public/` for the API and serves the React build directory for the Frontend.
- [ ] SSL/TLS certificate is installed (e.g., Let's Encrypt / Certbot).
- [ ] Enforce HTTPS redirection in the Nginx/Apache config.
- [ ] Rate limiting is configured properly in `RouteServiceProvider` or `bootstrap/app.php` to prevent brute-force attacks on the API.

## 6. Critical Routes Audit (Manual Verification)
Before announcing Go-Live, perform manual testing on the following critical paths:
- [ ] **Infrastructure Reachability:** `/api` responds through Nginx, `/up` returns healthy status, and static/storage links resolve correctly.
- [ ] **Authentication Flow:** Login, logout, token/session expiry handling, and any enabled social auth flow.
- [ ] **Role Management:** Admin can assign roles; restricted users cannot access admin routes (assert 403 Forbidden).
- [ ] **Administration Flow:** Dashboard stats, document generation, validation/review actions, and one export path.
- [ ] **Professor Flow:** Timetable access, attendance session creation, attendance marking, and grade entry.
- [ ] **Student Flow:** Dashboard access, transcript/notes access, document request, and absence justification submission.
- [ ] **File Uploads:** Test profile picture or document uploads to verify media/storage permissions and private/public disk separation.
- [ ] **Queues:** Trigger an asynchronous job (email, notification, report generation) and verify it completes successfully in Horizon or worker logs.

## 8. Backup & restore drill
- [ ] Postgres dump runs on a documented schedule (`scripts/backup-postgres.sh`).
- [ ] Monthly restore drill: `scripts/restore-postgres-drill.sh` into `encg_erp_drill`, smoke `php artisan test --filter=StudentTest`, drop the drill database.
- [ ] Last restore tested on: _______________

- [ ] Ensure no local session files or local cache files are being relied upon across scaled instances.
- [ ] Verify CSRF token and Sanctum stateful domains (`SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`) are perfectly aligned with the production frontend URL.

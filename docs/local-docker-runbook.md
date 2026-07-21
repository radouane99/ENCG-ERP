# ENCG ERP Local Docker Runbook

This runbook reflects the current local development setup in this repository.

## Local service map

| Service | URL | Notes |
|---|---|---|
| Main app (via Nginx) | http://localhost | Recommended entry point |
| Frontend dev server | http://localhost:5173 | Direct Vite access |
| API base URL | http://localhost/api | Proxied by Nginx to Laravel |
| Backend health check | http://localhost/up | Laravel health endpoint |
| Horizon dashboard | http://localhost/horizon | Requires authenticated/authorized backend user |
| Scribe docs | http://localhost/docs | Generate first with `scribe:generate` |
| phpMyAdmin | http://localhost:8081 | Host: `mysql`, user: `root` |
| Mailpit | http://localhost:8025 | Local mail inbox |
| Reverb | ws://localhost:8080 | WebSocket endpoint |
| MySQL from host | 127.0.0.1:3307 | Container port `3306` |

## Compose services

The current local stack uses these service names:

- `nginx`
- `backend`
- `frontend`
- `mysql`
- `redis`
- `queue-worker`
- `reverb`
- `mailpit`
- `phpmyadmin`

Use `backend` for artisan and composer commands. The service name is **not** `php` in this repository.

## First boot

1. Copy the backend environment file.
2. Set a known local password before seeding users.
3. Start the stack and initialize Laravel.

```bash
cp backend/.env.example backend/.env
```

Set this in `backend/.env` before running `db:seed` if you want known credentials locally:

```env
INITIAL_USER_PASSWORD=Password@123
```

Then run:

```bash
docker compose up -d --build
docker compose exec backend composer install
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate --seed
docker compose exec backend php artisan storage:link
docker compose exec backend php artisan optimize:clear
docker compose exec backend php artisan scribe:generate
docker compose exec frontend sh -c "npm run build"
```

## Daily commands

### Start

```bash
docker compose up -d
```

### Stop

```bash
docker compose down
```

### Rebuild after Dockerfile or dependency changes

```bash
docker compose down
docker compose up -d --build
```

### Reset local database completely

```bash
docker compose down -v
docker compose up -d --build
docker compose exec backend composer install
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate:fresh --seed
docker compose exec backend php artisan storage:link
docker compose exec backend php artisan optimize:clear
```

## Validation checklist

### Infrastructure

```bash
docker compose ps
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan optimize:clear
docker compose exec backend php artisan storage:link
docker compose exec frontend sh -c "npm run build"
```

### HTTP checks

```bash
curl http://localhost/up
curl http://localhost/api
```

If `curl http://localhost/api` returns a 404 or auth-style JSON response, the backend proxy is still reachable. That is acceptable for a routing smoke check.

## Seeded local accounts

If `INITIAL_USER_PASSWORD` is set before seeding, the following accounts use that password:

| Role | Email |
|---|---|
| Super Admin | `superadmin@encg-fes.ma` |
| Institution Admin | `admin@encg-fes.ma` |
| Director | `directeur@encg-fes.ma` |
| Demo Admin | `admin@encg.ma` |
| Demo Scolarité | `scolarite@encg.ma` |
| Demo Professor | `prof@encg.ma` |
| Demo Student | `student@encg.ma` |

Additional professor and student users are also seeded from ENCG Fès demo data.

## Role-based smoke test

### Administration

- Log in via `http://localhost`
- Open the admin dashboard
- Verify stats load
- Generate a document
- Review an absence justification or document request

### Professeur

- Log in with a professor account
- Open timetable / teaching area
- Create an attendance session
- Mark or scan attendance
- Open grade entry for one module

### Étudiant

- Log in with a student account
- Open the student dashboard
- Submit an absence justification
- Request or download an official document
- Open transcript / notes view

## Useful logs

```bash
docker compose logs -f backend
docker compose logs -f nginx
docker compose logs -f frontend
docker compose logs -f queue-worker
docker compose logs -f reverb
```

## Common local pitfalls

- `docker compose exec php ...` is wrong for this repo. Use `docker compose exec backend ...`.
- The local database is MySQL, not PostgreSQL.
- Local storage is Laravel filesystem storage; there is no MinIO service in the current compose file.
- `http://localhost` is the best day-to-day entry point because Nginx proxies both the SPA and `/api`.

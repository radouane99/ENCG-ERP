# ENCG ERP — University Management Platform

<div align="center">
  <h3>🎓 ENCG Fès ERP</h3>
  <p><strong>ERP universitaire multi-rôles pour administration, professeurs et étudiants</strong></p>
  <p>Laravel 12 · React 19 · MySQL 8 · Redis · Docker</p>
</div>

---

## Overview

ENCG ERP is a university management platform tailored to the Moroccan academic context, starting with **ENCG Fès**.

The current product revolves around three main sides:

- **Administration**
- **Professeur**
- **Étudiant**

Core workflows already present in the codebase include:

- academic structure and user management
- attendance and absence justification
- grades, deliberation, and transcript flows
- document generation with verification
- internships and mobility
- messaging, notifications, and dashboarding

A detailed functional reference is available in [`docs/functional-spec.md`](docs/functional-spec.md).

---

## Actual local tech stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12, PHP 8.4 |
| Frontend | React 19, TypeScript, Vite |
| Database | MySQL 8 |
| Cache / Queue | Redis |
| Realtime | Laravel Reverb |
| Queue worker | Laravel Horizon |
| Reverse proxy | Nginx |
| Mail (local) | Mailpit |
| DB admin (local) | phpMyAdmin |
| Storage (local) | Laravel filesystem disks (`public` + `private`) |

> Local development uses **MySQL** and **does not include MinIO** in the current `docker-compose.yml`.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)
- Optional only for non-Docker workflows:
  - Node.js 20+
  - PHP 8.4+
  - Composer

If you work with Docker, you can run the project without local PHP or local Node installed on the host machine.

---

## Quick start with Docker

### 1. Clone the repository

```bash
git clone https://github.com/your-org/encg-erp.git
cd encg-erp
```

### 2. Copy the backend environment file

```bash
cp backend/.env.example backend/.env
```

### 3. Set a known local seeded password

Before running `db:seed`, set this in `backend/.env` if you want predictable credentials locally:

```env
INITIAL_USER_PASSWORD=Password@123
```

### 4. Start the stack

```bash
docker compose up -d --build
```

### 5. Install backend dependencies

```bash
docker compose exec backend composer install
```

### 6. Initialize Laravel

```bash
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate --seed
docker compose exec backend php artisan storage:link
docker compose exec backend php artisan optimize:clear
```

### 7. Generate API docs and validate the frontend build

```bash
docker compose exec backend php artisan scribe:generate
docker compose exec frontend sh -c "npm run build"
```

### 8. Access the platform

| Service | URL | Notes |
|---|---|---|
| Main app | http://localhost | Recommended daily entry point |
| Frontend direct | http://localhost:5173 | Direct Vite access |
| API base | http://localhost/api | Proxied to Laravel |
| Backend health | http://localhost/up | Laravel health endpoint |
| Horizon | http://localhost/horizon | Requires authenticated/authorized backend user |
| API docs | http://localhost/docs | Run `scribe:generate` first |
| Mailpit | http://localhost:8025 | Local email inbox |
| phpMyAdmin | http://localhost:8081 | MySQL inspection |
| Reverb | ws://localhost:8080 | WebSocket endpoint |
| MySQL from host | 127.0.0.1:3307 | Container port 3306 |

---

## Seeded local accounts

If `INITIAL_USER_PASSWORD` is set before seeding, these local accounts use that same password:

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

---

## Day-to-day Docker commands

### Start

```bash
docker compose up -d
```

### Stop

```bash
docker compose down
```

### Rebuild

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

### Logs

```bash
docker compose logs -f backend
docker compose logs -f nginx
docker compose logs -f frontend
docker compose logs -f queue-worker
docker compose logs -f reverb
```

---

## Role-based smoke test

### Administration

- log in via `http://localhost`
- open dashboard and confirm stats load
- generate a document
- review a document request or absence justification

### Professeur

- log in with `prof@encg.ma`
- open timetable or teaching dashboard
- create an attendance session
- mark attendance
- open grade entry for one module

### Étudiant

- log in with `student@encg.ma`
- open the student dashboard
- submit an absence justification
- request or download a document
- open transcript / notes view

---

## Useful validation commands

```bash
docker compose ps
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan optimize:clear
docker compose exec backend php artisan storage:link
docker compose exec frontend sh -c "npm run build"
curl http://localhost/up
curl http://localhost/api
```

If `curl http://localhost/api` returns a 404 or an auth-style JSON response, the backend proxy is still reachable.

---

## Project structure

```text
encg-erp/
├── backend/                  # Laravel application
├── frontend/                 # React + Vite SPA
├── docker/                   # Nginx and Docker support files
├── docs/                     # Functional and operational documentation
├── docker-compose.yml        # Local development stack
├── docker-compose.prod.yml   # Production-oriented compose file
├── PRODUCTION_CHECKLIST.md
└── README.md
```

---

## Documentation

- Functional scope: [`docs/functional-spec.md`](docs/functional-spec.md)
- Local Docker operations: [`docs/local-docker-runbook.md`](docs/local-docker-runbook.md)
- Production go-live checks: [`PRODUCTION_CHECKLIST.md`](PRODUCTION_CHECKLIST.md)

---

## Important local notes

- Use `docker compose exec backend ...`, not `docker compose exec php ...`.
- `http://localhost` is the best local entry point because Nginx proxies both the SPA and `/api`.
- Sensitive generated files should stay on private storage and be served through controlled backend endpoints.
- The current local compose file is based on **MySQL**, not PostgreSQL.

---

## License

Proprietary — ENCG Fès. All rights reserved.

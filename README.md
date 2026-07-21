# ENCG ERP — University Management SaaS Platform

<div align="center">
  <h3>🎓 منصة إدارة جامعة ENCG فاس</h3>
  <p><strong>Production-ready University ERP for Moroccan Public Universities</strong></p>
  <p>Laravel 12 · React 19 · PostgreSQL · Redis · MinIO · Docker</p>
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Functional Specification](#functional-specification)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Modules](#modules)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Overview

ENCG ERP is a comprehensive university management platform designed for Moroccan public universities, starting with **ENCG Fès**. It covers:

- 🎓 Student lifecycle (admission → graduation)
- 👨‍🏫 Professor & vacataire management
- 📚 Academic organization (filières, modules, timetables)
- 📝 Examinations & deliberations (Apogée-style)
- 📄 Document generation with QR verification
- 🤖 AI-powered features (tutor, risk prediction)
- ⚖️ Moroccan Law 09-08 compliance

---

## Functional Specification

This repository now includes a consolidated functional specification for the ENCG ERP platform in [docs/functional-spec.md](docs/functional-spec.md).

It covers:
- The three main user roles: admin, professor, and student
- Core academic workflows such as authentication, timetable planning, exams, notes, and documents
- AI-powered modules for chatbot, QCM generation, revision planning, PDF summarization, tutoring, and student reporting
- PDF document generation and the REST API architecture
- The main technical stack and key use cases

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 12, PHP 8.4 |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 |
| Storage | MinIO (S3-compatible) |
| WebSocket | Laravel Reverb |
| Queue Monitor | Laravel Horizon |
| Frontend | React 19, TypeScript, Vite |
| UI | Tailwind CSS, Shadcn UI |
| State | TanStack Query, Zustand |
| i18n | i18next (FR + AR/RTL) |
| Mail | Mailpit (local) |
| Auth | Laravel Sanctum + 2FA |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.x
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) ≥ 20 (for local frontend dev without Docker)
- [PHP](https://php.net/) ≥ 8.4 + Composer (optional, for local backend dev)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-org/encg-erp.git
cd encg-erp
```

### 2. Copy environment file

```bash
cp .env.example backend/.env
```

### 3. Generate application key

```bash
docker compose run --rm php php artisan key:generate
```

### 4. Start all services

```bash
docker compose up -d
```

### 5. Run migrations and seed

```bash
docker compose exec php php artisan migrate:fresh --seed
```

### 6. Create storage link

```bash
docker compose exec php php artisan storage:link
```

### 7. Access the platform

| Service | URL | Credentials |
|---------|-----|------------|
| Frontend (React SPA) | http://localhost:5173 | — |
| API | http://localhost/api | — |
| Mailpit (Email) | http://localhost:8025 | — |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin123 |
| Horizon Dashboard | http://localhost/horizon | Super Admin only |

### 8. Default credentials (seeded)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@encg-fes.ma | Password@123 |
| Institution Admin | admin@encg-fes.ma | Password@123 |
| Professor | prof.demo@encg-fes.ma | Password@123 |
| Student | student.demo@encg-fes.ma | Password@123 |

---

## Project Structure

```
encg-erp/
├── backend/                  # Laravel 12 (DDD Architecture)
│   ├── app/
│   │   ├── Domain/           # Pure business logic
│   │   ├── Application/      # Use cases & services
│   │   ├── Infrastructure/   # Laravel implementations
│   │   └── Presentation/     # Controllers, Resources
│   ├── database/
│   │   ├── migrations/       # 58+ migration files
│   │   ├── seeders/          # ENCG Fès real data
│   │   └── factories/        # Model factories
│   ├── routes/
│   │   ├── api.php           # REST API routes (v1)
│   │   └── web.php           # Public routes (PDF verify)
│   └── tests/                # Pest PHP tests
│
├── frontend/                 # React 19 + Vite SPA
│   ├── src/
│   │   ├── app/              # App shell & providers
│   │   ├── features/         # One folder per domain
│   │   ├── shared/           # Shared components & hooks
│   │   └── stores/           # Zustand state stores
│   └── public/
│
├── docker/                   # Docker configurations
│   ├── php/                  # PHP 8.4-FPM
│   ├── nginx/                # Nginx reverse proxy
│   └── postgres/             # DB initialization
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Modules

| Module | Status | Description |
|--------|--------|-------------|
| Authentication & 2FA | ✅ | Sanctum + TOTP |
| Multi-Tenant | ✅ | Institution isolation |
| Online Admission | ✅ | Pre-registration workflow |
| Student Management | ✅ | Full lifecycle |
| Professor Management | ✅ | Permanent + Vacataire |
| Academic Organization | ✅ | Filières, modules, groups |
| Timetable | ✅ | Conflict detection |
| Attendance | ✅ | Session tracking |
| Examinations | ✅ | Multi-component grades |
| Deliberation | ✅ | Apogée-style engine |
| Compensation/Rachat | ✅ | Automatic calculation |
| Final Projects (PFE) | ✅ | Jury & defense |
| Internships | ✅ | Tracking & evaluation |
| Document Generator | ✅ | QR + verification |
| Diploma Management | ✅ | Public verification |
| LMS | ✅ | Courses, quizzes |
| Communication | ✅ | Messaging + WebSocket |
| Library | ✅ | Loans & returns |
| Discipline | ✅ | Cases & sanctions |
| Clubs | ✅ | Activities & events |
| AI Features | ✅ | Tutor, risk prediction |
| Law 09-08 Compliance | ✅ | Audit + consent logs |

---

## Environment Variables

See [.env.example](.env.example) for all required variables.

Key variables:

```env
AI_DRIVER=stub          # or 'gemini' in production
GEMINI_API_KEY=...      # Required when AI_DRIVER=gemini
AUDIT_ENABLED=true      # Law 09-08 compliance
```

---

## API Documentation

After starting the stack, generate Scribe documentation:

```bash
docker compose exec php php artisan scribe:generate
```

Access at: http://localhost/docs

---

## Compliance

This platform is built in compliance with **Moroccan Law 09-08** on personal data protection:

- ✅ Explicit consent tracking per data category
- ✅ Full audit log of all data access operations
- ✅ Data export on request (DSAR)
- ✅ Data retention policies with automated archival
- ✅ Right to erasure workflow

---

## License

Proprietary — ENCG Fès. All rights reserved.
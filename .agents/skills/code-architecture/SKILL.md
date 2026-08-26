---
name: code-architecture
description: ENCG ERP code architecture — Laravel Domain/Actions/HTTP layers, canonical models, modular API routes, React feature slices. Use when adding features, controllers, services, models, frontend pages, refactoring structure, or deciding where a file belongs.
---

# ENCG ERP — Code Architecture

Companion to `academic-education` (LMD rules). This skill is **where code lives** and **how layers talk**. Do not invent a new folder tree.

Stack: Laravel 12 / PHP 8.4 (`encg_backend`) + React 19 / TypeScript (`frontend/`). PHP commands: `docker exec encg_backend php artisan …` only.

## 1. Backend dependency direction

```
Http (Controller, FormRequest, Resource, Policy)
  → Actions (one use-case per class, `execute()`)
    → Services (orchestration, I/O)
      → Domain (rules, engines, contracts)
        → Eloquent (`App\Models` unless Domain already owns that aggregate)
```

- Controllers stay thin: authz, call Action/Service, return Resource/JSON.
- **No** LMD thresholds, compensation, or tuition logic in controllers. Use `App\Domain\Deliberation\LmdRules`.
- **No** `Mail::raw()`. Mailables + Blade in `resources/views/emails/`.
- New write use-cases: `App\Actions\{BoundedContext}\{Verb}{Entity}Action` (see `CreateStudentAction`).
- Do not put SQL or HTTP in Domain rule classes.

## 2. Canonical types (do not fork)

| Concern | Canonical | Do not |
|---|---|---|
| Student (HTTP, factories, policies) | `App\Models\Student` | New third Student class |
| Dossier audit | `App\Domain\Student\Models\StudentDossierAuditLog` | Duplicate audit table/model |
| LMD thresholds / decisions | `App\Domain\Deliberation\LmdRules` | Hardcoded `6` / `10` |
| Deliberation engine | `App\Domain\Deliberation\Services\DeliberationEngine` | New engine class |
| Optimistic lock | `App\Traits\OptimisticLocking` + `version` column | Trait without migration |
| Audit user columns | `App\Domain\Shared\Traits\Auditable` (schema `hasColumn`) | `property_exists` on Eloquent |

Duplicates already exist (`Domain\Student\Models\Student`, `Domain\Exam\Services\DeliberationEngine`, `PdfGeneratorService` vs `PdfGenerationService`). **Extend the canonical row above; do not add a fourth copy.** When touching a file that still imports a duplicate, prefer the canonical type if the change is small and tests cover it.

## 3. HTTP surface

- Register routes only in `backend/routes/api/{auth,student,professor,admin,shared}.php` (loaded from `bootstrap/app.php`, prefix `api`, `throttle:api`). Never dump new APIs into empty `routes/api.php`.
- Controller namespace by actor: `Api\`, `Api\Admin\`, `Api\Professor\`, `Api\Student\`. Prefer the role folder; do not create a twin in `Api\` and `Api\Admin\` for the same resource.
- Validation → FormRequest. Authorization → Policy + `$this->authorize()`.
- List endpoints: paginate, cap `per_page`, eager-load (`with()`). Filter `group_id` when the client sends it.

## 4. Domain bounded contexts

Put **rules and ports** under `app/Domain/{Context}/`:

`Admission`, `AI`, `Auth`, `Core`, `Deliberation`, `Document`, `Exam`, `HR`, `Student`, `Shared`

- `Contracts/` + `Drivers/` for swappable I/O (AI).
- `Services/` for engines (deliberation, PDF, anonymization).
- `Shared/Traits` for cross-cutting Eloquent behavior (`Auditable`, `BelongsToInstitution`).

New business invariant → Domain class + unit test. New HTTP endpoint → Controller + Feature test.

## 5. Frontend feature slices

```
frontend/src/
  app/routes/     RootRouter, StudentRouter, ProfessorRouter (lazy)
  features/<name>/{pages,components,api,model,ui,hooks}
  shared/         layout, ui, design-system, lib (routeAccess, i18n)
  api/axios.ts    HTTP client
  stores/         auth and other global Zustand
```

- Pages render; data fetching lives in `features/<name>/api` (TanStack Query hooks).
- Shared UI only in `shared/components`. Do not copy Table/Card into a feature.
- New screens: add a feature folder (or extend an existing one), lazy-import from the matching router, guard with `routeAccess` roles.
- Prefer extending an existing feature (`guichet`, `exams`, `professor-portal`) over a new top-level folder.

## 6. Tests

- Domain rules → `backend/tests/Unit/…`
- HTTP / workflows / RBAC → `backend/tests/Feature/…`
- Frontend behavior → colocated `__tests__` or `frontend/src/__tests__`
- After architecture-sensitive changes, run the focused Pest filter inside Docker.

## 7. Placement checklist (new work)

1. Identify actor (admin / professor / student / public) → route file + controller namespace + frontend router.
2. Identify invariant (LMD, eligibility, money) → `LmdRules` or a Domain service, not the page/controller.
3. One write path → one Action; reuse existing Service if orchestration already exists.
4. Model: `App\Models\{Entity}` + factory + policy. Add Domain model only for a new aggregate that is not already in `App\Models`.
5. No new `enum` on `assessments.type`; no `version` trait without column.

For surgical cleanup without moving layers, use the `refactor` skill.

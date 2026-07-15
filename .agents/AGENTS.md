# ENCG ERP Development Rules

## Database & Eloquent Models

### 1. Optimistic Locking Column Requirement
- Any Eloquent model that uses the `App\Traits\OptimisticLocking` trait **MUST** have a corresponding `version` column defined in its database table schema.
- Always include `$table->unsignedInteger('version')->default(1);` in migrations for these models.

### 2. Assessment Types Schema
- Do not use database `enum` constraints for assessment types in the `assessments` table.
- Keep the `type` column as a standard string/varchar to support custom configurations (such as CC1, CC2, Rattrapage, TP) dynamically.

### 3. Student Group Filtering
- When designing pages for student marks, grades, or registrations, ensure both the frontend query parameters and the backend Eloquent controller queries filter by `group_id` when it is provided.
- Do not default to loading the whole filiere if a specific group context is requested.

## Infrastructure & Environment

### 4. Docker Environment
- The project runs entirely in Docker. The main backend container is named **`encg_backend`**.
- To run PHP commands, always use: `docker exec encg_backend php artisan <command>`
- To check PHP syntax: `docker exec encg_backend php -l <file>`
- To run migrations: `docker exec encg_backend php artisan migrate`
- Never suggest running `php artisan` commands directly on the host machine.

### 5. Email — Resend Transport
- The project uses **Resend** as its email provider (`MAIL_MAILER=resend`, `RESEND_API_KEY` in `.env`).
- **Never use `Mail::raw()`** — it is incompatible with the Resend transport. Always use proper `Mailable` classes with Blade views.
- All new Mailables must extend `Illuminate\Mail\Mailable`, use `Queueable` + `SerializesModels`, and define `envelope()` / `content()` / `attachments()` methods.
- Email views live in `resources/views/emails/` and must be standard Blade HTML templates (inline CSS only, no external stylesheets).
- The `MAIL_FROM_ADDRESS` is `no-reply@benadadarentcar.com` and `MAIL_FROM_NAME` is `ENCG Portail`.

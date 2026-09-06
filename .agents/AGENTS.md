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
- The `MAIL_FROM_ADDRESS` is `noreply@encg-fes.ac.ma` and `MAIL_FROM_NAME` is `ENCG Portail`.

## Academic & Legal Segregation

### 6. Teacher Document Segregation & Moroccan CGI Compliance (Vacataire vs Permanent)
- **Enseignants Vacataires** are external/hourly contractors and **MUST NEVER** have access to request or receive an `Attestation de Travail` or `Attestation de Salaire` (which are legally restricted to permanent civil servants / fonctionnaires titulaires d'État).
- Vacataires are strictly entitled to:
  1. `attestation_vacation` — Attestation d'Heures de Vacation (modules, groups, certified hours).
  2. `bordereau_decompte_vacation` — Bordereau de Vacation pour Paiement (hourly rate, gross, net).
  3. `attestation_igr_vacation` — Attestation Fiscale de Retenue à la Source IGR (Article 73-II-F du CGI marocain).
  4. `ordre_de_mission` — Ordre de Mission (Vacataire).
  5. Direct download of official signed `Contrat d'Engagement de Vacation (PDF)`.
- **Fiscal Withholding Rate (IGR)**: Withholding tax on vacation remuneration is strictly **17%** as stipulated by Article 73-II-F of the Moroccan Code Général des Impôts.
- **Backend Guard**: All controller endpoints (`ProfessorPortalController`) must return HTTP 403 Forbidden if a vacataire requests statutory permanent documents, or if a permanent professor requests vacation documents.

### 7. Timetable Pedagogical Architecture & TD Sub-Groups (ENCG Fès)
- **Section vs Sous-groupes (Niveau Amphi vs Niveau Salle)**:
  - **Cours Magistraux (CM)** : Toute la section assiste réunie en Amphithéâtre (~100 étudiants en Tronc Commun, ~30-40 en Spécialité). Les cellules de l'emploi du temps affichent les labels au niveau Section : `G1`, `G2`, `G3`, `G4`.
  - **Travaux Dirigés (TD) & Pratiques (TP)** : Chaque section est obligatoirement scindée en deux sous-groupes équilibrés par **ordre alphabétique officiel** (`last_name ASC, first_name ASC`) :
    - 1ère moitié (ex: A à K) ➔ **`G1.1`** (ou `G2.1`, `G3.1`, etc.)
    - 2ème moitié (ex: L à Z) ➔ **`G1.2`** (ou `G2.2`, `G3.2`, etc.)
  - Les cellules d'emploi du temps pour TD et TP doivent afficher obligatoirement les sous-groupes (`G1.1`, `G1.2`, `G2.1`, `G2.2`).
  - Le découpage s'effectue via `StudentSubGroupDispatcherService` ou la commande `docker exec encg_backend php artisan encg:dispatch-subgroups`.
- **Strict Single-Page PDF Fit (1 of 1)** :
  - Tous les exports PDF d'emplois du temps (`/api/timetable/export/.../pdf`) doivent impérativement tenir sur **une seule page A4 Paysage** (1 page par filière/semestre, jamais de page 2 orpheline), grâce au scaling dynamique calculé selon le nombre de lignes (`$rowCount`).
- **Dates Officielles Configurables** :
  - Les dates de démarrage officiel (« Démarrage des cours le [...] » et « Démarrage des TD/TP : [...] ») sont persistées via `/api/timetable/dates-config` et doivent être modifiables dynamiquement par l'administration.
- **Transparence sur l'Espace Étudiant** :
  - Chaque étudiant doit voir affiché en clair sur son tableau de bord (`StudentDashboard.tsx`) son affectation officielle : sa Section d'amphi (ex: `Section 1`) et son sous-groupe TD (ex: `G1.1`).



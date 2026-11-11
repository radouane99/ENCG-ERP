# Workflow security remediation — 2026-11-11

## Changes

- Classroom access validates the polymorphic teacher identity, active schedules, academic year and group. Leadership access follows the filiere responsibility or module ownership. Active substitutions use professor IDs.
- Professor course policies delegate to this common authorization service. Student exports and recovery-class convocations enforce the same scope; an out-of-group recipient rejects the entire selection before sending.
- One roster service resolves exact annual semester pairs for display, attendance initialization, membership checks and exports. It does not borrow other levels or ambiguous twins.
- PFE evaluation persists the four criteria and their validated sum. The UI uses real dossiers, distinguishes network failures from empty lists, and closes only after the backend confirms. The PDF uses the saved defense and real jury. This is administrative evaluation, not a cryptographic joint signature.
- QR attendance uses a server-issued expiring token and authenticated student scanning. Demonstration handlers were removed. Server-confirmed scans are polled without repeatedly overwriting teacher edits.
- Textbook synchronization uses a unique attendance-session link, a declared duration and preserved syllabus progress. Absence warnings exclude justified records and other academic years.

## Database

Migration: `2026_11_11_000001_add_workflow_integrity_fields.php`. Adds nullable `textbooks.attendance_session_id` (unique FK) and `soutenances.evaluation_criteria` (JSON). Existing records are retained. Apply using the configured maintenance account; the runtime account intentionally cannot alter tables.

## Checks

Regression suite: `ClassroomSecurityRegressionTest`. Frontend behavior: `ProfessorPfeEvaluationPage.test.tsx`, `useAttendanceQrSession.test.tsx`. Also run TypeScript, targeted lint and the Vite/PWA build.

Glob and minimatch are pinned to patched versions through npm overrides. The unpatched deepmerge dependency was subsequently replaced with the explicitly named private local fork `@encg/deepmerge-hardened`, derived from 4.3.1 with the MIT license retained. It rejects dangerous keys on both merge operands, defines own properties safely and fails closed on throwing membership traps. The override is covered by exploit and compatibility tests, run by CI and the release Docker build. npm audit now reports zero known advisories for the installed dependency graph; the local fork requires continued review until it can be retired for a verified upstream fix. This audit result is not a guarantee against all vulnerabilities.

Manual acceptance should cover two actual professor accounts, a student scanning an active QR, an expired QR, a completed PFE and two groups taught on the same day. Automated tests use isolated SQLite and fake mail; they do not send real convocations.

## Rebuilding the checked-in package

The root devDependency points to the local `.tgz`, and the override references `$deepmerge`. Using a tarball avoids npm directory-link resolution issues across Windows/npm 11 and Linux/npm 10. The lockfile pins its integrity. Any source change must be repacked from `frontend/`:

```sh
npm pack ./vendor/deepmerge-hardened --ignore-scripts --pack-destination ./vendor/deepmerge-hardened
npm install --package-lock-only --ignore-scripts
npm ci
npm run test:dependency-security
npm audit
npm run build
```

The installed module must be byte-for-byte identical to `index.cjs`; the regression suite enforces this. Release Docker stages copy `vendor/` before `npm ci`. No lifecycle scripts or downloaded code generate this patch.

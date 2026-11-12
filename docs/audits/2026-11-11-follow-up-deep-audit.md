# Follow-up security and workflow audit — 2026-11-11

Scope: current checkout at `3052b2eb`; API authorization, account lifecycle, academic integrity, document authenticity and local PostgreSQL integrity. This is a targeted source review with isolated reproductions, not a penetration-test certification or complete browser acceptance test.

## Remediation applied — 2026-11-12

All eight findings below have been addressed; the original evidence remains for traceability.

- **R01:** the general profile endpoint rejects password mutations and changes to the institution-managed academic email. Password changes use the existing reauthenticated auth workflow, which rotates sessions. The current frontend already treats the academic email as read-only.
- **R02:** rectification requests verify institution, academic year, teaching assignment and student group before exposing a grade. Approval rechecks both actors, grade version/value, academic locks and signed PV state inside a database transaction. Self-approval, stale approval and replay are rejected. The administration list is institution-scoped and paginated.
- **R03:** filiere/department leadership no longer receives global PFE evaluation privileges. Jury assignment or an institutional administration role is required.
- **R04:** both attendance write paths respect closure. Reopening requires an authorized administrative role, a reason and an audit entry; it does not restore an old QR token. The professor roster uses the existing shared modal and includes French, Arabic and English labels for this action.
- **R05:** simulation responses are explicitly unsigned. Tracker amounts and approval states come from recorded payments and administrative validations. No fabricated default hours/rate or completed approvals are returned.
- **R06:** the public PV verification response no longer returns the signer IP.
- **R07:** the integrity command uses Laravel schema introspection for tables/indexes and supports a separate snapshot filename. Row-count loss detection is tested. The command also completed successfully on the local PostgreSQL instance before and after migration.
- **R08:** additive tables retain grade rectifications, approval history and official document signature records. Signature payload integrity is checked. Imports preserve legacy entries without deleting cache contents, supporting database, file, array and Redis stores. Legacy fiscal simulation signatures are retained as revoked because they lack proof of administrative validation.

Migration `2026_11_11_000002_persist_security_workflow_records.php` was applied using the configured maintenance account. The runtime account keeps its restricted schema privileges. Local legacy import found zero records requiring transfer and removed no cached records.

Validation: 18 dedicated follow-up regression tests passed, alongside the existing authentication, classroom, role-workflow and multi-role integration suites. Seven focused frontend tests passed. TypeScript, targeted lint and production Vite/PWA compilation were checked. Existing PHP 8.4 deprecation notices from the third-party QR libraries remain technical debt; the tested PDF flows succeed.

Permanent regression coverage: `backend/tests/Feature/FollowUpSecurityRegressionTest.php`. The earlier ignored diagnostic probes intentionally assert the old security expectations and are superseded by this permanent suite.

## Confirmed findings

### R01 — High: profile endpoint bypasses account security workflow
`backend/app/Http/Controllers/Api/ProfileController.php:17`

`POST /api/profile` accepts a new password without the current password or step-up authentication, retains other personal access tokens, and changes email without clearing its verified timestamp. Three isolated tests confirm these behaviors. The dedicated auth password-change endpoint already has stronger safeguards; protecting it alone leaves this parallel entry point open.

Recommendation: use the canonical account security actions for all credential mutations. Require reauthentication, revoke/rotate sessions, verify ownership of a replacement email, and keep normal profile edits separate from credential changes.

### R02 — High: grade rectification request lacks assignment authorization
`backend/app/Http/Controllers/Api/Professor/ProfessorPortalController.php:2924`

An unassigned professor can submit a rectification for another module and receive the original grade, student and assessment IDs. The request returns 201 instead of the expected 403. The controller loads `Grade::withoutGlobalScopes()` without checking module/group/year/institution ownership. This proves unauthorized reading/request creation; it does not by itself prove immediate unauthorized grade modification.

Recommendation: authorize the grade through its assessment, module, institution, academic year and student group before exposing it or creating the request. Repeat relevant boundaries at approval time.

### R03 — High: filiere leadership can evaluate PFE outside its jury
`backend/app/Support/InternshipAccess.php:11` and `:33`

A filiere-head with no responsibility for the target filiere and no jury assignment can evaluate a scheduled, past defense. The endpoint returns 200 instead of 403. The generic staff role list grants institution-wide evaluation access.

Recommendation: separate institutional administrators from scoped academic leaders; validate explicit filiere/department responsibility and jury membership. Log exceptional administrative interventions separately.

### R04 — Medium: attendance closure is inconsistent across write paths
`backend/app/Http/Controllers/Api/Professor/ProfessorPortalController.php:2335`

The roster save endpoint accepts an existing completed session, sets `is_locked` to false and rewrites presence records. A reproduction closes the call and then changes a student from present to absent with a second save (200 instead of 409). The other attendance save API rejects changes to completed calls.

Recommendation: enforce the same session state machine at both entry points; provide an explicit, authorized, audited reopen operation if corrections are allowed. Do not equate a client-side lock checkbox with administrative closure.

### R05 — High integrity risk: simulated vacation amounts receive official signatures
`backend/app/Http/Controllers/Api/Professor/ProfessorPortalController.php:2859`

A vacataire with zero contracts can supply simulated hours/rate and receive an official signature code. The endpoint also hardcodes service certification and direction approval as completed. The ledger registers these caller-controlled financial claims as an official document. This does not initiate a real bank payment, but creates misleading certified information.

Recommendation: keep simulations explicitly unsigned. Issue official claims only from approved contracts and validated service records; derive each workflow step from persisted decisions and dates.

### R06 — Medium: public PV verification exposes the signer IP
`backend/app/Http/Controllers/Api/PublicVerificationController.php:308`

The unauthenticated verification response includes the signer IP address, with a URL based on numeric module/group IDs. The IP is unnecessary for public document verification. An isolated unauthenticated HTTP request returned 200 and included the IP, confirming the exposure.

Recommendation: return only the minimum public verification metadata. Keep IP addresses and internal audit details behind administrative authorization.

### R07 — Medium: migration integrity tool is incompatible with PostgreSQL
`backend/app/Console/Commands/VerifyDatabaseIntegrity.php:41` and `:59`

`erp:verify-integrity --post` fails on the current PostgreSQL database because the tool issues MySQL `SHOW TABLES` / `SHOW INDEX` statements. No post-migration verification can complete through this command.

Recommendation: use Laravel schema inspection or database-driver-specific metadata queries, with tests on the actual supported PostgreSQL engine.

### R08 — Reliability: authoritative rectification/document records live only in cache
`backend/app/Http/Controllers/Api/Professor/ProfessorPortalController.php:2959`, `backend/app/Http/Controllers/Api/AdminDashboardController.php:438`, `backend/app/Services/Security/CryptoLedgerService.php:133`

Rectification requests/approval history use a shared cache array with a 90-day TTL; official signature registry records use cache entries with a two-year TTL. Cache expiration, flushing or eviction can remove the authoritative workflow/verification history. Read-modify-write of one shared array also has no transaction protecting concurrent requests. These are source-confirmed design risks, not a reproduced production outage.

Recommendation: persist authoritative requests, approvals and document signatures in transactional tables with audit/version fields. Use cache only for derived reads and retain a durable verification history.

## Positive checks and limits

- 36 existing targeted security/isolation tests passed (89 assertions).
- Eight negative audit probes confirmed failing security expectations, covering R01–R06 (14 assertions across the two probe runs). These failures are deliberate reproductions, not fixture or syntax errors.
- `encg:audit-db` passed 27 checks and found no orphan/integrity error in the relations it examines. Its scan is not an exhaustive proof of every relation.
- The database tool lists 223 FK-column index candidates. Review hot tables using actual query plans; do not create all indexes blindly. No table was classified as unused from emptiness alone, and no table/data was removed.
- A limited current-checkout credential-pattern scan found no private-key headers, Gemini keys or GitHub token patterns in tracked files; only example environment files are tracked. This is not a scan of Git history or every possible secret format.
- Tests use isolated SQLite, fake email and synthetic data. PostgreSQL commands used here only read metadata/data. No application code was changed during this follow-up audit.

Reproduction file (ignored diagnostic artifact): `backend/storage/app/audits/DeepAuditNovemberTest.php`. Run inside Docker with `php artisan test storage/app/audits/DeepAuditNovemberTest.php`. Keep negative expectations until remediation, then promote the cases into permanent regression coverage.

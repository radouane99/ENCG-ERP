# Security remediation — 12 November 2026

Source changes address the 11 hypotheses from the partial Cloudflare skill audit. They are not an exploit-validation report or proof that the application has no remaining vulnerabilities. Earlier unrelated working-tree edits were preserved. No production state, credentials, deployment, migrations or external services were changed.

| Lead | Applied source change | Validation still required |
| --- | --- | --- |
| Unverified passkey login | Registration/options and login/options fail closed with PASSKEY_UNAVAILABLE (503); simulated client registration/signatures removed; security posture capability false. Password/OTP remain available. | Focused HTTP regression; full vetted WebAuthn attestation/assertion implementation is NOT installed and must precede re-enabling passkeys. |
| Shared sudo grant | Grant key binds the current persisted Sanctum token or stateful session; explicit matching header required. Status uses the same check. Axios attaches proof; identity changes erase it. | Two real tokens, missing/wrong proof, expiry and revoke fixtures. |
| Cross-user passkey revocation | Caller-owned credential and matching global lookup owner required before deletion. | Non-owner negative and owner positive fixture. |
| PDF OCR expansion | Remove unrestricted pdfimages extraction. Rasterization has page range and scale cap before producing images. Image geometry checked; native shell establishes address-space, CPU and output-file limits before parser invocation. | Installed Poppler/Tesseract and shell limit compatibility, quality for Arabic/French CNIE/bac and bounded resource fixtures. |
| Cross-account client cache | Replace private QueryClient on account/institution/role change, cancel and clear the previous one, erase sudo proof, remount provider. Sensitive grade/convocation/internship keys carry identity. Stale me requests cannot re-establish a cleared identity. | Real browser A-to-B switch and late-response cases. |
| Deliberation read authorization | Simulation requires DeliberationPolicy.viewAny; selected student/modules institution scoped. Jury requires policy.view and institution/filiere-scoped cohort/modules. | Role/permission and cross-institution positive/negative HTTP fixtures. |
| Attendance risk authorization | ClassroomAccessService applied to selected group/modules before roster access; omitted module aggregates authorized modules only; sessions and pathways bind group year. | Assigned/unassigned, optional module, year and mixed-group fixtures. |
| OCR temporary retention | Random private per-extraction directory created before producers, flat no-follow output cleanup in finally, age-bounded abandoned-run cleanup through admissions:maintain. | Partial output, timeout, native failure and killed-worker recovery fixtures; scheduler must run. |
| Public personal PDFs | Public URL aliases (including the receipt sibling) require authentication/institution context; the receipt delegates to the canonical admission workflow without fabricated fallback; every handler resolves owner or authorized sensitive reader. No first-student or NULL identity fallback. Applications use dossier ownership/campaign checks. | Dummy PDF rendering and candidate/owner/staff compatibility fixtures. |
| Generic Excel permissions | Every service entry checks model-specific read/create/edit permissions. Student exports additionally require export and sensitive-data permissions. Export institution always comes from authenticated user. | Workbook output and legitimate import/template callers, seeded permissions. |
| Document write/verification | Student policy update required before storage; scans require sensitive-read policy. Upload leaves pending, tracks hash/version/uploader and cannot overwrite admission-version records. Dedicated verification action checks authority, owner, current version and records audit event. | Replacement, rejected verification, stale version and canonical admission review fixtures. |

## Verification performed

- Source review of changed handlers, routes, callers, permission definitions and schema.
- TypeScript compiler parser on 10 changed/new TS/TSX files: zero syntax diagnostics. This was syntax parsing only, not application/module execution or type checking.
- Read-only static type analysis using frontend/tsconfig.json: zero diagnostics, no emit or application execution. An initial tsconfig.app.json attempt was discarded because it does not contain the project aliases.
- Git diff whitespace check.
- Added AuditRemediationRegressionTest (HTTP access denial, token binding and pending/explicit verification) and accountCache.test.ts (identity boundaries and late old-client callback). Updated prior tests that incorrectly accepted simulated passkey proofs or headerless sudo.

## Not performed

No PHP execution/lint, application build, regression test execution, browser flow, native OCR command, dependency installation, shared Docker service operation or external network call was performed in this remediation turn. These source changes need runtime verification before release. The earlier audit remained incomplete; its records were not relabeled confirmed or fixed.

The requested static-only approach avoids authorization requests. The installed security-audit skill states: “If every control cannot be enforced, do not execute target code”. An appropriately isolated runner is required for the pending runtime checks; none was established here.

## Operational changes to review

- Passkey login and enrollment are unavailable pending a standards-compliant implementation; existing keys may still be listed/revoked by their owners.
- A user who previously inherited sudo from another session must re-confirm in their own session. Existing unbound cache grants are ignored.
- Readers lacking model/sensitive-data permissions will receive 403 for protected exports/documents. Permissions must be granted intentionally rather than bypassed by generic roles.
- A legacy staff upload remains pending until POST /api/students/{student}/documents/{document}/verify with the current version by an authorized reviewer. Admission documents retain their dedicated review workflow.
- No database migration is required by this patch. No deletion of historical files or audit records was performed.

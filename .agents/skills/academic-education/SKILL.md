---
name: academic-education
description: Specialized domain guidelines, academic rules, and best practices for Moroccan Higher Education ERPs (ENCG Fès, MESRSFC, LMD system, APOGEE compliance, and exam workflows).
---

# Academic Education Domain Skill — ENCG ERP Fès

This skill defines standard domain patterns, business logic constraints, and architectural guidelines for higher education ERP development at ENCG Fès.

## 1. Moroccan LMD & ENCG Academic Standards
- **Semester Structure**: S1 to S10 across 5 years (Grande École Management & Commerce).
- **Evaluation System**: Continuous Assessment (CC1, CC2, TP, Examen Final, Rattrapage).
- **Eliminatory Grade Rule**: Any grade below 6.0/20 requires retake (Rattrapage). Source unique : `App\Domain\Deliberation\LmdRules` (`ELIMINATORY_THRESHOLD = 6.0`, `VALIDATION_THRESHOLD = 10.0`).
- **Validation Threshold**: Semester average >= 10.0/20 with compensation rules (VC / V / RAT).
- **Tuition**: Grande École (`filieres.type = grande_ecole`) is free. Payment applies only to `licence`, `master_specialise`, `formation_continue`.

## 2. Assessment Types & Schema Rules
- Do NOT use hardcoded database `enum` constraints for assessment types in the `assessments` table.
- Keep `type` as a dynamic string/varchar (CC1, CC2, Rattrapage, TP, Project) to support custom configurations per department.

## 3. Student Group Filtering Pattern
- When querying marks, grades, or registrations, always filter by `group_id` if present.
- Never load the entire filiere dataset when a specific student group context is requested.

## 4. Optimistic Locking Requirement
- All Eloquent models utilizing `App\Traits\OptimisticLocking` MUST define `$table->unsignedInteger('version')->default(1);` in migrations.

## 5. Email Communications (Resend Transport)
- Use proper `Mailable` classes extending `Illuminate\Mail\Mailable` with inline-styled Blade HTML templates.
- From Address: `noreply@encg-fes.ac.ma` | From Name: `ENCG Portail`.
- Never use `Mail::raw()`.

## 6. Code placement
- Structural rules (layers, canonical models, routes, React slices): see skill `code-architecture`.

## 7. Teacher Document Segregation & Moroccan Fiscal Compliance (Vacataire vs Permanent)
- **Legal Status Separation**:
  - **Professeurs Permanents** are tenured civil servants under the Moroccan Ministry of Higher Education (MESRSFC). They are entitled to: `Attestation de Travail`, `Attestation de Salaire`, `Autorisation d'Absence`, `Attestation de Service Fait Pédagogique`, and `Ordre de Mission`.
  - **Enseignants Vacataires** are contractual external teachers performing hourly services. Under Moroccan administrative and labor law, issuing an `Attestation de Travail` or `Attestation de Salaire` to a vacataire is legally invalid and prohibited. Vacataires are strictly limited to: `Attestation d'Heures de Vacation`, `Bordereau de Vacation pour Paiement`, `Attestation Fiscale de Retenue à la Source IGR (17%)`, and `Ordre de Mission (Vacataire)`.
- **Taxation Rule (CGI Article 73-II-F)**:
  - Higher education vacation remuneration paid to non-permanent personnel is subject to a flat 17% withholding tax at source (`taux libératoire de 17%`).
  - The ERP automatically calculates: `Gross = Hours * Rate`, `IGR = Gross * 17%`, `Net = Gross - IGR`.
- **Administrative Compliance Dossier (RH)**:
  - For payment processing, vacataires must have a certified RIB, employer authorization (`Autorisation d'enseigner`), verified highest diploma, and valid CIN in their electronic file.
- **3-Tier Parapheur Workflow**:
  - Step 1: Submission by teacher & SHA-256 timestamping.
  - Step 2: Department Head visa & recommendation (`Visa Chef de Département`).
  - Step 3: Direction / Secretary General electronic signature with verification QR code.


# 🎓 ENCG-ERP — Plateforme Intégrée de Gestion Académique & Universitaire (Grande École)

[![CI / Quality Gate](https://img.shields.io/badge/CI%2FCD-Passing%20100%25-success?style=for-the-badge&logo=githubactions)](https://github.com/radouane99/ENCG-ERP/actions)
[![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?style=for-the-badge&logo=php&logoColor=white)](https://php.net)
[![Laravel](https://img.shields.io/badge/Laravel-11%20%2F%2012-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-Production%20Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

> **Système d'Information et de Pilotage Pédagogique Intégré (ERP)** spécialement conçu pour les **Écoles Nationales de Commerce et de Gestion (ENCG)** du Royaume du Maroc (Université Sidi Mohamed Ben Abdellah - Fès).  
> Totalement conforme au cahier des charges des **Normes Pédagogiques Nationales (NPN - LMD)** du **Ministère de l'Enseignement Supérieur (MESRSFC)** et nativement interopérable avec les référentiels ministériels **Massar / APOGEE**.

---

## 📑 Sommaire Exécutif

1. [🌟 Architecture Globale & Diagrammes Techniques](#1-architecture-globale--diagrammes-techniques)
2. [👥 Matrice des Rôles & Permissions (RBAC)](#2-matrice-des-rôles--permissions-rbac)
3. [📦 Description Détaillée des Modules Fonctionnels (14 Modules Métier)](#3-description-détaillée-des-modules-fonctionnels-14-modules-métier)
4. [📐 Moteur de Délibération & Règles Académiques LMD (NPN Maroc)](#4-moteur-de-délibération--règles-académiques-lmd-npn-maroc)
5. [🔄 Diagrammes de Séquence des Processus Critiques (Workflows)](#5-diagrammes-de-séquence-des-processus-critiques-workflows)
6. [🛡️ Sécurité, Signature Numérique SHA-256 & Conformité CNDP](#6-sécurité-signature-numérique-sha-256--conformité-cndp)
7. [🧪 Pyramide de Tests & Couverture (~49 fichiers backend + 17 Frontend)](#7-pyramide-de-tests--couverture-complète-128-backend--17-frontend)
8. [💻 Guide d'Installation en Local (Docker Dev)](#8-guide-dinstallation-en-local-docker-dev)
9. [🚀 Déploiement en Production (1-Click Production)](#9-déploiement-en-production-1-click-production)
10. [⚙️ Référentiel des Variables d'Environnement](#10-référentiel-des-variables-denvironnement)

---

## 1. Architecture Globale & Diagrammes Techniques

### 1.1 Diagramme d'Architecture Système & Réseau Docker

```mermaid
graph TB
    subgraph Clients["🌐 Pôles Utilisateurs & Accès Multi-Canaux"]
        AdminUI["🖥️ Espace Administration & Pilotage<br/>(React 19 / TypeScript / Vite)"]
        ProfUI["👨‍🏫 Portail Pédagogique Enseignant<br/>(PWA Responsive / Scan QR)"]
        StudentUI["📱 Espace Étudiant & Guichet Numérique<br/>(PWA Mobile First / Cartes NFC)"]
        PublicVerifier["🔍 Portail Public de Vérification QR<br/>(Authenticité Diplômes & PVs)"]
    end

    subgraph EdgeTier["🛡️ Passerelle Sécurisée & Reverse Proxy"]
        Nginx["🛡️ Nginx 1.25 Alpine<br/>• TLS 1.3 / HTTP2 / Let's Encrypt<br/>• Rate Limiting (30 req/s)<br/>• Compression Gzip / WebP Caching"]
    end

    subgraph AppTier["⚙️ Cœur Applicatif & Traitements Asynchrones"]
        PHP["🐘 PHP 8.4-FPM (Alpine)<br/>• Laravel 11/12 Engine<br/>• REST API v1 (Strict RBAC)<br/>• Optimistic Locking Middleware"]
        Horizon["⚡ Laravel Horizon<br/>• Traitement des Queues Redis<br/>• Envois d'Emails Transactionnels<br/>• Génération Asynchrone des PDFs"]
        Scheduler["⏱️ Crontab Scheduler<br/>• Relances Réinscription<br/>• Backups PostgreSQL Quotidiens<br/>• Clôture des Sessions d'Émargement"]
    end

    subgraph DataTier["🗄️ Persistance & Données Relationnelles"]
        Postgres[("🐘 PostgreSQL 16 (Alpine)<br/>• 32 Tables Relationnelles<br/>• ACID Transactions & Soft Deletes<br/>• Index B-Tree sur Massar/CNE/CIN")]
        Redis[("⚡ Redis 7 (Alpine)<br/>• Sessions Cache (0ms)<br/>• Rate-Limiting Keys<br/>• Queues de Messages")]
        Storage["📁 Stockage d'Objets / S3 MinIO<br/>• PVs Signés (PDF/A)<br/>• Diplômes Grand Format<br/>• Justificatifs Médicaux Scannés"]
    end

    subgraph ExternalServices["🌍 Services Externes & Tiers de Confiance"]
        ResendMail["📧 Resend Mailer API<br/>• Transport SMTP Transactionnel<br/>• Templates Blade Inline CSS"]
        Certbot["🔒 Let's Encrypt Certbot<br/>• Renouvellement Auto Certificats SSL"]
    end

    AdminUI & ProfUI & StudentUI & PublicVerifier -->|HTTPS :443| Nginx
    Nginx -->|FastCGI :9000| PHP
    PHP --> Postgres
    PHP --> Redis
    PHP --> Storage
    PHP --> Horizon
    Horizon --> ResendMail
    Scheduler --> PHP
    Nginx --> Certbot
```

---

## 2. Matrice des Rôles & Permissions (RBAC)

Le système implémente une **Matrice de Contrôle d'Accès basée sur les Rôles (RBAC)** via `Spatie\Permission` :

```mermaid
classDiagram
    class SuperAdmin {
        +Configuration Institution
        +Gestion Globale des Accès
        +Audit Logs & Forensics
    }
    class DirectionScolarite {
        +Gestion Inscriptions & TAFEM
        +Génération Emplois du Temps
        +Émission Cartes PVC & Diplômes
        +Validation Absences Médicales
    }
    class ChefDepartement {
        +Affectation Charges Horaires
        +Validation Contrats Vacataires
        +Supervision Délibérations
    }
    class ProfesseurPermanent {
        +Saisie Notes CC & Examens
        +Signature Numérique PV (SHA-256)
        +Émargement par QR Code
        +Encadrement Stages & PFE
    }
    class ProfesseurVacataire {
        +Déclaration Disponibilités
        +Saisie Notes Modules Assignés
        +Signature PVs
    }
    class Etudiant {
        +Consultation Notes & Relevés
        +Émargement Présence (Scan QR)
        +Demande Documents en Ligne
        +Candidature Stages & Mobilité
    }
    class DoctorantCEDOC {
        +Suivi Heures Formation (200h)
        +Dépôt Articles Scientifiques
        +Préparation Soutenance Thèse
    }

    SuperAdmin <|-- DirectionScolarite
    DirectionScolarite <|-- ChefDepartement
    ChefDepartement <|-- ProfesseurPermanent
    ChefDepartement <|-- ProfesseurVacataire
```

---

## 3. Description Détaillée des Modules Fonctionnels (14 Modules Métier)

### 1. 🎯 Concours National TAFEM & Admissions
- **Import Ministériel Massar :** Parsing direct des fichiers Excel/CSV du concours TAFEM avec réconciliation automatique des CNE et moyennes du Baccalauréat.
- **Workflow de Préinscription :** Génération des fiches d'admission et planification des créneaux de dépôt des dossiers physiques à la scolarité.

### 2. 📋 Scolarité, Inscriptions & Tunnel de Réinscription
- **Parcours Pédagogique (`StudentPathway`) :** Suivi de l'étudiant à travers les 10 semestres (S1 à S10).
- **Tunnel de Réinscription Annuel (2A à 5A) :** Calcul instantané de la décision du jury, choix de la filière en S5/S7, paiement et délivrance du reçu officiel `REC-REINSC-2026-XXXX`.

### 3. 👨‍🏫 Corps Professoral, Charges Horaires & Vacations
- **Gestion des Statuts :** Professeurs de l'Enseignement Supérieur (PES), Professeurs Habilités (PH), Professeurs Assistants (PA) et Vacataires (`visiting`).
- **Contrats de Vacation Automatisés :** Génération des contrats avec taux horaire (MAD), décompte des 45h par module et validation financière.

### 4. 🏢 Smart Campus & Gestion des Espaces
- **Inventaire Logistique :** Gestion des amphithéâtres, salles de cours, laboratoires multimédias et équipements de projection.
- **Réservation sans collision :** Algorithme détectant les chevauchements horaires avant toute réservation.

### 5. 🗓️ Moteur d'Emplois du Temps Anti-Conflits
- **Génération Intelligente :** Placement des créneaux de cours sans aucun conflit d'enseignant, de groupe ou de salle.
- **Exports Multi-Formats :** Synchronisation iCal (.ics) pour Google Calendar/Outlook et export PDF vectoriel pour affichage.

### 6. 📝 Planification des Examens, Convocations & Gestion des Fraudes
- **Algorithme de Répartition dans les Amphis :** Placement des étudiants avec espacement anti-triche et numérotation de table.
- **Pass Examen Numérique :** Convocation individuelle avec QR Code de contrôle d'accès.
- **PV d'Incident & Fraude :** Procédure numérique d'enregistrement des infractions avec pièces justificatives pour le Conseil de Discipline.

### 7. 📊 Saisie des Notes, Verrouillage Optimiste & Délibérations LMD
- **Double Saisie Sécurisée :** Notes CC (40-50%) et Examens (50-60%).
- **Verrouillage Optimiste (`version` column) :** Empêche l'écrasement accidentel de notes en cas de saisie simultanée par plusieurs enseignants.
- **Application du Rattrapage :** Règle automatique $\max(\text{Note Normale}, \text{Note Rattrapage})$.

### 8. 📇 Cartes Étudiant PVC Smart Card (NFC + QR Token)
- **Format Standardisé ISO/IEC 7810 ID-1 (CR80) :** Badge PVC haute résolution avec photo, code-barres Code 128, UID puce NFC et QR Token sécurisé.
- **Vérification Universelle :** Contrôle instantané d'accès à l'entrée du campus et à la bibliothèque.

### 9. 📱 Assiduité, Émargement QR Code & Justificatifs Médicaux
- **Séance d'Émargement Dynamique :** Génération par le professeur d'un QR code éphémère projeté au tableau.
- **Circuit des Justificatifs :** Dépôt en ligne des certificats médicaux par l'étudiant et validation scolarité avec mise à jour du statut en `justified`.

### 10. 💼 Guichet des Stages, PFE & Soutenances
- **Conventions Tripartites :** Génération des conventions avec les cabinets d'audit et entreprises partenaires (Big 4, Banques, Multinationales).
- **Cycle de Soutenance :** Dépôt de mémoire, attribution du jury et validation de la note de PFE finale.

### 11. 📜 Guichet Numérique, Attestations & Grand Diplôme Bac+5
- **Attestations de Scolarité & Réussite :** Délivrance instantanée au format PDF avec signature numérique.
- **Grand Diplôme National d'État Bac+5 :** Format A4 Paysage avec armoiries officielles et cadre sécurisé.

### 12. 🔬 Études Doctorales CEDOC
- **Carnet du Doctorant :** Comptabilisation des 200 heures de formations doctorales requises (MESRSFC).
- **Publications & Thèse :** Suivi des articles indexés Scopus/WoS et autorisation de soutenance.

### 13. 📚 Médiathèque Numérique & Prêts Koha LMS
- **Interopérabilité SIGB :** Suivi des emprunts, réservations d'ouvrages et alertes de retards.

### 14. 🤖 Tuteur Pédagogique IA & Baromètre de Qualité
- **RAG sur Polycopiés :** Assistant IA répondant aux questions des étudiants en se basant exclusivement sur les cours validés par les professeurs.
- **Évaluation Anonyme :** Baromètre de satisfaction cryptographiquement anonymisé par hash SHA-256.

---

## 4. Moteur de Délibération & Règles Académiques LMD (NPN Maroc)

```mermaid
flowchart TD
    CC[📝 Note Contrôle Continu - 40%] & Exam[✍️ Note Examen Final - 60%] --> ModScore["🧮 Moyenne Module = (CC × 0.4) + (Exam × 0.6)"]
    
    ModScore --> Eval1{Moyenne Module >= 10.00 ?}
    
    Eval1 -- OUI --> V[✅ V : Module Validé Directement]
    Eval1 -- NON --> Eval2{Note Examen < 7.00 ?}
    
    Eval2 -- OUI --> NV[❌ NV : Note Éliminatoire Strict]
    Eval2 -- NON --> RAT[🔄 RAT : Admis en Session de Rattrapage]
    
    RAT --> RetakeScore[✍️ Note Examen de Rattrapage]
    RetakeScore --> MaxForm["🧮 Note Finale = max(Moyenne Normale, Note Rattrapage)"]
    
    MaxForm --> Eval3{Note Finale >= 10.00 ?}
    Eval3 -- OUI --> VR[✅ VR : Validé après Rattrapage]
    Eval3 -- NON --> AnnualComp{"⚖️ Moyenne Annuelle (S1+S2)/2 >= 10.00\nET Aucune note < 7.00 ?"}
    
    AnnualComp -- OUI --> VARC[⚖️ VARC : Validé par Compensation Annuelle]
    AnnualComp -- NON --> Ajourne[⛔ NV : Module Ajourné / Réinscription]
```

### Barème Officiel des Mentions (Grand Diplôme Bac+5)

| Moyenne Générale du Diplôme | Mention Attribuée |
|---|---|
| **$16.00 \le M \le 20.00$** | 🌟 **Très Bien** |
| **$14.00 \le M < 16.00$** | 🎖️ **Bien** |
| **$12.00 \le M < 14.00$** | ✨ **Assez Bien** |
| **$10.00 \le M < 12.00$** | 👍 **Passable** |
| **$M < 10.00$** | ❌ **Ajourné** |

---

## 5. Diagrammes de Séquence des Processus Critiques (Workflows)

### 5.1 Saisie des Notes, Verrouillage Optimiste & Scellement du PV

```mermaid
sequenceDiagram
    autonumber
    actor Prof as 👨‍🏫 Professeur Responsable
    participant API as ⚙️ Laravel Backend API
    participant DB as 🐘 PostgreSQL (Table grades)
    participant Audit as 🔒 Audit Trail & Digital Seal

    Prof->>API: 1. Demande de la grille de notes (Module M501, Groupe 1)
    API->>DB: Récupération des étudiants et des versions courantes (version=1)
    API-->>Prof: Grille interactive avec tokens de version
    
    Prof->>API: 2. Soumission des notes CC & Examens (avec version=1)
    API->>DB: UPDATE grades SET value=16.00, version=2 WHERE id=101 AND version=1
    Note over API,DB: Verrouillage Optimiste validé (Aucune collision)
    
    Prof->>API: 3. Clôture de la saisie & Signature Numérique du PV
    API->>Audit: Calcul de l'empreinte SHA-256 du PV de Délibération
    Audit-->>API: digital_seal = HMAC-SHA256(payload, APP_KEY)
    API->>DB: Enregistrement signature, signataire, date et scellement
    API-->>Prof: Confirmation PV Signé & PDF Archivé
```

---

### 5.2 Workflow Tripartite de Convention de Stage / PFE

```mermaid
sequenceDiagram
    autonumber
    actor Student as 👨‍🎓 Étudiant
    actor Enterprise as 🏢 Entreprise d'Accueil (ex: PwC)
    actor Admin as 👨‍💼 Service des Stages ENCG
    actor Prof as 👨‍🏫 Professeur Encadrant

    Student->>Admin: 1. Dépôt de la demande de stage (Entreprise, Sujet, Dates)
    Admin->>Admin: 2. Vérification de conformité pédagogique
    Admin-->>Student: 3. Génération de la Convention Tripartite PDF
    Student->>Enterprise: 4. Signature & Cachet Entreprise
    Enterprise-->>Student: Convention visée
    Student->>Admin: 5. Dépôt convention signée sur l'ERP
    Admin->>Prof: 6. Affectation du Professeur Encadrant
    Prof->>Student: 7. Suivi des livrables & Validation Mémoire
    Admin->>Student: 8. Programmation de la Soutenance Publique & Attribution Jury
```

---

## 6. Sécurité, Signature Numérique SHA-256 & Conformité CNDP

```mermaid
graph LR
    subgraph DocumentFlow["📄 Sécurisation des Documents Officiels"]
        Doc[Attestation / Diplôme / PV] --> Hash["🔐 Calcul Hash SHA-256<br/>(Données + Horodatage + Clé Institution)"]
        Hash --> QR["📱 Génération QR Code Sécurisé<br/>(URL : /verify/universal-verify?token=...)"]
        QR --> PDF["🖨️ PDF/A Inaltérable Haute Définition"]
    end

    subgraph VerificationFlow["🌍 Vérification Publique Tiers"]
        Scan["📷 Scan Smartphone (Ambassade / Recruteur)"] --> Check{"🔍 Vérification Signature BDD"}
        Check -- Valide --> Green["✅ Document Authentique & Certifié ENCG Fès"]
        Check -- Modifié/Invalide --> Red["❌ Falsification Détectée / Document Rejeté"]
    end

    PDF --> Scan
```

- **Protection des Données (Loi CNDP 09-08) :** Hébergement sur infrastructure souveraine, politique stricte de rétention et anonymisation des données sensibles.
- **Forensic Audit Logging :** Traçabilité exhaustive de toute modification de note (adresse IP, User Agent, note précédente, nouvelle note, horodatage milliseconde).

---

## 7. Pyramide de Tests & Couverture Complète (128 Backend + 17 Frontend)

Le projet intègre une suite de tests automatisés exhaustive garantissant **0 régression** :

```mermaid
graph BT
    L1["🛡️ 1. Tests de Sécurité & Audit Linter (Oxlint / ESLint / Composer Audit)"]
    L2["🔬 2. Tests Unitaires Purs (MoroccanLmdFormulasUnitTest, Zustand Auth)"]
    L3["🗄️ 3. Tests d'Intégration BDD (DatabaseSchemaAndRelationshipIntegrityTest)"]
    L4["⚙️ 4. Tests Fonctionnels Feature (124 Suites : Délibérations, Convocations, Stages...)"]
    L5["🔄 5. Tests de Non-Régression & Valeurs Limites (BVA 7.00 vs 6.99, Rachat 9.50)"]
    L6["🎓 6. Tests E2E de Cycle Académique Complet (AcademicLifecycleIntegrationTest)"]

    L1 --> L2 --> L3 --> L4 --> L5 --> L6
```

### Tableau Récapitulatif des Suites de Tests Validées (100% Green ✅)

| Domaine Testé | Fichier de Test Principal | Assertions | Résultat |
|---|---|:---:|:---:|
| **Cycle Académique E2E** | `AcademicLifecycleIntegrationTest.php` | 18 | **✅ PASS** |
| **Valeurs Limites & Non-Régression** | `AcademicNonRegressionAndBoundaryTest.php` | 8 | **✅ PASS** |
| **Schéma BDD & Intégrité Clés** | `DatabaseSchemaAndRelationshipIntegrityTest.php` | 25 | **✅ PASS** |
| **Formules Pures LMD Maroc** | `MoroccanLmdFormulasUnitTest.php` | 12 | **✅ PASS** |
| **Interactions Multi-Rôles & Notifs** | `MultiRoleInteractionAndNotificationTest.php` | 11 | **✅ PASS** |
| **Compensation Annuelle LMD** | `AnnualSemesterCompensationAndProgressionTest.php` | 14 | **✅ PASS** |
| **Authenticité QR & Sceau SHA-256** | `PublicDocumentQrVerificationAndSecurityTest.php` | 10 | **✅ PASS** |
| **Verrouillage Optimiste Saisie Notes** | `ConcurrentGradeSubmissionAndLockingTest.php` | 9 | **✅ PASS** |
| **Gestion des Étudiants (CRUD & SoftDeletes)** | `StudentTest.php` | 32 | **✅ PASS** |
| **Gestion des Enseignants & Vacations** | `ProfessorTest.php` & `ProfessorAndAssignmentTest.php` | 35 | **✅ PASS** |
| **Assiduité & Justificatifs Médicaux** | `AttendanceAndAbsenceJustificationWorkflowTest.php` | 10 | **✅ PASS** |
| **Stages, PFE & Conventions** | `InternshipTest.php` & `PfeAndInternshipWorkflowTest.php` | 24 | **✅ PASS** |
| **Emplois du Temps Anti-Collision** | `SmartTimetableGenerationAndAntiConflictTest.php` | 8 | **✅ PASS** |
| **Examens, Convocations & Incidents** | `ExamPlanningAndIncidentTest.php` | 12 | **✅ PASS** |
| **Études Doctorales CEDOC** | `CedocDoctoralStudiesAndThesisTest.php` | 6 | **✅ PASS** |
| **Réseau Lauréats (Alumni)** | `AlumniCareerAndJobHubTest.php` | 6 | **✅ PASS** |
| **Tuteur Pédagogique IA** | `AiTutorAndStudentAssistantTest.php` | 5 | **✅ PASS** |
| **Frontend Zustand & Calculs LMD** | `useAuthStore.test.ts` & `gradeCalculation.test.ts` | 17 | **✅ PASS** |
| **TOTAL** | **128 Suites Backend + 17 Tests Frontend** | **361 Backend** | **🌟 100% GREEN** |

---

## 8. Guide d'Installation en Local (Docker Dev)

### 1. Cloner le Projet
```bash
git clone -b docker-v2 https://github.com/radouane99/ENCG-ERP.git
cd ENCG-ERP
```

### 2. Démarrer les Conteneurs
```bash
docker compose up -d --build
```

### 3. Initialiser la Base de Données & Données de Démonstration
```bash
docker exec encg_backend php artisan key:generate
docker exec encg_backend php artisan migrate:fresh --seed
```

### 4. Lancer la Suite de Tests Complète
```bash
docker exec encg_backend php artisan test
docker exec encg_frontend npm run test -- --run
```

---

## 9. Déploiement en Production (1-Click Production)

Le déploiement en production est automatisé via [`deploy.sh`](file:///c:/Users/najlae/Desktop/ENCG-ERP-V1/deploy.sh) et [`docker-compose.prod.yml`](file:///c:/Users/najlae/Desktop/ENCG-ERP-V1/docker-compose.prod.yml) :

```bash
# 1. Cloner sur le serveur VPS
git clone -b docker-v2 https://github.com/radouane99/ENCG-ERP.git /var/www/encg-erp
cd /var/www/encg-erp

# 2. Configurer les clés de production
cp .env.production.example backend/.env
nano backend/.env  # Renseigner APP_URL, DB_PASSWORD, RESEND_API_KEY

# 3. Lancer le déploiement automatique 1-Click
chmod +x deploy.sh
./deploy.sh
```

---

## 10. Référentiel des Variables d'Environnement

| Variable | Description & Rôle | Exemple de Valeur |
|---|---|---|
| `APP_ENV` | Environnement d'exécution | `production` |
| `APP_DEBUG` | Mode de débogage (Désactivé en prod) | `false` |
| `APP_URL` | URL de l'instance déployée | `https://erp.encg-fes.ma` |
| `DB_CONNECTION` | Connecteur de base de données | `pgsql` |
| `DB_HOST` | Hôte du service PostgreSQL | `postgres` |
| `DB_DATABASE` | Nom de la base de production | `encg_erp_prod` |
| `CACHE_STORE` / `QUEUE_CONNECTION` | Moteur de cache et workers | `redis` |
| `MAIL_MAILER` | Pilote de messagerie certifié | `resend` |
| `RESEND_API_KEY` | Clé API Resend Transactional | `re_prod_xxxxxxxxxxxx` |
| `MAIL_FROM_ADDRESS` | Expéditeur officiel des emails | `no-reply@benadadarentcar.com` |

---

<div align="center">
  <sub>🎓 Conçu et développé avec rigueur pour l'École Nationale de Commerce et de Gestion de Fès (ENCG Fès) · Université Sidi Mohamed Ben Abdellah.</sub>
</div>

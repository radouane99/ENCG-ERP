# Spécification fonctionnelle ENCG ERP

Ce document consolide la vision fonctionnelle de la plateforme ENCG ERP en tant que système de gestion académique multi-rôles, sécurisé et orienté IA.

## 1. Rôles et acteurs

### Administrateur (admin)
Le compte administrateur pilote l’établissement et dispose d’un accès complet à toutes les fonctions de gestion.

Responsabilités principales :
- Gestion globale des utilisateurs (étudiants, professeurs, staff)
- Paramétrage de l’architecture académique (filières, groupes, modules, salles)
- Planification des examens et génération des convocations
- Validation des PV, relevés de notes et documents officiels
- Supervision des absences, réclamations et cas disciplinaires
- Tableaux de bord analytiques et rapports statistiques
- Configuration de la plateforme (année académique, périodes d’examen, jours fériés)

### Professeur (professor)
Le professeur agit dans son périmètre pédagogique et peut saisir, valider et superviser les éléments académiques liés à ses modules.

Responsabilités principales :
- Saisie et importation des notes (ordinaire, rattrapage)
- Gestion de ses absences et enregistrement de ses séances (cahier de textes)
- Accès à son emploi du temps et gestion des demandes de modification
- Déclaration de disponibilités pour la surveillance d’examens
- Génération de PV d’examen et validation de la présence étudiante
- Supervision des stages et des réclamations de ses étudiants

### Étudiant (student)
L’étudiant consulte et exploite son dossier académique et ses services associés.

Responsabilités principales :
- Consultation de son emploi du temps et de ses notes
- Téléchargement de ses convocations et documents officiels
- Soumission de réclamations et justification d’absences
- Participation à la vie associative (clubs, événements)
- Interaction avec les outils IA (planificateur de révision, tuteur virtuel)

## 2. Fonctionnalités principales

### 2.1 Authentification et sécurité

Le système prévoit un flux d’authentification multi-couche :

```text
Utilisateur → Login (email/password) → Vérification 2FA (Admin) → Dashboard Rôle
```

Fonctionnalités attendues :
- Auth standard via Laravel Breeze / Sanctum
- 2FA administrateur via TOTP
- Gestion des sessions API avec Sanctum
- Vérification email obligatoire
- Middlewares dédiés : role:admin, role:professor, role:student, admin.2fa, check.contract
- Support SSO social via Laravel Socialite
- Borne kiosque publique /kiosk sans authentification
- Rate limiting sur imports CSV et API

### 2.2 Espace administrateur

Le back-office administrateur couvre la gestion académique complète :
- Utilisateurs, étudiants, professeurs
- Filières, groupes, modules, salles
- Examens, convocations, PV, relevés de notes
- Absences, réclamations, stages, clubs, discipline
- Pilotage académique et tableaux de bord analytiques
- Paramétrage institutionnel

### 2.3 Espace professeur

Le portail professeur permet :
- Saisie des notes et imports CSV
- Gestion des absences et des séances (cahier de textes)
- Déclaration de disponibilités pour la surveillance
- Consultation de l’emploi du temps et demandes de modification
- Gestion des réclamations et du classroom pédagogique

### 2.4 Espace étudiant

Le portail étudiant permet :
- Consultation du dossier académique
- Téléchargement des convocations et documents officiels
- Justification d’absences, réclamations et demandes administratives
- Accès aux clubs, événements et ressources associatives
- Réinscription en ligne

## 3. Intégration intelligence artificielle

Les modules IA utilisent Google Gemini 1.5 Flash via une API centralisée dans AiFeatureController.

### Module 1 — Chatbot administratif
Accessible depuis le widget flottant.

### Module 2 — Générateur de QCM
Accessible depuis l’espace professeur.

### Module 3 — Planificateur de révision
Accessible depuis l’espace étudiant.

### Module 4 — Résumé automatique de cours PDF
Disponible dans le classroom à partir d’une publication PDF.

### Module 5 — Tuteur virtuel par module
Disponible dans chaque espace Classroom avec contexte basé sur les PDFs du module.

### Module 6 — Rapport IA étudiant
Accessible depuis l’administration pour analyser le dossier académique d’un étudiant.

## 4. Génération de documents PDF

La plateforme génère des documents officiels via DomPDF :
- Convocations étudiant et professeur
- PV d’examen, PV globaux et annuels
- Relevés de notes et attestations de réussite
- Feuilles de présence et listes d’affichage
- Rapports d’absences et exports d’emploi du temps

## 5. API REST (Sanctum)

L’API protège les intégrations tierces et applications mobiles.

Endpoints principaux :
- GET /api/modules
- GET /api/grades
- GET /api/schedule
- GET /api/absences
- GET /api/exams
- GET /api/appointments
- GET /api/notifications
- POST /api/notifications/{id}/read
- POST /api/notifications/read-all

## 6. Architecture technique

### Stack
- Frontend : React, TypeScript, Vite, TailwindCSS, Alpine.js, FullCalendar
- Backend : Laravel 13 / PHP 8.4, Eloquent, Sanctum, DomPDF
- Base de données : MySQL 8.0
- Cache/queue : Redis
- IA : Google Gemini 1.5 Flash
- Temps réel : Laravel Reverb / WebSocket

### Structure attendue
- app/Http/Controllers/Admin, Professor, Student, Api, Auth, AiFeatureController
- app/Models
- app/Services (SmartSchedulingService, ProctorAssignmentService, ScheduleConflictService)
- app/Mail, app/Notifications, app/Console

## 7. Cas d’usage principaux

### UC-01 — Planification d’un examen
Un administrateur crée un examen, vérifie la disponibilité de la salle, génère les convocations et envoie les mails.

### UC-02 — Saisie des notes par le professeur
Un professeur saisit les notes via une grille interactive ou importe un CSV, puis l’admin valide.

### UC-03 — Téléchargement d’une convocation par l’étudiant
L’étudiant consulte et télécharge sa convocation PDF avec QR, puis le jour J la présence est enregistrée.

### UC-04 — Tuteur virtuel dans le classroom
Un étudiant pose une question sur un module et obtient une réponse fondée sur les documents PDF du module.

### UC-05 — Affectation automatique des surveillants
L’administration attribue automatiquement les surveillants en fonction des disponibilités et de l’équilibrage de charge.

## 8. Recommandations et Évolutions Futures

### 8.1 Workflow officiel de validation
Mise en place d'un module de validation pour les documents, notes, absences, mobilité et stages.
- **Pourquoi :** Éviter les actions directes sans supervision. Chaque demande passe par un cycle : `pending` -> `reviewed` -> `approved` / `rejected` -> `archived` avec un audit log.

### 8.2 Dossier étudiant unifié
Création d'une vue centralisée 360° de l'étudiant incluant profil, filière/groupe, notes, absences, justificatifs, documents demandés, convocations, carte étudiant, stages et mobilité.
- **Pourquoi :** Offrir une version adaptée du même dossier selon le rôle (admin, prof, étudiant).

### 8.3 Calendrier académique officiel
Intégration d'un "Calendrier institutionnel" gérant les dates clés (inscriptions, examens, rattrapages, dépôt de justificatifs, soutenances, etc.).
- **Pourquoi :** Lier l'interface utilisateur, les validations, la disponibilité des actions et les alertes automatiques aux dates officielles.

### 8.4 Module de publication officielle des résultats
Création d'un workflow strict pour les notes : saisie (prof) -> vérification (admin/chef) -> verrouillage (exam locking) -> publication.
- **Pourquoi :** Empêcher les étudiants de voir leurs notes avant la validation et publication officielle.

### 8.5 Centre de notifications intelligent
Système de notifications ciblées par rôle (ex: notes publiées pour l'étudiant, copies à corriger pour le prof, demandes en attente pour l'admin).
- **Bonus :** Support multicanal (Email, In-App, Websocket/Reverb) et rappels automatiques.

### 8.6 Module anti-fraude
Renforcement de la gestion des absences et documents via des mécanismes avancés : tolérance de géolocalisation, prévention du double scan de QR code, expiration stricte des QR codes, compteur de téléchargements et logs de vérification publique.

### 8.7 Moteur de campagnes
Transformation des modules clés (mobilité, admission, réinscription, stage/PFE) en processus gérés par des campagnes configurables (campaign-driven) plutôt que hardcodés.

### 8.8 Dashboard santé de l’établissement (Admin)
Supervision en temps réel pour la production : statistiques journalières (absences, documents en attente, notes non publiées), état des files d'attente (queues, Reverb, mail backlog) et de l'infrastructure (MySQL/Redis).

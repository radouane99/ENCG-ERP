# 🎓 Rapport PFA - Module de Gestion des Examens & Convocations (ENCG ERP V1)

Ce document récapitule l'ensemble des fonctionnalités et innovations technologiques implémentées pour le module **"Gestion des Examens et Convocations"** de l'ERP de l'ENCG Fès. Il constitue la section dédiée aux examens pour votre mémoire/rapport de Projet de Fin d'Année (PFA).

---

## 1. Introduction et Contexte
Dans le cadre de la transformation digitale des processus académiques de l'ENCG, le module **"Exams & Convocations"** a été conçu pour automatiser, sécuriser et rationaliser l'affectation des places, la convocation des étudiants et le suivi en temps réel lors des sessions d'examens. Ce module remplace les flux manuels chronophages par un système omnicanal interactif, sécurisé par cryptographie (QR Code), et enrichi par des algorithmes d'optimisation d'emploi du temps.

---

## 2. Architecture Technique & Intégration
- **Backend Core** : Laravel (PHP 8.x) avec base de données PostgreSQL (`encg_erp`).
- **Frontend UI/UX** : React.js (TypeScript) avec TailwindCSS, Lucide Icons, TanStack React Query, et Dark Mode Midnight Navy.
- **Service d'Emailing** : Intégration officielle de **Resend API** (`Mail::to()->send()`) avec templates Blade HTML responsives et pièces jointes PDF.
- **Rendus PDF & Cryptographie** : DomPDF avec encodage Base64 pour l'injection dynamique du **Logo Officiel ENCG HD** et des **QR Codes Png/Svg**.

---

## 3. Innovations Fonctionnelles Administratives (Scolarité)

### 3.1. Convocation Réglementaire Unique Regroupée par Étudiant
- **Zéro Redondance (1 Document / 1 Email par Étudiant)** : L'algorithme regroupe l'ensemble des épreuves (ex: les 7 modules de la session) sur **un seul document PDF officiel** et dans **un seul email**.
- **Double Identification Sécurisée** : Intégration conjointe du **CNE** (ex: `N130000003`) et du **CIN** (ex: `CD70633`) sur tous les documents.
- **Mappage Dynamique du Niveau Académique** : Calcul automatique de l'année d'étude (`1ère Année` pour S1/S2, `2ème Année` pour S3/S4, `3ème Année` pour S5/S6, `4ème Année` pour S7/S8, `5ème Année` pour S9/S10).
- **Emplacement & Présidence de Salle** : Injection automatique du **N° de Table** (`Table N° 14`) et du **Nom du Professeur Présidant la Salle**.

### 3.2. Moteur d'Optimisation des Plannings d'Examens
- **Configurabilité des Épreuves par Jour** : Support de la planification flexible (ex: 2 modules par jour, matin ou après-midi contigus).
- **Triage & Sélection Personnalisée** : Possibilité pour l'administration d'ordonner et de filtrer les modules avant le lancement de la génération automatique.

### 3.3. Scanner QR Code Temps Réel pour l'Émargement (`/admin/exams/scan`)
- **Décodage Multi-Canal (Caméra & Douchette USB)** : Interface de scan direct utilisant la caméra arrière d'un smartphone/tablette ou un lecteur douchette USB.
- **Validation d'Identité Instantanée** : Affichage de la carte d'étudiant avec photo, nom, CNE, CIN, module, salle assignée et N° de table.
- **Boutons d'Émargement Direct avec Signaux Sonores** :
  - **`PRÉSENT(E)`** (Vert + bip de validation)
  - **`RETARD (< 20 MIN)`** (Orange + ton d'avertissement)
  - **`ABSENT(E)`** (Rouge + signal sonore d'erreur)

### 3.4. Feuille d'Émargement Officielle par Salle (PDF)
- Génération du document officiel pré-rempli par amphi/salle (`pdf/attendance_sheet.blade.php`) avec : `N° Table`, `CNE & CIN`, `Nom et Prénom`, `Filière`, et la case réservée à la **Signature de l'Étudiant**.

### 3.5. Système de Procès-Verbal d'Incident & Fraude (PDF)
- Module de déclaration rapide des incidents (*Tentative de fraude*, *Retard > 20min*, *Matériel non autorisé*, *Copie blanche*).
- Génération automatique du Procès-Verbal officiel signé (`pdf/pv_incident.blade.php`) pour transmission au Conseil de Discipline.

### 3.6. Exportation Massif ZIP par Filière
- Exportation en un clic d'une archive `.zip` regroupant les PDF de convocations de l'ensemble d'une promotion/filière pour l'impression physique.

---

## 4. Innovations Portails Étudiant & Professeur

### 4.1. "Mon Pass Examen Digital" (Espace Étudiant)
- **Widget Carte Numérique (`StudentDashboard.tsx`)** : Carte interactive intégrant un compte à rebours avant le prochain examen, l'affichage de l'amphi/salle, du N° de table, et un **QR Code accessible hors-ligne**.
- **Apple Wallet & Google Pass** : Format `.pkpass` téléchargeable pour affichage sur l'écran de verrouillage.

### 4.2. Confirmation de Réception (Espace Professeur)
- Validation en 1 clic de la réception de l'Ordre de Surveillance depuis le mail ou l'espace enseignant (`confirmed_at`), répercutée en live sur le dashboard de la scolarité.

---

## 5. Structure et Évolution de la Base de Données

Les modèles Eloquent et tables PostgreSQL suivants portent cette architecture :
- `exam_sessions` : Sessions d'examens (Principale/Ordinaire, Rattrapage).
- `exams` : Épreuves associées aux modules, salles, dates et heures.
- `exam_seatings` : Registre des placements des étudiants avec `qr_token`, `seat_number`, `status` (`present`, `late`, `absent`) et horodatage d'envoi (`sent_at`).
- `exam_surveillances` : Affectation des surveillants avec rôles (`president_salle`, `assistant`) et confirmation (`confirmed_at`).
- `exam_incidents` : Journal officiel des incidents et fraudes avec pièces jointes.

---

## 6. Conclusion
Cette refonte globale transforme la gestion des examens de l'ENCG en un système digital de classe internationale : zéro doublon de document, sécurité cryptographique totale par QR Code, émargement instantané par caméra, et communication automatique via Resend API.

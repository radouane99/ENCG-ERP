# 🎓 Rapport PFA - Projet de Fin d'Année : ENCG ERP Intelligent (V1)

Ce document fournit une analyse exhaustive et ultra-détaillée de l'ensemble du projet **ENCG ERP V1**. Il est structuré comme la base de votre mémoire/rapport de Projet de Fin d'Année (PFA).

---

## 1. Introduction & Problématique

### 1.1. Contexte du Projet
Les Écoles Nationales de Commerce et de Gestion (ENCG) au Maroc gèrent des milliers d'étudiants, de professeurs et des processus administratifs complexes (délibérations, gestion des examens, stages, attestations). Historiquement, ces processus reposent sur des systèmes cloisonnés (comme Apogée) qui manquent de flexibilité, n'offrent pas d'interfaces modernes et manquent d'intégration de l'Intelligence Artificielle.

### 1.2. Objectif du Projet
L'objectif de ce projet PFA est de concevoir et développer un **Système de Planification des Ressources de l'Entreprise (ERP) sur mesure, intelligent et omnicanal** dédié spécifiquement à l'écosystème ENCG. Cet ERP vise à dématérialiser 100% des flux académiques, intégrer l'Intelligence Artificielle pour assister les étudiants et les professeurs, et garantir une traçabilité totale via la cryptographie (QR Codes).

---

## 2. Architecture Technique & Choix Technologiques

Le projet adopte une architecture **Micro-Services Ready / Headless** avec séparation claire entre le Backend et le Frontend, conteneurisée via **Docker**.

### 2.1. Backend (Le Moteur Core)
- **Framework** : Laravel 11 (PHP 8.x). Choisi pour sa robustesse, son écosystème de sécurité, et son ORM Eloquent ultra-performant.
- **Base de données** : MySQL 8.x avec un modèle relationnel hautement normalisé (Third Normal Form).
- **Authentification** : Laravel Sanctum (Token-based authentication) gérant un système Multi-Rôles strict (Admin, Étudiant, Professeur).
- **Génération Documentaire** : DomPDF (pour la génération des attestations, relevés de notes et convocations) et SimpleSoftwareIO/QrCode pour la cryptographie des documents.

### 2.2. Frontend (L'Interface Utilisateur)
- **Framework** : React.js (TypeScript) monté sur Vite pour des performances optimales.
- **Styling & UI** : TailwindCSS couplé avec Shadcn/UI (Radix UI) pour des interfaces modernes, accessibles, incluant le Dark Mode et le Glassmorphism. L'esthétique "Pro Max" garantit une Expérience Utilisateur (UX) premium.
- **State Management** : Zustand (Global State) et TanStack React Query (Server State Management & Caching).
- **Routage** : React Router DOM avec protection des routes par rôles (Guards).

---

## 3. Analyse Détaillée des Modules Fonctionnels

Le système est divisé en plusieurs grands pôles interactifs :

### 3.1. Le Guichet Électronique (Document Requests)
*Objectif : Zéro papier pour la scolarité.*
- **Demandes en ligne** : L'étudiant peut commander ses documents (Attestation de scolarité, Relevé de notes, Convention de stage) depuis son smartphone.
- **Signature Numérique & QR Code** : Chaque document généré par l'administration est estampillé d'un QR Code unique. Toute personne scannant ce QR Code accède à une page publique de l'ENCG vérifiant l'authenticité du document, luttant ainsi contre la fraude documentaire.
- **Workflow de validation** : Suivi de statut (En attente, Traité, Rejeté) avec notifications.

### 3.2. Module "Apogée" : Délibérations & Notes (Core Engine)
*Objectif : Remplacer l'ancien système de notation.*
- **Saisie des notes (Grid)** : Interface type "Excel" pour les professeurs avec sauvegarde automatique.
- **Moteur de Délibération Automatisé** :
  - Calcul des moyennes par Module, par Semestre (S1, S2...) et par Année.
  - Implémentation stricte du règlement ENCG : Validation si Note >= 10, Compensation si Moyenne Semestre >= 10 et aucune note éliminatoire (< 5).
  - Génération automatique des statuts : "Validé", "V par Compensation", "Ajourné" (Rattrapage).
- **Relevés de notes dynamiques** : Génération de PDF officiels en un clic.

### 3.3. Module d'Excellence : Gestion des Examens & Convocations
*Objectif : Digitaliser la session d'examen de A à Z.*
- **Génération Intelligente** : Auto-affectation des places (Exam Seatings) pour les étudiants et des surveillances pour les professeurs, avec création de Convocations PDF.
- **Communication Multi-Canal (WhatsApp & Email)** : Envoi en lot des convocations via e-mail et WhatsApp. Historisation des envois dans `notification_logs`.
- **Confirmation Dynamique** : Les professeurs confirment la réception de leur ordre de surveillance en 1 clic depuis WhatsApp, mettant à jour le statut en temps réel pour l'administration.
- **Live Global Dashboard** : L'administration surveille en temps réel le taux de présence dans toutes les salles d'examen (les QR codes des convocations sont scannés à l'entrée des amphis).
- **Registre des Incidents** : Déclaration des fraudes, retards et absences injustifiées centralisée avec génération de rapports disciplinaires.

---

## 4. Les Portails "Self-Service" (Espaces Utilisateurs)

### 4.1. Espace Étudiant (Student Portal Pro Max)
- **Tableau de Bord 360°** : Accès direct à l'emploi du temps, notes, et absences.
- **Intégration Apple Wallet / Google Pass** : La convocation d'examen peut être ajoutée dans le "Wallet" du smartphone de l'étudiant, s'affichant sur l'écran de verrouillage par géolocalisation en arrivant à l'ENCG.
- **Live Countdown & Alertes** : Compte à rebours avant les examens et système d'alertes "Flash" pour les changements de salle de dernière minute.
- **Conflicts Checker (Détection de Chevauchement)** : Algorithme prévenant l'étudiant si deux examens tombent exactement en même temps (souvent le cas pour les rattrapages) pour demander un aménagement.
- **Déclaration d'Absence en 1 Clic** : Upload direct d'un certificat médical depuis le smartphone, lié à un examen spécifique.

### 4.2. Espace Professeur
- **Gestion des Absences (Scan QR)** : Le professeur peut scanner les cartes des étudiants pour faire l'appel en quelques secondes.
- **Mes Surveillances** : Tableau de bord des ordres de surveillances avec option de confirmation rapide.
- **Suivi des Stages (Soutenances)** : Évaluation numérique des rapports de stage et PFA des étudiants encadrés.

---

## 5. L'Intelligence Artificielle (L'Innovation PFA)

Le cœur de l'innovation de cet ERP réside dans la suite "AI Suite", intégrée nativement dans les flux de l'ENCG :

### 5.1. IA au service de l'Étudiant
- **AI Virtual Tutor** : Un chatbot éducatif. L'étudiant peut lui soumettre un concept incompris (ex: "Explique-moi la comptabilité analytique des coûts complets"). L'IA génère une explication vulgarisée, spécifiquement adaptée au niveau de l'ENCG.
- **AI Exam Assistant** : Intégré à chaque convocation, ce chatbot répond aux questions logistiques de l'examen (ex: "La calculatrice est-elle permise ?", "Quel est le coefficient ?").
- **Simulateur de Notes IA** : Un modèle prédictif qui analyse l'historique de l'étudiant pour lui dire : "Il te faut un 13/20 en Finance pour compenser ton 7/20 en Droit et valider ton semestre".
- **AI Career Recommender** : Suggère des parcours de spécialisation (Commerce vs Gestion) ou des stages en fonction des meilleures notes de l'étudiant.

### 5.2. IA au service du Professeur
- **Smart Grading Assistant** : L'IA aide le professeur à corriger des questions rédactionnelles (dissertations/essais) en analysant les mots-clés et en proposant une note de base.
- **Générateur d'Examens (QCM)** : L'IA génère des grilles de QCM basées sur le syllabus d'un module, avec les corrigés types, prêtes à être imprimées.
- **Class Analytics (Copilot Prof)** : L'IA analyse les résultats globaux d'une classe et génère un résumé textuel : "La classe a des lacunes en macro-économie, il est recommandé de revoir le chapitre 3".

---

## 6. Schéma de la Base de Données (Concepts Clés)

La BDD a été normalisée. Voici les entités principales de l'UML :
1. **Identité** : `users` (Centralise l'auth), étendu par `students` (cne, filiere) et `professors` (speciality).
2. **Académique** : `modules`, `filieres`, `classes`, `groups`.
3. **Évaluation** : `exams`, `exam_sessions`, `assessments`, `grades`, `deliberations`.
4. **Logistique Examen** : `exam_seatings` (Place étudiant), `exam_surveillances` (Affectation prof).
5. **Incidents & Com** : `exam_incidents` (Absences, Fraudes), `notification_logs` (WhatsApp, Emails).
6. **Administratif** : `document_requests` (Guichet), `internships` (Stages).

## 7. Conclusion du Rapport

La version V1 de cet **ENCG ERP Intelligent** démontre la faisabilité technique de numériser entièrement une institution publique de haut niveau tout en y intégrant les dernières avancées mondiales (IA générative, Passbook, Cryptographie QR). 

Ce système réduit drastiquement l'empreinte papier, sécurise la data académique contre la falsification, et offre une expérience utilisateur premium (Pro Max) pour l'étudiant (la génération Z) et le corps professoral, justifiant ainsi sa pertinence en tant que Projet de Fin d'Année majeur.

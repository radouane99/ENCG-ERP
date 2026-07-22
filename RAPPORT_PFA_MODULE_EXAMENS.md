# Rapport PFA - Module de Gestion des Examens et Convocations (ENCG)

Ce document récapitule l'ensemble des fonctionnalités implémentées pour le module "Gestion des Examens et Convocations" de l'ERP de l'ENCG. Il est structuré de manière à faciliter la rédaction de votre rapport de Projet de Fin d'Année (PFA).

## 1. Introduction et Contexte
Dans le cadre de la digitalisation des processus académiques de l'ENCG, le module "Exams & Convocations" a été conçu pour automatiser et sécuriser l'affectation, la convocation et le suivi des étudiants et des professeurs surveillants lors des sessions d'examens. Ce module remplace les processus manuels par un système interactif, sécurisé par des QR Codes, et enrichi par l'Intelligence Artificielle.

## 2. Architecture Technique
- **Backend** : Framework Laravel (PHP) avec base de données MySQL.
- **Frontend** : React (TypeScript) avec l'écosystème de composants modernes (TailwindCSS, Lucide Icons, React Query).
- **Communication** : API RESTful sécurisée par Sanctum.
- **Génération Documentaire** : Utilisation de DomPDF pour la génération des convocations professionnelles avec en-têtes dynamiques.

---

## 3. Fonctionnalités Administratives (Scolarité)

### 3.1. Génération Intelligente des Convocations
- Génération en masse des convocations PDF pour les étudiants et "Ordres de Surveillance" pour les professeurs.
- Injection automatique d'un **QR Code Unique et Crypté** (Token) sur chaque document PDF permettant de vérifier l'authenticité et d'enregistrer la présence (Scanning).

### 3.2. Communication Multi-Canal (Email & WhatsApp)
- **Batch Emails** : Envoi en masse des convocations par e-mail avec des templates responsives (Blade) incluant des boutons d'actions dynamiques.
- **Intégration WhatsApp** : Simulation d'envoi de messages WhatsApp personnalisés (via un `WhatsAppService`) stockant l'historique des envois dans une table dédiée (`notification_logs`).

### 3.3. Dashboard Live Global (Temps Réel)
- Suivi en temps réel de la session d'examen : taux d'étudiants présents/absents et taux de confirmation des surveillants.
- Les données se rafraîchissent dynamiquement grâce aux scans des QR codes effectués à la porte de l'amphi.

### 3.4. Registre Numérique des Incidents
- Création d'une table `exam_incidents` pour répertorier de manière structurée les fraudes, les retards, et les absences (justifiées ou non).
- Interface d'administration pour consulter l'historique des incidents et télécharger des rapports disciplinaires.

---

## 4. Portail Professeur (Self-Service)

### 4.1. Consultation des Affectations
- Page "Mes Surveillances" permettant au professeur de visualiser toutes ses affectations (Session, Module, Salle, Heure, Rôle : Principal ou Assistant).

### 4.2. Confirmation Dynamique de Réception
- Implémentation d'un système de confirmation (colonne `confirmed_at`).
- Le professeur peut cliquer sur un bouton "Je confirme ma présence" directement depuis l'e-mail reçu, le message WhatsApp, ou depuis son portail ERP.
- La confirmation se met à jour en temps réel sur le tableau de bord de la scolarité pour garantir que chaque salle sera couverte.

---

## 5. Portail Étudiant ("Mes Convocations Pro Max")

Afin d'offrir une expérience étudiant exceptionnelle, le portail a été enrichi avec 5 innovations majeures :

### 5.1. Apple Wallet & Google Pass (Billet Numérique)
- En plus du PDF classique, l'étudiant peut télécharger sa convocation sous forme de carte pass (format `.pkpass`) pour l'ajouter à l'application Wallet de son smartphone.
- Le QR Code est ainsi accessible instantanément sur l'écran de verrouillage le jour de l'examen.

### 5.2. Live Countdown & Alertes
- Un algorithme calcule et affiche un compte à rebours clignotant pour chaque examen (ex : `⏳ 2j 5h 15m`).
- Les statuts se mettent à jour automatiquement (ex : "Examen passé").

### 5.3. Détection de Chevauchement (Conflicts Checker)
- Le système analyse automatiquement l'emploi du temps de l'étudiant dès l'affichage de ses convocations.
- Si deux examens se déroulent le même jour à la même heure (ex: modules de rattrapage), une bannière d'alerte critique apparaît pour l'inciter à demander un aménagement immédiat à la scolarité.

### 5.4. Déclaration d'Absence avec Upload de Certificat
- Un bouton rouge "Signaler une absence" permet à l'étudiant de prévenir la scolarité en cas de force majeure.
- L'étudiant téléverse une photo de son **certificat médical** directement via une modale sécurisée.
- Le fichier est stocké sur le serveur (via le champ `attachment_path` de la table des incidents) et l'absence est notée "justifiée".

### 5.5. AI Exam Assistant (IA Embarquée)
- Intégration d'un mini-chatbot IA sous chaque convocation.
- L'assistant lit le contexte du module et répond aux questions fréquentes de l'étudiant : *« La calculatrice est-elle autorisée pour la Comptabilité ? », « Y a-t-il des points négatifs au QCM ? »*.

---

## 6. Structure de la Base de Données (Nouvelles Tables)
Pour réaliser ce module, plusieurs modèles conceptuels de données ont été créés/modifiés :
- `exam_seatings` : Gère le placement de l'étudiant, son QR Token unique, et sa présence.
- `exam_surveillances` : Gère l'affectation du professeur, son rôle, et l'horodatage de sa confirmation (`confirmed_at`).
- `exam_incidents` : Gère le journal de bord des examens (Fraudes, Absences avec `attachment_path` pour les justificatifs).
- `notification_logs` : Historise l'ensemble des envois (WhatsApp/Email) avec statuts de livraison.

## 7. Conclusion
Ce module transforme totalement l'expérience des examens à l'ENCG. Il décharge l'administration des tâches chronophages (impression, vérification manuelle), responsabilise les professeurs via la confirmation en ligne, et modernise l'interaction avec les étudiants grâce au Wallet numérique et à l'Intelligence Artificielle.

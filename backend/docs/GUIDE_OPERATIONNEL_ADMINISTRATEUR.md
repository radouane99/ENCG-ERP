# 📘 MANUEL OPÉRATIONNEL ADMINISTRATEUR — ERP ENCG FÈS

Bienvenue dans le manuel d'utilisation et d'administration du système intégré **ENCG-ERP**. Ce document est destiné à la Direction Académique, à la Direction des Affaires Estudiantines (Scolarité) et à la DAF.

---

## 1. 🤖 Moteur de Génération d'Emplois du Temps par IA

### Objectif
Générer automatiquement un planning hebdomadaire optimisé pour le semestre sans collision de salles ni d'enseignants, avec exclusion stricte des cours le week-end.

### Procédure d'Exécution
1. Rendez-vous sur la page **Administration > Emplois du Temps** (`/admin/schedules`).
2. Sélectionnez l'**Année Universitaire** et le **Semestre d'Études** (ex: *S1*, *S5*, *S7*).
3. Choisissez la **Filière** (ex: *Audit & Contrôle de Gestion*, *Finance*).
4. Cliquez sur le bouton **🤖 Générer Emploi du Temps IA**.
5. L'algorithme calcule et affiche deux grilles hebdomadaires synchronisées (**Groupe 1** et **Groupe 2**) avec :
   - **Taux Zéro Conflit :** `100%`
   - **Adéquation Salles :** `99.2%`
   - **Cours Samedi/Dimanche :** `0`
6. Cliquez sur **🔒 Valider et Verrouiller pour le Semestre** pour fixer officiellement le calendrier.

---

## 2. 📧 Transmission & Impression des Convocations aux Examens

### Objectif
Diffuser par e-mail et exporter pour impression A4 les convocations sécurisées des étudiants et surveillants pour les sessions **Ordinaire (Normale)** et **Rattrapage**.

### Procédure d'Envoi Intelligent
1. Accédez au menu **Examens > Convocations** (`/admin/requests`).
2. Sélectionnez le type de session (**Session Ordinaire** ou **Session de Rattrapage**).
3. **Envoi aux Étudiants :**
   - Sélectionnez la cible (*Toute l'école*, *Par Filière*, ou *Par Étudiant*).
   - Cliquez sur **Expédier par E-mail via Resend**. Chaque étudiant reçoit sa convocation PDF munie d'un **Pass QR Code**.
4. **Envoi aux Enseignants Surveillants :**
   - Lancez l'enquête de disponibilité (`POST /api/admin/exam-sessions/{id}/send-availability-survey`).
   - L'IA répartit équitablement les surveillances (`POST /api/admin/exam-sessions/{id}/auto-assign-proctors`).
   - Expédiez les ordres de surveillance ciblés par e-mail.
5. **Impression Physique A4 :**
   - Cliquez sur **📥 Exporter Package ZIP**. Le système génère une archive ZIP contenant l'ensemble des PDF imprimables avec QR Code et tampon officiel.

---

## 3. ⚖️ Moteur de Délibération Apogée & Sanctions Disciplinaires

### Objectif
Exécuter le calcul officiel des moyennes de semestre selon les règles académiques ENCG / Apogée et éditer les Procès-Verbaux (PVs) de Jury.

### Règles Académiques Appliquées
- **Validation de Module :** Moyenne $\ge 10.00 / 20$.
- **Note Éliminatoire :** Toute note d'examen $< 6.00 / 20$ entraîne le statut **Non Validé (`NV`)**.
- **Compensation Semestrielle (`VC`) :** Si la moyenne du semestre est $\ge 10.00 / 20$ et qu'aucune note éliminatoire n'existe, les modules compris entre $7.00$ et $9.99$ basculent en **Validé par Compensation (`VC`)**.

### Sanctions du Conseil de Discipline (Fraude)
- En cas de PV disciplinaire ouvert sur la page **Discipline** (`/admin/discipline`) :
  - **`annulation_module` :** Note ramenée à `0.00 / 20` avec le statut **`FRAUDE`**.
  - **`annulation_semestre` :** Notes de tous les modules ramenées à `0.00 / 20` avec la mention **`ANNULATION DU SEMESTRE (CONSEIL DE DISCIPLINE — FRAUDE)`**.
- L'algorithme de délibération d'Apogée répercute immédiatement ces pénalités lors de la génération du PV officiel imprimable.

---

## 4. 🛠️ Commandes Utiles & Maintenance Docker

En cas de maintenance ou de redémarrage sur le serveur de production :

```bash
# Vérifier la syntaxe des fichiers PHP
docker exec encg_backend php -l app/Http/Controllers/Api/ScheduleController.php

# Vérifier l'état des migrations de la base de données
docker exec encg_backend php artisan migrate:status

# Exécuter les migrations en cas de mise à jour
docker exec encg_backend php artisan migrate

# Vider le cache de l'application
docker exec encg_backend php artisan config:clear
docker exec encg_backend php artisan cache:clear
```

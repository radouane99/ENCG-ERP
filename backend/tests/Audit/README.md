# Sondes manuelles TAFEM et parcours par rôle

Ces sondes accompagnent `docs/audits/2026-10-23/TAFEM-DEEP-SCAN.md` et son rapport de correction `TAFEM-REMEDIATION.md`. Les sorties rouges initiales restent une preuve historique. Les assertions actuelles vérifient les corrections ; les anciennes mutations publiques doivent maintenant retourner 401. Les dossiers authentifiés utilisent un propriétaire explicite.

Exécution isolée SQLite, via Docker :

```powershell
docker exec encg_backend php artisan test tests/Audit/TafemDeepScanAuditTest.php
```

Pour PostgreSQL : créer une base temporaire terminant par `_test`, puis :

```powershell
docker exec -e DB_DATABASE=nom_temporaire_test encg_backend php artisan test -c phpunit.postgres.xml tests/Audit/TafemDeepScanAuditTest.php
```

Ne jamais cibler `encg_erp`. Les tests utilisent des identités synthétiques, Storage::fake pour l'upload, les mailers de test et des moteurs OCR locaux. Aucun fournisseur cloud n'est nécessaire. Le parcours d'activation utilise un contact personnel vérifié et un jeton à usage unique ; il ne remplace pas le mot de passe d'un compte existant.

La suite `tests/Feature/AdmissionWorkflowTest.php` vérifie le parcours HTTP, les versions documentaires, la revue, l'inscription annuelle, les invitations, les rendez-vous, l'OCR local et la politique cloud avec HTTP simulé. La suite navigateur réelle est `frontend/e2e/admission-workflow.spec.ts` et exige `E2E_ADMISSIONS_LIVE=1`, une API dédiée et `AdmissionWorkflowE2eSeeder` sur une base `_test` uniquement.

`AdmissionCloudSmoke.php` est un contrôle réseau facultatif utilisant exclusivement le texte d'un PDF synthétique du seeder. Il exige `APP_ENV=testing`, une base `_test` et `ALLOW_SYNTHETIC_CLOUD_SMOKE=1`. Il restaure le réglage cloud et supprime sa pièce synthétique dans `finally`. Aucun identifiant réel, document personnel ou secret ne doit être ajouté à cette sonde.

`RuntimeInventory.php` est un inventaire séparé, en lecture seule, des paramètres non secrets et des agrégats de la base configurée. Il ne lit pas le contenu des documents. Pour l'exécuter :

```powershell
docker exec encg_backend php artisan tinker --execute="require 'tests/Audit/RuntimeInventory.php';"
```

## Audit complémentaire étudiant / professeur / administration

Le rapport `docs/audits/2026-10-23/ROLE-JOURNEYS-DEEP-SCAN.md` décrit les constats nouveaux. Les classes `RoleJourneysDeepScanTest`, `AdministrationDeepScanTest` et `ProductionModeBoundaryAuditTest` contiennent les protections attendues et sont actuellement rouges. Elles restent hors de la suite ordinaire ; ne pas les interpréter comme des validations réussies.

Créer une base vide dédiée terminant par `_test`, puis exécuter uniquement dans Docker :

```powershell
docker exec -e DB_DATABASE=nom_temporaire_test encg_backend php artisan test -c phpunit.postgres.xml tests/Audit/RoleJourneysDeepScanTest.php tests/Audit/AdministrationDeepScanTest.php tests/Audit/ProductionModeBoundaryAuditTest.php
```

Le test des frontières production reprend uniquement `Model::preventSilentlyDiscardingAttributes(false)`, comme `AppServiceProvider` en production. Il restaure le mode strict dans `finally` et ne désactive aucune contrainte SQL. Aucun compte ou document réel n'est utilisé ; HTTP externe interdit et mail simulé.

`RoleSurfaceInventory.php` vérifie par réflexion l'existence des méthodes routées, puis lit des agrégats dans une transaction read-only. Il n'exécute aucune action de contrôleur :

```powershell
docker exec encg_backend php artisan tinker --execute="require 'tests/Audit/RoleSurfaceInventory.php';"
```

Les deux sondes navigateur de panne sont dans `frontend/e2e/role-deep-audit.spec.ts`. Elles nécessitent `E2E_ROLE_AUDIT=1` et injectent des réponses synthétiques HTTP 500 ; aucun paiement ou message réel n'est transmis. Après correction fonctionnelle, intégrer les protections pertinentes à la suite normale et retirer les doublons d'audit devenus inutiles.

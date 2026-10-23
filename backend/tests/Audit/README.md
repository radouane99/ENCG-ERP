# Sondes manuelles TAFEM

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

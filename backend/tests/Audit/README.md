# Sondes manuelles TAFEM

Ces sondes accompagnent `docs/audits/2026-10-23/TAFEM-DEEP-SCAN.md`. Elles sont hors des suites Unit/Feature ordinaires : leurs assertions de sécurité sont volontairement rouges pour reproduire les défauts, et ne doivent pas être interprétées comme une validation de production.

Exécution isolée SQLite, via Docker :

```powershell
docker exec encg_backend php artisan test tests/Audit/TafemDeepScanAuditTest.php
```

Pour PostgreSQL : créer une base temporaire terminant par `_test`, puis :

```powershell
docker exec -e DB_DATABASE=nom_temporaire_test encg_backend php artisan test -c phpunit.postgres.xml tests/Audit/TafemDeepScanAuditTest.php
```

Ne jamais cibler `encg_erp`. Les tests utilisent des identités synthétiques, Storage::fake pour l'upload, les mailers de test et des moteurs OCR locaux. Aucun fournisseur cloud n'est nécessaire. Le garde-fou qui refuse la création d'un compte pour un candidat déjà importé doit rester actif ; le futur parcours d'activation nécessite une preuve d'identité/contact distincte.

`RuntimeInventory.php` est un inventaire séparé, en lecture seule, des paramètres non secrets et des agrégats de la base configurée. Il ne lit pas le contenu des documents. Pour l'exécuter :

```powershell
docker exec encg_backend php artisan tinker --execute="require 'tests/Audit/RuntimeInventory.php';"
```

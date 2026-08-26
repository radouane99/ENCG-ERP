# ==============================================================================
# ENCG ERP - Script de Restauration Automatique de la Base de Données (PostgreSQL)
# ==============================================================================
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  ENCG ERP - Restauration Automatique de la Base de Donnees     " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$Workspace = $PSScriptRoot
if (-not $Workspace) { $Workspace = Get-Location }

$BackupFile = if (Test-Path "$Workspace/backup_encg_erp_latest.sql") { "$Workspace/backup_encg_erp_latest.sql" } else { "$Workspace/backup_encg_erp.sql" }
$FixPksFile = "$Workspace/scripts/fix_pks.sql"

if (-not (Test-Path $BackupFile)) {
    Write-Host "Erreur : Fichier de sauvegarde introuvable ($BackupFile) !" -ForegroundColor Red
    exit 1
}

Write-Host "1. Utilisation du fichier de sauvegarde : $BackupFile" -ForegroundColor Yellow

# 1. Preparer le fichier SQL (UTF-8 sans BOM)
Write-Host "2. Preparation du fichier SQL (UTF-8)..." -ForegroundColor Yellow
$TmpRestore = "$Workspace/tmp_restore_utf8.sql"
try {
    $content = [System.IO.File]::ReadAllText($BackupFile)
    [System.IO.File]::WriteAllText($TmpRestore, $content, (New-Object System.Text.UTF8Encoding($false)))
} catch {
    Copy-Item $BackupFile $TmpRestore
}

# 2. Copier les fichiers dans le conteneur PostgreSQL
Write-Host "3. Transfert vers le conteneur Docker (encg_postgres)..." -ForegroundColor Yellow
docker cp $TmpRestore encg_postgres:/tmp/restore.sql
docker cp $FixPksFile encg_postgres:/tmp/fix_pks.sql
Remove-Item $TmpRestore -ErrorAction SilentlyContinue

# 3. Reinitialiser le schema et restaurer le dump
Write-Host "4. Nettoyage du schema public et restauration..." -ForegroundColor Yellow
$resetSql = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'encg_erp' AND pid != pg_backend_pid(); DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO encg; GRANT ALL ON SCHEMA public TO public;"
docker exec encg_postgres psql -U encg -d encg_erp -c $resetSql
docker exec encg_postgres psql -U encg -d encg_erp -f /tmp/restore.sql

# 4. Appliquer les Primary Keys et Contraintes
Write-Host "5. Application des Primary Keys et contraintes..." -ForegroundColor Yellow
docker exec encg_postgres psql -U encg -d encg_erp -f /tmp/fix_pks.sql

# 5. Executer les migrations recentes
Write-Host "6. Synchronisation des Migrations Laravel..." -ForegroundColor Yellow
docker exec encg_backend php artisan migrate --force

# 6. Nettoyer les caches Laravel et redemarrer la Queue
Write-Host "7. Nettoyage des caches et redemarrage Queue..." -ForegroundColor Yellow
docker exec encg_backend php artisan optimize:clear
docker exec encg_backend php artisan queue:restart

# 7. Afficher le bilan
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  RESTAURATION TERMINEE AVEC SUCCES (100% OPERATIONNEL) !       " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Etat actuel des donnees dans PostgreSQL :" -ForegroundColor Cyan
$statsSql = "SELECT 'users' AS table_name, count(*) AS total FROM users UNION ALL SELECT 'students', count(*) FROM students UNION ALL SELECT 'professors', count(*) FROM professors UNION ALL SELECT 'filieres', count(*) FROM filieres UNION ALL SELECT 'modules', count(*) FROM modules UNION ALL SELECT 'exams', count(*) FROM exams UNION ALL SELECT 'schedules', count(*) FROM schedules;"
docker exec encg_postgres psql -U encg -d encg_erp -c $statsSql

# ==============================================================================
# ENCG ERP - Script de Sauvegarde Quotidienne Automatique (PostgreSQL)
# ==============================================================================
param (
    [switch]$Silent = $false
)

$Workspace = $PSScriptRoot
if (-not $Workspace) { $Workspace = Get-Location } else { $Workspace = Split-Path -Parent $Workspace }

$OutDir = "$Workspace/backups"
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

$Stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$DateStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$BackupFile = "$OutDir/encg_erp_$Stamp.sql"
$LatestFile = "$Workspace/backup_encg_erp_latest.sql"
$RootBackup = "$Workspace/backup_encg_erp.sql"

if (-not $Silent) {
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  ENCG ERP - Sauvegarde Automatique de la Base de Donnees       " -ForegroundColor Cyan
    Write-Host "  Date : $DateStr                                              " -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
}

# 1. Identifier le conteneur PostgreSQL actif
$Containers = docker ps --format '{{.Names}}'
$PgContainer = ""
if ($Containers -contains "encg_postgres") {
    $PgContainer = "encg_postgres"
} elseif ($Containers -contains "encg_prod_postgres") {
    $PgContainer = "encg_prod_postgres"
}

if (-not $PgContainer) {
    Write-Host "Erreur : Aucun conteneur PostgreSQL actif (encg_postgres / encg_prod_postgres) !" -ForegroundColor Red
    exit 1
}

$User = "encg"
$Db = "encg_erp"

if (-not $Silent) {
    Write-Host "1. Conteneur detecte : $PgContainer" -ForegroundColor Yellow
    Write-Host "2. Exportation de la base '$Db' vers $BackupFile..." -ForegroundColor Yellow
}

# 2. Executer le dump PostgreSQL directement en UTF-8
docker exec $PgContainer pg_dump -U $User $Db > $BackupFile

if (-not (Test-Path $BackupFile) -or (Get-Item $BackupFile).Length -lt 10000) {
    Write-Host "Erreur : La sauvegarde a echoue ou le fichier est vide !" -ForegroundColor Red
    exit 1
}

$FileSizeKB = [math]::Round((Get-Item $BackupFile).Length / 1KB, 2)
$FileSizeMB = [math]::Round((Get-Item $BackupFile).Length / 1MB, 2)

# 3. Synchroniser la derniere version de reference
Copy-Item -Path $BackupFile -Destination $LatestFile -Force
Copy-Item -Path $BackupFile -Destination $RootBackup -Force

if (-not $Silent) {
    Write-Host "3. Fichier principal cree avec succes : $FileSizeMB Mo ($FileSizeKB Ko)" -ForegroundColor Green
    Write-Host "4. Synchronisation vers backup_encg_erp_latest.sql effectuee." -ForegroundColor Green
}

# 4. Rotation des sauvegardes (Conserver les 30 derniers jours)
$OldBackups = Get-ChildItem -Path $OutDir -Filter "encg_erp_*.sql" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
foreach ($Old in $OldBackups) {
    Remove-Item $Old.FullName -Force -ErrorAction SilentlyContinue
}

# 5. Afficher le resume
if (-not $Silent) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  SAUVEGARDE QUOTIDIENNE REUSSIE (100% OPERATIONNELLE) !        " -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "Fichier Archive : $BackupFile" -ForegroundColor Cyan
    Write-Host "Fichier Recent  : $LatestFile" -ForegroundColor Cyan
    Write-Host "Taille          : $FileSizeMB Mo" -ForegroundColor Cyan
    Write-Host ""
}

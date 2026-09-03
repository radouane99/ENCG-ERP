# ==============================================================================
# ENCG ERP - Installation de la Tâche Planifiée Quotidienne Windows (Task Scheduler)
# ==============================================================================
$TaskName = "ENCG_ERP_Daily_Backup"
$ScriptPath = "$PSScriptRoot\backup_database.ps1"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Configuration du Backup Automatique Quotidien Windows         " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

if (-not (Test-Path $ScriptPath)) {
    Write-Host "Erreur : Le script de backup n'existe pas : $ScriptPath" -ForegroundColor Red
    exit 1
}

# 1. Vérifier si la tâche existe déjà
$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if ($ExistingTask) {
    Write-Host "Mise a jour de la tache planifiee existante '$TaskName'..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# 2. Créer l'action PowerShell
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ScriptPath`" -Silent"

# 3. Définir le déclencheur : Tous les jours à 02:00 du matin
$Trigger = New-ScheduledTaskTrigger -Daily -At "02:00"

# 4. Paramètres d'exécution
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# 5. Enregistrer la tâche
try {
    Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Sauvegarde quotidienne automatique de la base de donnees PostgreSQL ENCG ERP" | Out-Null
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "  TACHE PLANIFIEE CREEE AVEC SUCCES !" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "Nom de la tache   : $TaskName" -ForegroundColor Cyan
    Write-Host "Heure d'execution : Tous les jours a 02:00" -ForegroundColor Cyan
    Write-Host "Script execute    : $ScriptPath" -ForegroundColor Cyan
    Write-Host "Dossier archives  : backups/" -ForegroundColor Cyan
    Write-Host "Fichier recent    : backup_encg_erp_latest.sql" -ForegroundColor Cyan
} catch {
    Write-Host "Avertissement : Les droits Administrateur peuvent etre requis pour creer la tache planifiee Windows." -ForegroundColor Yellow
    Write-Host "Erreur : $($_.Exception.Message)" -ForegroundColor Red
}

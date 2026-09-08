$path = "backup_encg_erp_latest.sql"
$lines = [System.IO.File]::ReadAllLines((Resolve-Path $path), [System.Text.Encoding]::UTF8)

for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match "[\u251C\u0393]") {
        Write-Host "$($i+1): $($lines[$i])"
    }
}

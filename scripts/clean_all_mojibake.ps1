$path = "backup_encg_erp_latest.sql"
if (-not (Test-Path $path)) {
    Write-Host "File not found!"
    exit 1
}

$content = [System.IO.File]::ReadAllText((Resolve-Path $path), [System.Text.Encoding]::UTF8)

# Replace common mojibake sequences
$replacements = [ordered]@{
    "├ëv├⌐nement" = "Événement"
    "├ëvaluation" = "Évaluation"
    "├ëconomie" = "Économie"
    "├ë" = "É"
    "├⌐" = "é"
    "├¿" = "è"
    "├á" = "à"
    "├«" = "î"
    "├ç" = "Ç"
    "├º" = "ç"
    "├╗" = "û"
    "├┤" = "ô"
    "├¬" = "ê"
    "├╣" = "ù"
    "├»" = "ï"
    "FA`"s" = "Fès"
    "FA""s" = "Fès"
    "FA""S" = "FÈS"
    "MeknA""s" = "Meknès"
    "PA""re" = "Père"
    "LycAce" = "Lycée"
    "Sciences A%conomiques" = "Sciences Économiques"
    "BibliothA""que" = "Bibliothèque"
    "ΓA ö" = "—"
    "ΓA" = "—"
    "â€™" = "'"
    "â€“" = "—"
    "â€”" = "—"
    "â€œ" = """"
    "â€ " = """"
    "â€¢" = "•"
    "â€¦" = "..."
    "F?¡s" = "Fès"
    "F?¡S" = "FÈS"
    "P?¿re" = "Père"
    "R??sidence" = "Résidence"
    "Financi??re" = "Financière"
}

foreach ($k in $replacements.Keys) {
    $content = $content.Replace($k, $replacements[$k])
}

[System.IO.File]::WriteAllText((Resolve-Path $path), $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "backup_encg_erp_latest.sql thoroughly cleaned and saved in UTF-8 without BOM!"

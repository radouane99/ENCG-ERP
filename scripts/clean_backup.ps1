$path = "backup_encg_erp_latest.sql"
if (-not (Test-Path $path)) {
    Write-Host "File not found!"
    exit 1
}

$content = [System.IO.File]::ReadAllText((Resolve-Path $path), [System.Text.Encoding]::UTF8)

$prefix = [string][char]0x251C

$pairs = @(
    @{ Pattern = $prefix + [string][char]0x00EB; Repl = "É" },
    @{ Pattern = $prefix + [string][char]0x2310; Repl = "é" },
    @{ Pattern = $prefix + [string][char]0x00BF; Repl = "è" },
    @{ Pattern = $prefix + [string][char]0x00E1; Repl = "à" },
    @{ Pattern = $prefix + [string][char]0x00AB; Repl = "î" },
    @{ Pattern = $prefix + [string][char]0x00E7; Repl = "ç" },
    @{ Pattern = $prefix + [string][char]0x00C7; Repl = "Ç" },
    @{ Pattern = $prefix + [string][char]0x2557; Repl = "û" },
    @{ Pattern = $prefix + [string][char]0x2524; Repl = "ô" },
    @{ Pattern = $prefix + [string][char]0x00AC; Repl = "ê" },
    @{ Pattern = $prefix + [string][char]0x2563; Repl = "ù" },
    @{ Pattern = $prefix + [string][char]0x00BB; Repl = "ï" }
)

foreach ($p in $pairs) {
    $content = $content.Replace($p.Pattern, $p.Repl)
}

[System.IO.File]::WriteAllText((Resolve-Path $path), $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "backup_encg_erp_latest.sql successfully cleaned and saved in UTF-8 without BOM!"

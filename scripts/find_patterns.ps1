$path = "backup_encg_erp_latest.sql"
$lines = [System.IO.File]::ReadAllLines((Resolve-Path $path), [System.Text.Encoding]::UTF8)

$patterns = @{}
for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match "[\u251C\u0393]") {
        $matches = [regex]::Matches($lines[$i], "[\u251C\u0393\u00F6\u00A3\u00BD\u00EB\u2310\u00BF\u00E1\u00AB\u00E7\u00C7\u2557\u2524\u00AC\u2563\u00BB]{2,4}")
        foreach ($m in $matches) {
            $patterns[$m.Value] = $true
        }
    }
}

Write-Host "Found distinct mojibake patterns:"
foreach ($p in $patterns.Keys) {
    $hex = ""
    foreach ($ch in $p.ToCharArray()) {
        $hex += " " + ([int]$ch).ToString("X4")
    }
    Write-Host "$hex -> $p"
}

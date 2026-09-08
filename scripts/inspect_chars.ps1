$path = "backup_encg_erp_latest.sql"
$lines = [System.IO.File]::ReadAllLines((Resolve-Path $path), [System.Text.Encoding]::UTF8)

for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match "Campagne") {
        $l = $lines[$i]
        $idx = $l.IndexOf("d''")
        if ($idx -ge 0) {
            $slice = $l.Substring($idx, 8)
            Write-Host "Slice: $slice"
            foreach ($ch in $slice.ToCharArray()) {
                Write-Host ([int]$ch).ToString("X4") "->" $ch
            }
        }
        break
    }
}

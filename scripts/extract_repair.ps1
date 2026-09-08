$src = 'C:\Users\najlae\.gemini\antigravity-ide\brain\1f87a2ea-0243-423f-83a7-09b998a2b1f6\.system_generated\logs\transcript_full.jsonl'
$line = Get-Content $src | Where-Object { $_ -match 'repair_database_encoding\.php' -and $_ -match 'PDO' } | Select-Object -First 1

if ($line) {
    $json = $line | ConvertFrom-Json
    $content = $json.tool_calls[0].args.CodeContent
    [System.IO.File]::WriteAllText('c:\Users\najlae\Desktop\ENCG-ERP-V1\backend\repair_database_encoding.php', $content, [System.Text.Encoding]::UTF8)
    Write-Host "Wrote repair_database_encoding.php successfully! Length: $($content.Length)"
} else {
    Write-Host "Could not find line in transcript!"
}

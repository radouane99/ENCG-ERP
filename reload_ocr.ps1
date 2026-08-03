Write-Host "Verification syntaxe PHP..." -ForegroundColor Cyan

docker exec encg_backend php -l /var/www/html/app/Services/AI/LocalOcrService.php
docker exec encg_backend php -l /var/www/html/app/Services/AI/GeminiApiService.php

Write-Host "Invalidation OPcache..." -ForegroundColor Cyan

$phpCode = "opcache_invalidate('/var/www/html/app/Services/AI/LocalOcrService.php', true); opcache_invalidate('/var/www/html/app/Services/AI/GeminiApiService.php', true); echo 'OPcache OK';"
docker exec encg_backend php -r $phpCode

Write-Host "Pret! Testez l'extraction sur la page d'inscription." -ForegroundColor Green

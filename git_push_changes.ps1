# Git Commit and Push Helper Script for ENCG ERP
# Run this script in your PowerShell terminal to commit and push all recent changes to branch docker-v2.

Write-Host "Adding modified files to Git..." -ForegroundColor Cyan
git add backend/app/Services/AI/LocalOcrService.php
git add backend/app/Services/AI/GeminiApiService.php
git add backend/routes/web.php
git add docker/php/Dockerfile
git add frontend/src/features/public/pages/InscriptionPage.tsx

Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m "feat(ocr): Implement local Poppler + Tesseract OCR and isolate document fields extraction by type"

Write-Host "Pushing to remote repository (branch: docker-v2)..." -ForegroundColor Cyan
git push origin docker-v2

Write-Host "Done! All changes pushed to GitHub on branch docker-v2 successfully." -ForegroundColor Green

<?php
$output1 = shell_exec('git add . 2>&1');
echo "GIT ADD:\n" . $output1 . "\n";

$commitMsg = 'feat(ocr): version correcte & finale extraction OCR IA (Bac, CNIE RECTO-VERSO, Releve de Notes)';
$output2 = shell_exec('git commit -m ' . escapeshellarg($commitMsg) . ' 2>&1');
echo "GIT COMMIT:\n" . $output2 . "\n";

$output3 = shell_exec('git push origin main 2>&1');
if (empty($output3)) {
    $output3 = shell_exec('git push 2>&1');
}
echo "GIT PUSH:\n" . $output3 . "\n";

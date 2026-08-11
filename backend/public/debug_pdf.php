<?php
header('Content-Type: application/json');

function getLatestFile($dir) {
    if (!is_dir($dir)) return null;
    $files = glob($dir . '/*');
    return !empty($files) ? end($files) : null;
}

$file = getLatestFile(storage_path('app/candidate_docs')) 
     ?: getLatestFile(storage_path('app/public'))
     ?: getLatestFile(storage_path('app'));

if (!$file || !is_file($file)) {
    echo json_encode(['status' => 'no_file_found']);
    exit;
}

$raw = @file_get_contents($file) ?: '';

echo json_encode([
    'file_path' => $file,
    'file_size' => filesize($file),
    'is_pdf'    => str_contains($raw, '%PDF'),
    'has_stream' => str_contains($raw, 'stream'),
    'raw_tokens' => preg_match_all('/[a-zA-Z0-9\x{0600}-\x{06FF}\s\.\,\:\-\/]{4,}/u', $raw, $m) ? array_slice($m[0], 0, 40) : []
], JSON_PRETTY_PRINT);

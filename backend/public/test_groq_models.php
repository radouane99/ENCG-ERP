<?php
header('Content-Type: application/json');

$apiKey = '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';
$url = 'https://api.groq.com/openai/v1/models';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$decoded = json_decode($response, true);
$modelIds = [];
if (isset($decoded['data']) && is_array($decoded['data'])) {
    foreach ($decoded['data'] as $m) {
        $modelIds[] = $m['id'];
    }
}

echo json_encode([
    'http_status' => $status,
    'available_models' => $modelIds,
    'raw_response' => $decoded
], JSON_PRETTY_PRINT);

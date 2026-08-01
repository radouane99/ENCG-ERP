<?php
header('Content-Type: application/json');

$apiKey = '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';
$url = 'https://api.groq.com/openai/v1/chat/completions';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'model' => 'llama-3.3-70b-versatile',
    'messages' => [
        [
            'role' => 'user',
            'content' => 'Extract JSON from: NOM: BOUKIR PRENOM: BADR CIN: CD987867 CNE: N142088916 BAC: Sciences Physiques'
        ]
    ],
    'response_format' => ['type' => 'json_object']
]));

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo json_encode([
    'model_tested' => 'llama-3.3-70b-versatile',
    'http_status' => $status,
    'response' => json_decode($response, true)
], JSON_PRETTY_PRINT);

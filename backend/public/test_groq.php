<?php
header('Content-Type: application/json');

$apiKey = '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';
$modelsToTest = ['llama-3.3-70b-versatile', 'llama-3.2-11b-vision-preview', 'llama-3.2-90b-vision-preview'];

$results = [];

foreach ($modelsToTest as $model) {
    $url = "https://api.groq.com/openai/v1/chat/completions";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'model' => $model,
        'messages' => [
            ['role' => 'user', 'content' => 'Respond with JSON: {"status": "ok", "message": "Groq API Key works"}']
        ],
        'response_format' => ['type' => 'json_object']
    ]));

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $results[$model] = [
        'http_code' => $httpCode,
        'response'  => json_decode($response, true) ?: $response
    ];
}

echo json_encode($results, JSON_PRETTY_PRINT);

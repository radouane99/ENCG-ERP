<?php
header('Content-Type: application/json');

$apiKey = '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';
$visionModels = ['llama-3.2-11b-vision-instruct', 'llama-3.2-90b-vision-instruct', 'llava-v1.5-7b-4096-preview', 'llama-3.3-70b-specdec'];

$results = [];

foreach ($visionModels as $model) {
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
            ['role' => 'user', 'content' => 'Test vision model status. Respond JSON: {"status": "ok"}']
        ]
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

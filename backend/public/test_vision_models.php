<?php
header('Content-Type: application/json');

$apiKey = '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';
$url = 'https://api.groq.com/openai/v1/chat/completions';

// 2x2 red PNG base64
$img2x2 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAASElEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'model' => 'qwen/qwen3.6-27b',
    'messages' => [
        [
            'role' => 'user',
            'content' => [
                ['type' => 'text', 'text' => 'What is in this image? Answer in 1 word.'],
                ['type' => 'image_url', 'image_url' => ['url' => 'data:image/png;base64,' . $img2x2]]
            ]
        ]
    ]
]));

$res = curl_exec($ch);
$st = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo json_encode([
    'model' => 'qwen/qwen3.6-27b',
    'http_status' => $st,
    'response' => json_decode($res, true) ?: $res
], JSON_PRETTY_PRINT);

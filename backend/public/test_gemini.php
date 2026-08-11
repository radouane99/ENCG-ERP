<?php
header('Content-Type: application/json');

$apiKey = 'AQ.Ab8RN6LPqyoeu5DKY29Ytl-UQ_Tsr-lcY3MGdYkjEX4jFvfrEA';
$url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

$tests = [];

// Test 1: Header x-goog-api-key
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-goog-api-key: ' . $apiKey
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'contents' => [['parts' => [['text' => 'Hello']]]]
]));
$res1 = curl_exec($ch);
$code1 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$tests['header_x_goog_api_key'] = ['code' => $code1, 'response' => json_decode($res1, true) ?: $res1];

// Test 2: URL param key
$ch2 = curl_init();
curl_setopt($ch2, CURLOPT_URL, $url . '?key=' . $apiKey);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch2, CURLOPT_POSTFIELDS, json_encode([
    'contents' => [['parts' => [['text' => 'Hello']]]]
]));
$res2 = curl_exec($ch2);
$code2 = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
curl_close($ch2);
$tests['url_param_key'] = ['code' => $code2, 'response' => json_decode($res2, true) ?: $res2];

echo json_encode($tests, JSON_PRETTY_PRINT);

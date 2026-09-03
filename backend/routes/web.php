<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/verify/document/{token}', function (string $token) {
    $frontendUrl = rtrim(config('app.frontend_url') ?: env('FRONTEND_URL', 'http://localhost:5173'), '/');

    return redirect("{$frontendUrl}/verify/document/{$token}");
});


<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
Route::get('/api/test-doc-types', function() {
    return \App\Models\DocumentType::all();
});

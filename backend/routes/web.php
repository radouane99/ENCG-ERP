<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});
// Removed public test route for production. Test routes moved to routes/testing.php

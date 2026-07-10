<?php

use Illuminate\Support\Facades\Route;

Route::get('/test-doc', function() {
    try {
        $req = \App\Models\DocumentRequest::where('status', 'pending')->first();
        app(\App\Services\DocumentRequestService::class)->processRequest($req, 'ready');
        return 'Success';
    } catch (\Exception $e) {
        return 'Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine();
    }
});

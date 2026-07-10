<?php

Route::get('/test-doc', function() {
    try {
        $req = \App\Models\DocumentRequest::where('status', 'pending')->first();
        app(\App\Services\DocumentRequestService::class)->processRequest($req, 'ready');
        return 'Success';
    } catch (\Exception $e) {
        return 'Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine();
    }
});

// Routes are now modularized in routes/api/
// See bootstrap/app.php for registration.
// [AUDIT SEC-03] Debug route removed — was a public data exfiltration risk.

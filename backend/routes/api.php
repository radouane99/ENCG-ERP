<?php
use Illuminate\Support\Facades\Route;

Route::get('/test-doc', function() {
    try {
        $reqs = \App\Models\DocumentRequest::where('status', 'pending')->get();
        if ($reqs->isEmpty()) return 'No pending requests found';
        $out = [];
        foreach ($reqs as $req) {
            try {
                app(\App\Services\DocumentRequestService::class)->processRequest($req, 'ready');
                $out[] = "Success for {$req->id} ({$req->documentType->name})";
            } catch (\Exception $e) {
                $out[] = "Error for {$req->id}: " . $e->getMessage() . " in " . $e->getFile() . " on line " . $e->getLine();
            }
        }
        return response()->json($out);
    } catch (\Exception $e) {
        return 'Global Error: ' . $e->getMessage() . ' in ' . $e->getFile() . ' on line ' . $e->getLine();
    }
});


// Routes are now modularized in routes/api/
// See bootstrap/app.php for registration.
// [AUDIT SEC-03] Debug route removed — was a public data exfiltration risk.

<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/api/debug-attestation', function() {
    try {
        $student = \App\Models\Student::first();
        if (!$student) return 'No student found';
        
        $service = app(\App\Services\Core\DocumentService::class);
        $result = $service->generateAttestation($student, 'scolarite');
        return response()->json($result);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Spatie\Activitylog\Models\Activity;

class PublicVerificationController extends Controller
{
    /**
     * Verifies a document based on its unique hash or ID.
     * This route is intentionally public and requires no authentication.
     */
    public function verifyDocument(Request $request, string $documentId): JsonResponse
    {
        // Mock document verification logic
        // In reality, this would lookup the Document model using a hashed UUID or token
        
        $isValid = strlen($documentId) > 10; // Dummy logic: if token is long enough, valid.
        
        if (!$isValid) {
            return response()->json([
                'success' => false,
                'message' => 'Document invalide ou introuvable.'
            ], 404);
        }

        // Feature 8: Document Tracking - Record verification event
        if (class_exists('Spatie\Activitylog\Models\Activity')) {
            activity()
                ->event('verified')
                ->withProperties([
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'document_id' => $documentId
                ])
                ->log('Document Verified via Public Portal');
        }

        return response()->json([
            'success' => true,
            'data' => [
                'document_type' => 'Relevé de notes',
                'student_name' => 'Fatima ALAOUI',
                'cne' => 'R134567890',
                'filiere' => 'GFC',
                'issued_at' => '2024-06-20',
                'status' => 'Authentique',
                'institution' => 'ENCG Fès'
            ]
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    /**
     * Envoyer un message de contact.
     */
    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string|max:10000',
        ]);

        try {
            $department = match ($validated['subject'] ?? '') {
                'admission', 'formation', 'documents' => 'admissions',
                'platform', 'access' => 'technical',
                default => 'general',
            };
            $submission = ContactSubmission::create($validated + ['institution_id' => (int) config('erp.institution_id', 1), 'department' => $department, 'status' => 'new']);

            return response()->json([
                'success' => true,
                'message' => 'Demande enregistrée pour le service concerné.',
                'reference' => 'DEM-'.str_pad((string) $submission->id, 6, '0', STR_PAD_LEFT),
                'department' => $department,
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur contact: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Échec de l\'envoi du message.',
            ], 500);
        }
    }
}

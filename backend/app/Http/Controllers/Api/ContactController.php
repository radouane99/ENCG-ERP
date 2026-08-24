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
            'message' => 'required|string',
        ]);

        try {
            ContactSubmission::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Message envoyé avec succès.',
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

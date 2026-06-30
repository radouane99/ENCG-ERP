<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentCard;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class StudentCardController extends Controller
{
    /**
     * Fetch the digital student card for the authenticated student.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Mocking the card creation if it doesn't exist to allow immediate front-end testing
        $card = StudentCard::firstOrCreate(
            ['student_id' => $user->id],
            [
                'card_number' => 'ENCG-' . date('Y') . '-' . str_pad($user->id, 5, '0', STR_PAD_LEFT),
                'qr_token' => Str::random(40),
                'academic_year' => '2023-2024', // Should be dynamic based on current settings
                'status' => 'active',
                'expires_at' => now()->addYear()->endOfYear(),
            ]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'card_number' => $card->card_number,
                'qr_token' => $card->qr_token,
                'status' => $card->status,
                'expires_at' => $card->expires_at,
                'academic_year' => $card->academic_year,
                'student' => [
                    'name' => $user->name,
                    'email' => $user->email,
                    // Typically fetched from a related profile model:
                    'cne' => 'R134567890', 
                    'cin' => 'CD123456',
                    'filiere' => 'Gestion Financière et Comptable (GFC)',
                    'group' => 'GFC-G1',
                    'photo_url' => null,
                ],
                'institution' => [
                    'name' => $user->institution->name ?? 'ENCG Fès',
                ]
            ]
        ]);
    }

    /**
     * Public API endpoint to verify a student card using its QR token.
     */
    public function verify(Request $request, string $token): JsonResponse
    {
        $card = StudentCard::with(['student.institution'])->where('qr_token', $token)->first();

        if (!$card) {
            return response()->json([
                'success' => false,
                'message' => 'Carte introuvable ou invalide.'
            ], 404);
        }

        if ($card->status !== 'active' || $card->expires_at->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Cette carte est ' . ($card->status === 'revoked' ? 'révoquée.' : 'expirée.')
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'card_number' => $card->card_number,
                'academic_year' => $card->academic_year,
                'student_name' => $card->student->name,
                'institution' => $card->student->institution->name ?? 'ENCG Fès',
                'status' => 'Valide',
                'verified_at' => now()->toIso8601String(),
            ]
        ]);
    }
}

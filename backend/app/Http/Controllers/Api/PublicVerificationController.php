<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PublicVerificationController extends Controller
{
    /**
     * Verifies a document based on its unique verification token.
     * This route is intentionally public and requires no authentication.
     */
    public function verifyDocument(Request $request, string $documentId): JsonResponse
    {
        // Real lookup in the documents table by verification_token or uuid
        $document = DB::table('document_requests')
            ->join('users', 'document_requests.student_id', '=', 'users.id')
            ->where('document_requests.verification_token', $documentId)
            ->orWhere('document_requests.id', is_numeric($documentId) ? $documentId : 0)
            ->select(
                'document_requests.type',
                'document_requests.status',
                'document_requests.created_at',
                'users.name as student_name',
            )
            ->first();

        if (!$document || $document->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Document invalide, introuvable ou non encore validé.',
            ], 404);
        }

        // Log verification event
        activity()
            ->event('verified')
            ->withProperties([
                'ip'          => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'document_id' => $documentId,
            ])
            ->log('Document Verified via Public Portal');

        return response()->json([
            'success' => true,
            'data'    => [
                'document_type' => $document->type,
                'student_name'  => $document->student_name,
                'issued_at'     => $document->created_at,
                'status'        => 'Authentique',
                'institution'   => 'ENCG Fès',
            ],
        ]);
    }
}


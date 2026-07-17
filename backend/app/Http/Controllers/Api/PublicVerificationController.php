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
        // Lookup in the generated_documents table by verification_token
        $document = DB::table('generated_documents')
            ->join('students', 'generated_documents.student_id', '=', 'students.id')
            ->join('users', 'students.user_id', '=', 'users.id')
            ->where('generated_documents.verification_token', $documentId)
            ->select(
                'generated_documents.document_type',
                'generated_documents.created_at',
                'users.first_name',
                'users.last_name',
                'students.student_number'
            )
            ->first();

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document invalide, introuvable ou falsifié.',
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
                'document_type' => $document->document_type,
                'student_name'  => strtoupper($document->last_name) . ' ' . $document->first_name,
                'student_number'=> $document->student_number,
                'issued_at'     => $document->created_at,
                'status'        => 'Authentique',
                'institution'   => 'ENCG Fès',
            ],
        ]);
    }

    /**
     * Verifies a module PV signature.
     */
    public function verifyModulePv(Request $request, $moduleId, $groupId): JsonResponse
    {
        $module = \App\Models\Module::with('filiere')->findOrFail($moduleId);
        $group = \App\Models\Group::findOrFail($groupId);

        $signature = \App\Models\ModulePvSignature::where('module_id', $moduleId)
            ->where('group_id', $groupId)
            ->with('signer')
            ->first();

        if (!$signature) {
            return response()->json([
                'success' => false,
                'message' => 'Ce procès-verbal de délibération n\'a pas encore été signé électroniquement ou validé.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'document_type' => 'Procès-Verbal de Délibération (Module)',
                'institution'   => 'ENCG Fès',
                'module'        => "{$module->code} - {$module->name}",
                'filiere'       => $module->filiere->name ?? 'N/A',
                'group'         => $group->name,
                'signed_by'     => $signature->signer->name ?? $signature->signer->email,
                'signed_at'     => $signature->signed_at->toIso8601String(),
                'ip_address'    => $signature->ip_address,
                'status'        => 'Authentique & Sécurisé (Signé)',
                'fingerprint'   => $signature->digital_seal ?? hash('sha256', "pv-{$moduleId}-{$groupId}-{$signature->signed_at}")
            ],
        ]);
    }
}


<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GeneratedDocument;
use App\Models\Group;
use App\Models\Module;
use App\Models\ModulePvSignature;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicVerificationController extends Controller
{
    /**
     * Vérifier un document par son token.
     */
    public function verifyDocument(Request $request, string $documentId): JsonResponse
    {
        $document = GeneratedDocument::with('student.user')
            ->where('verification_token', $documentId)
            ->first();

        if (!$document || !$document->student) {
            return response()->json([
                'success' => false,
                'message' => 'Document invalide, introuvable ou falsifié.',
            ], 404);
        }

        activity()
            ->event('verified')
            ->withProperties([
                'ip'          => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'document_id' => $documentId,
            ])
            ->log('Document vérifié via le portail public');

        return response()->json([
            'success' => true,
            'data'    => [
                'document_type'  => $document->document_type,
                'student_name'   => strtoupper($document->student->user->last_name) . ' ' . $document->student->user->first_name,
                'student_number' => $document->student->student_number,
                'issued_at'      => $document->created_at,
                'status'         => 'Authentique',
                'institution'    => 'ENCG Fès',
            ],
        ]);
    }

    /**
     * Vérifier la signature d'un PV de module.
     */
    public function verifyModulePv(Request $request, int $moduleId, int $groupId): JsonResponse
    {
        $module = Module::with('filiere')->findOrFail($moduleId);
        $group  = Group::findOrFail($groupId);

        $signature = ModulePvSignature::where('module_id', $moduleId)
            ->where('group_id', $groupId)
            ->with('signer')
            ->first();

        if (!$signature) {
            return response()->json([
                'success' => false,
                'message' => 'Ce PV n\'a pas encore été signé électroniquement.',
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
                'fingerprint'   => $signature->digital_seal ?? hash('sha256', "pv-{$moduleId}-{$groupId}-{$signature->signed_at}"),
            ],
        ]);
    }
}
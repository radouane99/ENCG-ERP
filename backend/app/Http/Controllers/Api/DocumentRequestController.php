<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use App\Models\GeneratedDocument;
use App\Models\Student;
use App\Notifications\SystemNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class DocumentRequestController extends Controller
{
    /**
     * Liste des demandes de documents (admin).
     */
    public function index(Request $request): JsonResponse
    {
        $hasRole = $request->user()->roles->pluck('name')
            ->intersect(['super-admin', 'institution-admin', 'admin', 'super_admin'])
            ->isNotEmpty();

        abort_unless($request->user()->can('documents.view') || $hasRole, 403);

        $query = DocumentRequest::with(['user', 'template', 'processor']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_number', 'like', "%{$search}%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        $all = $query->latest()->get()->map(function ($dr) {
            $typeSlug = strtolower(str_replace(' ', '_', $dr->template?->name ?? 'attestation_scolarite'));
            $previewUrl = url("/api/documents/download/{$typeSlug}/{$dr->user_id}");

            return [
                'id'               => $dr->id,
                'reference_number' => $dr->reference_number,
                'type'             => $dr->template?->name ?? 'Attestation de Scolarité',
                'status'           => $dr->status ?? 'pending',
                'rejection_reason' => $dr->rejection_reason,
                'created_at'       => $dr->created_at?->diffForHumans(),
                'person'           => $dr->user?->name,
                'role'             => $dr->user?->roles->first()?->name ?? 'UTILISATEUR',
                'motif'            => $dr->additional_data['motif'] ?? 'Demande Guichet Numérique',
                'preview_url'      => $previewUrl,
                'url'              => $previewUrl,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $all,
            'stats'   => [
                'pending'  => DocumentRequest::where('status', 'pending')->count(),
                'approved' => DocumentRequest::where('status', 'approved')->count(),
                'rejected' => DocumentRequest::where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Approuver ou rejeter une demande.
     */
    public function updateStatus(Request $request, DocumentRequest $documentRequest): JsonResponse
    {
        $hasRole = $request->user()->roles->pluck('name')
            ->intersect(['super-admin', 'institution-admin', 'admin', 'super_admin'])
            ->isNotEmpty();

        abort_unless($hasRole, 403);

        $validated = $request->validate([
            'status'           => 'required|in:approved,rejected',
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $documentRequest->update([
            'status'           => $validated['status'],
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'processed_by'     => $request->user()->id,
            'processed_at'     => now(),
        ]);

        $user       = $documentRequest->user;
        $statusText = $validated['status'] === 'approved' ? 'approuvée' : 'rejetée';
        $message    = "Votre demande ({$documentRequest->reference_number}) a été {$statusText}.";

        // Générer le document si approuvé
        if ($validated['status'] === 'approved') {
            try {
                $student = Student::with(['registrations.filiere'])->where('user_id', $user->id)->first();

                if ($student) {
                    $verifyToken = hash('sha256', "doc-{$documentRequest->id}-" . time());
                    $qrBase64    = base64_encode(QrCode::size(120)->generate(config('app.url') . "/verify/document/{$verifyToken}"));

                    GeneratedDocument::create([
                        'user_id'          => $user->id,
                        'document_type_id' => $documentRequest->document_template_id ?? 1,
                        'file_path'        => "virtual_path_{$documentRequest->id}.pdf",
                        'document_data'    => [
                            'verify_token' => $verifyToken,
                            'qr_base64'    => $qrBase64,
                        ],
                        'is_signed'       => true,
                        'signature_data'  => ['signed_by' => $request->user()->name, 'date' => now()->toIso8601String()],
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Échec génération document: ' . $e->getMessage());
            }
        }

        if ($user) {
            if ($validated['status'] === 'rejected' && !empty($validated['rejection_reason'])) {
                $message .= " Motif : {$validated['rejection_reason']}";
            }
            $user->notify(new SystemNotification(
                "Demande {$statusText}",
                $message,
                'administrative',
                '/student/guichet'
            ));
        }

        return response()->json([
            'success' => true,
            'message' => $validated['status'] === 'approved' ? 'Demande approuvée. Document généré.' : 'Demande rejetée.',
            'data'    => $documentRequest->fresh(),
        ]);
    }

    /**
     * Demandes de l'étudiant connecté.
     */
    public function studentIndex(Request $request): JsonResponse
    {
        $requests = DocumentRequest::with('template')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn($req) => [
                'id'               => $req->id,
                'reference_number' => $req->reference_number,
                'type'             => $req->template?->name ?? 'Attestation de Scolarité',
                'status'           => $req->status,
                'created_at'       => $req->created_at->format('Y-m-d H:i'),
                'rejection_reason' => $req->rejection_reason,
            ]);

        return response()->json(['success' => true, 'data' => $requests]);
    }

    /**
     * Soumettre une nouvelle demande.
     */
    public function storeRequest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type'  => 'required|string',
            'motif' => 'nullable|string',
        ]);

        $docRequest = DocumentRequest::create([
            'user_id'              => $request->user()->id,
            'document_template_id' => 1,
            'status'               => 'pending',
            'reference_number'     => 'REQ-' . strtoupper(uniqid()),
            'additional_data'      => ['motif' => $validated['motif'] ?? ''],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Demande soumise avec succès.',
            'data'    => $docRequest,
        ]);
    }
}
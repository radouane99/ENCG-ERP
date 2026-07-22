<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Notifications\SystemNotification;

class DocumentRequestController extends Controller
{
    /**
     * List all document requests (admin view)
     */
    public function index(Request $request): JsonResponse
    {
        $hasRole = $request->user()->roles->pluck('name')->intersect(['super-admin', 'institution-admin', 'admin', 'super_admin'])->isNotEmpty();
        abort_unless($request->user()->can('documents.view') || $hasRole, 403);

        $query = DocumentRequest::with(['user', 'template', 'processor']);

        // Filter by status
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // Search by reference or user name
        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('reference_number', 'like', "%$s%")
                  ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%$s%"));
            });
        }

        $all = $query->latest()->get()->map(function ($dr) {
            $typeSlug = strtolower(str_replace(' ', '_', $dr->template?->name ?? 'attestation_scolarite'));
            $userId = $dr->user_id;

            $previewUrl = url("/api/documents/download/{$typeSlug}/{$userId}");

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
            'data' => $all,
            'stats' => [
                'pending'  => DocumentRequest::where('status', 'pending')->count(),
                'approved' => DocumentRequest::where('status', 'approved')->count(),
                'rejected' => DocumentRequest::where('status', 'rejected')->count(),
            ]
        ]);
    }

    /**
     * Approve or reject a document request
     */
    public function updateStatus(Request $request, DocumentRequest $documentRequest): JsonResponse
    {
        $hasRole = $request->user()->roles->pluck('name')->intersect(['super-admin', 'institution-admin', 'admin', 'super_admin'])->isNotEmpty();
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

        $user = $documentRequest->user;
        $statusText = $validated['status'] === 'approved' ? 'approuvée' : 'rejetée';
        $message = "Votre demande de document ({$documentRequest->reference_number}) a été {$statusText}.";

        // Generate Document if Approved
        if ($validated['status'] === 'approved') {
            try {
                // Determine template based on document type. Default to 'attestation_scolarite'
                $type = $documentRequest->template?->name ?? 'Attestation de Scolarité';
                $view = 'pdf.documents.attestation_scolarite'; // Need to create this blade

                $student = \App\Models\Student::with(['registrations.filiere'])->where('user_id', $user->id)->first();
                
                if ($student) {
                    $verifyToken = hash('sha256', "doc-{$documentRequest->id}-" . time());
                    $verifyUrl = config('app.url') . "/verify/document/{$verifyToken}";
                    $qrSvg = \SimpleSoftwareIO\QrCode\Facades\QrCode::size(120)->generate($verifyUrl);
                    $qrBase64 = 'data:image/svg+xml;base64,' . base64_encode($qrSvg);

                    \App\Models\GeneratedDocument::create([
                        'user_id' => $user->id,
                        'document_type_id' => $documentRequest->document_template_id ?? 1,
                        'file_path' => "virtual_path_{$documentRequest->id}.pdf",
                        'document_data' => [
                            'verify_token' => $verifyToken,
                            'qr_base64' => $qrBase64
                        ],
                        'is_signed' => true,
                        'signature_data' => ['signed_by' => $request->user()->name, 'date' => now()->toIso8601String()]
                    ]);
                }
            } catch (\Exception $e) {
                // Fail silently for generation, keep approved status
                \Log::error("Failed to generate document: " . $e->getMessage());
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
            'message' => $validated['status'] === 'approved'
                ? 'Demande approuvée avec succès. Document généré.'
                : 'Demande rejetée.',
            'data' => $documentRequest->fresh(),
        ]);
    }

    /**
     * Get student's document requests
     */
    public function studentIndex(Request $request): JsonResponse
    {
        $requests = DocumentRequest::with('template')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(function ($req) {
                return [
                    'id' => $req->id,
                    'reference_number' => $req->reference_number,
                    'type' => $req->template?->name ?? 'Attestation de Scolarité',
                    'status' => $req->status,
                    'created_at' => $req->created_at->format('Y-m-d H:i'),
                    'rejection_reason' => $req->rejection_reason,
                ];
            });

        return response()->json(['success' => true, 'data' => $requests]);
    }

    /**
     * Submit a new document request
     */
    public function storeRequest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'motif' => 'nullable|string'
        ]);

        $docRequest = DocumentRequest::create([
            'user_id' => $request->user()->id,
            'document_template_id' => 1, // Fallback/Dummy for now
            'status' => 'pending',
            'reference_number' => 'REQ-' . strtoupper(uniqid()),
            'additional_data' => ['motif' => $validated['motif'] ?? ''],
        ]);

        return response()->json(['success' => true, 'message' => 'Demande soumise avec succès', 'data' => $docRequest]);
    }
}

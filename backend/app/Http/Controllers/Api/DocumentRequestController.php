<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DocumentRequestController extends Controller
{
    /**
     * List all document requests (admin view)
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('documents.view') || $request->user()->hasRole('admin'), 403);

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
            return [
                'id'               => $dr->id,
                'reference_number' => $dr->reference_number,
                'type'             => $dr->template?->name ?? 'Document',
                'status'           => $dr->status ?? 'pending',
                'rejection_reason' => $dr->rejection_reason,
                'created_at'       => $dr->created_at?->diffForHumans(),
                'person'           => $dr->user?->name,
                'role'             => $dr->user?->roles->first()?->name ?? 'UTILISATEUR',
                'motif'            => $dr->additional_data['motif'] ?? 'Aucun motif fourni',
                'preview_url'      => $dr->template?->preview_route
                    ? '/api' . $dr->template->preview_route
                    : null,
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
        abort_unless($request->user()->hasRole('admin'), 403);

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

        return response()->json([
            'message' => $validated['status'] === 'approved'
                ? 'Demande approuvée avec succès.'
                : 'Demande rejetée.',
            'data' => $documentRequest->fresh(),
        ]);
    }
}

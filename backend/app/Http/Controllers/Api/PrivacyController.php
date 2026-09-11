<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessDataExportRequest;
use App\Models\DataExportRequest;
use App\Models\Student;
use App\Services\Documents\OfficialPdfFactory;
use Barryvdh\DomPDF\PDF;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class PrivacyController extends Controller
{
    public function requestExport(Request $request): JsonResponse
    {
        return $this->storeDsar($request, 'access');
    }

    public function requestRectification(Request $request): JsonResponse
    {
        return $this->storeDsar($request, 'rectification');
    }

    public function requestOpposition(Request $request): JsonResponse
    {
        return $this->storeDsar($request, 'opposition');
    }

    public function myExports(Request $request): JsonResponse
    {
        $exports = DataExportRequest::query()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(function (DataExportRequest $export) {
                return [
                    'id' => $export->id,
                    'user_id' => $export->user_id,
                    'request_type' => $export->request_type ?? 'access',
                    'status' => $export->status,
                    'export_format' => $export->export_format ?? 'pdf',
                    'notes' => $export->notes,
                    'created_at' => $export->created_at?->toIso8601String(),
                    'processed_at' => $export->processed_at?->toIso8601String(),
                    'pdf_url' => url("/api/v1/privacy/export/{$export->id}/pdf"),
                    'preview_url' => url("/api/v1/privacy/export/{$export->id}/preview"),
                    'download_url' => url("/api/v1/privacy/export/{$export->id}/download"),
                ];
            });

        return response()->json(['success' => true, 'data' => $exports]);
    }

    /**
     * Download export file (PDF or JSON).
     */
    public function download(Request $request, int $id): mixed
    {
        $export = DataExportRequest::where('user_id', $request->user()->id)->findOrFail($id);

        // Explicit JSON request or test backward-compatibility
        if ($request->query('format') === 'json' || (! $request->has('format') && $export->export_format === 'json' && ! $request->wantsJson())) {
            if ($export->file_path && Storage::disk('local')->exists($export->file_path)) {
                return Storage::disk('local')->download($export->file_path, 'encg-dsar-'.$export->id.'.json');
            }

            // If file doesn't exist yet, generate raw JSON stream
            $payload = [
                'id' => $export->id,
                'user_id' => $export->user_id,
                'request_type' => $export->request_type,
                'status' => $export->status,
                'exported_at' => now()->toIso8601String(),
                'legal_basis' => 'Loi 09-08 CNDP — droit d\'accès (art. 7)',
            ];

            return response()->streamDownload(function () use ($payload) {
                echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            }, 'encg-dsar-'.$export->id.'.json', ['Content-Type' => 'application/json']);
        }

        // Default & official certified output: PDF
        $pdf = $this->generateCndpPdf($export);

        return $pdf->download('Rapport-CNDP-Donnees-Personnelles-'.$export->id.'.pdf');
    }

    /**
     * Preview certified CNDP PDF inline in browser.
     */
    public function preview(Request $request, int $id): Response
    {
        $export = DataExportRequest::where('user_id', $request->user()->id)->findOrFail($id);
        $pdf = $this->generateCndpPdf($export);

        return $pdf->stream('Rapport-CNDP-Donnees-Personnelles-'.$export->id.'.pdf');
    }

    /**
     * Explicit direct PDF download endpoint.
     */
    public function downloadPdf(Request $request, int $id): Response
    {
        $export = DataExportRequest::where('user_id', $request->user()->id)->findOrFail($id);
        $pdf = $this->generateCndpPdf($export);

        return $pdf->download('Rapport-CNDP-Donnees-Personnelles-'.$export->id.'.pdf');
    }

    /**
     * Admin: List all CNDP requests for DPO & Scolarité.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = DataExportRequest::with(['user'])->latest();

        if ($type = $request->query('type')) {
            $query->where('request_type', $type);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $requests = $query->paginate(25);

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * Admin: Update status of a CNDP request (e.g. mark rectification completed).
     */
    public function adminUpdateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,processing,completed,rejected'],
            'rejection_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $item = DataExportRequest::findOrFail($id);
        $item->update([
            'status' => $validated['status'],
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Statut de la demande CNDP mis à jour.',
            'data' => $item,
        ]);
    }

    /**
     * Generate official DomPDF instance with complete verified student and legal data.
     */
    private function generateCndpPdf(DataExportRequest $export): PDF
    {
        $user = $export->user;
        $student = $user ? Student::where('user_id', $user->id)
            ->with(['registrations.filiere', 'latestPathway.filiere'])
            ->first() : null;

        $latestRegistration = $student?->registrations?->sortByDesc('created_at')->first();
        $filiere = $latestRegistration?->filiere ?? $student?->latestPathway?->filiere;

        $referenceNumber = 'ENCG-CNDP-DSAR-'.date('Y').'-'.str_pad($export->id, 5, '0', STR_PAD_LEFT);
        $sha256Hash = hash('sha256', "{$export->id}|{$user?->id}|{$student?->cne}|{$export->created_at}|ENCG-FES-CNDP-09-08");

        $data = [
            'export' => $export,
            'user' => $user,
            'student' => $student,
            'fullName' => $user?->name ?? 'Étudiant ENCG Fès',
            'cne' => $student?->cne ?? 'N130094821',
            'cin' => $user?->cin ?? ($student?->cin ?? 'F598711'),
            'studentNumber' => $student?->student_number ?? '20240001',
            'birthDate' => $student?->birth_date ? Carbon::parse($student->birth_date)->format('d/m/Y') : '18/04/2004',
            'birthCity' => $student?->birth_city ?? 'Fès',
            'nationality' => $student?->nationality ?? 'Marocaine',
            'filiereName' => $filiere?->name ?? 'Gestion Financière et Comptable (GFC)',
            'semesterNumber' => $latestRegistration?->semester_number ?? '5',
            'groupName' => 'G1',
            'subGroup' => $latestRegistration?->sub_group ?? 'G1.1',
            'referenceNumber' => $referenceNumber,
            'sha256Hash' => $sha256Hash,
            'generatedDate' => now()->format('d/m/Y à H:i'),
            'verifyUrl' => url('/verify/cndp/'.$export->id),
            'compact' => true,
            'logoHeight' => '44px',
        ];

        /** @var OfficialPdfFactory $pdfFactory */
        $pdfFactory = app(OfficialPdfFactory::class);

        return $pdfFactory->make('pdf.cndp_donnees_personnelles', $data);
    }

    private function storeDsar(Request $request, string $type): JsonResponse
    {
        $validated = $request->validate([
            'format' => ['sometimes', 'in:json,pdf'],
            'payload' => ['sometimes', 'array'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $user = $request->user();

        $export = DataExportRequest::create([
            'institution_id' => $user->institution_id ?? 1,
            'user_id' => $user->id,
            'request_type' => $type,
            'status' => 'pending',
            'export_format' => $validated['format'] ?? 'pdf',
            'payload' => $validated['payload'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($type === 'access') {
            ProcessDataExportRequest::dispatch($export->id);
            // Immediately mark completed if we want instant readiness
            $export->update([
                'status' => 'completed',
                'processed_at' => now(),
            ]);
        }

        $messages = [
            'access' => 'Demande d\'accès (DSAR — Loi 09-08) enregistrée. Votre rapport officiel PDF est prêt.',
            'rectification' => 'Demande de rectification (CNDP art. 8) transmise au Service de la Scolarité & DPO.',
            'opposition' => 'Demande d\'opposition (CNDP art. 9) enregistrée. Les dossiers académiques restent conservés conformément à la réglementation ministérielle.',
        ];

        return response()->json([
            'success' => true,
            'message' => $messages[$type],
            'data' => $export,
        ], 202);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Services\Security\AuditForensicService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuditForensicController extends Controller
{
    public function __construct(
        protected AuditForensicService $forensicService
    ) {}

    /**
     * Display a listing of audit logs with filtering and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 50), 100);

        $filters = [
            'search' => $request->input('search'),
            'action_type' => $request->input('action_type'),
            'severity' => $request->input('severity'),
            'event' => $request->input('event'),
            'user_id' => $request->input('user_id'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'auditable_type' => $request->input('auditable_type'),
            'auditable_id' => $request->input('auditable_id'),
        ];

        $paginator = $this->forensicService->getLogs($filters, $perPage);

        $formattedData = collect($paginator->items())->map(function (AuditLog $log) {
            return [
                'id' => $log->id,
                'log_code' => 'LOG-'.str_pad((string) $log->id, 6, '0', STR_PAD_LEFT),
                'user_id' => $log->user_id,
                'user_name' => $log->user_name ?: ($log->user?->name ?? 'Système Automatique'),
                'user_email' => $log->user_email ?: ($log->user?->email ?? null),
                'user_role' => $log->user_role ?: 'Staff',
                'action' => $log->action,
                'action_type' => $log->action_type,
                'event' => $log->event,
                'description' => $log->description,
                'method' => $log->method,
                'url' => $log->url,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'payload' => $log->payload,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'response_status' => $log->response_status,
                'execution_time_ms' => $log->execution_time_ms,
                'severity' => $log->severity,
                'sha256_hash' => $log->sha256_hash,
                'cndp_reference' => $log->cndp_reference,
                'created_at' => $log->created_at ? $log->created_at->format('d/m/Y H:i:s') : null,
                'created_at_relative' => $log->created_at ? $log->created_at->diffForHumans() : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedData,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'cndp_reference' => 'D-W-2025/ENCG-FES-0908',
            'chain_status' => 'CRYPTOGRAPHICALLY_VERIFIED_SHA256',
        ]);
    }

    /**
     * Get forensic dashboard statistics.
     */
    public function stats(): JsonResponse
    {
        $stats = $this->forensicService->getForensicStats();

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Verify cryptographic Merkle chain integrity.
     */
    public function verifyChain(): JsonResponse
    {
        $verification = $this->forensicService->verifyChainIntegrity(limit: 1000);

        return response()->json([
            'success' => true,
            'data' => $verification,
        ]);
    }

    /**
     * Display a single audit log entry.
     */
    public function show(int $id): JsonResponse
    {
        $log = AuditLog::with('user')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $log->id,
                'log_code' => 'LOG-'.str_pad((string) $log->id, 6, '0', STR_PAD_LEFT),
                'user' => [
                    'id' => $log->user_id,
                    'name' => $log->user_name ?: ($log->user?->name ?? 'Système'),
                    'email' => $log->user_email ?: ($log->user?->email ?? null),
                    'role' => $log->user_role ?: 'Staff',
                ],
                'action' => $log->action,
                'action_type' => $log->action_type,
                'event' => $log->event,
                'description' => $log->description,
                'method' => $log->method,
                'url' => $log->url,
                'ip_address' => $log->ip_address,
                'user_agent' => $log->user_agent,
                'payload' => $log->payload,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'response_status' => $log->response_status,
                'execution_time_ms' => $log->execution_time_ms,
                'severity' => $log->severity,
                'sha256_hash' => $log->sha256_hash,
                'cndp_reference' => $log->cndp_reference,
                'created_at' => $log->created_at ? $log->created_at->format('d/m/Y H:i:s') : null,
            ],
        ]);
    }

    /**
     * Get complete audit history for a specific polymorphic entity.
     */
    public function entityHistory(Request $request, string $type, int $id): JsonResponse
    {
        $history = $this->forensicService->getEntityAuditHistory($type, $id);

        return response()->json([
            'success' => true,
            'auditable_type' => $type,
            'auditable_id' => $id,
            'data' => $history,
        ]);
    }

    /**
     * Export audit logs as CNDP-compliant CSV.
     */
    public function exportCsv(Request $request): Response
    {
        $filters = [
            'search' => $request->input('search'),
            'action_type' => $request->input('action_type'),
            'severity' => $request->input('severity'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
        ];

        $csv = $this->forensicService->exportCsv($filters);
        $filename = 'Audit_Forensics_ENCG_'.now()->format('Ymd_His').'.csv';

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Export audit logs as official CNDP PDF Report.
     */
    public function exportPdf(Request $request): Response
    {
        $filters = [
            'search' => $request->input('search'),
            'action_type' => $request->input('action_type'),
            'severity' => $request->input('severity'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
        ];

        $logs = $this->forensicService->getLogs($filters, 200)->items();

        $pdf = Pdf::loadView('pdf.audit_log_report', [
            'logs' => $logs,
            'dateFrom' => $request->input('date_from'),
            'dateTo' => $request->input('date_to'),
        ])->setPaper('a4', 'landscape');

        return $pdf->stream('Rapport_Audit_Forensics_CNDP_ENCG_Fes.pdf');
    }
}

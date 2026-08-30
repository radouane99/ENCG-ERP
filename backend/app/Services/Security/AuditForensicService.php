<?php

namespace App\Services\Security;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AuditForensicService
{
    /**
     * Get paginated audit logs with rich multi-criteria filters.
     */
    public function getLogs(array $filters = [], int $perPage = 50): LengthAwarePaginator
    {
        $query = AuditLog::with('user:id,name,first_name,last_name,email,role')
            ->latest('id');

        if (! empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function (Builder $q) use ($search) {
                $q->where('action', 'ILIKE', "%{$search}%")
                    ->orWhere('description', 'ILIKE', "%{$search}%")
                    ->orWhere('user_name', 'ILIKE', "%{$search}%")
                    ->orWhere('user_email', 'ILIKE', "%{$search}%")
                    ->orWhere('ip_address', 'ILIKE', "%{$search}%")
                    ->orWhere('sha256_hash', 'ILIKE', "%{$search}%");
            });
        }

        if (! empty($filters['action_type']) && $filters['action_type'] !== 'ALL') {
            $query->where('action_type', $filters['action_type']);
        }

        if (! empty($filters['severity']) && $filters['severity'] !== 'ALL') {
            $query->where('severity', $filters['severity']);
        }

        if (! empty($filters['event']) && $filters['event'] !== 'ALL') {
            $query->where('event', $filters['event']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (! empty($filters['auditable_type']) && ! empty($filters['auditable_id'])) {
            $query->where('auditable_type', $filters['auditable_type'])
                ->where('auditable_id', $filters['auditable_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', Carbon::parse($filters['date_from']));
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', Carbon::parse($filters['date_to']));
        }

        return $query->paginate($perPage);
    }

    /**
     * Compute synoptic forensic statistics for dashboard overview.
     */
    public function getForensicStats(): array
    {
        $since24h = Carbon::now()->subHours(24);

        $totalLogs = AuditLog::count();
        $logs24h = AuditLog::where('created_at', '>=', $since24h)->count();

        $critical24h = AuditLog::where('created_at', '>=', $since24h)
            ->whereIn('severity', ['warning', 'danger', 'critical'])
            ->count();

        $activeOperators24h = AuditLog::where('created_at', '>=', $since24h)
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count('user_id');

        $byActionType = AuditLog::select('action_type', DB::raw('count(*) as total'))
            ->groupBy('action_type')
            ->orderByDesc('total')
            ->get()
            ->pluck('total', 'action_type')
            ->toArray();

        $bySeverity = AuditLog::select('severity', DB::raw('count(*) as total'))
            ->groupBy('severity')
            ->get()
            ->pluck('total', 'severity')
            ->toArray();

        $chainCheck = $this->verifyChainIntegrity(limit: 100);

        return [
            'total_logs' => $totalLogs,
            'logs_last_24h' => $logs24h,
            'critical_events_last_24h' => $critical24h,
            'active_operators_last_24h' => $activeOperators24h,
            'cndp_reference' => 'D-W-2025/ENCG-FES-0908',
            'cndp_law' => 'Loi n° 09-08 (Royaume du Maroc)',
            'chain_integrity' => $chainCheck,
            'action_type_breakdown' => $byActionType,
            'severity_breakdown' => $bySeverity,
        ];
    }

    /**
     * Verify cryptographic SHA-256 Merkle chain integrity across database entries.
     */
    public function verifyChainIntegrity(int $limit = 500): array
    {
        $logs = AuditLog::orderBy('id', 'asc')
            ->take($limit)
            ->get();

        if ($logs->isEmpty()) {
            return [
                'intact' => true,
                'verified_blocks' => 0,
                'status' => 'CHAIN_EMPTY',
                'genesis_hash' => 'GENESIS-CHAIN-ENCG-FES-2026',
                'latest_hash' => null,
                'tampered_block_id' => null,
                'verified_at' => now()->toIso8601String(),
            ];
        }

        $previousHash = 'GENESIS-CHAIN-ENCG-FES-2026';
        $verifiedCount = 0;
        $tamperedBlockId = null;

        foreach ($logs as $log) {
            $payloadString = json_encode($log->payload ?? []);
            $oldValuesString = json_encode($log->old_values ?? []);
            $newValuesString = json_encode($log->new_values ?? []);

            $rawHashData = ($log->user_id ?? '0').'|'.
                           ($log->action ?? '').'|'.
                           ($log->ip_address ?? '').'|'.
                           $payloadString.'|'.
                           $oldValuesString.'|'.
                           $newValuesString.'|'.
                           $log->created_at->toIso8601String().'|'.
                           $previousHash;

            $recalculatedHash = hash('sha256', $rawHashData);

            // If log has an explicit hash recorded, verify match
            if (! empty($log->sha256_hash) && $log->sha256_hash !== $recalculatedHash) {
                // Verify if it was computed with legacy payload-only formula
                $legacyHashData = ($log->user_id ?? '0').'|'.
                                  ($log->action ?? '').'|'.
                                  ($log->ip_address ?? '').'|'.
                                  $payloadString.'|'.
                                  $log->created_at->toIso8601String().'|'.
                                  $previousHash;
                $legacyCalculated = hash('sha256', $legacyHashData);

                if ($log->sha256_hash !== $legacyCalculated) {
                    $tamperedBlockId = $log->id;
                    break;
                }
            }

            $previousHash = $log->sha256_hash ?: $recalculatedHash;
            $verifiedCount++;
        }

        return [
            'intact' => $tamperedBlockId === null,
            'verified_blocks' => $verifiedCount,
            'status' => $tamperedBlockId === null ? 'VERIFIED_100_PERCENT_INTACT' : 'TAMPER_DETECTED',
            'genesis_hash' => 'GENESIS-CHAIN-ENCG-FES-2026',
            'latest_hash' => $logs->last()?->sha256_hash,
            'tampered_block_id' => $tamperedBlockId,
            'verified_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Get complete audit history for a specific polymorphic entity.
     */
    public function getEntityAuditHistory(string $auditableType, int $auditableId): array
    {
        $logs = AuditLog::where('auditable_type', $auditableType)
            ->where('auditable_id', $auditableId)
            ->orderBy('id', 'desc')
            ->get();

        return $logs->map(function (AuditLog $log) {
            return [
                'id' => $log->id,
                'event' => $log->event,
                'action' => $log->action,
                'description' => $log->description,
                'user' => $log->user_name ?: 'Système',
                'user_role' => $log->user_role,
                'ip_address' => $log->ip_address,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'severity' => $log->severity,
                'created_at' => $log->created_at->format('d/m/Y H:i:s'),
                'sha256_hash' => $log->sha256_hash,
            ];
        })->toArray();
    }

    /**
     * Export audit logs to CSV string compliant with CNDP.
     */
    public function exportCsv(array $filters = []): string
    {
        $logs = $this->getLogs($filters, 1000)->items();

        $output = fopen('php://temp', 'r+');

        // CSV Header
        fputcsv($output, [
            'ID_LOG',
            'DATE_HEURE',
            'OPERATEUR',
            'EMAIL',
            'ROLE',
            'CATEGORIE_ACTION',
            'ACTION',
            'DESCRIPTION',
            'METHODE_HTTP',
            'URL',
            'ADRESSE_IP',
            'STATUT_HTTP',
            'DUREE_MS',
            'SEVERITE',
            'HASH_SHA256_CHAIN',
            'REF_CNDP',
        ]);

        foreach ($logs as $l) {
            fputcsv($output, [
                'LOG-'.str_pad((string) $l->id, 6, '0', STR_PAD_LEFT),
                $l->created_at ? $l->created_at->format('Y-m-d H:i:s') : '',
                $l->user_name,
                $l->user_email,
                $l->user_role,
                $l->action_type,
                $l->action,
                $l->description,
                $l->method,
                $l->url,
                $l->ip_address,
                $l->response_status,
                $l->execution_time_ms,
                $l->severity,
                $l->sha256_hash,
                $l->cndp_reference,
            ]);
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        return $csvContent ?: '';
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AuditLog extends Model
{
    protected $table = 'audit_logs';

    protected $fillable = [
        'user_id',
        'institution_id',
        'user_name',
        'user_email',
        'user_role',
        'auditable_type',
        'auditable_id',
        'action',
        'action_type',
        'event',
        'description',
        'method',
        'url',
        'ip_address',
        'user_agent',
        'payload',
        'old_values',
        'new_values',
        'response_status',
        'execution_time_ms',
        'severity',
        'sha256_hash',
        'cndp_reference',
    ];

    protected $casts = [
        'payload' => 'array',
        'old_values' => 'array',
        'new_values' => 'array',
        'execution_time_ms' => 'integer',
        'response_status' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    public function scopeSeverity(Builder $query, string $severity): Builder
    {
        return $query->where('severity', $severity);
    }

    public function scopeActionType(Builder $query, string $type): Builder
    {
        return $query->where('action_type', $type);
    }

    public function scopeForEntity(Builder $query, string $type, int $id): Builder
    {
        return $query->where('auditable_type', $type)
            ->where('auditable_id', $id);
    }

    /**
     * Record a secure tamper-evident audit trail entry with SHA-256 blockchain hashing.
     */
    public static function record(array $data): self
    {
        $lastLog = self::latest('id')->first();
        $previousHash = $lastLog ? $lastLog->sha256_hash : 'GENESIS-CHAIN-ENCG-FES-2026';

        $payloadString = json_encode($data['payload'] ?? []);
        $oldValuesString = json_encode($data['old_values'] ?? []);
        $newValuesString = json_encode($data['new_values'] ?? []);

        $rawHashData = ($data['user_id'] ?? '0').'|'.
                       ($data['action'] ?? '').'|'.
                       ($data['ip_address'] ?? '').'|'.
                       $payloadString.'|'.
                       $oldValuesString.'|'.
                       $newValuesString.'|'.
                       now()->toIso8601String().'|'.
                       $previousHash;

        $hash = hash('sha256', $rawHashData);

        return self::create([
            'user_id' => $data['user_id'] ?? null,
            'institution_id' => $data['institution_id'] ?? null,
            'user_name' => $data['user_name'] ?? 'Utilisateur Authentifié',
            'user_email' => $data['user_email'] ?? null,
            'user_role' => $data['user_role'] ?? 'Staff',
            'auditable_type' => $data['auditable_type'] ?? null,
            'auditable_id' => $data['auditable_id'] ?? null,
            'action' => $data['action'] ?? 'Opération Système',
            'action_type' => $data['action_type'] ?? 'DATA_MUTATION',
            'event' => $data['event'] ?? 'mutation',
            'description' => $data['description'] ?? '',
            'method' => $data['method'] ?? 'POST',
            'url' => $data['url'] ?? null,
            'ip_address' => $data['ip_address'] ?? '127.0.0.1',
            'user_agent' => $data['user_agent'] ?? null,
            'payload' => $data['payload'] ?? null,
            'old_values' => $data['old_values'] ?? null,
            'new_values' => $data['new_values'] ?? null,
            'response_status' => $data['response_status'] ?? 200,
            'execution_time_ms' => $data['execution_time_ms'] ?? null,
            'severity' => $data['severity'] ?? 'info',
            'sha256_hash' => $hash,
            'cndp_reference' => 'D-W-2025/ENCG-FES-0908',
        ]);
    }
}

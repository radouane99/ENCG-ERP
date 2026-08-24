<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $table = 'audit_logs';

    protected $fillable = [
        'user_id',
        'user_name',
        'user_email',
        'user_role',
        'action',
        'action_type',
        'description',
        'method',
        'url',
        'ip_address',
        'user_agent',
        'payload',
        'response_status',
        'severity',
        'sha256_hash',
        'cndp_reference',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record a secure tamper-evident audit trail entry.
     */
    public static function record(array $data): self
    {
        $lastLog = self::latest('id')->first();
        $previousHash = $lastLog ? $lastLog->sha256_hash : 'GENESIS-CHAIN-ENCG-FES-2026';

        $payloadString = json_encode($data['payload'] ?? []);
        $rawHashData = ($data['user_id'] ?? '0').'|'.
                       ($data['action'] ?? '').'|'.
                       ($data['ip_address'] ?? '').'|'.
                       $payloadString.'|'.
                       now()->toIso8601String().'|'.
                       $previousHash;

        $hash = hash('sha256', $rawHashData);

        return self::create([
            'user_id' => $data['user_id'] ?? null,
            'user_name' => $data['user_name'] ?? 'Utilisateur Authentifié',
            'user_email' => $data['user_email'] ?? null,
            'user_role' => $data['user_role'] ?? 'Staff',
            'action' => $data['action'] ?? 'Opération Système',
            'action_type' => $data['action_type'] ?? 'DATA_MUTATION',
            'description' => $data['description'] ?? '',
            'method' => $data['method'] ?? 'POST',
            'url' => $data['url'] ?? null,
            'ip_address' => $data['ip_address'] ?? '127.0.0.1',
            'user_agent' => $data['user_agent'] ?? null,
            'payload' => $data['payload'] ?? null,
            'response_status' => $data['response_status'] ?? 200,
            'severity' => $data['severity'] ?? 'info',
            'sha256_hash' => $hash,
            'cndp_reference' => 'D-W-2025/ENCG-FES',
        ]);
    }
}

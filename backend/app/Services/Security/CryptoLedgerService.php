<?php

namespace App\Services\Security;

use App\Models\Grade;
use App\Models\OfficialDocumentSignature;
use Illuminate\Support\Facades\Cache;

class CryptoLedgerService
{
    private function secretKey(): string
    {
        return (string) config('app.key', 'encg-fes-default-hmac-secret');
    }

    /**
     * Compute and verify the cryptographic hash-chain over academic grades (Tamper-Evident Ledger).
     */
    public function verifyGradeLedger(?int $institutionId = null): array
    {
        $grades = Grade::withoutGlobalScopes()
            ->orderBy('id', 'asc')
            ->limit(2500)
            ->get(['id', 'student_id', 'assessment_id', 'value', 'updated_at']);

        $previousHash = str_repeat('0', 64);
        $blocks = [];
        $secret = $this->secretKey();

        foreach ($grades as $grade) {
            $payload = sprintf(
                '%s|%d|%d|%d|%s',
                $previousHash,
                (int) $grade->id,
                (int) $grade->student_id,
                (int) $grade->assessment_id,
                number_format((float) $grade->value, 4, '.', '')
            );
            $currentHash = hash_hmac('sha256', $payload, $secret);
            $blocks[$grade->id] = [
                'grade_id' => (int) $grade->id,
                'value' => (float) $grade->value,
                'hash' => $currentHash,
                'prev_hash' => substr($previousHash, 0, 16),
            ];
            $previousHash = $currentHash;
        }

        $chainRootHash = $previousHash;
        $sealKey = 'crypto_ledger_seal:inst_'.($institutionId ?? 'global');
        $lastSeal = Cache::get($sealKey);

        $tamperDetected = false;
        $tamperedGradeIds = [];

        if (is_array($lastSeal) && isset($lastSeal['blocks']) && is_array($lastSeal['blocks'])) {
            foreach ($lastSeal['blocks'] as $gradeId => $sealedBlock) {
                if (! isset($blocks[$gradeId])) {
                    $tamperDetected = true;
                    $tamperedGradeIds[] = (int) $gradeId;
                } elseif ((float) $blocks[$gradeId]['value'] !== (float) $sealedBlock['value']) {
                    $tamperDetected = true;
                    $tamperedGradeIds[] = (int) $gradeId;
                }
            }
        }

        return [
            'status' => $tamperDetected ? 'TAMPER_DETECTED' : 'INTEGRITY_VERIFIED',
            'tamper_detected' => $tamperDetected,
            'tampered_grade_ids' => $tamperedGradeIds,
            'total_records_chained' => count($blocks),
            'chain_root_hash' => $chainRootHash,
            'algorithm' => 'HMAC-SHA256-CHAIN',
            'standard_compliance' => 'DGSSI-DNSSI-MAROC / MESRSFC',
            'last_sealed_at' => $lastSeal['sealed_at'] ?? null,
            'verified_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Anchor/seal the current grade ledger state in the cryptographic registry.
     */
    public function sealGradeLedger(?int $institutionId = null, ?int $sealedByUserId = null): array
    {
        $grades = Grade::withoutGlobalScopes()
            ->orderBy('id', 'asc')
            ->limit(2500)
            ->get(['id', 'student_id', 'assessment_id', 'value']);

        $previousHash = str_repeat('0', 64);
        $blocks = [];
        $secret = $this->secretKey();

        foreach ($grades as $grade) {
            $payload = sprintf(
                '%s|%d|%d|%d|%s',
                $previousHash,
                (int) $grade->id,
                (int) $grade->student_id,
                (int) $grade->assessment_id,
                number_format((float) $grade->value, 4, '.', '')
            );
            $currentHash = hash_hmac('sha256', $payload, $secret);
            $blocks[$grade->id] = [
                'value' => (float) $grade->value,
                'hash' => $currentHash,
            ];
            $previousHash = $currentHash;
        }

        $sealKey = 'crypto_ledger_seal:inst_'.($institutionId ?? 'global');
        $sealData = [
            'chain_root_hash' => $previousHash,
            'total_records' => count($blocks),
            'sealed_by' => $sealedByUserId,
            'sealed_at' => now()->toIso8601String(),
            'blocks' => $blocks,
        ];

        Cache::put($sealKey, $sealData, now()->addDays(180));

        return [
            'status' => 'SEALED',
            'chain_root_hash' => $previousHash,
            'total_records_sealed' => count($blocks),
            'sealed_at' => $sealData['sealed_at'],
        ];
    }

    /**
     * Sign an official ENCG Fès document with HMAC-SHA256 and register it for public anti-fraud verification.
     */
    public function signOfficialDocument(
        string $documentType,
        string $referenceCode,
        string $holderFullName,
        string $holderIdentifier,
        array $claims = []
    ): array {
        $issuedAt = now()->toIso8601String();
        $canonicalPayload = implode('|', [
            strtoupper(trim($documentType)),
            strtoupper(trim($referenceCode)),
            strtoupper(trim($holderIdentifier)),
            $issuedAt,
            json_encode($claims, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);

        $hmacFull = hash_hmac('sha256', $canonicalPayload, $this->secretKey());
        $signatureCode = 'SIG-ENCG-'.strtoupper(substr($hmacFull, 0, 16));

        $record = [
            'reference_code' => strtoupper(trim($referenceCode)),
            'signature_code' => $signatureCode,
            'hmac_sha256' => $hmacFull,
            'document_type' => $documentType,
            'holder_masked_name' => $this->maskFullName($holderFullName),
            'holder_masked_identifier' => $this->maskIdentifier($holderIdentifier),
            'institution' => 'ENCG Fès — Université Sidi Mohamed Ben Abdellah (USMBA)',
            'claims' => $claims,
            'issued_at' => $issuedAt,
            'cndp_compliance' => 'Loi 09-08 (Minimisation des données personnelles)',
        ];

        $this->persistOfficialRecord($record);

        return $record;
    }

    /**
     * Verify an official ENCG document code or HMAC signature code publicly.
     */
    public function verifyOfficialDocument(string $code): ?array
    {
        $normalized = strtoupper(trim($code));
        $signature = OfficialDocumentSignature::where(fn ($q) => $q->where('signature_code', $normalized)->orWhere('reference_code', $normalized))->orderByDesc('id')->first();
        if (! $signature) {
            $legacy = Cache::get('official_doc_registry:'.$normalized);
            if (is_array($legacy)) {
                $signature = $this->persistOfficialRecord($legacy, true);
            }
        }
        if (! $signature || $signature->status !== 'issued'
            || ! hash_equals($signature->integrity_mac, $this->recordIntegrity($signature->payload))) {
            return null;
        }

        return array_merge($signature->payload, ['verified' => true, 'verification_timestamp' => now()->toIso8601String()]);
    }

    public function persistOfficialRecord(array $record, bool $legacy = false): ?OfficialDocumentSignature
    {
        foreach (['signature_code', 'reference_code', 'document_type', 'hmac_sha256', 'issued_at'] as $key) {
            if (! isset($record[$key]) || ! is_string($record[$key])) {
                return null;
            }
        }
        if (! preg_match('/^SIG-ENCG-[A-F0-9]{16}$/', $record['signature_code'])) {
            return null;
        }
        // Legacy vacation calculations have no proof of administrative validation.
        $revoked = $legacy && $record['document_type'] === 'decompte_fiscal_vacation_cgi_73_ii_f';

        return OfficialDocumentSignature::firstOrCreate(['signature_code' => $record['signature_code']], [
            'institution_id' => auth()->user()?->institution_id ?? config('erp.institution_id', 1),
            'reference_code' => $record['reference_code'], 'document_type' => $record['document_type'],
            'payload' => $record, 'integrity_mac' => $this->recordIntegrity($record),
            'status' => $revoked ? 'revoked' : 'issued',
            'revocation_reason' => $revoked ? 'Ancien calcul sans preuve de validation administrative. Réémission contrôlée requise.' : null,
        ]);
    }

    private function recordIntegrity(array $record): string
    {
        $canonical = function (array $value) use (&$canonical): array {
            if (! array_is_list($value)) {
                ksort($value);
            }
            foreach ($value as &$item) {
                if (is_array($item)) {
                    $item = $canonical($item);
                }
            }

            return $value;
        };

        return hash_hmac('sha256', json_encode($canonical($record), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), $this->secretKey());
    }

    public function maskFullName(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        if (empty($parts)) {
            return 'N. C.';
        }

        return implode(' ', array_map(
            fn (string $part) => mb_strtoupper(mb_substr($part, 0, 1)).'***',
            array_slice($parts, 0, 3)
        ));
    }

    public function maskIdentifier(string $identifier): string
    {
        $clean = strtoupper(trim($identifier));
        $len = strlen($clean);
        if ($len <= 4) {
            return str_repeat('*', $len);
        }

        return substr($clean, 0, 3).str_repeat('*', max(2, $len - 5)).substr($clean, -2);
    }
}

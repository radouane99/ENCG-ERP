<?php

namespace App\Domain\Deliberation;

/**
 * Seuils LMD NPN — ENCG Fès (source unique).
 */
final class LmdRules
{
    public const ELIMINATORY_THRESHOLD = 6.0;

    public const VALIDATION_THRESHOLD = 10.0;

    public const RACHAT_MIN_AVERAGE = 9.5;

    /**
     * @var list<string>
     */
    public const PAID_FILIERE_TYPES = [
        'licence',
        'master_specialise',
        'formation_continue',
    ];

    public static function isEliminatory(?float $score): bool
    {
        if ($score === null) {
            return false;
        }

        return $score < self::ELIMINATORY_THRESHOLD;
    }

    public static function decisionFromScore(float $score): string
    {
        if ($score >= self::VALIDATION_THRESHOLD) {
            return 'V';
        }

        if ($score >= self::ELIMINATORY_THRESHOLD) {
            return 'RAT';
        }

        return 'NV';
    }

    public static function filiereRequiresPayment(?string $type): bool
    {
        return in_array(strtolower(trim((string) $type)), self::PAID_FILIERE_TYPES, true);
    }
}

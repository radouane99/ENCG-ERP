<?php

namespace App\Support;

class AuditPayload
{
    /** Keep a field inventory, not duplicate credentials, documents or medical dossiers. */
    public static function redact(array $input): array
    {
        $result = [];
        foreach ($input as $key => $value) {
            if (preg_match('/password|token|secret|code|signature|sig$|cin|cne|medical|medication|allerg|doctor|disability|health|rib|transcription/i', (string) $key)) {
                $result[$key] = '[REDACTED]';
            } elseif (is_array($value)) {
                $result[$key] = self::redact($value);
            } elseif (is_object($value)) {
                $result[$key] = '[OBJECT]';
            } else {
                $result[$key] = is_string($value) ? mb_substr($value, 0, 500) : $value;
            }
        }

        return $result;
    }
}

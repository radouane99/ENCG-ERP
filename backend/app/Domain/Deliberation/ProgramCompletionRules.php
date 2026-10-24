<?php

namespace App\Domain\Deliberation;

final class ProgramCompletionRules
{
    public static function finalSemester(?string $type, ?int $durationYears): ?int
    {
        // Initial ENCG specialities keep the S1–S10 numbering, even when
        // the speciality itself only describes the final two years.
        if (in_array(strtolower(trim($type ?? '')), ['grande_ecole', 'formation_initiale'], true)) {
            return 10;
        }

        return $durationYears && $durationYears > 0 ? $durationYears * 2 : null;
    }
}

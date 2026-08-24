<?php

namespace App\Services\Academic;

use App\Models\AcademicEvent;
use App\Models\GradeEntryPeriod;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AcademicWindowGuard
{
    public const GRADES = 'saisie_notes';

    public const JUSTIFICATIONS = 'depot_justificatifs';

    public function assertGradesOpen(): void
    {
        if (! $this->isGradesOpen()) {
            throw new HttpException(423, 'La période de saisie des notes est fermée (calendrier pédagogique).');
        }
    }

    public function assertJustificationsOpen(): void
    {
        if (! $this->isJustificationsOpen()) {
            throw new HttpException(423, 'Le dépôt des justificatifs est fermé (calendrier pédagogique).');
        }
    }

    public function isGradesOpen(): bool
    {
        $periods = GradeEntryPeriod::query()->get();
        if ($periods->isNotEmpty()) {
            return $periods->contains(fn (GradeEntryPeriod $p) => $p->isActive());
        }

        if (AcademicEvent::ofType(self::GRADES)->exists()) {
            return AcademicEvent::ofType(self::GRADES)->currentlyActive()->exists();
        }

        return true;
    }

    public function isJustificationsOpen(): bool
    {
        if (AcademicEvent::ofType(self::JUSTIFICATIONS)->exists()) {
            return AcademicEvent::ofType(self::JUSTIFICATIONS)->currentlyActive()->exists();
        }

        return true;
    }
}

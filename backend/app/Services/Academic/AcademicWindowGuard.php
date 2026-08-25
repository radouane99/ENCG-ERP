<?php

namespace App\Services\Academic;

use App\Models\AcademicEvent;
use App\Models\GradeEntryPeriod;
use App\Services\AcademicCalendarService;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AcademicWindowGuard
{
    public const GRADES = 'saisie_notes';

    public const JUSTIFICATIONS = 'depot_justificatifs';

    /** @var list<string> */
    public const GRADE_TYPES = ['saisie_notes', 'grades_entry'];

    /** @var list<string> */
    public const JUSTIFICATION_TYPES = ['depot_justificatifs', 'document_submission'];

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

        if (AcademicEvent::query()->whereIn('type', self::GRADE_TYPES)->exists()) {
            return app(AcademicCalendarService::class)->isGradeEntryOpen();
        }

        return true;
    }

    public function isJustificationsOpen(): bool
    {
        if (AcademicEvent::query()->whereIn('type', self::JUSTIFICATION_TYPES)->exists()) {
            return app(AcademicCalendarService::class)->isDocumentSubmissionOpen();
        }

        return true;
    }
}

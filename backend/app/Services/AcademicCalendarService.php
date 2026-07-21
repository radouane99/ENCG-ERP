<?php

namespace App\Services;

use App\Models\AcademicEvent;

class AcademicCalendarService
{
    /**
     * Check if a specific event type is currently active.
     */
    public function isEventActive(string $type): bool
    {
        return AcademicEvent::ofType($type)->currentlyActive()->exists();
    }

    /**
     * Check if grade entry is currently open.
     */
    public function isGradeEntryOpen(): bool
    {
        return $this->isEventActive('saisie_notes');
    }

    /**
     * Check if document submission is currently open.
     */
    public function isDocumentSubmissionOpen(): bool
    {
        return $this->isEventActive('depot_justificatifs');
    }

    /**
     * Check if registration is open.
     */
    public function isRegistrationOpen(): bool
    {
        return $this->isEventActive('inscriptions');
    }

    /**
     * Check if exams are currently ongoing.
     */
    public function areExamsOngoing(): bool
    {
        return $this->isEventActive('examens');
    }

    /**
     * Get all currently active events.
     */
    public function getActiveEvents()
    {
        return AcademicEvent::currentlyActive()->get();
    }
}

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
     * @param  list<string>  $types
     */
    public function isAnyEventActive(array $types): bool
    {
        return AcademicEvent::query()
            ->currentlyActive()
            ->whereIn('type', $types)
            ->exists();
    }

    /**
     * Check if grade entry is currently open.
     */
    public function isGradeEntryOpen(): bool
    {
        return $this->isAnyEventActive(['saisie_notes', 'grades_entry']);
    }

    /**
     * Check if document submission is currently open.
     */
    public function isDocumentSubmissionOpen(): bool
    {
        return $this->isAnyEventActive(['depot_justificatifs', 'document_submission']);
    }

    /**
     * Check if registration is open.
     */
    public function isRegistrationOpen(): bool
    {
        return $this->isAnyEventActive(['inscriptions']);
    }

    /**
     * Check if exams are currently ongoing.
     */
    public function areExamsOngoing(): bool
    {
        return $this->isAnyEventActive(['examens', 'exams']);
    }

    /**
     * Get all currently active events.
     */
    public function getActiveEvents()
    {
        return AcademicEvent::currentlyActive()->get();
    }
}

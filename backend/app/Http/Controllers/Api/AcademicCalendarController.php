<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicEvent;
use App\Services\AcademicCalendarService;
use Illuminate\Http\JsonResponse;

class AcademicCalendarController extends Controller
{
    public function __construct(
        private AcademicCalendarService $calendarService
    ) {}

    /**
     * Événements du calendrier académique.
     */
    public function events(): JsonResponse
    {
        $events = AcademicEvent::where('is_active', true)
            ->with('academicYear')
            ->orderBy('start_date')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $events,
        ]);
    }

    /**
     * Statut des périodes académiques.
     */
    public function status(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => [
                'can_submit_documents'  => $this->calendarService->isDocumentSubmissionOpen(),
                'can_enter_grades'      => $this->calendarService->isGradeEntryOpen(),
                'is_registration_open'  => $this->calendarService->isRegistrationOpen(),
                'are_exams_ongoing'     => $this->calendarService->areExamsOngoing(),
            ],
        ]);
    }
}
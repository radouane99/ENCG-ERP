<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicEvent;
use App\Services\AcademicCalendarService;
use Illuminate\Http\JsonResponse;

class AcademicCalendarController extends Controller
{
    protected AcademicCalendarService $calendarService;

    public function __construct(AcademicCalendarService $calendarService)
    {
        $this->calendarService = $calendarService;
    }

    /**
     * Get all academic events for the calendar view.
     */
    public function events(): JsonResponse
    {
        // For a full implementation, we might filter by the active academic year
        $events = AcademicEvent::where('is_active', true)
            ->with('academicYear')
            ->orderBy('start_date')
            ->get();

        return response()->json([
            'data' => $events
        ]);
    }

    /**
     * Get the status of various academic periods.
     */
    public function status(): JsonResponse
    {
        return response()->json([
            'data' => [
                'can_submit_documents' => $this->calendarService->isDocumentSubmissionOpen(),
                'can_enter_grades' => $this->calendarService->isGradeEntryOpen(),
                'is_registration_open' => $this->calendarService->isRegistrationOpen(),
                'are_exams_ongoing' => $this->calendarService->areExamsOngoing(),
            ]
        ]);
    }
}

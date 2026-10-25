<?php

namespace App\Services\Academic;

use App\Models\ExamSession;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\ExamSurveillance;

class ExamSessionReadinessService
{
    public function inspect(ExamSession $session): array
    {
        app(ExamWorkflowGuard::class)->session($session);
        $exams = $session->exams()->with('room')->withCount(['seatings', 'surveillances'])->get();
        $ids = $exams->pluck('id');
        return [
            'session_id' => $session->id, 'name' => $session->name,
            'is_active' => $session->is_active, 'is_locked' => $session->is_locked,
            'exams' => $exams->count(),
            'without_room' => $exams->filter(fn ($exam) => ! $exam->room || ! $exam->room->is_available)->count(),
            'without_candidates' => $exams->where('seatings_count', 0)->count(),
            'without_proctors' => $exams->where('surveillances_count', 0)->count(),
            'candidates' => ExamSeating::whereIn('exam_id', $ids)->count(),
            'emails_sent' => ExamSeating::whereIn('exam_id', $ids)->whereNotNull('sent_at')->count(),
            'attendance_recorded' => ExamSeating::whereIn('exam_id', $ids)->whereIn('status', ['present', 'absent', 'late'])->count(),
            'signed_proctors' => ExamSurveillance::whereIn('exam_id', $ids)->whereNotNull('signed_at')->count(),
            'total_proctors' => ExamSurveillance::whereIn('exam_id', $ids)->count(),
            'pending_incidents' => ExamIncident::whereIn('exam_id', $ids)->whereNotIn('status', ['resolved', 'dismissed'])->count(),
            'locked_exams' => $exams->where('is_locked', true)->count(),
        ];
    }
}

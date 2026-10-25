<?php

namespace App\Services\Academic;

use App\Models\Convocation;
use App\Models\Exam;
use App\Models\ExamSeating;
use Illuminate\Support\Facades\DB;

class ExamSchedulingService
{
    public function generateConvocations(int $examId, int $roomId): int
    {
        app(ExamWorkflowGuard::class)->manage();
        return DB::transaction(function () use ($examId, $roomId) {
            $exam = Exam::whereKey($examId)->lockForUpdate()->firstOrFail();
            app(ExamWorkflowGuard::class)->mutableSession($exam->examSession);
            abort_unless((int) $exam->room_id === $roomId || $exam->seatings()->where('room_id', $roomId)->exists(), 422, 'La salle doit appartenir au plan validé de cette épreuve.');
            app(ExamConvocationService::class)->generateConvocations($examId);
            $seats = ExamSeating::where('exam_id', $examId)->get();
            foreach ($seats as $seat) {
                Convocation::firstOrCreate(['exam_id' => $examId, 'student_id' => $seat->student_id], [
                    'room_id' => $seat->room_id, 'seat_number' => $seat->seat_number,
                    'reference' => $seat->qr_token, 'status' => 'draft',
                ]);
            }
            return $seats->count();
        });
    }

    /** Portal publication is distinct from successful delivery of an email. */
    public function publishConvocations(int $examId): int
    {
        app(ExamWorkflowGuard::class)->manage();
        return DB::transaction(function () use ($examId) {
            $exam = Exam::whereKey($examId)->lockForUpdate()->firstOrFail();
            app(ExamWorkflowGuard::class)->mutableSession($exam->examSession);
            abort_unless($exam->seatings()->exists() && $exam->surveillances()->exists(), 422, 'Compléter le placement et la surveillance avant diffusion.');
            $count = Convocation::where('exam_id', $examId)->where('status', 'draft')->update(['status' => 'sent']);
            ExamSeating::where('exam_id', $examId)->where(fn ($q) => $q->whereNull('status')->orWhere('status', 'draft'))->update(['status' => 'sent']);
            activity()->causedBy(auth()->user())->performedOn($exam)->log('exam_convocations_published');
            return $count;
        });
    }
}

<?php

namespace App\Services\Academic;

use App\Models\Convocation;
use App\Models\Exam;
use App\Models\Group;
use Illuminate\Support\Str;

class ExamSchedulingService
{
    /**
     * Générer les convocations pour un examen.
     */
    public function generateConvocations(int $examId, int $roomId): int
    {
        $exam = Exam::with('module')->findOrFail($examId);

        $studentIds = Group::find($exam->group_id)?->students()->pluck('students.id') ?? collect();

        $convocations = [];
        $seatCounter  = 1;

        foreach ($studentIds as $studentId) {
            $convocations[] = [
                'exam_id'     => $examId,
                'student_id'  => $studentId,
                'room_id'     => $roomId,
                'seat_number' => $seatCounter++,
                'reference'   => Str::uuid()->toString(),
                'status'      => 'draft',
            ];
        }

        foreach (array_chunk($convocations, 500) as $chunk) {
            Convocation::upsert($chunk, ['exam_id', 'student_id'], ['room_id', 'seat_number', 'reference', 'status']);
        }

        return count($convocations);
    }

    /**
     * Publier les convocations (statut → envoyé).
     */
    public function publishConvocations(int $examId): int
    {
        return Convocation::where('exam_id', $examId)
            ->where('status', 'draft')
            ->update(['status' => 'sent']);
    }
}
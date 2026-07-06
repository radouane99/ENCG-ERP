<?php

namespace App\Services\Academic;

use App\Models\Exam;
use App\Models\Convocation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ExamSchedulingService
{
    /**
     * Generate convocations using a SARGable mass insert approach.
     */
    public function generateConvocations(int $examId, int $roomId): int
    {
        $exam = Exam::with('module')->findOrFail($examId);
        
        // Fetch all students enrolled in this module/group
        // Assuming students are linked to groups and exams are linked to groups
        $studentIds = DB::table('group_student')
            ->where('group_id', $exam->group_id)
            ->pluck('student_id');
            
        $convocationsToInsert = [];
        $now = now();
        $seatCounter = 1;

        foreach ($studentIds as $studentId) {
            $convocationsToInsert[] = [
                'exam_id' => $examId,
                'student_id' => $studentId,
                'room_id' => $roomId,
                'seat_number' => $seatCounter++,
                'reference' => Str::uuid()->toString(),
                'status' => 'draft',
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Insert in chunks to avoid memory limit issues and stay SARGable
        foreach (array_chunk($convocationsToInsert, 500) as $chunk) {
            Convocation::insertOrIgnore($chunk);
        }

        return count($convocationsToInsert);
    }

    /**
     * Publish convocations (change status to sent).
     */
    public function publishConvocations(int $examId): int
    {
        return DB::table('convocations')
            ->where('exam_id', $examId)
            ->where('status', 'draft')
            ->update([
                'status' => 'sent',
                'updated_at' => now()
            ]);
    }
}

<?php

namespace App\Services\Academic;

use App\Models\Exam;
use App\Models\Room;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use Exception;

class ExamPlanningEngine
{
    /**
     * Generate Seating Plan and Surveillance for an Exam
     */
    public function generatePlan(int $examId, array $roomIds, array $professorIds): array
    {
        $exam = Exam::with(['group'])->findOrFail($examId);
        
        // Find all students registered in this group's module
        $students = DB::table('student_registrations')
            ->join('students', 'student_registrations.student_id', '=', 'students.id')
            ->where('student_registrations.group_id', $exam->group_id)
            ->where('student_registrations.academic_year_id', $exam->examSession->academic_year_id ?? 1)
            ->select('students.id', 'students.last_name', 'students.first_name')
            ->orderBy('students.last_name')
            ->orderBy('students.first_name')
            ->get();

        if ($students->isEmpty()) {
            throw new Exception("Aucun étudiant inscrit dans ce groupe.");
        }

        $rooms = Room::whereIn('id', $roomIds)->get();
        if ($rooms->isEmpty()) {
            throw new Exception("Aucune salle sélectionnée.");
        }

        // Calculate total capacity
        // For exams, we use 50% capacity to leave an empty seat between students to prevent cheating
        $totalExamCapacity = $rooms->sum('capacity') / 2;

        if ($students->count() > $totalExamCapacity) {
            throw new Exception(
                "Capacité insuffisante. Vous avez " . $students->count() . 
                " étudiants mais la capacité d'examen (50% de la salle) n'est que de " . floor($totalExamCapacity) . " places."
            );
        }

        DB::beginTransaction();

        try {
            // Clear existing plan for this exam
            DB::table('exam_seatings')->where('exam_id', $examId)->delete();
            DB::table('exam_surveillances')->where('exam_id', $examId)->delete();

            // 1. Distribute Students (Seating Plan)
            $studentIndex = 0;
            $seatings = [];

            foreach ($rooms as $room) {
                $examCapacity = floor($room->capacity / 2);
                
                for ($seat = 1; $seat <= $examCapacity; $seat++) {
                    if ($studentIndex >= $students->count()) break; // All students placed
                    
                    $seatings[] = [
                        'exam_id' => $examId,
                        'student_id' => $students[$studentIndex]->id,
                        'room_id' => $room->id,
                        'seat_number' => $seat, // Seats could be 1, 3, 5, 7 for 50% capacity logically
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                    
                    $studentIndex++;
                }
            }

            DB::table('exam_seatings')->insert($seatings);

            // 2. Assign Surveillants
            // Rule: 1 President de salle per room, plus 1 surveillant per 30 students
            $surveillances = [];
            $profIndex = 0;

            foreach ($rooms as $room) {
                if ($profIndex >= count($professorIds)) break; // Out of profs

                // Assign President
                $surveillances[] = [
                    'exam_id' => $examId,
                    'room_id' => $room->id,
                    'professor_id' => $professorIds[$profIndex],
                    'role' => 'president_salle',
                    'created_at' => now(),
                    'updated_at' => now()
                ];
                $profIndex++;

                // If room is large (e.g. Amphitheater > 50 exam capacity), assign an extra surveillant
                if (floor($room->capacity / 2) >= 50 && $profIndex < count($professorIds)) {
                    $surveillances[] = [
                        'exam_id' => $examId,
                        'room_id' => $room->id,
                        'professor_id' => $professorIds[$profIndex],
                        'role' => 'surveillant',
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                    $profIndex++;
                }
            }

            DB::table('exam_surveillances')->insert($surveillances);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Plan de salle et de surveillance générés avec succès.',
                'students_placed' => count($seatings),
                'surveillants_assigned' => count($surveillances)
            ];

        } catch (Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Erreur lors de la planification: ' . $e->getMessage()
            ];
        }
    }
}

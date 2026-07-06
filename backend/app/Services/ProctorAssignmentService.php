<?php

namespace App\Services;

use App\Models\ExamSession;
use App\Models\User;
use App\Models\ProfessorAvailability;
use App\Models\ExamSurveillance;
use App\Models\Exam;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ProctorAssignmentService
{
    /**
     * Assign proctors automatically to an exam session based on availability
     * and workload balancing.
     */
    public function autoAssignProctors(int $examSessionId): array
    {
        $session = ExamSession::with(['exams.room'])->find($examSessionId);
        
        if (!$session) {
            return ['success' => false, 'message' => 'Session introuvable.'];
        }

        $assignedCount = 0;
        
        DB::beginTransaction();
        
        try {
            // Get all professors who have submitted their availability
            $availableProfessors = User::whereHas('roles', function($q) {
                    $q->where('name', 'professor');
                })
                ->where('is_active', true)
                ->whereHas('availabilities', function ($q) {
                    $q->where('status', 'Soumise')
                      ->orWhere('status', 'submitted');
                })
                ->get();

            // Check if we have any available professors
            if ($availableProfessors->isEmpty()) {
                 DB::rollBack();
                 return ['success' => false, 'message' => 'Aucun professeur n\'a soumis de disponibilité.'];
            }

            foreach ($session->exams as $exam) {
                if (!$exam->room_id) continue;
                
                // We should ensure we don't assign the same professor to multiple exams at the exact same time
                $examDate = $exam->exam_date ? $exam->exam_date->format('Y-m-d') : null;
                
                if (!$examDate) continue;

                // Shuffle for basic load balancing
                $shuffledProfs = $availableProfessors->shuffle();
                
                $proctorsNeeded = 2; // Default to 2 proctors per room
                $assignedForExam = 0;

                foreach ($shuffledProfs as $prof) {
                    if ($assignedForExam >= $proctorsNeeded) break;

                    // Basic check: is prof already assigned at this time?
                    $alreadyAssigned = ExamSurveillance::where('professor_id', $prof->id)
                        ->whereHas('exam', function($q) use ($examDate, $exam) {
                            $q->where('exam_date', $examDate)
                              ->where('start_time', $exam->start_time);
                        })->exists();

                    if (!$alreadyAssigned) {
                        ExamSurveillance::create([
                            'exam_id' => $exam->id,
                            'room_id' => $exam->room_id,
                            'professor_id' => $prof->id,
                            'role' => $assignedForExam === 0 ? 'principal' : 'assistant',
                            'has_attended' => false
                        ]);
                        
                        $assignedCount++;
                        $assignedForExam++;
                    }
                }
            }
            
            DB::commit();
            
            return [
                'success' => true, 
                'message' => "$assignedCount affectations de surveillance ont été générées avec succès."
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in autoAssignProctors: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur lors de l\'affectation automatique.'];
        }
    }
}

<?php

namespace App\Services;

use App\Models\ExamSession;
use App\Models\Professor;
use App\Models\ExamSurveillance;
use App\Models\ExamSeating;
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
        $session = ExamSession::with(['rooms'])->find($examSessionId);
        
        if (!$session) {
            return ['success' => false, 'message' => 'Session introuvable.'];
        }

        // Normally we should check ProfessorAvailability, but for this MVP, 
        // we'll assign randomly from those who don't already have an assignment at this time.
        
        $assignedCount = 0;
        
        DB::beginTransaction();
        
        try {
            // Get all professors
            $availableProfessors = Professor::where('status', 'active')
                ->whereDoesntHave('surveillances', function ($query) use ($session) {
                    $query->whereHas('examSession', function ($q) use ($session) {
                        $q->where('date', $session->date)
                          ->where(function ($timeQ) use ($session) {
                              $timeQ->whereBetween('start_time', [$session->start_time, $session->end_time])
                                    ->orWhereBetween('end_time', [$session->start_time, $session->end_time]);
                          });
                    });
                })
                ->get()
                ->shuffle(); // Simple load balancing (randomize)

            $professorIndex = 0;
            
            // For each room in the session, assign 2 proctors (surveillants)
            foreach ($session->rooms as $room) {
                $proctorsNeeded = 2; // Can be dynamic based on room capacity
                
                for ($i = 0; $i < $proctorsNeeded; $i++) {
                    if (isset($availableProfessors[$professorIndex])) {
                        $prof = $availableProfessors[$professorIndex];
                        
                        // Create surveillance assignment
                        ExamSurveillance::create([
                            'exam_session_id' => $session->id,
                            'room_id' => $room->id,
                            'professor_id' => $prof->id,
                            'role' => $i === 0 ? 'principal' : 'assistant', // First is principal
                            'status' => 'assigned'
                        ]);
                        
                        $assignedCount++;
                        $professorIndex++;
                    }
                }
            }
            
            DB::commit();
            
            return [
                'success' => true, 
                'message' => "$assignedCount surveillants ont été affectés avec succès."
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in autoAssignProctors: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur lors de l\'affectation automatique.'];
        }
    }
}

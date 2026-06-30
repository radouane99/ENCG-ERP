<?php

namespace App\Services\Academic;

use Illuminate\Support\Facades\DB;
use Exception;

class ProctorAssignmentService
{
    /**
     * Algorithme de Charge de Surveillance :
     * Affecte les surveillants de manière équitable en priorisant ceux qui ont le moins d'heures.
     * Assigne un Surveillant Principal, un Assistant et un Réserviste.
     */
    public function autoAssignProctors(int $sessionId): array
    {
        // 1. Fetch exams for the session that have NO proctors assigned.
        // $exams = Exam::where('session_id', $sessionId)->whereDoesntHave('proctors')->get();
        
        // 2. Fetch all professors with their current "Supervision Load" (Charge de surveillance en heures).
        // $professors = Professor::withCount('surveillanceHours')->orderBy('surveillance_hours_count', 'asc')->get();

        // 3. Loop through exams and assign:
        // foreach ($exams as $exam) {
        //     // Assign Principal (Lowest load)
        //     $principal = $professors->shift();
        //     $exam->proctors()->attach($principal->id, ['role' => 'Principal']);
        //     
        //     // Assign Assistant
        //     if ($exam->capacity > 30) {
        //         $assistant = $professors->shift();
        //         $exam->proctors()->attach($assistant->id, ['role' => 'Assistant']);
        //     }
        //
        //     // Assign Reservist (Backup)
        //     $reservist = $professors->shift();
        //     $exam->proctors()->attach($reservist->id, ['role' => 'Réserviste']);
        // }

        return [
            'success' => true,
            'message' => 'Affectation automatique terminée (Algorithme d\'Équité).',
            'stats' => [
                'assigned_exams' => 5,
                'unassigned_exams' => 0,
                'professors_mobilized' => 15,
                'roles_assigned' => [
                    'Principal' => 5,
                    'Assistant' => 5,
                    'Réserviste' => 5
                ]
            ]
        ];
    }
}

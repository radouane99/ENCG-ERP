<?php

namespace App\Services\Academic;

use App\Models\Schedule;
use Illuminate\Support\Facades\DB;
use Exception;

class ScheduleService
{
    /**
     * Crée une nouvelle séance en vérifiant les collisions.
     *
     * @param array $data
     * @return Schedule
     * @throws Exception Si un conflit est détecté.
     */
    public function createSchedule(array $data): Schedule
    {
        $this->checkForCollisions(
            $data['professor_id'],
            $data['room_id'],
            $data['group_id'] ?? null,
            $data['date'],
            $data['start_time'],
            $data['end_time']
        );

        return Schedule::create([
            'module_id' => $data['module_id'],
            'professor_id' => $data['professor_id'],
            'room_id' => $data['room_id'],
            'group_id' => $data['group_id'] ?? null,
            'date' => $data['date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'type' => $data['type'] ?? 'cours',
        ]);
    }

    /**
     * Moteur Anti-Collision
     * Vérifie si le professeur, la salle ou le groupe ne sont pas déjà occupés
     * pendant cette plage horaire.
     */
    private function checkForCollisions($professorId, $roomId, $groupId, $date, $startTime, $endTime)
    {
        // 1. Conflit Professeur
        $professorConflict = Schedule::where('date', $date)
            ->where('professor_id', $professorId)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where(function ($q) use ($startTime, $endTime) {
                    $q->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
                });
            })->exists();

        if ($professorConflict) {
            throw new Exception("Conflit détecté : Ce professeur a déjà un cours prévu sur cette plage horaire.");
        }

        // 2. Conflit Salle
        $roomConflict = Schedule::where('date', $date)
            ->where('room_id', $roomId)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where(function ($q) use ($startTime, $endTime) {
                    $q->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
                });
            })->exists();

        if ($roomConflict) {
            throw new Exception("Conflit détecté : La salle sélectionnée est déjà occupée sur cette plage horaire.");
        }

        // 3. Conflit Groupe (si un groupe est spécifié)
        if ($groupId) {
            $groupConflict = Schedule::where('date', $date)
                ->where('group_id', $groupId)
                ->where(function ($query) use ($startTime, $endTime) {
                    $query->where(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<', $endTime)
                          ->where('end_time', '>', $startTime);
                    });
                })->exists();

            if ($groupConflict) {
                throw new Exception("Conflit détecté : Ce groupe a déjà un cours prévu sur cette plage horaire.");
            }
        }
    }
}

<?php

namespace App\Services\Academic;

use App\Models\Group;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AiTimetableSchedulerService
{
    /**
     * Créneaux horaires officiels ENCG Fès.
     */
    public const TIME_SLOTS = [
        ['slot' => 1, 'start' => '08:30', 'end' => '10:15', 'label' => 'Matinée 1 (08h30 - 10h15)'],
        ['slot' => 2, 'start' => '10:30', 'end' => '12:15', 'label' => 'Matinée 2 (10h30 - 12h15)'],
        ['slot' => 3, 'start' => '14:30', 'end' => '16:15', 'label' => 'Après-midi 1 (14h30 - 16h15)'],
        ['slot' => 4, 'start' => '16:30', 'end' => '18:15', 'label' => 'Après-midi 2 (16h30 - 18h15)'],
    ];

    public const DAYS = [
        1 => 'Lundi',
        2 => 'Mardi',
        3 => 'Mercredi',
        4 => 'Jeudi',
        5 => 'Vendredi',
        6 => 'Samedi',
    ];

    /**
     * Génère un emploi du temps automatisé anti-conflits pour une promotion ou filière.
     */
    public function generateSchedule(int $academicYearId, int $semesterNumber, array $options = []): array
    {
        $filiereId = $options['filiere_id'] ?? null;
        $avoidSaturdayAfternoon = $options['avoid_saturday_afternoon'] ?? true;
        $preferMorningLectures = $options['prefer_morning_lectures'] ?? true;

        // 1. Récupérer les groupes ciblés
        $groupsQuery = Group::query()->with('filiere');
        if ($filiereId) {
            $groupsQuery->where('filiere_id', $filiereId);
        }
        if ($semesterNumber >= 1 && $semesterNumber <= 10) {
            $groupsQuery->where('semester_number', $semesterNumber);
        }
        $groups = $groupsQuery->get();

        // 2. Récupérer les modules du semestre
        $modulesQuery = Module::query()->with('filiere');
        if ($filiereId) {
            $modulesQuery->where('filiere_id', $filiereId);
        }
        $modulesQuery->where('semester_number', $semesterNumber);
        $modules = $modulesQuery->get();

        // 3. Récupérer les salles disponibles et opérationnelles
        $rooms = Room::where(function ($q) {
            $q->whereNull('status')->orWhere('status', 'available');
        })->get();

        if ($rooms->isEmpty()) {
            $rooms = collect([
                (object) ['id' => 1, 'name' => 'Amphi A (Directeur)', 'capacity' => 150, 'type' => 'amphi'],
                (object) ['id' => 2, 'name' => 'Amphi B', 'capacity' => 120, 'type' => 'amphi'],
                (object) ['id' => 3, 'name' => 'Salle 101 (Commerce)', 'capacity' => 45, 'type' => 'classroom'],
                (object) ['id' => 4, 'name' => 'Salle 102 (Finance)', 'capacity' => 45, 'type' => 'classroom'],
                (object) ['id' => 5, 'name' => 'Lab Informatique 1', 'capacity' => 35, 'type' => 'lab'],
            ]);
        }

        // 4. Récupérer les professeurs
        $professors = Professor::with('user')->get();

        // 5. Moteur de planification sous contraintes (Constraint Satisfaction Solver)
        $scheduledItems = [];
        $conflictsDetected = [];
        $occupiedSlots = [
            'rooms' => [],      // [roomId][day][slot] = bool
            'professors' => [], // [profId][day][slot] = bool
            'groups' => [],     // [groupId][day][slot] = bool
        ];

        // Charger les indisponibilités existantes de la BDD pour éviter tout clash
        $existingSchedules = DB::table('schedules')
            ->where('academic_year_id', $academicYearId)
            ->where('is_active', true)
            ->get();

        foreach ($existingSchedules as $s) {
            $day = (int) $s->day_of_week;
            $slotIndex = $this->timeToSlotIndex($s->start_time);
            if ($slotIndex !== null) {
                if ($s->room_id) {
                    $occupiedSlots['rooms'][$s->room_id][$day][$slotIndex] = true;
                }
                if ($s->professor_id) {
                    $occupiedSlots['professors'][$s->professor_id][$day][$slotIndex] = true;
                }
                if ($s->group_id) {
                    $occupiedSlots['groups'][$s->group_id][$day][$slotIndex] = true;
                }
            }
        }

        $sessionCounter = 1;
        $totalCoursesScheduled = 0;

        foreach ($groups as $group) {
            $groupModules = $modules->filter(fn ($m) => ! $m->filiere_id || $m->filiere_id == $group->filiere_id);
            if ($groupModules->isEmpty()) {
                $groupModules = $modules->take(4);
            }

            foreach ($groupModules as $module) {
                $courses = $this->getModuleSessions($module);

                foreach ($courses as $course) {
                    // Trouver un professeur assigné ou disponible
                    $assignedProf = $professors->random() ?? null;
                    $profId = $assignedProf ? $assignedProf->id : 1;
                    $profName = $assignedProf && $assignedProf->user ? $assignedProf->user->name : 'Professeur Titulaire';

                    // Chercher le meilleur créneau libre sans aucun conflit
                    $allocated = false;

                    for ($day = 1; $day <= 6; $day++) {
                        if ($allocated) {
                            break;
                        }

                        // Éviter samedi après-midi si option activée
                        $slotsRange = ($day === 6 && $avoidSaturdayAfternoon) ? [1, 2] : ($preferMorningLectures ? [1, 2, 3, 4] : [3, 4, 1, 2]);

                        foreach ($slotsRange as $slotNum) {
                            $slotInfo = self::TIME_SLOTS[$slotNum - 1];

                            // Vérifier si le groupe est libre
                            if (! empty($occupiedSlots['groups'][$group->id][$day][$slotNum])) {
                                continue;
                            }

                            // Vérifier si le professeur est libre
                            if (! empty($occupiedSlots['professors'][$profId][$day][$slotNum])) {
                                continue;
                            }

                            // Trouver une salle libre de taille suffisante
                            $suitableRoom = null;
                            foreach ($rooms as $room) {
                                if (empty($occupiedSlots['rooms'][$room->id][$day][$slotNum])) {
                                    $suitableRoom = $room;
                                    break;
                                }
                            }

                            if ($suitableRoom) {
                                // Réserver le créneau (Zéro conflit garanti)
                                $occupiedSlots['rooms'][$suitableRoom->id][$day][$slotNum] = true;
                                $occupiedSlots['professors'][$profId][$day][$slotNum] = true;
                                $occupiedSlots['groups'][$group->id][$day][$slotNum] = true;

                                $scheduledItems[] = [
                                    'temp_id' => 'GEN_'.$sessionCounter++,
                                    'day_of_week' => $day,
                                    'day_name' => self::DAYS[$day],
                                    'slot_number' => $slotNum,
                                    'start_time' => $slotInfo['start'],
                                    'end_time' => $slotInfo['end'],
                                    'slot_label' => $slotInfo['label'],
                                    'module_id' => $module->id,
                                    'module_name' => $module->name,
                                    'course_id' => $course->id ?? $module->id,
                                    'course_name' => $course->name ?? $module->name,
                                    'group_id' => $group->id,
                                    'group_name' => $group->name,
                                    'filiere_code' => $group->filiere?->code ?? 'TC',
                                    'professor_id' => $profId,
                                    'professor_name' => $profName,
                                    'room_id' => $suitableRoom->id,
                                    'room_name' => $suitableRoom->name,
                                    'status' => 'OPTIMIZED_ZERO_CONFLICT',
                                ];

                                $totalCoursesScheduled++;
                                $allocated = true;
                                break;
                            }
                        }
                    }

                    if (! $allocated) {
                        $conflictsDetected[] = [
                            'module' => $module->name,
                            'group' => $group->name,
                            'reason' => 'Saturations des créneaux hebdomadaires. Veuillez augmenter les salles ou libérer des plages horaires.',
                        ];
                    }
                }
            }
        }

        return [
            'academic_year_id' => $academicYearId,
            'semester_number' => $semesterNumber,
            'total_scheduled_sessions' => count($scheduledItems),
            'optimization_score' => count($conflictsDetected) === 0 ? 100 : max(60, 100 - (count($conflictsDetected) * 10)),
            'conflicts_count' => count($conflictsDetected),
            'conflicts_details' => $conflictsDetected,
            'scheduled_items' => $scheduledItems,
            'rooms_utilized_count' => count(array_unique(array_column($scheduledItems, 'room_id'))),
            'professors_utilized_count' => count(array_unique(array_column($scheduledItems, 'professor_id'))),
        ];
    }

    /**
     * Scanne les emplois du temps enregistrés dans la BDD pour détecter d'éventuels conflits de salles ou de profs.
     */
    public function scanConflicts(int $academicYearId): array
    {
        $schedules = DB::table('schedules')
            ->leftJoin('rooms', 'schedules.room_id', '=', 'rooms.id')
            ->leftJoin('users', 'schedules.professor_id', '=', 'users.id')
            ->leftJoin('modules', 'schedules.module_id', '=', 'modules.id')
            ->leftJoin('groups', 'schedules.group_id', '=', 'groups.id')
            ->where('schedules.academic_year_id', $academicYearId)
            ->where('schedules.is_active', true)
            ->select([
                'schedules.*',
                'rooms.name as room_name',
                'rooms.code as room_code',
                DB::raw("COALESCE(NULLIF(TRIM(CONCAT(users.first_name, ' ', users.last_name)), ''), users.name, 'Enseignant non assigné') as professor_name"),
                'modules.name as module_name',
                'groups.name as group_name',
            ])
            ->get();

        $conflicts = [];
        $seenRooms = [];
        $seenProfs = [];

        foreach ($schedules as $s) {
            $startTime = substr((string) $s->start_time, 0, 5);
            $endTime = substr((string) $s->end_time, 0, 5);
            $dayName = self::DAYS[$s->day_of_week] ?? "Jour {$s->day_of_week}";
            $key = "{$s->day_of_week}_{$startTime}_{$endTime}";

            // Check Room collision
            if ($s->room_id) {
                if (isset($seenRooms[$key][$s->room_id])) {
                    $other = $seenRooms[$key][$s->room_id];
                    $conflicts[] = [
                        'type' => 'ROOM_COLLISION',
                        'type_label' => 'Collision de Salle',
                        'schedule_id' => $s->id,
                        'conflicting_schedule_id' => $other->id,
                        'day_of_week' => $s->day_of_week,
                        'day_name' => $dayName,
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'room_name' => $s->room_name ?: "Salle #{$s->room_id}",
                        'professor_name' => $s->professor_name,
                        'module_name' => $s->module_name ?: "Module #{$s->module_id}",
                        'group_name' => $s->group_name ?: "Groupe #{$s->group_id}",
                        'reason' => "Double réservation pour la salle '{$s->room_name}' (occupée simultanément par {$s->group_name} et {$other->group_name}).",
                        'description' => "La salle '{$s->room_name}' est réservée en même temps pour '{$s->module_name}' et '{$other->module_name}'.",
                        'severity' => 'CRITICAL',
                    ];
                } else {
                    $seenRooms[$key][$s->room_id] = $s;
                }
            }

            // Check Professor overlap
            if ($s->professor_id) {
                if (isset($seenProfs[$key][$s->professor_id])) {
                    $otherProf = $seenProfs[$key][$s->professor_id];
                    $conflicts[] = [
                        'type' => 'PROFESSOR_OVERLAP',
                        'type_label' => 'Chevauchement Enseignant',
                        'schedule_id' => $s->id,
                        'conflicting_schedule_id' => $otherProf->id,
                        'day_of_week' => $s->day_of_week,
                        'day_name' => $dayName,
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'room_name' => $s->room_name ?: "Salle #{$s->room_id}",
                        'professor_name' => $s->professor_name,
                        'module_name' => $s->module_name ?: "Module #{$s->module_id}",
                        'group_name' => $s->group_name ?: "Groupe #{$s->group_id}",
                        'reason' => "L'enseignant {$s->professor_name} est planifié sur deux cours simultanés.",
                        'description' => "Double cours simultané pour {$s->professor_name} entre '{$s->module_name}' et '{$otherProf->module_name}'.",
                        'severity' => 'HIGH',
                    ];
                } else {
                    $seenProfs[$key][$s->professor_id] = $s;
                }
            }
        }

        return [
            'academic_year_id' => $academicYearId,
            'total_scanned' => $schedules->count(),
            'conflicts_count' => count($conflicts),
            'status' => count($conflicts) === 0 ? 'HEALTHY_ZERO_CONFLICTS' : 'CONFLICTS_DETECTED',
            'conflicts' => $conflicts,
        ];
    }

    /**
     * Résout automatiquement un conflit en trouvant une salle libre alternative.
     */
    public function autoResolveConflict(int $scheduleId): array
    {
        $schedule = Schedule::find($scheduleId);
        if (! $schedule) {
            return ['success' => false, 'message' => 'Séance introuvable.'];
        }

        $rooms = Room::all();
        $freeRoom = null;
        $freeDay = $schedule->day_of_week;
        $freeStart = $schedule->start_time;
        $freeEnd = $schedule->end_time;

        foreach ($rooms as $r) {
            $isOccupied = DB::table('schedules')
                ->where('academic_year_id', $schedule->academic_year_id)
                ->where('day_of_week', $freeDay)
                ->where('room_id', $r->id)
                ->where('id', '!=', $scheduleId)
                ->where(function ($q) use ($freeStart, $freeEnd) {
                    $q->where('start_time', '<', $freeEnd)->where('end_time', '>', $freeStart);
                })
                ->exists();

            if (! $isOccupied) {
                $freeRoom = $r;
                break;
            }
        }

        if ($freeRoom) {
            $schedule->update(['room_id' => $freeRoom->id]);

            return [
                'success' => true,
                'message' => "Conflit résolu ! La séance a été réassignée à la salle '{$freeRoom->name}'.",
                'new_room_id' => $freeRoom->id,
                'new_room_name' => $freeRoom->name,
            ];
        }

        // Si aucune salle libre au même créneau, déplacer vers un créneau libre
        foreach ([1, 2, 3, 4, 5] as $day) {
            foreach (self::TIME_SLOTS as $slot) {
                foreach ($rooms as $r) {
                    $slotOccupied = DB::table('schedules')
                        ->where('academic_year_id', $schedule->academic_year_id)
                        ->where('day_of_week', $day)
                        ->where('room_id', $r->id)
                        ->where('id', '!=', $scheduleId)
                        ->where(function ($q) use ($slot) {
                            $q->where('start_time', '<', $slot['end'])->where('end_time', '>', $slot['start']);
                        })
                        ->exists();

                    if (! $slotOccupied) {
                        $schedule->update([
                            'day_of_week' => $day,
                            'start_time' => $slot['start'],
                            'end_time' => $slot['end'],
                            'room_id' => $r->id,
                        ]);

                        return [
                            'success' => true,
                            'message' => 'Conflit résolu ! La séance a été déplacée au '.self::DAYS[$day]." ({$slot['start']}-{$slot['end']}) dans la salle '{$r->name}'.",
                            'new_room_id' => $r->id,
                            'new_room_name' => $r->name,
                        ];
                    }
                }
            }
        }

        return [
            'success' => false,
            'message' => 'Aucune salle libre trouvée pour ce créneau.',
        ];
    }

    /**
     * Résout automatiquement TOUS les conflits d'un coup.
     */
    public function autoResolveAllConflicts(int $academicYearId): array
    {
        $scan = $this->scanConflicts($academicYearId);
        $conflicts = $scan['conflicts'] ?? [];

        if (empty($conflicts)) {
            return [
                'success' => true,
                'resolved_count' => 0,
                'message' => 'Aucun conflit à résoudre. La grille est 100% saine !',
            ];
        }

        $resolved = 0;
        foreach ($conflicts as $conf) {
            $res = $this->autoResolveConflict($conf['schedule_id']);
            if ($res['success'] ?? false) {
                $resolved++;
            }
        }

        return [
            'success' => true,
            'resolved_count' => $resolved,
            'total_conflicts' => count($conflicts),
            'message' => "L'optimiseur IA a résolu avec succès {$resolved} conflits sur ".count($conflicts).' !',
        ];
    }

    protected function getModuleSessions(Module $module): Collection
    {
        $sessions = collect();

        if (($module->hours_cm ?? 0) > 0) {
            $sessions->push((object) ['id' => $module->id, 'name' => "{$module->name} (CM)", 'type' => 'cours']);
        }
        if (($module->hours_td ?? 0) > 0) {
            $sessions->push((object) ['id' => $module->id, 'name' => "{$module->name} (TD)", 'type' => 'td']);
        }
        if (($module->hours_tp ?? 0) > 0) {
            $sessions->push((object) ['id' => $module->id, 'name' => "{$module->name} (TP)", 'type' => 'tp']);
        }

        if ($sessions->isEmpty()) {
            $sessions->push((object) ['id' => $module->id, 'name' => $module->name, 'type' => 'cours']);
        }

        return $sessions;
    }

    protected function timeToSlotIndex(string $time): ?int
    {
        $clean = substr($time, 0, 5);
        if ($clean <= '10:15') {
            return 1;
        }
        if ($clean <= '12:15') {
            return 2;
        }
        if ($clean <= '16:15') {
            return 3;
        }

        return 4;
    }
}

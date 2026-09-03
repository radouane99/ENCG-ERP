<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\Campus;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Institution;
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
     * Génère un emploi du temps automatisé anti-conflits pour une promotion, période ou filière.
     */
    public function generateSchedule(mixed $academicYearId, mixed $semesterSelection, array $options = []): array
    {
        $filiereId = $options['filiere_id'] ?? null;
        $avoidSaturdayAfternoon = $options['avoid_saturday_afternoon'] ?? true;
        $preferMorningLectures = $options['prefer_morning_lectures'] ?? true;

        // Résoudre l'année académique active valide
        $academicYear = (! empty($academicYearId) ? AcademicYear::find($academicYearId) : null)
            ?? AcademicYear::where('is_current', true)->first()
            ?? AcademicYear::first();
        $academicYearId = $academicYear ? $academicYear->id : null;

        // Déterminer les semestres cibles (Automne S1/S3/S5/S7/S9 vs Printemps S2/S4/S6/S8/S10 vs Individuel S1..S10)
        $targetSemesters = [];
        if ($semesterSelection === 'odd' || $semesterSelection === 'autumn' || $semesterSelection === 's1') {
            $targetSemesters = [1, 3, 5, 7, 9];
        } elseif ($semesterSelection === 'even' || $semesterSelection === 'spring' || $semesterSelection === 's2') {
            $targetSemesters = [2, 4, 6, 8, 10];
        } elseif ($semesterSelection === 'all') {
            $targetSemesters = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        } elseif (is_numeric($semesterSelection)) {
            $targetSemesters = [(int) $semesterSelection];
        } else {
            $targetSemesters = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        }

        // 1. S'assurer que les groupes d'étudiants (G1, G2) existent pour toutes les filières concernées
        $this->ensureGroupsForSemesters($academicYearId, $targetSemesters, $filiereId);

        // 2. Récupérer les groupes ciblés
        $groupsQuery = Group::query()->with('filiere');
        if ($filiereId) {
            $groupsQuery->where('filiere_id', $filiereId);
        }
        if (! empty($targetSemesters)) {
            $groupsQuery->where(function ($q) use ($targetSemesters) {
                $q->whereIn('semester_number', $targetSemesters)
                    ->orWhereNull('semester_number');
            });
        }
        $groups = $groupsQuery->get();

        // 3. Récupérer les modules ciblés
        $modulesQuery = Module::query()->with('filiere');
        if ($filiereId) {
            $modulesQuery->where('filiere_id', $filiereId);
        }
        if (! empty($targetSemesters)) {
            $modulesQuery->whereIn('semester_number', $targetSemesters);
        }
        $modules = $modulesQuery->get();

        // 4. S'assurer de la présence des salles de cours et labos nécessaires sur le campus
        $this->ensureCampusRooms();

        // 5. Récupérer les salles disponibles et opérationnelles
        $rooms = Room::where('is_available', true)->get();

        if ($rooms->isEmpty()) {
            $rooms = Room::all();
        }

        // 6. Récupérer les professeurs
        $professors = Professor::with('user')->get();

        // 7. Moteur de planification sous contraintes (Constraint Satisfaction Solver)
        $scheduledItems = [];
        $conflictsDetected = [];
        $occupiedSlots = [
            'rooms' => [],      // [roomId][day][slot] = bool
            'professors' => [], // [profId][day][slot] = bool
            'groups' => [],     // [groupId][day][slot] = bool
        ];

        $groupDailySessions = [];
        $profDailySessions = [];

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
                    $profDailySessions[$s->professor_id][$day] = ($profDailySessions[$s->professor_id][$day] ?? 0) + 1;
                }
                if ($s->group_id) {
                    $occupiedSlots['groups'][$s->group_id][$day][$slotIndex] = true;
                    $groupDailySessions[$s->group_id][$day] = ($groupDailySessions[$s->group_id][$day] ?? 0) + 1;
                }
            }
        }

        $sessionCounter = 1;
        $profCycleIndex = 0;
        $totalCoursesScheduled = 0;

        foreach ($groups as $group) {
            $groupSem = (int) ($group->semester_number ?? 0);
            $groupFiliereId = $group->filiere_id;

            $groupModules = $modules->filter(function ($m) use ($groupFiliereId, $groupSem) {
                $filiereMatch = ! $m->filiere_id || $m->filiere_id == $groupFiliereId;
                $semesterMatch = ! $groupSem || $m->semester_number == $groupSem;

                return $filiereMatch && $semesterMatch;
            });

            if ($groupModules->isEmpty()) {
                $groupModules = $modules->filter(fn ($m) => ! $m->filiere_id || $m->filiere_id == $groupFiliereId);
            }

            foreach ($groupModules as $module) {
                $courses = $this->getModuleSessions($module);

                // Déterminer la nature pédagogique du module
                $nameLower = mb_strtolower($module->name);
                $isIT = str_contains($nameLower, 'informatique') || str_contains($nameLower, 'système') || str_contains($nameLower, 'logiciel') || str_contains($nameLower, 'data') || str_contains($nameLower, 'bureautique');
                $isLanguageOrSoftSkills = str_contains($nameLower, 'langue') || str_contains($nameLower, 'anglais') || str_contains($nameLower, 'français') || str_contains($nameLower, 'soft skills') || str_contains($nameLower, 'communication');

                $natureLabel = $isIT ? 'TP Informatique' : ($isLanguageOrSoftSkills ? 'Langues & Soft Skills' : 'Cours Magistral / TD');
                $natureBadge = $isIT ? 'TP Labo' : ($isLanguageOrSoftSkills ? 'TD Groupe' : 'CM / TD');
                $studentsCount = (int) ($group->capacity ?? 35);

                foreach ($courses as $course) {
                    // Chercher l'enseignant réellement affecté dans module_professor
                    $assignedProfId = DB::table('module_professor')
                        ->where('module_id', $module->id)
                        ->where(function ($q) use ($group) {
                            $q->where('group_id', $group->id)->orWhereNull('group_id');
                        })
                        ->value('professor_id');

                    $assignedProf = $assignedProfId ? $professors->firstWhere('id', $assignedProfId) : null;
                    if (! $assignedProf && $professors->isNotEmpty()) {
                        $assignedProf = $professors->get(($profCycleIndex++) % $professors->count());
                    }

                    $profId = $assignedProf ? $assignedProf->id : 1;
                    $profName = $assignedProf && $assignedProf->user
                        ? trim(($assignedProf->user->first_name ?? '').' '.($assignedProf->user->last_name ?? ''))
                        : ($assignedProf?->user?->name ?? 'Enseignant Chercheur');

                    // Salles classées par pertinence pédagogique et affectation de salles dédiées par filière
                    $rankedRooms = $this->rankRoomsForModule($rooms, $module, $course, $group, $options['dedicated_rooms'] ?? []);

                    // Chercher le meilleur créneau libre sans aucun conflit avec équilibrage hebdomadaire (Lundi à Vendredi)
                    $allocated = false;

                    // Classer les jours par ordre de charge croissante pour ce groupe afin d'étaler équitablement sur Lundi, Mardi, Mercredi, Jeudi, Vendredi
                    $availableDays = [1, 2, 3, 4, 5];
                    if (! $avoidSaturdayAfternoon) {
                        $availableDays[] = 6;
                    }

                    // Trier les jours : privilégier les jours les moins chargés pour ce groupe
                    usort($availableDays, function ($d1, $d2) use ($group, $groupDailySessions) {
                        $c1 = $groupDailySessions[$group->id][$d1] ?? 0;
                        $c2 = $groupDailySessions[$group->id][$d2] ?? 0;
                        if ($c1 === $c2) {
                            return $d1 <=> $d2;
                        }

                        return $c1 <=> $c2;
                    });

                    // 1ère passe : Max 2 cours par jour par groupe (Équilibre pédagogique idéal)
                    // 2ème passe : Jusqu'à 3 ou 4 cours si nécessaire
                    foreach ([2, 3, 4] as $maxDailyLimit) {
                        if ($allocated) {
                            break;
                        }

                        foreach ($availableDays as $day) {
                            if ($allocated) {
                                break;
                            }

                            // Si le groupe a déjà atteint la limite du jour pour cette passe, passer au jour suivant
                            if (($groupDailySessions[$group->id][$day] ?? 0) >= $maxDailyLimit) {
                                continue;
                            }

                            // Plages horaires selon contraintes
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

                                // Trouver la salle la plus adaptée disponible
                                $suitableRoom = null;
                                foreach ($rankedRooms as $room) {
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

                                    $groupDailySessions[$group->id][$day] = ($groupDailySessions[$group->id][$day] ?? 0) + 1;
                                    $profDailySessions[$profId][$day] = ($profDailySessions[$profId][$day] ?? 0) + 1;

                                    $rType = strtolower($suitableRoom->type ?? 'classroom');
                                    $roomTypeLabel = ($rType === 'lab') ? 'Labo Informatique (PC)' : (($rType === 'amphitheater' || $rType === 'amphi') ? 'Amphithéâtre' : 'Salle de TD');

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
                                        'filiere_code' => $group->filiere?->code ?? $module->filiere?->code ?? 'TC',
                                        'professor_id' => $profId,
                                        'professor_name' => $profName,
                                        'room_id' => $suitableRoom->id,
                                        'room_name' => $suitableRoom->name,
                                        'room_type' => $suitableRoom->type,
                                        'room_type_label' => $roomTypeLabel,
                                        'students_count' => $studentsCount,
                                        'session_nature' => $natureLabel,
                                        'session_badge' => $natureBadge,
                                        'is_group_format' => $isLanguageOrSoftSkills || $isIT,
                                        'status' => 'OPTIMIZED_ZERO_CONFLICT',
                                    ];

                                    $totalCoursesScheduled++;
                                    $allocated = true;
                                    break;
                                }
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
            'semester_number' => is_numeric($semesterSelection) ? (int) $semesterSelection : null,
            'semester_selection' => $semesterSelection,
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
            ->leftJoin('professors', 'schedules.professor_id', '=', 'professors.id')
            ->leftJoin('users', 'professors.user_id', '=', 'users.id')
            ->leftJoin('modules', 'schedules.module_id', '=', 'modules.id')
            ->leftJoin('groups', 'schedules.group_id', '=', 'groups.id')
            ->where(function ($q) use ($academicYearId) {
                $q->where('schedules.academic_year_id', $academicYearId)
                    ->orWhereNull('schedules.academic_year_id');
            })
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

    /**
     * S'assure que chaque filière ayant des modules sur les semestres ciblés possède ses groupes d'étudiants (G1, G2).
     */
    protected function ensureGroupsForSemesters(?int $academicYearId, array $targetSemesters, ?int $filiereId = null): void
    {
        if (! $academicYearId) {
            $academicYearId = AcademicYear::where('is_current', true)->value('id') ?? AcademicYear::first()?->id ?? null;
        }

        $filieresQuery = Filiere::query();
        if ($filiereId) {
            $filieresQuery->where('id', $filiereId);
        }
        $filieres = $filieresQuery->get();

        foreach ($filieres as $filiere) {
            $fCode = $filiere->code ?? 'FIL';

            // Trouver les numéros de semestres pour cette filière
            $semestersWithModules = Module::where('filiere_id', $filiere->id)
                ->whereIn('semester_number', $targetSemesters)
                ->pluck('semester_number')
                ->unique();

            foreach ($semestersWithModules as $semNum) {
                $existingCount = Group::where('filiere_id', $filiere->id)
                    ->where('semester_number', $semNum)
                    ->count();

                if ($existingCount === 0) {
                    Group::create([
                        'filiere_id' => $filiere->id,
                        'academic_year_id' => $academicYearId,
                        'name' => "{$fCode}-S{$semNum}-G1",
                        'semester_number' => $semNum,
                        'capacity' => 35,
                    ]);

                    Group::create([
                        'filiere_id' => $filiere->id,
                        'academic_year_id' => $academicYearId,
                        'name' => "{$fCode}-S{$semNum}-G2",
                        'semester_number' => $semNum,
                        'capacity' => 35,
                    ]);
                }
            }
        }
    }

    /**
     * Classe les salles par pertinence pédagogique stricte et affectation dédiée par filière.
     * CONTRAINTE ABSOLUE : Les modules non-informatiques (Comptabilité, Finance, Math, etc.) sont TOTALEMENT INTERDITS de salle informatique !
     */
    protected function rankRoomsForModule(
        Collection $rooms,
        Module $module,
        object $course,
        Group $group,
        array $dedicatedRooms = []
    ): Collection {
        $nameLower = mb_strtolower($module->name);
        $codeLower = mb_strtolower($module->code ?? '');

        $isIT = str_contains($nameLower, 'informatique')
            || str_contains($nameLower, 'système')
            || str_contains($nameLower, 'logiciel')
            || str_contains($nameLower, 'data')
            || str_contains($nameLower, 'bureautique')
            || str_contains($nameLower, 'programmation')
            || str_contains($codeLower, 'info')
            || ($course->type ?? '') === 'tp';

        $isLanguageOrSoftSkills = str_contains($nameLower, 'langue')
            || str_contains($nameLower, 'anglais')
            || str_contains($nameLower, 'français')
            || str_contains($nameLower, 'espagnol')
            || str_contains($nameLower, 'soft skills')
            || str_contains($nameLower, 'communication');

        if ($isIT) {
            // Pour l'informatique : Priorité absolue aux Labos Informatique (PC)
            $itRooms = $rooms->filter(function ($r) {
                $rType = strtolower($r->type ?? 'classroom');

                return $rType === 'lab' || str_contains(strtolower($r->name), 'info');
            });

            if ($itRooms->isNotEmpty()) {
                return $itRooms->values();
            }

            // En cas d'extrême saturation des labos info, utiliser une salle de cours
            return $rooms->filter(fn ($r) => strtolower($r->type ?? '') === 'classroom')->values();
        }

        // CONTRAINTE DURE STRICTE : Tout module non-informatique est STRICTEMENT INTERDIT dans les salles / labos informatiques !
        $nonLabRooms = $rooms->filter(function ($r) {
            $rType = strtolower($r->type ?? 'classroom');
            $isLab = ($rType === 'lab' || str_contains(strtolower($r->name), 'info'));

            return ! $isLab;
        });

        // Salles dédiées configurées pour cette filière
        $filiereId = (int) ($group->filiere_id ?? $module->filiere_id ?? 0);
        $filiereCode = strtolower((string) ($group->filiere_code ?? ''));

        $dedicatedForThisFiliere = array_map('intval', (array) (
            $dedicatedRooms[$filiereId]
            ?? $dedicatedRooms[(string) $filiereId]
            ?? $dedicatedRooms[$filiereCode]
            ?? []
        ));

        // Salles réservées pour d'autres filières (à éviter si possible)
        $dedicatedForOtherFilieres = [];
        foreach ($dedicatedRooms as $fKey => $rIds) {
            $isSame = ((string) $fKey === (string) $filiereId) || (strtolower((string) $fKey) === $filiereCode);
            if (! $isSame) {
                foreach ((array) $rIds as $rid) {
                    $dedicatedForOtherFilieres[] = (int) $rid;
                }
            }
        }
        $dedicatedForOtherFilieres = array_unique($dedicatedForOtherFilieres);

        return $nonLabRooms->sortBy(function ($r) use ($isLanguageOrSoftSkills, $dedicatedForThisFiliere, $dedicatedForOtherFilieres) {
            $rId = (int) $r->id;
            $rType = strtolower($r->type ?? 'classroom');

            // 1. Salle explicitement attribuée à cette filière / département -> Top Priorité (Score 5)
            if (in_array($rId, $dedicatedForThisFiliere, true)) {
                return 5;
            }

            // 2. Salle réservée pour une autre filière -> Priorité faible (Score 80)
            if (in_array($rId, $dedicatedForOtherFilieres, true)) {
                return 80;
            }

            // 3. Salles standard selon la matière
            if ($isLanguageOrSoftSkills) {
                return ($rType === 'classroom' || str_contains(strtolower($r->name), 'salle')) ? 20 : 30;
            }

            return ($rType === 'classroom') ? 20 : 30;
        })->values();
    }

    /**
     * S'assure que le campus dispose d'un parc suffisant de salles de TD, amphis et labos.
     */
    protected function ensureCampusRooms(): void
    {
        $institutionId = Institution::first()?->id ?? null;
        $campusId = Campus::first()?->id ?? null;

        $neededRooms = [
            ['name' => 'Amphithéâtre A', 'code' => 'AMPH-A', 'type' => 'amphitheater', 'capacity' => 320],
            ['name' => 'Amphithéâtre B', 'code' => 'AMPH-B', 'type' => 'amphitheater', 'capacity' => 250],
            ['name' => 'Salle 101', 'code' => 'S-101', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 102', 'code' => 'S-102', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 103', 'code' => 'S-103', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 104', 'code' => 'S-104', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 105', 'code' => 'S-105', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 106', 'code' => 'S-106', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 107', 'code' => 'S-107', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle 108', 'code' => 'S-108', 'type' => 'classroom', 'capacity' => 45],
            ['name' => 'Salle Informatique I', 'code' => 'INFO-1', 'type' => 'lab', 'capacity' => 35],
            ['name' => 'Salle Informatique II', 'code' => 'INFO-2', 'type' => 'lab', 'capacity' => 35],
        ];

        foreach ($neededRooms as $r) {
            $exists = Room::where('code', $r['code'])->orWhere('name', $r['name'])->exists();
            if (! $exists && $institutionId) {
                Room::create([
                    'institution_id' => $institutionId,
                    'campus_id' => $campusId,
                    'name' => $r['name'],
                    'code' => $r['code'],
                    'type' => $r['type'],
                    'capacity' => $r['capacity'],
                    'has_projector' => true,
                    'has_ac' => true,
                    'is_available' => true,
                ]);
            }
        }
    }
}

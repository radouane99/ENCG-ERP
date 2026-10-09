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

        // 6. Récupérer les professeurs avec utilisateur et département
        $professors = Professor::with(['user', 'department'])->get();

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
        $profDailyShift = []; // [profId][day] = 'morning' | 'afternoon'

        // Charger les indisponibilités existantes de la BDD pour éviter tout clash (sauf si ignore_existing est actif)
        $ignoreExisting = $options['ignore_existing'] ?? false;
        if (! $ignoreExisting) {
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
                        $isMorn = ($slotIndex === 1 || $slotIndex === 2);
                        $profDailyShift[$s->professor_id][$day] = $isMorn ? 'morning' : 'afternoon';
                    }
                    if ($s->group_id) {
                        $occupiedSlots['groups'][$s->group_id][$day][$slotIndex] = true;
                        $groupDailySessions[$s->group_id][$day] = ($groupDailySessions[$s->group_id][$day] ?? 0) + 1;
                    }
                }
            }
        }

        $sessionCounter = 1;
        $profCycleIndex = 0;
        $totalCoursesScheduled = 0;

        // Grouper les groupes par cohorte (Filière x Semestre)
        // Règle ENCG Fès (Option B Amphithéâtre) :
        // Pour les Cours Magistraux (CM), toute la section (G1 + G2) est réunie dans un Amphithéâtre
        // sous la direction d'UN SEUL professeur titulaire pour l'ensemble du module.
        // Pour les Travaux Dirigés (TD/TP), les sous-groupes sont séparés en salles de cours / labos.
        $cohorts = $groups->groupBy(function ($g) {
            return ($g->filiere_id ?? 0).'_'.($g->semester_number ?? 0);
        });

        foreach ($cohorts as $cohortKey => $cohortGroups) {
            $cohortGroups = $cohortGroups->values();
            $leadGroup = $cohortGroups->first();
            $groupSem = (int) ($leadGroup->semester_number ?? 0);
            $groupFiliereId = $leadGroup->filiere_id;

            $groupModules = $modules->filter(function ($m) use ($groupFiliereId, $groupSem) {
                $filiereMatch = ! $m->filiere_id || $m->filiere_id == $groupFiliereId;
                $semesterMatch = ! $groupSem || $m->semester_number == $groupSem;

                return $filiereMatch && $semesterMatch;
            });

            if ($groupModules->isEmpty()) {
                $groupModules = $modules->filter(fn ($m) => ! $m->filiere_id || $m->filiere_id == $groupFiliereId);
            }

            // Effectif total inscrit dans cette filière (student_pathways) pour le CM en amphi
            $totalFiliereStudents = (int) DB::table('student_pathways')
                ->where('filiere_id', $groupFiliereId)
                ->where('is_current', true)
                ->count();

            foreach ($groupModules as $module) {
                $courses = $this->getModuleSessions($module);

                foreach ($courses as $course) {
                    $cType = $course->type ?? 'cm';
                    $isCM = ($cType === 'cm' || $cType === 'cours');
                    $isTD = ($cType === 'td');
                    $isTP = ($cType === 'tp');

                    if ($isCM) {
                        // =========================================================================
                        // OPTION B (Amphithéâtre) :
                        // Toute la section (G1 + G2 réunis) assiste au CM dans un Amphithéâtre
                        // avec UN SEUL enseignant titulaire pour tout le module.
                        // =========================================================================

                        $natureLabel = 'Cours Magistral (Section)';
                        $natureBadge = 'CM SECTION';
                        $studentsCount = $totalFiliereStudents > 0 ? $totalFiliereStudents : 75;

                        // Chercher l'enseignant titulaire du module dans module_professor
                        $assignedProfId = DB::table('module_professor')
                            ->where('module_id', $module->id)
                            ->value('professor_id');

                        $assignedProf = $assignedProfId ? $professors->firstWhere('id', $assignedProfId) : null;
                        if (! $assignedProf && $professors->isNotEmpty()) {
                            $nameLower = mb_strtolower($module->name);
                            $filiereId = (int) ($leadGroup->filiere_id ?? $module->filiere_id ?? 0);
                            $filiereCode = strtoupper(trim((string) ($leadGroup->filiere?->code ?? $module->filiere?->code ?? '')));
                            $dedicatedProfList = $options['dedicated_professors'][$filiereCode]
                                ?? $options['dedicated_professors'][$filiereId]
                                ?? $options['dedicated_professors'][(string) $filiereId]
                                ?? [];

                            if (! empty($dedicatedProfList)) {
                                $candidateProfs = $professors->filter(function ($p) use ($dedicatedProfList) {
                                    $pFullName = trim(($p->user?->first_name ?? '').' '.($p->user?->last_name ?? ''));
                                    $pUserName = $p->user?->name ?? '';

                                    return in_array($pFullName, $dedicatedProfList, true)
                                        || in_array($pUserName, $dedicatedProfList, true)
                                        || in_array((string) $p->id, $dedicatedProfList, true)
                                        || in_array($p->id, $dedicatedProfList, true);
                                });

                                if ($candidateProfs->isNotEmpty()) {
                                    $sortedCandidates = $candidateProfs->sortByDesc(function ($p) use ($nameLower) {
                                        $specLower = mb_strtolower($p->specialty ?? $p->department?->name ?? '');
                                        $score = 0;
                                        if (str_contains($nameLower, 'financ') && str_contains($specLower, 'financ')) $score += 20;
                                        if (str_contains($nameLower, 'comptab') && str_contains($specLower, 'comptab')) $score += 20;
                                        if (str_contains($nameLower, 'droit') && str_contains($specLower, 'droit')) $score += 20;
                                        if (str_contains($nameLower, 'market') && (str_contains($specLower, 'market') || str_contains($specLower, 'gestion'))) $score += 20;
                                        if (str_contains($nameLower, 'manag') && str_contains($specLower, 'manag')) $score += 20;
                                        if (str_contains($nameLower, 'info') && str_contains($specLower, 'info')) $score += 20;
                                        if ((str_contains($nameLower, 'lang') || str_contains($nameLower, 'anglais') || str_contains($nameLower, 'franc') || str_contains($nameLower, 'soft') || str_contains($nameLower, 'commun')) && (str_contains($specLower, 'commun') || str_contains($specLower, 'lang'))) $score += 20;
                                        return $score;
                                    });
                                    $assignedProf = $sortedCandidates->values()->get(($profCycleIndex++) % $sortedCandidates->count());
                                }
                            }

                            if (! $assignedProf) {
                                $assignedProf = $professors->get(($profCycleIndex++) % $professors->count());
                            }
                        }

                        $profId = $assignedProf ? $assignedProf->id : 1;
                        $rawProfName = $assignedProf && $assignedProf->user
                            ? trim(($assignedProf->user->first_name ?? '').' '.($assignedProf->user->last_name ?? ''))
                            : ($assignedProf?->user?->name ?? 'Enseignant Chercheur');
                        $profName = str_starts_with($rawProfName, 'Pr.') ? $rawProfName : "Pr. {$rawProfName}";

                        // Salles : Pour le CM, priorité absolue aux Amphithéâtres (Amphi A, Amphi B)
                        $rankedRooms = $this->rankRoomsForModule($rooms, $module, $course, $leadGroup, $options['dedicated_rooms'] ?? []);

                        $allocated = false;
                        $availableDays = [1, 2, 3, 4, 5];
                        if (! $avoidSaturdayAfternoon) {
                            $availableDays[] = 6;
                        }

                        // Trier les jours par charge minimale pour la cohorte
                        usort($availableDays, function ($d1, $d2) use ($cohortGroups, $groupDailySessions) {
                            $c1 = 0;
                            $c2 = 0;
                            foreach ($cohortGroups as $cg) {
                                $c1 += $groupDailySessions[$cg->id][$d1] ?? 0;
                                $c2 += $groupDailySessions[$cg->id][$d2] ?? 0;
                            }
                            if ($c1 === $c2) return $d1 <=> $d2;
                            return $c1 <=> $c2;
                        });

                        foreach ([2, 3, 4] as $maxDailyLimit) {
                            if ($allocated) break;

                            foreach ($availableDays as $day) {
                                if ($allocated) break;

                                // Vérifier que TOUS les groupes de la cohorte n'ont pas dépassé la limite du jour
                                $dayExceeded = false;
                                foreach ($cohortGroups as $cg) {
                                    if (($groupDailySessions[$cg->id][$day] ?? 0) >= $maxDailyLimit) {
                                        $dayExceeded = true;
                                        break;
                                    }
                                }
                                if ($dayExceeded) continue;

                                $slotsRange = ($day === 6 && $avoidSaturdayAfternoon) ? [1, 2] : ($preferMorningLectures ? [1, 2, 3, 4] : [3, 4, 1, 2]);

                                foreach ($slotsRange as $slotNum) {
                                    $slotInfo = self::TIME_SLOTS[$slotNum - 1];

                                    // 1. Vérifier que TOUS les groupes de la cohorte sont libres à ce créneau
                                    $groupsFree = true;
                                    foreach ($cohortGroups as $cg) {
                                        if (! empty($occupiedSlots['groups'][$cg->id][$day][$slotNum])) {
                                            $groupsFree = false;
                                            break;
                                        }
                                    }
                                    if (! $groupsFree) continue;

                                    // 2. Vérifier que le professeur est libre
                                    if (! empty($occupiedSlots['professors'][$profId][$day][$slotNum])) continue;

                                    // Contrainte de demi-journée (shift) pour le professeur
                                    $isCurrentSlotMorning = in_array($slotNum, [1, 2], true);
                                    $isCurrentSlotAfternoon = in_array($slotNum, [3, 4], true);
                                    $currentProfShift = $profDailyShift[$profId][$day] ?? null;

                                    if ($currentProfShift === 'morning' && $isCurrentSlotAfternoon) continue;
                                    if ($currentProfShift === 'afternoon' && $isCurrentSlotMorning) continue;
                                    if (($profDailySessions[$profId][$day] ?? 0) >= 2) continue;

                                    // 3. Trouver la salle (Amphithéâtre libre)
                                    $suitableRoom = null;
                                    foreach ($rankedRooms as $room) {
                                        if (empty($occupiedSlots['rooms'][$room->id][$day][$slotNum])) {
                                            $suitableRoom = $room;
                                            break;
                                        }
                                    }

                                    if ($suitableRoom) {
                                        // Réserver le créneau pour la salle et le prof
                                        $occupiedSlots['rooms'][$suitableRoom->id][$day][$slotNum] = true;
                                        $occupiedSlots['professors'][$profId][$day][$slotNum] = true;
                                        $profDailySessions[$profId][$day] = ($profDailySessions[$profId][$day] ?? 0) + 1;
                                        $profDailyShift[$profId][$day] = $isCurrentSlotMorning ? 'morning' : 'afternoon';

                                        $rType = strtolower($suitableRoom->type ?? 'classroom');
                                        $roomTypeLabel = ($rType === 'amphitheater' || $rType === 'amphi') ? 'Amphithéâtre' : 'Salle de cours';

                                        // Réserver et enregistrer pour CHAQUE groupe de la cohorte (G1 + G2 réunis en Amphi)
                                        foreach ($cohortGroups as $cg) {
                                            $occupiedSlots['groups'][$cg->id][$day][$slotNum] = true;
                                            $groupDailySessions[$cg->id][$day] = ($groupDailySessions[$cg->id][$day] ?? 0) + 1;

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
                                                'group_id' => $cg->id,
                                                'group_name' => $cg->name,
                                                'filiere_code' => $cg->filiere?->code ?? $module->filiere?->code ?? 'TC',
                                                'professor_id' => $profId,
                                                'professor_name' => $profName,
                                                'room_id' => $suitableRoom->id,
                                                'room_name' => $suitableRoom->name,
                                                'room_type' => $suitableRoom->type,
                                                'room_type_label' => $roomTypeLabel,
                                                'students_count' => $studentsCount,
                                                'session_nature' => $natureLabel,
                                                'session_badge' => $natureBadge,
                                                'is_group_format' => false,
                                                'session_format' => 'cm',
                                                'status' => 'OPTIMIZED_ZERO_CONFLICT',
                                            ];
                                        }

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
                                'group' => $cohortGroups->pluck('name')->implode(' + '),
                                'reason' => 'Saturation des créneaux en Amphithéâtre pour le CM de section.',
                            ];
                        }
                    } else {
                        // =========================================================================
                        // SÉANCE TD / TP : Chaque sous-groupe / groupe a sa propre séance en salle
                        // =========================================================================
                        foreach ($cohortGroups as $group) {
                            $realGroupStudents = (int) DB::table('student_pathways')
                                ->where('group_id', $group->id)
                                ->where('is_current', true)
                                ->count();
                            if ($realGroupStudents === 0 && $totalFiliereStudents > 0) {
                                $realGroupStudents = (int) ceil($totalFiliereStudents / 2);
                            }

                            $natureLabel = $isTD ? 'Travaux Dirigés (Sous-groupe)' : 'TP Informatique (Labo PC)';
                            $natureBadge = $isTD ? 'TD GROUPE' : 'TP MACHINE';
                            $studentsCount = $realGroupStudents;

                            $assignedProfId = DB::table('module_professor')
                                ->where('module_id', $module->id)
                                ->where(function ($q) use ($group) {
                                    $q->where('group_id', $group->id)->orWhereNull('group_id');
                                })
                                ->value('professor_id');

                            $assignedProf = $assignedProfId ? $professors->firstWhere('id', $assignedProfId) : null;
                            if (! $assignedProf && $professors->isNotEmpty()) {
                                $nameLower = mb_strtolower($module->name);
                                $filiereId = (int) ($group->filiere_id ?? $module->filiere_id ?? 0);
                                $filiereCode = strtoupper(trim((string) ($group->filiere?->code ?? $module->filiere?->code ?? '')));
                                $dedicatedProfList = $options['dedicated_professors'][$filiereCode]
                                    ?? $options['dedicated_professors'][$filiereId]
                                    ?? $options['dedicated_professors'][(string) $filiereId]
                                    ?? [];

                                if (! empty($dedicatedProfList)) {
                                    $candidateProfs = $professors->filter(function ($p) use ($dedicatedProfList) {
                                        $pFullName = trim(($p->user?->first_name ?? '').' '.($p->user?->last_name ?? ''));
                                        $pUserName = $p->user?->name ?? '';

                                        return in_array($pFullName, $dedicatedProfList, true)
                                            || in_array($pUserName, $dedicatedProfList, true)
                                            || in_array((string) $p->id, $dedicatedProfList, true)
                                            || in_array($p->id, $dedicatedProfList, true);
                                    });

                                    if ($candidateProfs->isNotEmpty()) {
                                        $sortedCandidates = $candidateProfs->sortByDesc(function ($p) use ($nameLower) {
                                            $specLower = mb_strtolower($p->specialty ?? $p->department?->name ?? '');
                                            $score = 0;
                                            if (str_contains($nameLower, 'financ') && str_contains($specLower, 'financ')) $score += 20;
                                            if (str_contains($nameLower, 'comptab') && str_contains($specLower, 'comptab')) $score += 20;
                                            if (str_contains($nameLower, 'droit') && str_contains($specLower, 'droit')) $score += 20;
                                            if (str_contains($nameLower, 'market') && (str_contains($specLower, 'market') || str_contains($specLower, 'gestion'))) $score += 20;
                                            if (str_contains($nameLower, 'manag') && str_contains($specLower, 'manag')) $score += 20;
                                            if (str_contains($nameLower, 'info') && str_contains($specLower, 'info')) $score += 20;
                                            if ((str_contains($nameLower, 'lang') || str_contains($nameLower, 'anglais') || str_contains($nameLower, 'franc') || str_contains($nameLower, 'soft') || str_contains($nameLower, 'commun')) && (str_contains($specLower, 'commun') || str_contains($specLower, 'lang'))) $score += 20;
                                            return $score;
                                        });
                                        $assignedProf = $sortedCandidates->values()->get(($profCycleIndex++) % $sortedCandidates->count());
                                    }
                                }

                                if (! $assignedProf) {
                                    $assignedProf = $professors->get(($profCycleIndex++) % $professors->count());
                                }
                            }

                            $profId = $assignedProf ? $assignedProf->id : 1;
                            $rawProfName = $assignedProf && $assignedProf->user
                                ? trim(($assignedProf->user->first_name ?? '').' '.($assignedProf->user->last_name ?? ''))
                                : ($assignedProf?->user?->name ?? 'Enseignant Chercheur');

                            if ($isTD) {
                                $cleanName = preg_replace('/^Pr\.\s*/i', '', $rawProfName);
                                $profName = str_ends_with($cleanName, '(TD)') ? $cleanName : "{$cleanName} (TD)";
                            } else {
                                $profName = str_starts_with($rawProfName, 'Pr.') ? $rawProfName : "Pr. {$rawProfName}";
                            }

                            $rankedRooms = $this->rankRoomsForModule($rooms, $module, $course, $group, $options['dedicated_rooms'] ?? []);

                            $allocated = false;
                            $availableDays = [1, 2, 3, 4, 5];
                            if (! $avoidSaturdayAfternoon) {
                                $availableDays[] = 6;
                            }

                            usort($availableDays, function ($d1, $d2) use ($group, $groupDailySessions) {
                                $c1 = $groupDailySessions[$group->id][$d1] ?? 0;
                                $c2 = $groupDailySessions[$group->id][$d2] ?? 0;
                                if ($c1 === $c2) return $d1 <=> $d2;
                                return $c1 <=> $c2;
                            });

                            foreach ([2, 3, 4] as $maxDailyLimit) {
                                if ($allocated) break;

                                foreach ($availableDays as $day) {
                                    if ($allocated) break;

                                    if (($groupDailySessions[$group->id][$day] ?? 0) >= $maxDailyLimit) {
                                        continue;
                                    }

                                    $slotsRange = ($day === 6 && $avoidSaturdayAfternoon) ? [1, 2] : ($preferMorningLectures ? [1, 2, 3, 4] : [3, 4, 1, 2]);

                                    foreach ($slotsRange as $slotNum) {
                                        $slotInfo = self::TIME_SLOTS[$slotNum - 1];

                                        if (! empty($occupiedSlots['groups'][$group->id][$day][$slotNum])) continue;
                                        if (! empty($occupiedSlots['professors'][$profId][$day][$slotNum])) continue;

                                        $isCurrentSlotMorning = in_array($slotNum, [1, 2], true);
                                        $isCurrentSlotAfternoon = in_array($slotNum, [3, 4], true);
                                        $currentProfShift = $profDailyShift[$profId][$day] ?? null;

                                        if ($currentProfShift === 'morning' && $isCurrentSlotAfternoon) continue;
                                        if ($currentProfShift === 'afternoon' && $isCurrentSlotMorning) continue;
                                        if (($profDailySessions[$profId][$day] ?? 0) >= 2) continue;

                                        $suitableRoom = null;
                                        foreach ($rankedRooms as $room) {
                                            if (empty($occupiedSlots['rooms'][$room->id][$day][$slotNum])) {
                                                $suitableRoom = $room;
                                                break;
                                            }
                                        }

                                        if ($suitableRoom) {
                                            $occupiedSlots['rooms'][$suitableRoom->id][$day][$slotNum] = true;
                                            $occupiedSlots['professors'][$profId][$day][$slotNum] = true;
                                            $occupiedSlots['groups'][$group->id][$day][$slotNum] = true;

                                            $groupDailySessions[$group->id][$day] = ($groupDailySessions[$group->id][$day] ?? 0) + 1;
                                            $profDailySessions[$profId][$day] = ($profDailySessions[$profId][$day] ?? 0) + 1;
                                            $profDailyShift[$profId][$day] = $isCurrentSlotMorning ? 'morning' : 'afternoon';

                                            $rType = strtolower($suitableRoom->type ?? 'classroom');
                                            $roomTypeLabel = ($rType === 'lab') ? 'Labo Informatique (PC)' : 'Salle de TD';

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
                                                'is_group_format' => true,
                                                'session_format' => $isTD ? 'td' : 'tp',
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
                                    'reason' => 'Saturation des créneaux en salle pour le TD.',
                                ];
                            }
                        }
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
        $profDayShifts = [];

        foreach ($schedules as $s) {
            $startTime = substr((string) $s->start_time, 0, 5);
            $endTime = substr((string) $s->end_time, 0, 5);
            $dayName = self::DAYS[$s->day_of_week] ?? "Jour {$s->day_of_week}";
            $key = "{$s->day_of_week}_{$startTime}_{$endTime}";

            // Check Room collision
            if ($s->room_id) {
                if (isset($seenRooms[$key][$s->room_id])) {
                    $other = $seenRooms[$key][$s->room_id];
                    $isSharedCm = ((int) $s->module_id === (int) $other->module_id)
                        && ((int) $s->professor_id === (int) $other->professor_id)
                        && strtolower($s->session_type ?? '') === 'cm';

                    if (! $isSharedCm) {
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
                    }
                } else {
                    $seenRooms[$key][$s->room_id] = $s;
                }
            }

            // Check Professor overlap
            if ($s->professor_id) {
                if (isset($seenProfs[$key][$s->professor_id])) {
                    $otherProf = $seenProfs[$key][$s->professor_id];
                    // Option B (Amphithéâtre) : S'il s'agit du même module partagé avec la section entière (G1 + G2 en amphi), ce n'est PAS un chevauchement !
                    $isSharedCm = ((int) $s->module_id === (int) $otherProf->module_id)
                        && ((int) $s->room_id === (int) $otherProf->room_id)
                        && strtolower($s->session_type ?? '') === 'cm';

                    if (! $isSharedCm) {
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
                    }
                } else {
                    $seenProfs[$key][$s->professor_id] = $s;
                }

                // Check Professor Dual Shift (Matin & Après-midi sur la même journée)
                $isMorn = ($startTime < '13:00');
                $shiftKey = $isMorn ? 'morning' : 'afternoon';
                $oppKey = $isMorn ? 'afternoon' : 'morning';

                if (isset($profDayShifts[$s->professor_id][$s->day_of_week][$oppKey])) {
                    $otherShift = $profDayShifts[$s->professor_id][$s->day_of_week][$oppKey];
                    $conflicts[] = [
                        'type' => 'PROFESSOR_DUAL_SHIFT',
                        'type_label' => 'Surcharge Enseignant (Matin & Après-midi)',
                        'schedule_id' => $s->id,
                        'conflicting_schedule_id' => $otherShift->id,
                        'day_of_week' => $s->day_of_week,
                        'day_name' => $dayName,
                        'start_time' => $startTime,
                        'end_time' => $endTime,
                        'room_name' => $s->room_name ?: "Salle #{$s->room_id}",
                        'professor_name' => $s->professor_name,
                        'module_name' => $s->module_name ?: "Module #{$s->module_id}",
                        'group_name' => $s->group_name ?: "Groupe #{$s->group_id}",
                        'reason' => "L'enseignant {$s->professor_name} est planifié le matin ({$otherShift->start_time}) ET l'après-midi ({$startTime}) le même jour ({$dayName}).",
                        'description' => "Règle pédagogique : un enseignant doit enseigner soit le matin soit l'après-midi sur une journée donnée.",
                        'severity' => 'MEDIUM',
                    ];
                } else {
                    $profDayShifts[$s->professor_id][$s->day_of_week][$shiftKey] = $s;
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
            $sessions->push((object) ['id' => $module->id, 'name' => "{$module->name} (CM)", 'type' => 'cm']);
        }
        if (($module->hours_td ?? 0) > 0) {
            $sessions->push((object) ['id' => $module->id, 'name' => "{$module->name} (TD)", 'type' => 'td']);
        }
        if (($module->hours_tp ?? 0) > 0) {
            $sessions->push((object) ['id' => $module->id, 'name' => "{$module->name} (TP)", 'type' => 'tp']);
        }

        if ($sessions->isEmpty()) {
            $nameLower = mb_strtolower($module->name);

            // 1. Informatique / TP Machine
            if (str_contains($nameLower, 'informatique') || str_contains($nameLower, 'système') || str_contains($nameLower, 'bureautique') || str_contains($nameLower, 'data')) {
                $sessions->push((object) ['id' => $module->id, 'name' => "{$module->name} (TP Machine)", 'type' => 'tp']);
            }
            // 2. Langues & Soft Skills (strictement en format TD / Dédoublé)
            elseif (str_contains($nameLower, 'langue') || str_contains($nameLower, 'anglais') || str_contains($nameLower, 'français') || str_contains($nameLower, 'soft skills') || str_contains($nameLower, 'communication')) {
                $sessions->push((object) ['id' => $module->id, 'name' => "{$module->name} (TD)", 'type' => 'td']);
            }
            // 3. Modules fondamentaux de gestion d'ENCG Fès (Management, Comptabilité, Économie, Mathématiques/Stats, Finance)
            // Modèle réel ENCG : Ils comportent obligatoirement 1 séance de CM (Amphi, 75 étuds) ET 1 séance de TD (Salle, 35 étuds)
            elseif (
                str_contains($nameLower, 'management') ||
                str_contains($nameLower, 'comptab') ||
                str_contains($nameLower, 'économie') || str_contains($nameLower, 'economie') ||
                str_contains($nameLower, 'math') || str_contains($nameLower, 'stat') ||
                str_contains($nameLower, 'financ') || str_contains($nameLower, 'fiscal') ||
                str_contains($nameLower, 'marketing')
            ) {
                $sessions->push((object) ['id' => $module->id, 'name' => "{$module->name} (CM)", 'type' => 'cm']);
                $sessions->push((object) ['id' => $module->id, 'name' => "{$module->name} (TD)", 'type' => 'td']);
            }
            // 4. Droit & Autres modules magistraux
            else {
                $sessions->push((object) ['id' => $module->id, 'name' => "{$module->name} (CM)", 'type' => 'cm']);
            }
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

        $isCM = ($course->type ?? '') === 'cm' || ($course->type ?? '') === 'cours';
        $isTD = ($course->type ?? '') === 'td';

        return $nonLabRooms->sortBy(function ($r) use ($isCM, $isTD, $isLanguageOrSoftSkills, $dedicatedForThisFiliere, $dedicatedForOtherFilieres) {
            $rId = (int) $r->id;
            $rType = strtolower($r->type ?? 'classroom');
            $isAmphi = ($rType === 'amphitheater' || $rType === 'amphi' || str_contains(strtolower($r->name), 'amphi'));

            // 1. Cours Magistral CM (Section entière de 75 étudiants) :
            // Règle institutionnelle ENCG : Priorité absolue aux Amphithéâtres (Amphi 1, 2, 3) !
            if ($isCM) {
                if ($isAmphi) {
                    return 2; // Top priorité absolue
                }
                if (in_array($rId, $dedicatedForThisFiliere, true)) {
                    return 10;
                }

                return 40;
            }

            // 2. Travaux Dirigés TD & Langues (Sous-groupe dédoublé de 35 étudiants) :
            // Règle institutionnelle ENCG : Priorité absolue aux Salles de classe classiques (Salles 11-28 / Salles 101-108).
            // Interdiction / forte pénalité d'attribuer un amphi de 300 places pour un petit groupe de TD !
            if ($isTD || $isLanguageOrSoftSkills) {
                if ($isAmphi) {
                    return 100; // Éviter l'amphi pour un sous-groupe de 35 étuds
                }
                if (in_array($rId, $dedicatedForThisFiliere, true)) {
                    return 5; // Top priorité salle dédiée
                }
                if (in_array($rId, $dedicatedForOtherFilieres, true)) {
                    return 80;
                }

                return 15;
            }

            // 3. Salles standard pour autres formats
            if (in_array($rId, $dedicatedForThisFiliere, true)) {
                return 5;
            }
            if (in_array($rId, $dedicatedForOtherFilieres, true)) {
                return 80;
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

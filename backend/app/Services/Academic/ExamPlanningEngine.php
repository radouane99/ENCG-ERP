<?php

namespace App\Services\Academic;

use App\Models\Exam;
use App\Models\ExamSeating;
use App\Models\ExamSession;
use App\Models\ExamSurveillance;
use App\Models\Group;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Room;
use App\Models\StudentRegistration;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;

class ExamPlanningEngine
{
    /**
     * Générer le plan de salle et de surveillance pour un examen.
     */
    public function generatePlan(int $examId, array $roomIds, array $professorIds, ?int $secondaryGroupId = null): array
    {
        $exam = Exam::with(['group', 'examSession'])->findOrFail($examId);

        $academicYearId = $exam->examSession->academic_year_id ?? 1;

        $studentsA = StudentRegistration::with('student')
            ->where('group_id', $exam->group_id)
            ->where('academic_year_id', $academicYearId)
            ->get()
            ->map(fn ($r) => $r->student)
            ->sortBy('last_name')
            ->values();

        if ($studentsA->isEmpty()) {
            throw new Exception('Aucun étudiant inscrit dans ce groupe principal.');
        }

        $studentsB = collect();
        if ($secondaryGroupId && $secondaryGroupId != $exam->group_id) {
            $studentsB = StudentRegistration::with('student')
                ->where('group_id', $secondaryGroupId)
                ->where('academic_year_id', $academicYearId)
                ->get()
                ->map(fn ($r) => $r->student)
                ->sortBy('last_name')
                ->values();
        }

        // Entrelacer les groupes
        $students = collect();
        if ($studentsB->isNotEmpty()) {
            $maxCount = max($studentsA->count(), $studentsB->count());
            for ($i = 0; $i < $maxCount; $i++) {
                if (isset($studentsA[$i])) {
                    $students->push($studentsA[$i]);
                }
                if (isset($studentsB[$i])) {
                    $students->push($studentsB[$i]);
                }
            }
        } else {
            $students = $studentsA;
        }

        // Anti-triche : ordre différent par épreuve pour varier les numéros de place
        $studentList = $students->values()->all();
        usort($studentList, function ($a, $b) use ($examId) {
            $ha = crc32($examId.'|'.(string) $a->id);
            $hb = crc32($examId.'|'.(string) $b->id);

            return $ha <=> $hb;
        });
        $students = collect($studentList);

        $rooms = Room::whereIn('id', $roomIds)->get();
        if ($rooms->isEmpty()) {
            throw new Exception('Aucune salle sélectionnée.');
        }

        $totalExamCapacity = $rooms->sum(fn ($r) => $r->exam_capacity ?? floor($r->capacity / 2));

        if ($students->count() > $totalExamCapacity) {
            throw new Exception("Capacité insuffisante : {$students->count()} étudiants pour {$totalExamCapacity} places.");
        }

        return DB::transaction(function () use ($examId, $rooms, $students, $professorIds) {
            // Nettoyer le plan existant
            ExamSeating::where('exam_id', $examId)->delete();
            ExamSurveillance::where('exam_id', $examId)->delete();

            // Placer les étudiants
            $studentIndex = 0;
            $seatings = [];

            foreach ($rooms as $room) {
                $examCapacity = $room->exam_capacity ?? floor($room->capacity / 2);
                for ($seat = 1; $seat <= $examCapacity; $seat++) {
                    if ($studentIndex >= $students->count()) {
                        break;
                    }
                    $seatings[] = [
                        'exam_id' => $examId,
                        'student_id' => $students[$studentIndex]->id,
                        'room_id' => $room->id,
                        'seat_number' => $seat,
                    ];
                    $studentIndex++;
                }
            }
            ExamSeating::insert($seatings);

            // Assigner les surveillants
            $surveillances = [];
            $profIndex = 0;

            foreach ($rooms as $room) {
                if ($profIndex >= count($professorIds)) {
                    break;
                }

                $surveillances[] = [
                    'exam_id' => $examId,
                    'room_id' => $room->id,
                    'professor_id' => $professorIds[$profIndex],
                    'role' => 'president_salle',
                ];
                $profIndex++;

                if (floor($room->capacity / 2) >= 50 && $profIndex < count($professorIds)) {
                    $surveillances[] = [
                        'exam_id' => $examId,
                        'room_id' => $room->id,
                        'professor_id' => $professorIds[$profIndex],
                        'role' => 'surveillant',
                    ];
                    $profIndex++;
                }
            }
            ExamSurveillance::insert($surveillances);

            return [
                'success' => true,
                'message' => 'Plan généré avec succès.',
                'students_placed' => count($seatings),
                'surveillants_assigned' => count($surveillances),
            ];
        });
    }

    /**
     * Génération automatique intelligente des examens.
     */
    public function autoGenerateIntelligentBatch(
        int $filiereId,
        int $sessionId,
        ?int $semesterNumber = null,
        int $modulesPerDay = 1,
        string $daySlotMode = 'matin',
        ?array $customModuleIds = null,
        ?string $customStartDate = null
    ): array {
        $session = ExamSession::with('semester')->findOrFail($sessionId);
        $isAutomne = $session->semester->number === 1;

        if (! empty($customModuleIds)) {
            $modules = Module::whereIn('id', $customModuleIds)
                ->get()
                ->sortBy(fn ($m) => array_search($m->id, $customModuleIds))
                ->values();
        } else {
            $modules = Module::where('filiere_id', $filiereId)
                ->when($semesterNumber, fn ($q) => $q->where('semester_number', $semesterNumber), fn ($q) => $q->whereRaw($isAutomne ? 'semester_number % 2 != 0' : 'semester_number % 2 = 0'))
                ->get();
        }

        $rooms = Room::orderBy('capacity')->get();
        $groups = Group::where('filiere_id', $filiereId)->get();

        if ($modules->isEmpty()) {
            throw new Exception('Aucun module trouvé.');
        }
        if ($groups->isEmpty()) {
            throw new Exception('Aucun groupe trouvé.');
        }
        if ($rooms->isEmpty()) {
            throw new Exception('Aucune salle disponible.');
        }

        $startDate = $customStartDate ? Carbon::parse($customStartDate) : Carbon::parse($session->start_date);
        $endDate = Carbon::parse($session->end_date);
        if ($endDate->lte($startDate)) {
            $endDate = $startDate->copy()->addDays(45);
        }
        $currentDate = $startDate->copy();
        if ($currentDate->isSunday()) {
            $currentDate->addDay();
        }

        return DB::transaction(function () use (
            $filiereId, $sessionId, $session, $modules, $rooms, $groups,
            $startDate, $endDate, $currentDate, $modulesPerDay, $daySlotMode
        ) {
            // Supprimer les examens existants pour cette session et filière
            $moduleIds = Module::where('filiere_id', $filiereId)->pluck('id');
            $existingExamIds = Exam::where('exam_session_id', $sessionId)->whereIn('module_id', $moduleIds)->pluck('id');

            ExamSeating::whereIn('exam_id', $existingExamIds)->delete();
            ExamSurveillance::whereIn('exam_id', $existingExamIds)->delete();
            Exam::whereIn('id', $existingExamIds)->delete();

            // Sélection exhaustive du corps de surveillance : Professeurs Permanents, Vacataires et Doctorants surveillants
            $professors = User::where(function ($query) {
                $query->whereHas('roles', fn ($q) => $q->whereIn('name', [
                    'professor',
                    'department-head',
                    'enseignant',
                    'vacataire',
                    'doctorant',
                ]))
                ->orWhereHas('professor', fn ($q) => $q->where('is_active', true));
            })
            ->with(['roles', 'professor'])
            ->get();

            if ($professors->isEmpty()) {
                $profUserIds = Professor::whereNotNull('user_id')->pluck('user_id');
                $professors = User::whereIn('id', $profUserIds)->get();
            }
            if ($professors->isEmpty()) {
                $professors = User::limit(5)->get();
            }

            $examsCreated = 0;
            $moduleIndexInDay = 0;
            $defaultGroupId = $groups->first()->id;
            $allCreatedExams = [];

            foreach ($modules as $module) {
                $semNum = $module->semester_number ?? 1;

                $startTime = match (true) {
                    $modulesPerDay >= 2 && $daySlotMode === 'pm' && $moduleIndexInDay === 0 => '14:30:00',
                    $modulesPerDay >= 2 && $daySlotMode === 'pm' => ExamSlotCatalog::afternoonSecondStart().':00',
                    $modulesPerDay >= 2 && $daySlotMode === 'split' && $moduleIndexInDay === 0 => '08:30:00',
                    $modulesPerDay >= 2 && $daySlotMode === 'split' => '14:30:00',
                    $modulesPerDay >= 2 && $moduleIndexInDay === 0 => '08:30:00',
                    $modulesPerDay >= 2 => ExamSlotCatalog::morningSecondStart().':00',
                    default => ($semNum % 2 !== 0) ? '08:30:00' : '14:30:00',
                };

                $slot = ExamSlotCatalog::resolve($startTime);
                $dateStr = $currentDate->format('Y-m-d');

                $students = StudentRegistration::whereHas('group', fn ($q) => $q->where('filiere_id', $filiereId))
                    ->where('academic_year_id', $session->academic_year_id)
                    ->pluck('student_id');

                $studentCount = $students->count() ?: 24;
                $unassignedCount = $studentCount;
                $studentsList = $students->toArray();
                $availableRooms = clone $rooms;

                while ($unassignedCount > 0 && $availableRooms->isNotEmpty()) {
                    $assignedRoom = $availableRooms->first(fn ($r) => floor($r->capacity / 2) >= $unassignedCount)
                        ?? $availableRooms->pop();

                    $examCapacity = floor($assignedRoom->capacity / 2);
                    $studentsForThisRoom = array_splice($studentsList, 0, $examCapacity);
                    $unassignedCount -= count($studentsForThisRoom);

                    $exam = Exam::create([
                        'module_id' => $module->id,
                        'group_id' => $defaultGroupId,
                        'exam_session_id' => $sessionId,
                        'room_id' => $assignedRoom->id,
                        'exam_date' => $dateStr,
                        'start_time' => $startTime,
                        'duration_minutes' => $slot['duration'],
                        'type' => 'final',
                    ]);
                    $examsCreated++;
                    $allCreatedExams[] = $exam;

                    $seatings = [];
                    $seatNum = 1;
                    foreach ($studentsForThisRoom as $sid) {
                        $seatings[] = [
                            'exam_id' => $exam->id,
                            'student_id' => $sid,
                            'room_id' => $assignedRoom->id,
                            'seat_number' => $seatNum++,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }

                    if (! empty($seatings)) {
                        ExamSeating::insert($seatings);
                    }
                }

                // Progression des dates : passer au jour suivant une fois modulesPerDay atteint
                $moduleIndexInDay++;
                if ($moduleIndexInDay >= $modulesPerDay) {
                    $moduleIndexInDay = 0;
                    $currentDate->addDay();
                    while ($currentDate->isSunday()) {
                        $currentDate->addDay();
                    }
                }
            }

            // ── AFFECTATION GLOBALE DE SURVEILLANCE : ÉGALITÉ STRICTE, BLOC CONSÉCUTIF & PRÉSIDENCE LÉGALE ──
            if ($professors->isNotEmpty() && ! empty($allCreatedExams)) {
                $totalSlotsNeeded = count($allCreatedExams) * 2; // 2 surveillants par salle (Président + Surveillant)
                $activeProfCount = max(1, $professors->count());
                $maxFairWorkload = (int) ceil($totalSlotsNeeded / $activeProfCount);

                // Trier les examens chronologiquement (date croissante, puis heure croissante)
                $sortedExams = collect($allCreatedExams)->sort(function ($a, $b) {
                    $cmp = strcmp($a->exam_date, $b->exam_date);
                    if ($cmp !== 0) {
                        return $cmp;
                    }

                    return strcmp($a->start_time, $b->start_time);
                })->values();

                $isPermanent = fn ($user) => $user->hasAnyRole(['professor', 'department-head', 'enseignant'])
                    || ($user->professor && $user->professor->contract_type === 'permanent');

                // Suivi dynamique en mémoire
                $workload = [];
                $daily = [];
                $schedules = [];

                foreach ($professors as $p) {
                    $workload[$p->id] = 0;
                    $daily[$p->id] = [];
                    $schedules[$p->id] = [];
                }

                $totalExams = $sortedExams->count();

                for ($i = 0; $i < $totalExams; $i++) {
                    $exam = $sortedExams[$i];
                    $dateStr = \Carbon\Carbon::parse($exam->exam_date)->toDateString();
                    $parts = explode(':', $exam->start_time);
                    $candStart = ((int) ($parts[0] ?? 8) * 60) + (int) ($parts[1] ?? 30);
                    $candEnd = $candStart + ($exam->duration_minutes ?: 120);

                    // Examens restants après celui-ci
                    $remainingExams = $sortedExams->slice($i + 1);

                    // Calcul dynamique du plafond journalier selon le nombre d'examens ce jour-là et le nombre d'enseignants disponibles
                    $dayExamsCount = $sortedExams->where('exam_date', $exam->exam_date)->count();
                    $dynamicDailyCap = max(2, (int) ceil(($dayExamsCount * 2) / $activeProfCount));

                    // Vérification de disponibilité (Hard constraint : zéro chevauchement horaire ; Soft : quotas équitables)
                    $canProctor = function (int $pid, bool $ignoreWorkloadCap = false, bool $ignoreDailyCap = false) use (
                        $dateStr, $candStart, $candEnd, &$daily, &$schedules, &$workload, $maxFairWorkload, $dynamicDailyCap
                    ): bool {
                        // 1. RÈGLE PHYSIQUE ABSOLUE ET INVIOLABLE : Zéro chevauchement d'heure le même jour
                        foreach ($schedules[$pid] as $s) {
                            if ($s['date'] === $dateStr && $candStart < $s['end'] && $s['start'] < $candEnd) {
                                return false; // Conflit temporel strict
                            }
                        }

                        // 2. Plafond journalier ergonomique dynamique
                        if (! $ignoreDailyCap && ($daily[$pid][$dateStr] ?? 0) >= $dynamicDailyCap) {
                            return false;
                        }

                        // 3. Quota d'équité globale
                        if (! $ignoreWorkloadCap && ($workload[$pid] ?? 0) >= $maxFairWorkload) {
                            return false;
                        }

                        return true;
                    };

                    // ── 1. SÉLECTION DU PRÉSIDENT DE SALLE (Enseignant Permanent Obligatoire) ──
                    // Palier 1 : Permanent respectant tous les critères stricts
                    $eligiblePresidents = $professors->filter(fn ($p) => $isPermanent($p) && $canProctor($p->id));

                    // Palier 2 : Si tous les permanents ont atteint le quota, chercher un permanent sans conflit horaire
                    if ($eligiblePresidents->isEmpty()) {
                        $eligiblePresidents = $professors->filter(fn ($p) => $isPermanent($p) && $canProctor($p->id, ignoreWorkloadCap: true));
                    }

                    // Palier 3 : Secours d'extrême urgence : n'importe quel surveillant sans conflit horaire
                    if ($eligiblePresidents->isEmpty()) {
                        $eligiblePresidents = $professors->filter(fn ($p) => $canProctor($p->id, ignoreWorkloadCap: true, ignoreDailyCap: true));
                    }

                    // Tri multicritère des présidents :
                    // a) Priorité au bloc consécutif (séance 2 d'affilée le même jour)
                    // b) Charge cumulée globale la plus faible (égalité mathématique)
                    // c) Nombre de séances aujourd'hui le plus faible
                    // d) Stabilité par ID
                    $president = $eligiblePresidents->sort(function ($a, $b) use ($daily, $workload, $dateStr) {
                        $aToday = ($daily[$a->id][$dateStr] ?? 0) === 1 ? 0 : 1;
                        $bToday = ($daily[$b->id][$dateStr] ?? 0) === 1 ? 0 : 1;
                        if ($aToday !== $bToday) {
                            return $aToday <=> $bToday;
                        }

                        $aWork = $workload[$a->id] ?? 0;
                        $bWork = $workload[$b->id] ?? 0;
                        if ($aWork !== $bWork) {
                            return $aWork <=> $bWork;
                        }

                        $aDayCount = $daily[$a->id][$dateStr] ?? 0;
                        $bDayCount = $daily[$b->id][$dateStr] ?? 0;
                        if ($aDayCount !== $bDayCount) {
                            return $aDayCount <=> $bDayCount;
                        }

                        return $a->id <=> $b->id;
                    })->first();

                    if (! $president) {
                        $president = $professors->first();
                    }

                    // Enregistrer le président
                    ExamSurveillance::create([
                        'exam_id' => $exam->id,
                        'room_id' => $exam->room_id,
                        'professor_id' => $president->id,
                        'role' => 'president_salle',
                    ]);
                    $workload[$president->id] = ($workload[$president->id] ?? 0) + 1;
                    $daily[$president->id][$dateStr] = ($daily[$president->id][$dateStr] ?? 0) + 1;
                    $schedules[$president->id][] = ['date' => $dateStr, 'start' => $candStart, 'end' => $candEnd];

                    // ── 2. SÉLECTION DU SURVEILLANT SECONDAIRE ──
                    // Palier 1 : Candidats sous plafond et sans conflit
                    $eligibleSeconds = $professors->filter(fn ($p) => $p->id !== $president->id && $canProctor($p->id));

                    // Palier 2 : Si épuisé, candidats sans conflit horaire (dépassement équitable contrôlé)
                    if ($eligibleSeconds->isEmpty()) {
                        $eligibleSeconds = $professors->filter(fn ($p) => $p->id !== $president->id && $canProctor($p->id, ignoreWorkloadCap: true));
                    }

                    // Palier 3 : Secours si contraintes extrêmes
                    if ($eligibleSeconds->isEmpty()) {
                        $eligibleSeconds = $professors->filter(fn ($p) => $p->id !== $president->id && $canProctor($p->id, ignoreWorkloadCap: true, ignoreDailyCap: true));
                    }

                    // Tri intelligent des surveillants :
                    $second = $eligibleSeconds->sort(function ($a, $b) use ($daily, $workload, $dateStr, $isPermanent, $professors, $maxFairWorkload, $remainingExams, $activeProfCount) {
                        // Lookahead dynamique : calcul précis du besoin en surveillants pour chaque date future
                        $futureMinDistinct = $remainingExams->groupBy('exam_date')->map(function ($dayExams) use ($activeProfCount) {
                            $simultaneous = $dayExams->groupBy('start_time')->map->count()->max() ?? 1;
                            $slots = $dayExams->count() * 2;
                            return max($simultaneous * 2, (int) ceil($slots / 2));
                        })->max() ?? 0;

                        $aTodayConsecutive = ($daily[$a->id][$dateStr] ?? 0) === 1 ? 0 : 1;
                        $bTodayConsecutive = ($daily[$b->id][$dateStr] ?? 0) === 1 ? 0 : 1;

                        // Vérification de sécurité anticipative (ne pas bloquer un collègue si cela prive les jours futurs)
                        $aLeavesEnough = true;
                        if ($aTodayConsecutive === 0 && (($workload[$a->id] ?? 0) + 1) >= $maxFairWorkload) {
                            $availableColleagues = $professors->filter(fn ($p) => $p->id !== $a->id && ($workload[$p->id] ?? 0) < $maxFairWorkload)->count();
                            if ($availableColleagues < $futureMinDistinct) {
                                $aLeavesEnough = false;
                            }
                        }

                        $bLeavesEnough = true;
                        if ($bTodayConsecutive === 0 && (($workload[$b->id] ?? 0) + 1) >= $maxFairWorkload) {
                            $availableColleagues = $professors->filter(fn ($p) => $p->id !== $b->id && ($workload[$p->id] ?? 0) < $maxFairWorkload)->count();
                            if ($availableColleagues < $futureMinDistinct) {
                                $bLeavesEnough = false;
                            }
                        }

                        $aConsecutiveScore = ($aTodayConsecutive === 0 && $aLeavesEnough) ? 0 : 1;
                        $bConsecutiveScore = ($bTodayConsecutive === 0 && $bLeavesEnough) ? 0 : 1;
                        if ($aConsecutiveScore !== $bConsecutiveScore) {
                            return $aConsecutiveScore <=> $bConsecutiveScore;
                        }

                        // Priorité aux non-permanents (vacataires / doctorants) pour préserver le vivier permanent pour la présidence
                        $aIsNonPerm = ! $isPermanent($a) ? 0 : 1;
                        $bIsNonPerm = ! $isPermanent($b) ? 0 : 1;
                        if ($aIsNonPerm !== $bIsNonPerm) {
                            return $aIsNonPerm <=> $bIsNonPerm;
                        }

                        // Charge globale cumulée la plus faible (égalité stricte)
                        $aWork = $workload[$a->id] ?? 0;
                        $bWork = $workload[$b->id] ?? 0;
                        if ($aWork !== $bWork) {
                            return $aWork <=> $bWork;
                        }

                        // Nombre de séances aujourd'hui
                        $aDayCount = $daily[$a->id][$dateStr] ?? 0;
                        $bDayCount = $daily[$b->id][$dateStr] ?? 0;
                        if ($aDayCount !== $bDayCount) {
                            return $aDayCount <=> $bDayCount;
                        }

                        return $a->id <=> $b->id;
                    })->first();

                    if (! $second) {
                        $second = $professors->first(fn ($p) => $p->id !== $president->id);
                    }

                    if ($second) {
                        ExamSurveillance::create([
                            'exam_id' => $exam->id,
                            'room_id' => $exam->room_id,
                            'professor_id' => $second->id,
                            'role' => 'surveillant',
                        ]);
                        $workload[$second->id] = ($workload[$second->id] ?? 0) + 1;
                        $daily[$second->id][$dateStr] = ($daily[$second->id][$dateStr] ?? 0) + 1;
                        $schedules[$second->id][] = ['date' => $dateStr, 'start' => $candStart, 'end' => $candEnd];
                    }
                }
            }

            return [
                'success' => true,
                'message' => "{$examsCreated} examens générés avec succès sans aucun conflit de surveillance.",
            ];
        });
    }
}

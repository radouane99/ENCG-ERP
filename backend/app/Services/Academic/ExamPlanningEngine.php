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
        app(ExamWorkflowGuard::class)->manage();
        $exam = Exam::with(['group', 'examSession'])->findOrFail($examId);
        app(ExamWorkflowGuard::class)->mutablePlan($exam);

        $academicYearId = $exam->examSession->academic_year_id;

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
            Group::where('academic_year_id', $academicYearId)->where('filiere_id', $exam->group->filiere_id)->where('semester_number', $exam->group->semester_number)->findOrFail($secondaryGroupId);
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

        $rooms = Room::where('institution_id', $exam->examSession->institution_id)->where('is_available', true)->whereIn('id', $roomIds)->get();
        abort_unless($rooms->count() === count(array_unique($roomIds)), 422, 'Une salle est indisponible ou hors établissement.');
        $professorIds = array_values(array_unique($professorIds));
        $proctors = User::where('institution_id', $exam->examSession->institution_id)->where('is_active', true)->whereIn('id', $professorIds)->get();
        abort_unless($proctors->count() === count($professorIds) && $proctors->every(fn ($p) => $p->hasAnyRole(['professor', 'vacataire', 'department-head', 'enseignant', 'doctorant']) || $p->professor?->is_active), 422, 'Liste de surveillants invalide.');
        $required = $rooms->sum(fn ($room) => floor($room->capacity / 2) >= 50 ? 2 : 1);
        abort_if(count($professorIds) < $required, 422, 'Pas assez de surveillants pour couvrir toutes les salles.');
        if ($rooms->isEmpty()) {
            throw new Exception('Aucune salle sélectionnée.');
        }

        $totalExamCapacity = $rooms->sum(fn ($r) => $r->exam_capacity ?? floor($r->capacity / 2));

        if ($students->count() > $totalExamCapacity) {
            throw new Exception("Capacité insuffisante : {$students->count()} étudiants pour {$totalExamCapacity} places.");
        }

        return DB::transaction(function () use ($examId, $rooms, $students, $professorIds) {
            $exam = Exam::whereKey($examId)->lockForUpdate()->firstOrFail();
            app(ExamWorkflowGuard::class)->mutablePlan($exam);
            Room::whereIn('id', $rooms->pluck('id'))->orderBy('id')->lockForUpdate()->get();
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
     * Génération automatique intelligente des examens (pour une filière ou toutes les filières).
     */
    public function autoGenerateIntelligentBatch(
        ?int $filiereId,
        int $sessionId,
        ?int $semesterNumber = null,
        int $modulesPerDay = 2,
        string $daySlotMode = 'matin',
        ?array $customModuleIds = null,
        ?string $customStartDate = null
    ): array {
        $session = ExamSession::with('semester')->findOrFail($sessionId);
        app(ExamWorkflowGuard::class)->mutableSession($session);
        abort_unless($session->semester && $session->academic_year_id && $session->start_date && $session->end_date, 422, 'Configurer l’année, le semestre et la période de la session.');
        $isAutomne = (int) $session->semester->number % 2 === 1;

        if (! empty($customModuleIds)) {
            $modules = Module::whereIn('id', $customModuleIds)
                ->where('institution_id', $session->institution_id)
                ->when($filiereId, fn ($q) => $q->where('filiere_id', $filiereId))
                ->when($semesterNumber, fn ($q) => $q->where('semester_number', $semesterNumber), fn ($q) => $q->whereRaw($isAutomne ? 'semester_number % 2 != 0' : 'semester_number % 2 = 0'))
                ->get()
                ->sortBy(fn ($m) => array_search($m->id, $customModuleIds))
                ->values();
        } else {
            $modules = Module::where('institution_id', $session->institution_id)->when($filiereId, fn ($q) => $q->where('filiere_id', $filiereId))
                ->when($semesterNumber, fn ($q) => $q->where('semester_number', $semesterNumber), fn ($q) => $q->whereRaw($isAutomne ? 'semester_number % 2 != 0' : 'semester_number % 2 = 0'))
                ->orderBy('filiere_id')
                ->orderBy('semester_number')
                ->orderBy('id')
                ->get();
        }

        $rooms = Room::where('institution_id', $session->institution_id)->where('is_available', true)->where('capacity', '>', 1)->orderBy('capacity')->get();

        if ($modules->isEmpty()) {
            throw new Exception('Aucun module trouvé pour les critères sélectionnés.');
        }
        if ($rooms->isEmpty()) {
            throw new Exception('Aucune salle disponible.');
        }

        $startDate = $customStartDate ? Carbon::parse($customStartDate) : Carbon::parse($session->start_date);
        $endDate = Carbon::parse($session->end_date);
        abort_if($startDate->lt($session->start_date) || $endDate->lt($startDate), 422, 'Date de démarrage hors période de session.');
        $currentDate = $startDate->copy();
        if ($currentDate->isSunday()) {
            $currentDate->addDay();
        }

        return DB::transaction(function () use (
            $filiereId, $sessionId, $session, $modules, $rooms, $currentDate, $endDate, $modulesPerDay, $daySlotMode
        ) {
            $lockedSession = ExamSession::whereKey($sessionId)->lockForUpdate()->firstOrFail();
            app(ExamWorkflowGuard::class)->mutableSession($lockedSession);
            Room::whereIn('id', $rooms->pluck('id'))->orderBy('id')->lockForUpdate()->get();
            // Supprimer les examens existants pour cette session et filière(s)
            $existing = Exam::where('exam_session_id', $sessionId)->whereIn('module_id', $modules->pluck('id'))->lockForUpdate()->get();
            foreach ($existing as $exam) { app(ExamWorkflowGuard::class)->mutablePlan($exam); }
            $existingExamIds = $existing->pluck('id');

            ExamSeating::whereIn('exam_id', $existingExamIds)->delete();
            ExamSurveillance::whereIn('exam_id', $existingExamIds)->delete();
            Exam::whereIn('id', $existingExamIds)->delete();

            // Sélection exhaustive du corps de surveillance : Professeurs Permanents, Vacataires et Doctorants surveillants
            $professors = User::where('institution_id', $session->institution_id)->where(function ($query) {
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
                $profUserIds = Professor::where('institution_id', $session->institution_id)->where('is_active', true)->whereNotNull('user_id')->pluck('user_id');
                $professors = User::whereIn('id', $profUserIds)->get();
            }
            if ($professors->isEmpty()) {
                abort(422, 'Aucun enseignant surveillant disponible.');
            }

            $examsCreated = 0;
            $allCreatedExams = [];
            $scheduledExams = Exam::with('seatings')->whereBetween('exam_date', [$currentDate->toDateString(), $endDate->toDateString()])->get();

            // Grouper les modules par filière pour les planifier en parallèle sans chevauchement
            $modulesByFiliere = $modules->groupBy('filiere_id');
            $modulePointers = [];
            foreach ($modulesByFiliere as $fid => $fMods) {
                $modulePointers[$fid] = 0;
            }

            // Répartition équilibrée des filières entre Matin (08:30) et Soir/Après-midi (14:30)
            // afin de répartir la charge des salles (ex: 6 filières -> 3 matin et 3 soir)
            $filierePeriod = []; // [$fid => 'matin' | 'soir']
            $filiereStudentCounts = [];
            foreach ($modulesByFiliere as $fid => $fMods) {
                $count = StudentRegistration::whereHas('group', fn ($q) => $q->where('filiere_id', $fid))
                    ->where('academic_year_id', $session->academic_year_id)
                    ->count();
                $filiereStudentCounts[$fid] = $count > 0 ? $count : 24;
            }

            // Trier les filières par effectif décroissant pour alterner (ex: grande filière le matin, grande filière le soir)
            $sortedFiliereIds = array_keys($filiereStudentCounts);
            usort($sortedFiliereIds, fn ($a, $b) => $filiereStudentCounts[$b] <=> $filiereStudentCounts[$a]);

            $shouldBalance = ($daySlotMode === 'balanced') || ($daySlotMode === 'matin' && count($sortedFiliereIds) > 1) || empty($filiereId);

            foreach ($sortedFiliereIds as $fIdx => $fid) {
                if ($daySlotMode === 'pm') {
                    $filierePeriod[$fid] = 'soir';
                } elseif ($shouldBalance) {
                    // Équilibrage 50% matin / 50% soir (ex: 6 filières -> 3 matin, 3 soir)
                    $filierePeriod[$fid] = ($fIdx % 2 === 0) ? 'matin' : 'soir';
                } else {
                    $filierePeriod[$fid] = 'matin';
                }
            }

            $hasRemainingModules = true;
            $safetyLoopLimit = 120;
            $loopCount = 0;

            while ($hasRemainingModules && $loopCount < $safetyLoopLimit) {
                abort_if($currentDate->gt($endDate), 422, 'Période insuffisante : aucun planning partiel n’a été enregistré.');
                $loopCount++;
                $dateStr = $currentDate->format('Y-m-d');
                $scheduledSomethingToday = false;

                foreach ($modulesByFiliere as $fid => $fMods) {
                    $ptr = $modulePointers[$fid];
                    $totalFMods = $fMods->count();

                    for ($mIdx = 0; $mIdx < $modulesPerDay; $mIdx++) {
                        $currIdx = $ptr + $mIdx;
                        if ($currIdx >= $totalFMods) {
                            break;
                        }

                        $module = $fMods[$currIdx];
                        $semNum = $module->semester_number ?? 1;
                        $period = $filierePeriod[$module->filiere_id] ?? 'matin';

                        if ($daySlotMode === 'split' && $modulesPerDay >= 2) {
                            $preferredTime = ($mIdx === 0) ? '08:30:00' : '14:30:00';
                            $allCandidateSlots = ($mIdx === 0)
                                ? ['08:30:00', '10:45:00', '14:30:00', '16:45:00']
                                : ['14:30:00', '16:45:00', '10:45:00', '08:30:00'];
                        } elseif ($period === 'soir') {
                            if ($modulesPerDay >= 2 && $mIdx > 0) {
                                $preferredTime = '16:45:00';
                                $allCandidateSlots = ['16:45:00', '14:30:00', '10:45:00', '08:30:00'];
                            } else {
                                $preferredTime = '14:30:00';
                                $allCandidateSlots = ['14:30:00', '16:45:00', '08:30:00', '10:45:00'];
                            }
                        } else {
                            if ($modulesPerDay >= 2 && $mIdx > 0) {
                                $preferredTime = '10:45:00';
                                $allCandidateSlots = ['10:45:00', '08:30:00', '14:30:00', '16:45:00'];
                            } else {
                                $preferredTime = '08:30:00';
                                $allCandidateSlots = ['08:30:00', '10:45:00', '14:30:00', '16:45:00'];
                            }
                        }

                        $students = StudentRegistration::whereHas('group', fn ($q) => $q->where('filiere_id', $module->filiere_id)->where('semester_number', $module->semester_number))
                            ->where('academic_year_id', $session->academic_year_id)
                            ->distinct()->pluck('student_id');

                        $studentCount = $students->count();
                        abort_if($studentCount === 0, 422, "Aucun inscrit pour le module {$module->code} et son semestre.");

                        // Trouver le créneau où les salles libres peuvent contenir les étudiants
                        $chosenSlot = null;
                        $chosenAvailableRooms = null;

                        foreach ($allCandidateSlots as $slotCand) {
                            $slotStart = Carbon::parse($dateStr.' '.$slotCand);
                            $slotEnd = $slotStart->copy()->addMinutes(ExamSlotCatalog::durationMinutes($slotCand));
                            $overlaps = $scheduledExams->filter(function ($other) use ($dateStr, $slotStart, $slotEnd) {
                                if ($other->exam_date->toDateString() !== $dateStr) { return false; }
                                $otherStart = Carbon::parse($dateStr.' '.$other->start_time);
                                return $slotStart->lt($otherStart->copy()->addMinutes($other->duration_minutes)) && $slotEnd->gt($otherStart);
                            });
                            if ($overlaps->contains(fn ($other) => $other->seatings->pluck('student_id')->intersect($students)->isNotEmpty())) { continue; }
                            $bookedInSlot = $overlaps->flatMap(fn ($other) => array_merge([$other->room_id], $other->seatings->pluck('room_id')->all()))->all();
                            $freeRooms = $rooms->filter(fn ($r) => ! in_array($r->id, $bookedInSlot) && ! app(TimetableRoomGuard::class)->isRoomBusyAt((string) $r->id, $slotStart, $slotEnd))->values();
                            $totalCap = $freeRooms->sum(fn ($r) => floor($r->capacity / 2));

                            if ($totalCap >= $studentCount) {
                                $chosenSlot = $slotCand;
                                $chosenAvailableRooms = $freeRooms;
                                break;
                            }
                        }

                        if (! $chosenSlot) {
                            abort(422, "Capacité insuffisante le {$dateStr} : choisir une autre période ou libérer des salles.");
                        }

                        $slotInfo = ExamSlotCatalog::resolve($chosenSlot);
                        $unassignedCount = $studentCount;
                        $studentsList = $students->toArray();
                        $availableRooms = clone $chosenAvailableRooms;
                        $filiereGroup = Group::where('filiere_id', $module->filiere_id)->where('semester_number', $module->semester_number)->where('academic_year_id', $session->academic_year_id)->firstOrFail();
                        $defaultGroupId = $filiereGroup->id;

                        while ($unassignedCount > 0 && $availableRooms->isNotEmpty()) {
                            $assignedRoom = $availableRooms->first(fn ($r) => floor($r->capacity / 2) >= $unassignedCount)
                                ?? $availableRooms->pop();

                            $availableRooms = $availableRooms->filter(fn ($r) => $r->id !== $assignedRoom->id)->values();

                            $examCapacity = floor($assignedRoom->capacity / 2);
                            $studentsForThisRoom = array_splice($studentsList, 0, $examCapacity);
                            $unassignedCount -= count($studentsForThisRoom);

                            $exam = Exam::create([
                                'module_id' => $module->id,
                                'group_id' => $defaultGroupId,
                                'exam_session_id' => $sessionId,
                                'room_id' => $assignedRoom->id,
                                'exam_date' => $dateStr,
                                'start_time' => $chosenSlot,
                                'duration_minutes' => $slotInfo['duration'] ?? 120,
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
                            $scheduledExams->push($exam->load('seatings'));
                        }

                        $modulePointers[$fid]++;
                        $scheduledSomethingToday = true;
                    }
                }

                $hasRemainingModules = false;
                foreach ($modulesByFiliere as $fid => $fMods) {
                    if ($modulePointers[$fid] < $fMods->count()) {
                        $hasRemainingModules = true;
                        break;
                    }
                }

                if ($scheduledSomethingToday || $hasRemainingModules) {
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
                foreach (ExamSurveillance::with('exam')->whereIn('professor_id', $professors->pluck('id'))->whereNotIn('exam_id', collect($allCreatedExams)->pluck('id'))->get() as $row) {
                    if (! $row->exam) { continue; }
                    $otherDate = $row->exam->exam_date->toDateString();
                    $parts = explode(':', $row->exam->start_time);
                    $otherStart = (int) $parts[0] * 60 + (int) $parts[1];
                    $schedules[$row->professor_id][] = ['date' => $otherDate, 'start' => $otherStart, 'end' => $otherStart + $row->exam->duration_minutes];
                    $workload[$row->professor_id]++;
                    $daily[$row->professor_id][$otherDate] = ($daily[$row->professor_id][$otherDate] ?? 0) + 1;
                }

                $totalExams = $sortedExams->count();

                for ($i = 0; $i < $totalExams; $i++) {
                    $exam = $sortedExams[$i];
                    $dateStr = Carbon::parse($exam->exam_date)->toDateString();
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
                        abort(422, "Aucun président disponible pour l’épreuve {$exam->id}. Aucun planning partiel enregistré.");
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
                    $second = $eligibleSeconds->sort(function ($a, $b) use ($daily, $workload, $dateStr, $isPermanent, $professors, $maxFairWorkload, $remainingExams) {
                        // Lookahead dynamique : calcul précis du besoin en surveillants pour chaque date future
                        $futureMinDistinct = $remainingExams->groupBy('exam_date')->map(function ($dayExams) {
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
                        abort(422, "Aucun second surveillant disponible pour l’épreuve {$exam->id}. Aucun planning partiel enregistré.");
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

            $targetDesc = $filiereId ? 'la filière sélectionnée' : 'toutes les filières académiques';
            $balanceNote = ($daySlotMode === 'balanced' || count($modulesByFiliere) > 1)
                ? ' (répartition équilibrée Matin / Soir)'
                : '';

            return [
                'success' => true,
                'message' => "{$examsCreated} examens générés avec succès pour {$targetDesc}{$balanceNote} sans aucun conflit de salle ou de surveillance.",
                'created_count' => $examsCreated,
            ];
        });
    }
}

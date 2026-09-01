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
use App\Models\Student;
use App\Models\StudentRegistration;
use App\Models\User;
use App\Services\Academic\ExamSlotCatalog;
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
        $currentDate = $startDate->copy();

        return DB::transaction(function () use (
            $filiereId, $sessionId, $session, $modules, $rooms, $groups,
            $startDate, $endDate, $currentDate, $modulesPerDay, $daySlotMode
        ) {
            // Supprimer les examens existants
            $moduleIds = Module::where('filiere_id', $filiereId)->pluck('id');
            $existingExamIds = Exam::where('exam_session_id', $sessionId)->whereIn('module_id', $moduleIds)->pluck('id');

            ExamSeating::whereIn('exam_id', $existingExamIds)->delete();
            ExamSurveillance::whereIn('exam_id', $existingExamIds)->delete();
            Exam::whereIn('id', $existingExamIds)->delete();

            $professors = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['professor', 'department-head', 'enseignant']))->get();
            if ($professors->isEmpty()) {
                $profUserIds = Professor::whereNotNull('user_id')->pluck('user_id');
                $professors = User::whereIn('id', $profUserIds)->get();
            }
            if ($professors->isEmpty()) {
                $professors = User::limit(5)->get();
            }
            $vacataires = $professors;

            $examsCreated = 0;
            $busyProfessors = [];
            $moduleIndexInDay = 0;
            $defaultGroupId = $groups->first()->id;

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

                $timeSlot = $moduleIndexInDay === 0 ? 'matin' : 'apres_midi';
                $dateStr = $currentDate->format('Y-m-d');
                $slotKey = $dateStr.'_'.$timeSlot;
                $busyProfessors[$slotKey] ??= [];

                $students = StudentRegistration::whereHas('group', fn ($q) => $q->where('filiere_id', $filiereId))
                    ->where('academic_year_id', $session->academic_year_id)
                    ->pluck('student_id');

                $studentCount = $students->count() ?: 20;
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

                    $seatings = array_map(fn ($sid) => [
                        'exam_id' => $exam->id,
                        'student_id' => $sid,
                        'room_id' => $assignedRoom->id,
                        'seat_number' => $examCapacity--,
                    ], $studentsForThisRoom);

                    if (! empty($seatings)) {
                        ExamSeating::insert($seatings);
                    }

                    if ($professors->isNotEmpty()) {
                        $availablePresidents = $professors->whereNotIn('id', $busyProfessors[$slotKey]);
                        $president = $availablePresidents->isNotEmpty() ? $availablePresidents->random() : $professors->random();
                        $busyProfessors[$slotKey][] = $president->id;

                        ExamSurveillance::create([
                            'exam_id' => $exam->id,
                            'room_id' => $assignedRoom->id,
                            'professor_id' => $president->id,
                            'role' => 'president_salle',
                        ]);

                        // Surveillants supplémentaires
                        $availableVacataires = $vacataires->whereNotIn('id', $busyProfessors[$slotKey]);
                        foreach ($availableVacataires->take(min(2, $availableVacataires->count())) as $vacataire) {
                            ExamSurveillance::create([
                                'exam_id' => $exam->id,
                                'room_id' => $assignedRoom->id,
                                'professor_id' => $vacataire->id,
                                'role' => 'surveillant',
                            ]);
                            $busyProfessors[$slotKey][] = $vacataire->id;
                        }
                    }
                }

                $moduleIndexInDay++;
                if ($moduleIndexInDay >= $modulesPerDay) {
                    $moduleIndexInDay = 0;
                    $currentDate->addDay();
                    if ($currentDate->isSunday()) {
                        $currentDate->addDay();
                    }
                }

                if ($currentDate->gt($endDate)) {
                    $currentDate = $startDate->copy();
                }
            }

            return [
                'success' => true,
                'message' => "{$examsCreated} examens générés.",
            ];
        });
    }
}

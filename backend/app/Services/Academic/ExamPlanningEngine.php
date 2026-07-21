<?php

namespace App\Services\Academic;

use App\Models\Exam;
use App\Models\Room;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use Exception;

class ExamPlanningEngine
{
    /**
     * Generate Seating Plan and Surveillance for an Exam
     */
    public function generatePlan(int $examId, array $roomIds, array $professorIds): array
    {
        $exam = Exam::with(['group'])->findOrFail($examId);
        
        // Find all students registered in this group's module
        $students = DB::table('student_registrations')
            ->join('students', 'student_registrations.student_id', '=', 'students.id')
            ->where('student_registrations.group_id', $exam->group_id)
            ->where('student_registrations.academic_year_id', $exam->examSession->academic_year_id ?? 1)
            ->select('students.id', 'students.last_name', 'students.first_name')
            ->orderBy('students.last_name')
            ->orderBy('students.first_name')
            ->get();

        if ($students->isEmpty()) {
            throw new Exception("Aucun étudiant inscrit dans ce groupe.");
        }

        $rooms = Room::whereIn('id', $roomIds)->get();
        if ($rooms->isEmpty()) {
            throw new Exception("Aucune salle sélectionnée.");
        }

        // Calculate total capacity
        // For exams, we use 50% capacity to leave an empty seat between students to prevent cheating
        $totalExamCapacity = $rooms->sum('capacity') / 2;

        if ($students->count() > $totalExamCapacity) {
            throw new Exception(
                "Capacité insuffisante. Vous avez " . $students->count() . 
                " étudiants mais la capacité d'examen (50% de la salle) n'est que de " . floor($totalExamCapacity) . " places."
            );
        }

        DB::beginTransaction();

        try {
            // Clear existing plan for this exam
            DB::table('exam_seatings')->where('exam_id', $examId)->delete();
            DB::table('exam_surveillances')->where('exam_id', $examId)->delete();

            // 1. Distribute Students (Seating Plan)
            $studentIndex = 0;
            $seatings = [];

            foreach ($rooms as $room) {
                $examCapacity = floor($room->capacity / 2);
                
                for ($seat = 1; $seat <= $examCapacity; $seat++) {
                    if ($studentIndex >= $students->count()) break; // All students placed
                    
                    $seatings[] = [
                        'exam_id' => $examId,
                        'student_id' => $students[$studentIndex]->id,
                        'room_id' => $room->id,
                        'seat_number' => $seat, // Seats could be 1, 3, 5, 7 for 50% capacity logically
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                    
                    $studentIndex++;
                }
            }

            DB::table('exam_seatings')->insert($seatings);

            // 2. Assign Surveillants
            // Rule: 1 President de salle per room, plus 1 surveillant per 30 students
            $surveillances = [];
            $profIndex = 0;

            foreach ($rooms as $room) {
                if ($profIndex >= count($professorIds)) break; // Out of profs

                // Assign President
                $surveillances[] = [
                    'exam_id' => $examId,
                    'room_id' => $room->id,
                    'professor_id' => $professorIds[$profIndex],
                    'role' => 'president_salle',
                    'created_at' => now(),
                    'updated_at' => now()
                ];
                $profIndex++;

                // If room is large (e.g. Amphitheater > 50 exam capacity), assign an extra surveillant
                if (floor($room->capacity / 2) >= 50 && $profIndex < count($professorIds)) {
                    $surveillances[] = [
                        'exam_id' => $examId,
                        'room_id' => $room->id,
                        'professor_id' => $professorIds[$profIndex],
                        'role' => 'surveillant',
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                    $profIndex++;
                }
            }

            DB::table('exam_surveillances')->insert($surveillances);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Plan de salle et de surveillance générés avec succès.',
                'students_placed' => count($seatings),
                'surveillants_assigned' => count($surveillances)
            ];

        } catch (Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Erreur lors de la planification: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Auto-generate exams using intelligent scheduling constraints
     */
    public function autoGenerateIntelligentBatch(int $filiereId, int $sessionId): array
    {
        $session = \App\Models\ExamSession::findOrFail($sessionId);
        $modules = \App\Models\Module::where('filiere_id', $filiereId)->get();
        // Order rooms by capacity ascending to find the smallest suitable room
        $rooms = \App\Models\Room::orderBy('capacity', 'asc')->get();
        $groups = \App\Models\Group::where('filiere_id', $filiereId)->get();

        if ($modules->isEmpty()) throw new Exception("Aucun module pour cette filière.");
        if ($groups->isEmpty()) throw new Exception("Aucun groupe pour cette filière.");
        if ($rooms->isEmpty()) throw new Exception("Aucune salle disponible.");

        $startDate = \Carbon\Carbon::parse($session->start_date);
        $endDate = \Carbon\Carbon::parse($session->end_date);
        $currentDate = $startDate->copy();

        DB::beginTransaction();
        try {
            // Delete existing exams and convocations for this filiere & session
            $existingExamIds = Exam::where('exam_session_id', $sessionId)
                ->whereIn('module_id', $modules->pluck('id'))
                ->pluck('id');
            
            DB::table('exam_seatings')->whereIn('exam_id', $existingExamIds)->delete();
            DB::table('exam_surveillances')->whereIn('exam_id', $existingExamIds)->delete();
            Exam::whereIn('id', $existingExamIds)->delete();

            // Fetch available personnel
            $professors = \App\Models\User::whereHas('roles', function($q) {
                $q->whereIn('name', ['professor', 'department-head']);
            })->get();
            
            $vacataires = \App\Models\User::whereHas('roles', function($q) {
                $q->whereIn('name', ['vacataire', 'doctorant']);
            })->get();
            
            // Fallback if no specific roles
            if ($professors->isEmpty()) $professors = \App\Models\User::limit(5)->get();
            if ($vacataires->isEmpty()) $vacataires = \App\Models\User::limit(5)->get();
             $examsCreated = 0;
            $busyProfessors = []; // Track busy professors by date and slot: 'YYYY-MM-DD_matin' => [id1, id2]

            foreach ($modules as $module) {
                // Règle 1: Semestres impairs le matin, pairs l'après-midi
                $semesterNumber = $module->semester_number ?? 1;
                $isOddSemester = ($semesterNumber % 2 !== 0);
                $startTime = $isOddSemester ? '09:00:00' : '14:00:00';
                
                $dateStr = $currentDate->format('Y-m-d');
                $timeSlot = $isOddSemester ? 'matin' : 'apres-midi';
                $slotKey = $dateStr . '_' . $timeSlot;

                if (!isset($busyProfessors[$slotKey])) {
                    $busyProfessors[$slotKey] = [];
                }

                // Traiter toute la filière comme un seul bloc (pas par groupe)
                $students = DB::table('student_registrations')
                    ->join('groups', 'student_registrations.group_id', '=', 'groups.id')
                    ->where('groups.filiere_id', $filiereId)
                    ->where('student_registrations.academic_year_id', $session->academic_year_id)
                    ->select('student_registrations.student_id')
                    ->get();
                    
                $studentCount = $students->count();
                if ($studentCount == 0) $studentCount = 20; // Fallback

                $unassignedCount = $studentCount;
                $studentsList = $students->pluck('student_id')->toArray();
                
                // Si on utilise le fallback, on génère un tableau de fausses IDs pour boucler
                if (empty($studentsList) && $studentCount > 0) {
                    $studentsList = array_fill(0, $studentCount, null);
                }

                $availableRooms = clone $rooms;
                $defaultGroupId = $groups->first()->id; // Requis par la DB

                // Répartir les étudiants de la filière sur une ou plusieurs salles
                while ($unassignedCount > 0 && $availableRooms->count() > 0) {
                    $assignedRoom = null;
                    foreach ($availableRooms as $key => $room) {
                        $examCapacity = floor($room->capacity / 2);
                        if ($examCapacity >= $unassignedCount) {
                            $assignedRoom = $room;
                            $availableRooms->forget($key);
                            break;
                        }
                    }

                    if (!$assignedRoom) {
                        // Prendre la plus grande salle dispo si aucune n'est assez grande seule
                        $assignedRoom = $availableRooms->last(); 
                        $availableRooms->pop();
                    }

                    $examCapacity = floor($assignedRoom->capacity / 2);
                    $studentsForThisRoom = array_splice($studentsList, 0, $examCapacity);
                    $unassignedCount -= count($studentsForThisRoom);

                    // Création de l'examen pour cette salle
                    $exam = Exam::create([
                        'module_id' => $module->id,
                        'group_id' => $defaultGroupId,
                        'exam_session_id' => $sessionId,
                        'room_id' => $assignedRoom->id,
                        'exam_date' => $dateStr,
                        'start_time' => $startTime,
                        'duration_minutes' => 120,
                        'type' => 'final'
                    ]);
                    $examsCreated++;

                    // Affectation des étudiants à cette salle
                    $seatings = [];
                    $seat = 1;
                    foreach ($studentsForThisRoom as $studentId) {
                        if ($studentId !== null) {
                            $seatings[] = [
                                'exam_id' => $exam->id,
                                'student_id' => $studentId,
                                'room_id' => $assignedRoom->id,
                                'seat_number' => $seat++,
                                'created_at' => now(),
                                'updated_at' => now()
                            ];
                        }
                    }
                    if (!empty($seatings)) {
                        DB::table('exam_seatings')->insert($seatings);
                    }

                    // Affectation intelligente de la surveillance
                    $availablePresidents = $professors->whereNotIn('id', $busyProfessors[$slotKey]);
                    if ($availablePresidents->isEmpty()) {
                        $availablePresidents = $professors;
                    }
                    
                    $president = $availablePresidents->random();
                    $busyProfessors[$slotKey][] = $president->id;

                    DB::table('exam_surveillances')->insert([
                        'exam_id' => $exam->id,
                        'room_id' => $assignedRoom->id,
                        'professor_id' => $president->id,
                        'role' => 'president_salle',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);

                    $numVacataires = $examCapacity >= 40 ? 2 : 1; 

                    if ($vacataires->isNotEmpty()) {
                        $availableVacataires = $vacataires->whereNotIn('id', $busyProfessors[$slotKey]);
                        $actualNumToAssign = min($numVacataires, $availableVacataires->count());

                        if ($actualNumToAssign > 0) {
                            $selectedVacataires = $availableVacataires->shuffle()->take($actualNumToAssign);

                            foreach ($selectedVacataires as $vacataire) {
                                DB::table('exam_surveillances')->insert([
                                    'exam_id' => $exam->id,
                                    'room_id' => $assignedRoom->id,
                                    'professor_id' => $vacataire->id,
                                    'role' => 'surveillant',
                                    'created_at' => now(),
                                    'updated_at' => now()
                                ]);
                                $busyProfessors[$slotKey][] = $vacataire->id;
                            }
                        }
                    }
                }

                // Avancer d'un jour pour le module suivant
                $currentDate->addDay();
                // Éviter les dimanches (optionnel)
                if ($currentDate->isSunday()) $currentDate->addDay();
                
                if ($currentDate->gt($endDate)) {
                    $currentDate = $startDate->copy();
                }
            }

            DB::commit();
            return [
                'success' => true,
                'message' => "Génération intelligente terminée avec $examsCreated examens créés et affectés (Salles optimisées, Surveillants affectés matin/soir)."
            ];

        } catch (Exception $e) {
            DB::rollBack();
            return [
                'success' => false,
                'message' => 'Erreur lors de la génération: ' . $e->getMessage()
            ];
        }
    }
}

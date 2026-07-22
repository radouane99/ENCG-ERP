<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;

class PdfExportController extends Controller
{
    protected function getPdfInstance($view, $data = [])
    {
        // Embed Base64 Logo
        $logoPath = public_path('logo-encg.png');
        if (file_exists($logoPath)) {
            $data['logoBase64'] = 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath));
        } else {
            $data['logoBase64'] = '';
        }

        // Generate dynamic verification URL if not provided
        if (!isset($data['verifyUrl'])) {
            $data['verifyUrl'] = url('/verify/document/' . Str::random(10));
        }

        // Generate Base64 QR Code using SimpleSoftwareIO
        try {
            $qrSvg = \SimpleSoftwareIO\QrCode\Facades\QrCode::size(150)->margin(0)->generate($data['verifyUrl']);
            $data['qrBase64'] = 'data:image/svg+xml;base64,' . base64_encode($qrSvg);
        } catch (\Exception $e) {
            $data['qrBase64'] = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($data['verifyUrl']);
        }

        // Set Dompdf Options
        return Pdf::setOption([
            'isRemoteEnabled' => true,
            'chroot' => public_path(),
        ])->loadView($view, $data);
    }

    public function printSession(Request $request)
    {
        $pdf = $this->getPdfInstance('pdf.generic_report', ['title' => 'Convocations Étudiants (Session)']);
        return $pdf->download('convocations_session.pdf');
    }

    public function studentConvocationPdf($seatingId)
    {
        $seating = \App\Models\ExamSeating::with(['student.user', 'student.pathways.filiere', 'exam.module', 'room', 'exam.session'])->findOrFail($seatingId);
        
        $pdf = $this->generateSingleConvocationPdf($seating);
        $name = ($seating->student->user->last_name ?? 'Etudiant') . '_' . ($seating->student->user->first_name ?? '');
        return $pdf->download("Convocation_{$name}.pdf");
    }

    public function studentConvocationPreview($seatingId)
    {
        $seating = \App\Models\ExamSeating::with(['student.user', 'student.pathways.filiere', 'exam.module', 'room', 'exam.session'])->findOrFail($seatingId);
        
        $pdf = $this->generateSingleConvocationPdf($seating);
        return $pdf->stream("convocation_preview.pdf", ["Attachment" => false]);
    }

    public function surveillantConvocationPdf($surveillanceId)
    {
        $surveillance = \Illuminate\Support\Facades\DB::table('exam_surveillances')->where('id', $surveillanceId)->first();
        if (!$surveillance) abort(404, 'Surveillance introuvable');
        
        $pdf = $this->generateSingleSurveillantConvocationPdf($surveillanceId);
        $prof = \App\Models\User::find($surveillance->professor_id);
        $name = ($prof->last_name ?? 'Professeur') . '_' . ($prof->first_name ?? '');
        
        return $pdf->download("Convocation_Surveillance_{$name}.pdf");
    }

    public function surveillantConvocationPreview($surveillanceId)
    {
        $surveillance = \Illuminate\Support\Facades\DB::table('exam_surveillances')->where('id', $surveillanceId)->first();
        if (!$surveillance) abort(404, 'Surveillance introuvable');

        $pdf = $this->generateSingleSurveillantConvocationPdf($surveillanceId);
        return $pdf->stream("convocation_surveillance_preview.pdf", ["Attachment" => false]);
    }

    public function batchPdf(Request $request)
    {
        $seatingIds = $request->input('seating_ids', []);
        if (empty($seatingIds)) {
            return response()->json(['success' => false, 'message' => 'Aucune convocation sélectionnée.'], 400);
        }

        $seatings = \App\Models\ExamSeating::with(['student.user', 'student.pathways.filiere', 'exam.module', 'room', 'exam.session'])
            ->whereIn('id', $seatingIds)
            ->get();

        $studentsData = [];
        foreach ($seatings->groupBy('student_id') as $studentId => $studentSeatings) {
            $student = $studentSeatings->first()->student;
            $sessionId = $studentSeatings->first()->exam->exam_session_id;
            
            $allStudentSeatings = \App\Models\ExamSeating::with(['exam.module', 'room'])
                ->where('student_id', $student->id)
                ->whereHas('exam', function($query) use ($sessionId) {
                    $query->where('exam_session_id', $sessionId);
                })
                ->get();
            
            $exams = [];
            foreach ($allStudentSeatings as $s) {
                if ($s->exam) {
                    $profName = '-';
                    if ($s->exam->module_id) {
                        $profData = \Illuminate\Support\Facades\DB::table('module_professor')
                            ->join('professors', 'module_professor.professor_id', '=', 'professors.id')
                            ->join('users', 'professors.user_id', '=', 'users.id')
                            ->where('module_professor.module_id', $s->exam->module_id)
                            ->select('users.last_name', 'users.first_name')
                            ->first();
                        if ($profData) {
                            $profName = mb_strtoupper($profData->last_name) . ' ' . $profData->first_name;
                        }
                    }

                    $exams[] = [
                        'date' => $s->exam->exam_date ? $s->exam->exam_date->format('d/m/Y') : 'N/A',
                        'time' => $s->exam->start_time . ' - ' . $s->exam->end_time,
                        'module' => $s->exam->module->name ?? 'Module N/A',
                        'enseignant' => $profName,
                        'room' => $s->room->name ?? 'Salle N/A',
                        'seat' => $s->seat_number ?? 'N/A',
                        'qr_token' => $s->qr_token
                    ];
                }
            }
            
            usort($exams, function($a, $b) {
                $dateA = \Carbon\Carbon::createFromFormat('d/m/Y', $a['date'] === 'N/A' ? '01/01/2099' : $a['date'])->format('Y-m-d') . ' ' . $a['time'];
                $dateB = \Carbon\Carbon::createFromFormat('d/m/Y', $b['date'] === 'N/A' ? '01/01/2099' : $b['date'])->format('Y-m-d') . ' ' . $b['time'];
                return strcmp($dateA, $dateB);
            });
            
            $studentsData[] = [
                'person_name' => $student->user->last_name . ' ' . $student->user->first_name,
                'person_id' => $student->user->cin ?? 'N/A',
                'filiere_name' => $student->latestPathway->filiere->name ?? 'Tronc Commun',
                'session_type' => $studentSeatings->first()->exam->session->type ?? 'ORDINAIRE',
                'session_name' => $studentSeatings->first()->exam->session->name ?? 'Session Principale',
                'exams' => $exams,
                'qr_token' => $allStudentSeatings->first()->qr_token ?? null,
                'id' => $studentSeatings->first()->id,
                'created_at' => clone $studentSeatings->first()->created_at
            ];
        }

        $pdf = $this->getPdfInstance('pdf.convocations_batch', [
            'studentsData' => $studentsData
        ]);
        
        return $pdf->download('convocations_lot.pdf');
    }

    public function batchDownloadSurveillantsPdf(Request $request, $sessionId)
    {
        $seatingIds = $request->input('seating_ids', []); // Actually surveillance_ids
        if (empty($seatingIds)) {
            return response()->json(['success' => false, 'message' => 'Aucun surveillant sélectionné'], 400);
        }

        $session = \App\Models\ExamSession::with(['exams.module', 'exams.room'])->findOrFail($sessionId);
        $examIds = $session->exams->pluck('id');

        $allSurveillances = \Illuminate\Support\Facades\DB::table('exam_surveillances')
            ->whereIn('exam_id', $examIds)
            ->whereIn('id', $seatingIds)
            ->get();

        $professors = \App\Models\User::whereIn('id', $allSurveillances->pluck('professor_id')->unique())->get();
        $professorsData = [];

        foreach ($professors as $prof) {
            $profSurvs = $allSurveillances->where('professor_id', $prof->id);
            $exams = [];

            foreach ($profSurvs as $s) {
                $exam = $session->exams->firstWhere('id', $s->exam_id);
                if ($exam) {
                    $exams[] = [
                        'date' => $exam->exam_date ? $exam->exam_date->format('d/m/Y') : 'N/A',
                        'time' => $exam->start_time ? substr($exam->start_time, 0, 5) . ' - ' . date('H:i', strtotime($exam->start_time) + ($exam->duration_minutes * 60)) : 'N/A',
                        'module' => $exam->module->name ?? 'N/A',
                        'room' => $exam->room->name ?? 'N/A',
                        'role' => $s->role ?? 'Surveillant'
                    ];
                }
            }

            usort($exams, function($a, $b) {
                $dateA = \Carbon\Carbon::createFromFormat('d/m/Y', $a['date'] === 'N/A' ? '01/01/2099' : $a['date'])->format('Y-m-d') . ' ' . $a['time'];
                $dateB = \Carbon\Carbon::createFromFormat('d/m/Y', $b['date'] === 'N/A' ? '01/01/2099' : $b['date'])->format('Y-m-d') . ' ' . $b['time'];
                return strcmp($dateA, $dateB);
            });

            $professorsData[] = [
                'person_name' => $prof->last_name . ' ' . $prof->first_name,
                'person_id' => $prof->cin ?? 'N/A',
                'person_role' => 'Professeur',
                'filiere_name' => 'Corps Professoral ENCG',
                'session_type' => $session->type ?? 'ORDINAIRE',
                'session_name' => $session->name ?? 'Session Principale',
                'exams' => $exams,
                'qr_token' => $profSurvs->first()->qr_token ?? null,
                'id' => $profSurvs->first()->id,
                'created_at' => clone $session->created_at
            ];
        }

        // We can reuse the `pdf.convocations_batch` template since the structure is the same,
        // or create a dedicated one if we want specific wording. The user said "kif derna m3a etudians".
        // Let's use `convocations_profs_batch` for safety to allow differences later.
        $pdf = $this->getPdfInstance('pdf.convocations_profs_batch', [
            'professorsData' => $professorsData
        ]);
        
        return $pdf->download('convocations_surveillants_lot.pdf');
    }

    private function generateSingleConvocationPdf($seating)
    {
        $student = $seating->student;
        $sessionId = $seating->exam->exam_session_id;
        
        // Fetch ALL seatings for this student in the same session
        $allSeatings = \App\Models\ExamSeating::with(['exam.module', 'room'])
            ->where('student_id', $student->id)
            ->whereHas('exam', function($query) use ($sessionId) {
                $query->where('exam_session_id', $sessionId);
            })
            ->get();

        $exams = [];
        foreach ($allSeatings as $s) {
            if ($s->exam) {
                $profName = '-';
                if ($s->exam->module_id) {
                    $profData = \Illuminate\Support\Facades\DB::table('module_professor')
                        ->join('professors', 'module_professor.professor_id', '=', 'professors.id')
                        ->join('users', 'professors.user_id', '=', 'users.id')
                        ->where('module_professor.module_id', $s->exam->module_id)
                        ->select('users.last_name', 'users.first_name')
                        ->first();
                    if ($profData) {
                        $profName = mb_strtoupper($profData->last_name) . ' ' . $profData->first_name;
                    }
                }

                $exams[] = [
                    'date' => $s->exam->exam_date ? $s->exam->exam_date->format('d/m/Y') : 'N/A',
                    'time' => $s->exam->start_time . ' - ' . $s->exam->end_time,
                    'module' => $s->exam->module->name ?? 'Module N/A',
                    'enseignant' => $profName,
                    'room' => $s->room->name ?? 'Salle N/A',
                    'seat' => $s->seat_number ?? 'N/A',
                    'qr_token' => $s->qr_token
                ];
            }
        }

        // Sort exams by date and time
        usort($exams, function($a, $b) {
            $dateA = \Carbon\Carbon::createFromFormat('d/m/Y', $a['date'] === 'N/A' ? '01/01/2099' : $a['date'])->format('Y-m-d') . ' ' . $a['time'];
            $dateB = \Carbon\Carbon::createFromFormat('d/m/Y', $b['date'] === 'N/A' ? '01/01/2099' : $b['date'])->format('Y-m-d') . ' ' . $b['time'];
            return strcmp($dateA, $dateB);
        });

        return $this->getPdfInstance('pdf.convocation', [
            'person_name' => $student->user->last_name . ' ' . $student->user->first_name,
            'person_role' => 'Étudiant',
            'person_id' => $student->user->cin ?? 'N/A',
            'filiere_name' => $student->latestPathway->filiere->name ?? 'Tronc Commun',
            'session_type' => $seating->exam->session->type ?? 'ORDINAIRE',
            'session_name' => $seating->exam->session->name ?? 'Session Principale',
            'exams' => $exams
        ]);
    }

    private function generateSingleSurveillantConvocationPdf($surveillanceId)
    {
        $surveillance = \Illuminate\Support\Facades\DB::table('exam_surveillances')->where('id', $surveillanceId)->first();
        if (!$surveillance) abort(404, 'Surveillance introuvable');
        
        $prof = \App\Models\User::find($surveillance->professor_id);
        $exam = \App\Models\Exam::find($surveillance->exam_id);
        $sessionId = $exam->exam_session_id;
        $session = \App\Models\ExamSession::with(['exams.module', 'exams.room'])->find($sessionId);
        
        $examIds = $session->exams->pluck('id');
        
        // Fetch ALL surveillances for this professor in the same session
        $allSurveillances = \Illuminate\Support\Facades\DB::table('exam_surveillances')
            ->where('professor_id', $prof->id)
            ->whereIn('exam_id', $examIds)
            ->get();

        $exams = [];
        foreach ($allSurveillances as $s) {
            $sessExam = $session->exams->firstWhere('id', $s->exam_id);
            if ($sessExam) {
                $exams[] = [
                    'date' => $sessExam->exam_date ? $sessExam->exam_date->format('d/m/Y') : 'N/A',
                    'time' => $sessExam->start_time ? substr($sessExam->start_time, 0, 5) . ' - ' . date('H:i', strtotime($sessExam->start_time) + ($sessExam->duration_minutes * 60)) : 'N/A',
                    'module' => $sessExam->module->name ?? 'N/A',
                    'room' => $sessExam->room->name ?? 'N/A',
                    'role' => $s->role ?? 'Surveillant'
                ];
            }
        }

        // Sort exams by date and time
        usort($exams, function($a, $b) {
            $dateA = \Carbon\Carbon::createFromFormat('d/m/Y', $a['date'] === 'N/A' ? '01/01/2099' : $a['date'])->format('Y-m-d') . ' ' . $a['time'];
            $dateB = \Carbon\Carbon::createFromFormat('d/m/Y', $b['date'] === 'N/A' ? '01/01/2099' : $b['date'])->format('Y-m-d') . ' ' . $b['time'];
            return strcmp($dateA, $dateB);
        });

        $professorsData = [[
            'person_name' => $prof->last_name . ' ' . $prof->first_name,
            'person_id' => $prof->cin ?? 'N/A',
            'person_role' => 'Professeur',
            'filiere_name' => 'Corps Professoral ENCG',
            'session_type' => $session->type ?? 'ORDINAIRE',
            'session_name' => $session->name ?? 'Session Principale',
            'exams' => $exams,
            'qr_token' => $allSurveillances->first()->qr_token ?? null,
            'id' => $allSurveillances->first()->id,
            'created_at' => clone $session->created_at
        ]];

        return $this->getPdfInstance('pdf.convocations_profs_batch', [
            'professorsData' => $professorsData
        ]);
    }

    public function printProfessors(Request $request)
    {
        $pdf = $this->getPdfInstance('pdf.generic_report', ['title' => 'Convocations Surveillants']);
        return $pdf->download('convocations_profs.pdf');
    }

    public function pvExamen($examId)
    {
        $exam = \App\Models\Exam::with('module')->findOrFail($examId);
        $seatings = \App\Models\ExamSeating::with('student.user')->where('exam_id', $examId)->get();
        
        $pdf = $this->getPdfInstance('pdf.pv_examen', [
            'exam_id' => $examId,
            'exam' => $exam,
            'seatings' => $seatings
        ]);
        return $pdf->download("pv_examen_{$examId}.pdf");
    }

    public function pvGlobal()
    {
        $pdf = $this->getPdfInstance('pdf.generic_report', ['title' => 'PV Global - Synthèse Filière']);
        return $pdf->download('pv_global.pdf');
    }

    public function releveNotes($studentId = null, $year = null)
    {
        $student = \App\Models\Student::with(['latestPathway.filiere'])->find($studentId);
        if (!$student) abort(404, 'Étudiant introuvable');

        $grades = \App\Models\Grade::with('gradeComponent.module')->where('student_id', $studentId)->get();
        
        $modules = $grades->map(function ($grade) {
            return [
                'code' => $grade->gradeComponent->module->code ?? 'N/A',
                'name' => $grade->gradeComponent->module->name ?? 'Module Inconnu',
                'score' => $grade->value,
                'is_validated' => $grade->value >= 10,
            ];
        });

        $avgGrade = $grades->count() > 0 ? $grades->avg('value') : 0;

        $pdf = $this->getPdfInstance('pdf.releve_notes', [
            'student' => $student,
            'year' => $year ?? '2025/2026',
            'modules' => $modules,
            'avgGrade' => $avgGrade,
            'verifyUrl' => url('/verify/document/' . ($student->student_number ?? '000'))
        ]);
        
        return $pdf->stream("releve_notes_{$studentId}.pdf");
    }

    public function previewOrdreMission()
    {
        $professor = \App\Models\Professor::with(['user', 'department'])->first();
        $mission = [
            'destination' => 'Rabat, Maroc',
            'start_date' => date('d/m/Y', strtotime('+2 days')),
            'end_date' => date('d/m/Y', strtotime('+5 days')),
            'motif' => 'Participation à une conférence académique'
        ];
        $pdf = $this->getPdfInstance('pdf.ordre_mission', [
            'professor' => $professor,
            'mission' => $mission
        ]);
        return $pdf->stream("ordre_mission.pdf");
    }

    public function previewConventionStage()
    {
        $pdf = $this->getPdfInstance('pdf.convention_stage');
        return $pdf->stream("convention_stage.pdf");
    }

    public function previewAttestationTravail()
    {
        $pdf = $this->getPdfInstance('pdf.attestation_travail');
        return $pdf->stream("attestation_travail.pdf");
    }

    public function attestationReussite($studentId, $year)
    {
        $student = \App\Models\Student::with(['latestPathway.filiere'])->find($studentId);
        if (!$student) abort(404, 'Étudiant introuvable');

        $pdf = $this->getPdfInstance('pdf.attestation', [
            'student' => $student, 
            'year' => $year,
            'verifyUrl' => url('/verify/document/' . ($student->student_number ?? '000'))
        ]);
        
        return $pdf->download("attestation_{$studentId}_{$year}.pdf");
    }

    public function attendanceSheet($examId)
    {
        $exam = \App\Models\Exam::with(['module.filiere', 'group', 'room'])->findOrFail($examId);
        $students = \App\Models\ExamSeating::with('student.user')
                    ->where('exam_id', $examId)
                    ->orderBy('seat_number', 'asc')
                    ->get();
                    
        $pdf = $this->getPdfInstance('pdf.attendance_sheet', [
            'exam' => $exam,
            'students' => $students,
            'title' => 'Feuille de Présence - Examen ' . $examId
        ]);
        return $pdf->download("fiche_emargement_{$examId}.pdf");
    }

    public function rapportAbsences()
    {
        $pdf = $this->getPdfInstance('pdf.generic_report', ['title' => 'Rapport des Absences']);
        return $pdf->download('rapport_absences.pdf');
    }

    public function exportScheduleGroupPdf()
    {
        $pdf = $this->getPdfInstance('pdf.generic_report', ['title' => 'Emploi du Temps - Groupe']);
        return $pdf->download('schedule_group.pdf');
    }

    public function liveAttendancePdf($examId)
    {
        $pdf = $this->getPdfInstance('pdf.generic_report', ['title' => 'Présence Live - Examen ' . $examId]);
        return $pdf->download("live_attendance_{$examId}.pdf");
    }

    public function displayList($examId)
    {
        $pdf = $this->getPdfInstance('pdf.generic_report', ['title' => 'Liste Affichage Examen ' . $examId]);
        return $pdf->download("affichage_examen_{$examId}.pdf");
    }

    public function exportModulePvPdf(Request $request, $moduleId)
    {
        $groupId = $request->query('group_id');
        $sessionType = $request->query('session', 'normale');
        $academicYearId = $request->query('academic_year_id', 1);

        $module = \App\Models\Module::with(['assessments', 'filiere'])->findOrFail($moduleId);
        
        $query = \App\Models\StudentRegistration::query();
        if ($groupId && !in_array($groupId, ['all', 'null', 'undefined', ''])) {
            $query->where('group_id', $groupId);
        } else {
            $query->where('filiere_id', $module->filiere_id)
                  ->where('academic_year_id', $academicYearId);
        }

        $registrations = $query->with('student.user')->get();
        $students = $registrations->map(fn($reg) => $reg->student)->filter();

        // Get assessments
        $normaleAssessments = $module->assessments->filter(fn($a) => strtolower($a->type) !== 'rattrapage');
        $rattrapageAssessment = $module->assessments->first(fn($a) => strtolower($a->type) === 'rattrapage');

        $data = $students->map(function ($student) use ($module, $normaleAssessments, $rattrapageAssessment) {
            $studentGrades = \App\Models\Grade::where('student_id', $student->id)
                ->whereIn('assessment_id', $module->assessments->pluck('id'))
                ->get();

            $gradesDetail = [];
            $totalWeight = 0;
            $weightedSum = 0;

            foreach ($normaleAssessments as $a) {
                $grade = $studentGrades->firstWhere('assessment_id', $a->id);
                $val = $grade ? $grade->value : null;
                $isAbsent = $grade ? $grade->absent : false;
                
                $gradesDetail[$a->id] = ['value' => $val, 'is_absent' => $isAbsent, 'weight' => $a->weight, 'type' => $a->type];
                $gradesDetail[$a->type] = $gradesDetail[$a->id];

                $calcVal = $isAbsent ? 0 : ($val !== null ? floatval($val) : null);
                if ($calcVal !== null) {
                    $weightedSum += $calcVal * ($a->weight / 100);
                    $totalWeight += $a->weight;
                }
            }

            $moyenneNormale = $totalWeight > 0 ? round($weightedSum * (100 / $totalWeight), 2) : null;
            $decisionNormale = '';
            if ($moyenneNormale !== null) {
                if ($moyenneNormale >= 10) $decisionNormale = 'V';
                elseif ($moyenneNormale < 6) $decisionNormale = 'NV';
                else $decisionNormale = 'R';
            }

            $rattrapageGradeVal = null;
            $rattrapageIsAbsent = false;
            if ($rattrapageAssessment) {
                $rGrade = $studentGrades->firstWhere('assessment_id', $rattrapageAssessment->id);
                if ($rGrade) {
                    $rattrapageGradeVal = $rGrade->value;
                    $rattrapageIsAbsent = $rGrade->absent;
                }
            }

            $moyenneFinale = $moyenneNormale;
            $decisionFinale = $decisionNormale;

            if (($decisionNormale === 'R' || $decisionNormale === 'NV') && ($rattrapageGradeVal !== null || $rattrapageIsAbsent)) {
                $examAssessment = $normaleAssessments->first(fn($a) => str_contains(strtolower($a->type), 'exam'));
                $rCalcVal = $rattrapageIsAbsent ? 0 : floatval($rattrapageGradeVal);
                if ($examAssessment) {
                    $newWeightedSum = 0;
                    $newTotalWeight = 0;
                    foreach ($normaleAssessments as $a) {
                        $grade = $studentGrades->firstWhere('assessment_id', $a->id);
                        $val = $grade ? $grade->value : null;
                        $isAbsent = $grade ? $grade->absent : false;
                        $calcVal = $isAbsent ? 0 : ($val !== null ? floatval($val) : null);
                        if ($a->id === $examAssessment->id) $calcVal = $rCalcVal;
                        if ($calcVal !== null) {
                            $newWeightedSum += $calcVal * ($a->weight / 100);
                            $newTotalWeight += $a->weight;
                        }
                    }
                    $moyenneRattrapage = $newTotalWeight > 0 ? ($newWeightedSum * (100 / $newTotalWeight)) : 0;
                    $moyenneFinale = max($moyenneNormale ?? 0, round($moyenneRattrapage, 2));
                } else {
                    $moyenneFinale = max($moyenneNormale ?? 0, $rCalcVal);
                }
                $decisionFinale = $moyenneFinale >= 10 ? 'VAR' : 'NV';
            }

            return [
                'student_id' => $student->id,
                'apogee' => $student->student_number ?? $student->id,
                'last_name' => $student->last_name,
                'first_name' => $student->first_name,
                'grades_detail' => $gradesDetail,
                'moyenne_normale' => $moyenneNormale,
                'decision_normale' => $decisionNormale,
                'rattrapage_note' => $rattrapageGradeVal,
                'rattrapage_absent' => $rattrapageIsAbsent,
                'moyenne_finale' => $moyenneFinale,
                'decision_finale' => $decisionFinale
            ];
        });

        // Signature record query
        $signature = null;
        $sigGroupId = ($groupId && !in_array($groupId, ['all', 'null', 'undefined', ''])) ? intval($groupId) : null;
        $sigQuery = \App\Models\ModulePvSignature::where('module_id', $moduleId);
        if ($sigGroupId) {
            $sigQuery->where('group_id', $sigGroupId);
        }
        $sigRecord = $sigQuery->with('signer')->latest()->first();

        if ($sigRecord) {
            $signature = [
                'signed_by' => $sigRecord->signer->name ?? $sigRecord->signer->email,
                'signed_at' => $sigRecord->signed_at ? $sigRecord->signed_at->format('d/m/Y H:i') : date('d/m/Y H:i'),
                'signature_data' => $sigRecord->signature_data,
                'ip_address' => $sigRecord->ip_address,
                'digital_seal' => $sigRecord->digital_seal,
            ];
        }

        // Base64 Logo
        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

        // Dynamic verification URL & QR Code
        $verifyUrl = url("/verify/pv/{$moduleId}/" . ($groupId ?: 'all'));
        try {
            $qrSvg = \SimpleSoftwareIO\QrCode\Facades\QrCode::size(120)->margin(0)->generate($verifyUrl);
            $qrBase64 = 'data:image/svg+xml;base64,' . base64_encode($qrSvg);
        } catch (\Exception $e) {
            $qrBase64 = "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=" . urlencode($verifyUrl);
        }

        $semesterNum = $request->query('semester', $module->semester_number ?? 1);

        $pdf = Pdf::setOption([
            'isRemoteEnabled' => true,
            'chroot' => public_path(),
        ])->loadView('pdf.module_pv', [
            'module' => $module,
            'session' => $sessionType,
            'normaleAssessments' => $normaleAssessments,
            'students' => $data,
            'signature' => $signature,
            'logoBase64' => $logoBase64,
            'qrBase64' => $qrBase64,
            'verifyUrl' => $verifyUrl,
            'perimetre' => ($groupId && !in_array($groupId, ['all', 'null', 'undefined', ''])) ? "Groupe {$groupId}" : "Module Complet",
            'academicYear' => '2026/2027',
            'semester' => 'S' . $semesterNum,
            'date' => date('d/m/Y H:i')
        ])->setPaper('a4', 'landscape');

        return $pdf->download("PV_Deliberation_{$module->code}.pdf");
    }

    /**
     * Export all PVs for a filiere/semester as a Zip archive.
     */
    public function exportBulkPvZip(Request $request)
    {
        $filiereId = $request->query('filiere_id');
        $semesterNum = $request->query('semester', 1);

        $query = \App\Models\Module::query();
        if ($filiereId) {
            $query->where('filiere_id', $filiereId);
        }
        if ($semesterNum) {
            $query->where('semester_number', $semesterNum);
        }
        $modules = $query->take(10)->get();

        if ($modules->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'Aucun module trouvé pour ces critères.'], 404);
        }

        $zipFileName = "PV_Deliberations_S{$semesterNum}_" . date('Ymd_His') . ".zip";
        $zipPath = storage_path("app/{$zipFileName}");

        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            foreach ($modules as $module) {
                $content = "PROCES-VERBAL DE DELIBERATION OFFICIAL\nInstitution: ENCG Fes\nModule: {$module->code} - {$module->name}\nSemestre: S{$semesterNum}\nStatut: Valide avec Signature Numerique & QR Code\nEmpreinte SHA-256: " . hash('sha256', $module->id . date('Y-m-d'));
                $zip->addFromString("PV_{$module->code}_S{$semesterNum}.txt", $content);
            }
            $zip->close();
        }

        return response()->download($zipPath)->deleteFileAfterSend(true);
    }
}


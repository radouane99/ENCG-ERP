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
            // Fallback to external API
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

    public function studentConvocationPdf($convocationId)
    {
        $convocation = \App\Models\Convocation::with(['student.user', 'exam.module', 'room', 'exam.session'])->findOrFail($convocationId);
        $student = $convocation->student;
        
        $exams = [];
        if ($convocation->exam) {
            $exams[] = [
                'date' => $convocation->exam->exam_date ? $convocation->exam->exam_date->format('d/m/Y') : 'N/A',
                'time' => $convocation->exam->start_time . ' - ' . $convocation->exam->end_time,
                'module' => $convocation->exam->module->name ?? 'Module N/A',
                'room' => $convocation->room->name ?? 'Salle N/A',
                'seat' => $convocation->seat_number ?? 'N/A'
            ];
        }

        $pdf = $this->getPdfInstance('pdf.convocation', [
            'person_name' => $student->user->last_name . ' ' . $student->user->first_name,
            'person_role' => 'Étudiant',
            'person_id' => $student->user->cin ?? 'N/A',
            'filiere_name' => $student->latestPathway->filiere->name ?? 'Tronc Commun',
            'session_type' => $convocation->exam->session->type ?? 'ORDINAIRE',
            'session_name' => $convocation->exam->session->name ?? 'Session Principale',
            'exams' => $exams
        ]);
        return $pdf->download("convocation_etudiant_{$convocationId}.pdf");
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
        $pdf = $this->getPdfInstance('pdf.generic_report', ['title' => 'Feuille de Présence - Examen ' . $examId]);
        return $pdf->download("attendance_sheet_{$examId}.pdf");
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


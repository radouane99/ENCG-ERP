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
        $pdf = $this->getPdfInstance('pdf.generic_report', [
            'title' => 'Convocation d\'Examen',
            'description' => 'Ceci est votre convocation officielle pour l\'examen. Veuillez vous munir de votre carte d\'étudiant.',
            'ref' => 'CONV-' . date('Y') . '-' . str_pad($convocationId, 6, '0', STR_PAD_LEFT)
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
        $pdf = $this->getPdfInstance('pdf.pv_examen', ['exam_id' => $examId]);
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
        $pdf = $this->getPdfInstance('pdf.ordre_mission');
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
}

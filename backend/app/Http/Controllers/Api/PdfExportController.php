<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PdfExportController extends Controller
{
    public function printSession(Request $request)
    {
        $pdf = Pdf::loadView('pdf.generic_report', ['title' => 'Convocations Étudiants (Session)']);
        return $pdf->download('convocations_session.pdf');
    }

    public function printProfessors(Request $request)
    {
        $pdf = Pdf::loadView('pdf.generic_report', ['title' => 'Convocations Surveillants']);
        return $pdf->download('convocations_profs.pdf');
    }

    public function pvExamen($examId)
    {
        $pdf = Pdf::loadView('pdf.pv_examen', ['exam_id' => $examId]);
        return $pdf->download("pv_examen_{$examId}.pdf");
    }

    public function pvGlobal()
    {
        $pdf = Pdf::loadView('pdf.generic_report', ['title' => 'PV Global - Synthèse Filière']);
        return $pdf->download('pv_global.pdf');
    }

    public function releveNotes($studentId = null, $year = null)
    {
        $pdf = Pdf::loadView('pdf.releve_notes', ['student_id' => $studentId, 'year' => $year]);
        return $pdf->stream("releve_notes.pdf");
    }

    public function previewOrdreMission()
    {
        $pdf = Pdf::loadView('pdf.ordre_mission');
        return $pdf->stream("ordre_mission.pdf");
    }

    public function previewConventionStage()
    {
        $pdf = Pdf::loadView('pdf.convention_stage');
        return $pdf->stream("convention_stage.pdf");
    }

    public function previewAttestationTravail()
    {
        $pdf = Pdf::loadView('pdf.attestation_travail');
        return $pdf->stream("attestation_travail.pdf");
    }

    public function attestationReussite($studentId, $year)
    {
        $pdf = Pdf::loadView('pdf.attestation', ['student_id' => $studentId, 'year' => $year]);
        return $pdf->download("attestation_{$studentId}_{$year}.pdf");
    }

    public function attendanceSheet($examId)
    {
        $pdf = Pdf::loadView('pdf.generic_report', ['title' => 'Feuille de Présence - Examen ' . $examId]);
        return $pdf->download("attendance_sheet_{$examId}.pdf");
    }

    public function rapportAbsences()
    {
        $pdf = Pdf::loadView('pdf.generic_report', ['title' => 'Rapport des Absences']);
        return $pdf->download('rapport_absences.pdf');
    }

    public function exportScheduleGroupPdf()
    {
        $pdf = Pdf::loadView('pdf.generic_report', ['title' => 'Emploi du Temps - Groupe']);
        return $pdf->download('schedule_group.pdf');
    }

    public function liveAttendancePdf($examId)
    {
        $pdf = Pdf::loadView('pdf.generic_report', ['title' => 'Présence Live - Examen ' . $examId]);
        return $pdf->download("live_attendance_{$examId}.pdf");
    }

    public function displayList($examId)
    {
        $pdf = Pdf::loadView('pdf.generic_report', ['title' => 'Liste Affichage Examen ' . $examId]);
        return $pdf->download("affichage_examen_{$examId}.pdf");
    }
}

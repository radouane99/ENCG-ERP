<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\ExamSurveillance;
use App\Models\Grade;
use App\Services\Documents\OfficialPdfFactory;

class ExamPdfController extends Controller
{
    public function __construct(private OfficialPdfFactory $pdfFactory) {}

    public function pvExamen(int $examId)
    {
        abort_if(request()->user()?->hasRole('student'), 403);
        $this->authorize('viewAny', Grade::class);

        $exam = Exam::with(['module.filiere', 'group', 'room', 'examSession'])->findOrFail($examId);

        $seatings = ExamSeating::with(['student.user'])
            ->where('exam_id', $examId)
            ->orderBy('seat_number')
            ->get();

        $surveillances = ExamSurveillance::with('professor')
            ->where('exam_id', $examId)
            ->get();

        $incidents = ExamIncident::with(['student.user'])
            ->where('exam_id', $examId)
            ->get();

        $seal = $exam->documentSeal();

        $mode = request()->query('mode', request()->query('type', 'pv'));
        if (request()->query('emargement') == '1') {
            $mode = 'emargement';
        }

        $attendance = ExamSeating::pvAttendanceTotals($seatings);

        $pdf = $this->pdfFactory->make('pdf.pv_examen', [
            'exam_id' => $examId,
            'exam' => $exam,
            'seatings' => $seatings,
            'surveillances' => $surveillances,
            'incidents' => $incidents,
            'mode' => $mode,
            'total_students' => $attendance['total_students'],
            'present_students' => $attendance['present_students'],
            'absent_students' => $attendance['absent_students'],
            'seal' => $seal,
            'generated_at' => now()->format('d/m/Y H:i'),
        ]);

        return $pdf->stream("PV_Examen_{$examId}.pdf", ['Attachment' => false]);
    }
}

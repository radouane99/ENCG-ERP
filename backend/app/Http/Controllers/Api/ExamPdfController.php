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
        if (request()->user()) {
            abort_if(request()->user()->hasRole('student'), 403);
        }

        $exam = Exam::with(['module.filiere', 'group', 'room', 'examSession'])->findOrFail($examId);

        $incidents = ExamIncident::with(['student.user'])
            ->where('exam_id', $examId)
            ->get();

        $fraudCnes = [];
        $fraudStudentIds = [];
        $fraudNames = [];
        foreach ($incidents as $inc) {
            if ($inc->student_id) $fraudStudentIds[] = (int) $inc->student_id;
            if ($inc->cne) $fraudCnes[] = strtoupper(trim($inc->cne));
            if ($inc->student_name) $fraudNames[] = strtolower(trim($inc->student_name));
            if ($inc->student?->cne) $fraudCnes[] = strtoupper(trim($inc->student->cne));
            if ($inc->student?->user?->name) $fraudNames[] = strtolower(trim($inc->student->user->name));
        }

        $seatings = ExamSeating::with(['student.user'])
            ->where('exam_id', $examId)
            ->get()
            ->map(function ($s) use ($fraudStudentIds, $fraudCnes, $fraudNames) {
                $seatNumber = \App\Services\Academic\ExamConvocationService::seatNumberFor($s);
                $s->seat_number = 'N° ' . str_pad($seatNumber, 2, '0', STR_PAD_LEFT);
                $s->seat_num_val = $seatNumber;
                $s->cne = $s->student?->cne ?? ('N13' . str_pad($s->student_id ?? 1, 7, '0', STR_PAD_LEFT));
                $s->student_name = $s->student?->user?->name ?? 'Étudiant ENCG';

                $cneUpper = strtoupper(trim($s->cne));
                $nameLower = strtolower(trim($s->student_name));
                $isFraud = in_array((int) $s->student_id, $fraudStudentIds)
                    || in_array($cneUpper, $fraudCnes)
                    || in_array($nameLower, $fraudNames);

                $s->is_fraud = $isFraud;
                if ($isFraud) {
                    $s->is_present = true;
                }
                return $s;
            })
            ->sortBy('seat_num_val')
            ->values();

        $surveillances = ExamSurveillance::with(['professor.user'])
            ->where('exam_id', $examId)
            ->get();

        $seal = $exam->documentSeal();

        $mode = request()->query('mode', request()->query('type', 'pv'));
        if (request()->query('emargement') == '1') {
            $mode = 'emargement';
        }

        $totalCount = $seatings->count();
        $fraudCount = $seatings->where('is_fraud', true)->count() ?: count($incidents);
        $absentCount = $seatings->where('is_present', false)->where('is_fraud', false)->count();
        $presentCount = $seatings->where('is_present', true)->where('is_fraud', false)->count();

        $secondarySignature = request()->query('signature') ?? request()->input('signature');
        $secondarySignatureImg = null;
        if ($secondarySignature && str_starts_with($secondarySignature, 'data:image')) {
            $secondarySignatureImg = $secondarySignature;
        }

        $qrUrl = url("/verification/pv-examen/{$examId}?token=" . md5("ENCG-PV-{$examId}-{$seal}"));
        $qrBase64 = null;
        try {
            $renderer = new \BaconQrCode\Renderer\ImageRenderer(
                new \BaconQrCode\Renderer\RendererStyle\RendererStyle(120, 1),
                new \BaconQrCode\Renderer\Image\SvgImageBackEnd()
            );
            $writer = new \BaconQrCode\Writer($renderer);
            $svg = $writer->writeString($qrUrl);
            $qrBase64 = 'data:image/svg+xml;base64,' . base64_encode($svg);
        } catch (\Throwable $e) {}

        $pdf = $this->pdfFactory->make('pdf.pv_examen', [
            'exam_id' => $examId,
            'exam' => $exam,
            'seatings' => $seatings,
            'surveillances' => $surveillances,
            'incidents' => $incidents,
            'mode' => $mode,
            'total_students' => $totalCount,
            'present_students' => $presentCount,
            'absent_students' => $absentCount,
            'fraud_count' => $fraudCount,
            'secondarySignatureImg' => $secondarySignatureImg,
            'seal' => $seal,
            'qrBase64' => $qrBase64,
            'generated_at' => now()->format('d/m/Y H:i'),
        ]);

        return $pdf->stream("PV_Examen_{$examId}.pdf", ['Attachment' => false]);
    }
}

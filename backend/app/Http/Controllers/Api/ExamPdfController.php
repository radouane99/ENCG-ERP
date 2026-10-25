<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\ExamSurveillance;
use App\Services\Academic\ExamWorkflowGuard;
use App\Services\Documents\OfficialPdfFactory;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class ExamPdfController extends Controller
{
    public function __construct(private OfficialPdfFactory $pdfFactory) {}

    public function pvExamen(int $examId)
    {
        if (request()->user()) {
            abort_if(request()->user()->hasRole('student'), 403);
        }

        $exam = Exam::with(['module.filiere', 'group', 'room', 'examSession'])->findOrFail($examId);

        app(ExamWorkflowGuard::class)->viewExam($exam);

        $incidentsDb = ExamIncident::with(['student.user'])
            ->where('exam_id', $examId)
            ->latest()
            ->get();

        $incidents = collect();
        foreach ($incidentsDb as $inc) {
            $rawType = strtoupper(trim(str_replace(['🚨', '⚠️', '?', '[?]', '[✓]'], '', $inc->type ?? 'FRAUDE')));
            $cleanType = (empty($rawType) || str_contains($rawType, 'FRAUD')) ? 'FRAUDE' : $rawType;

            $incidents->push((object) [
                'id' => $inc->id,
                'student_id' => $inc->student_id,
                'student_name' => $inc->student?->user?->name ?? ($inc->student_name ?? '—'),
                'cne' => $inc->student?->cne ?? ($inc->cne ?? '—'),
                'type' => $cleanType,
                'description' => $inc->description ?? '—',
                'confiscated_items' => $inc->confiscated_items ?? 'Aucun',
            ]);
        }

        $rawSeatings = ExamSeating::with(['student.user'])
            ->where('exam_id', $examId)
            ->orderBy('id', 'asc')
            ->get();

        $incidentStudents = $incidents->pluck('student_id')->all();
        $seatings = $rawSeatings->map(function ($seat) use ($incidentStudents) {
            $seat->seat_num_val = $seat->seat_number;
            $seat->seat_number = 'N° '.str_pad((string) $seat->seat_number, 2, '0', STR_PAD_LEFT);
            $seat->cne = $seat->student?->cne ?? '—';
            $seat->student_name = $seat->student?->user?->name ?? '—';
            $seat->is_fraud = in_array($seat->student_id, $incidentStudents);

            return $seat;
        })->sortBy('seat_num_val')->values();

        $surveillances = ExamSurveillance::with(['professor.user'])
            ->where('exam_id', $examId)
            ->get();

        $principalSurv = $surveillances->first(function ($s) {
            $r = strtolower($s->role ?? '');

            return str_contains($r, 'principal') || str_contains($r, 'president');
        }) ?? $surveillances->first();

        $secondarySurv = $surveillances->first(function ($s) use ($principalSurv) {
            return $s->id !== $principalSurv?->id;
        });

        $principalName = $principalSurv?->professor?->user?->name
            ?? $principalSurv?->professor?->name
            ?? 'Surveillant Principal';

        $secondaryName = $secondarySurv?->professor?->user?->name
            ?? $secondarySurv?->professor?->name
            ?? 'Surveillant Secondaire';

        $seal = $exam->documentSeal();

        $mode = request()->query('mode', request()->query('type', 'pv'));
        if (request()->query('emargement') == '1') {
            $mode = 'emargement';
        }

        $totalCount = $seatings->count();
        $fraudCount = $seatings->where('is_fraud', true)->count() ?: count($incidents);
        $absentCount = $seatings->whereStrict('is_present', false)->count();
        $presentCount = $seatings->whereStrict('is_present', true)->count();

        $principalSig = $principalSurv?->signed_at ? ($principalSurv->signature_data ?: 'DIGITAL_CERTIFIED_STAMP_ENCG') : null;
        $secondarySig = $secondarySurv?->signed_at ? ($secondarySurv->signature_data ?: 'DIGITAL_CERTIFIED_STAMP_ENCG') : null;

        $principalSignatureImg = null;
        if ($principalSig && str_starts_with($principalSig, 'data:image')) {
            $principalSignatureImg = $principalSig;
        }

        $secondarySignatureImg = null;
        if ($secondarySig && str_starts_with($secondarySig, 'data:image')) {
            $secondarySignatureImg = $secondarySig;
        }

        $hasPrincipalSignature = ! empty($principalSig);
        $hasSecondarySignature = ! empty($secondarySig);

        $qrUrl = url("/admin/exams/{$examId}/surveillance");
        $qrBase64 = null;
        try {
            $renderer = new ImageRenderer(
                new RendererStyle(120, 1),
                new SvgImageBackEnd
            );
            $writer = new Writer($renderer);
            $svg = $writer->writeString($qrUrl);
            $qrBase64 = 'data:image/svg+xml;base64,'.base64_encode($svg);
        } catch (\Throwable $e) {
        }

        $pdf = $this->pdfFactory->make('pdf.pv_examen', [
            'exam_id' => $examId,
            'verifyUrl' => $qrUrl,
            'exam' => $exam,
            'seatings' => $seatings,
            'surveillances' => $surveillances,
            'principalName' => $principalName,
            'secondaryName' => $secondaryName,
            'incidents' => $incidents,
            'mode' => $mode,
            'total_students' => $totalCount,
            'present_students' => $presentCount,
            'absent_students' => $absentCount,
            'unrecorded_students' => $seatings->whereNull('is_present')->count(),
            'fraud_count' => $fraudCount,
            'principalSignatureImg' => $principalSignatureImg,
            'hasPrincipalSignature' => $hasPrincipalSignature,
            'secondarySignatureImg' => $secondarySignatureImg,
            'hasSecondarySignature' => $hasSecondarySignature,
            'seal' => $seal,
            'qrBase64' => $qrBase64,
            'generated_at' => now()->format('d/m/Y H:i'),
        ]);

        return $pdf->stream("PV_Examen_{$examId}.pdf", ['Attachment' => false]);
    }
}

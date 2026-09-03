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

        $incidentsFromQuery = [];
        if (request()->filled('incidents')) {
            try {
                $decoded = json_decode(request()->input('incidents'), true);
                if (is_array($decoded)) {
                    $incidentsFromQuery = $decoded;
                }
            } catch (\Throwable $e) {}
        }

        // Cleanup duplicate rows in database for this exam if any exist
        try {
            $existingDb = ExamIncident::where('exam_id', $examId)->get();
            $seenStudents = [];
            foreach ($existingDb as $row) {
                if (in_array($row->student_id, $seenStudents)) {
                    $row->delete();
                } else {
                    $seenStudents[] = $row->student_id;
                }
            }
        } catch (\Throwable $e) {}

        $incidentsDb = ExamIncident::with(['student.user'])
            ->where('exam_id', $examId)
            ->latest()
            ->get();

        $incidents = collect();
        foreach ($incidentsDb as $inc) {
            $rawType = strtoupper(trim(str_replace(['🚨', '⚠️', '?', '[?]', '[✓]'], '', $inc->type ?? 'FRAUDE')));
            $cleanType = (empty($rawType) || str_contains($rawType, 'FRAUD')) ? 'FRAUDE' : $rawType;

            $incidents->push((object)[
                'id' => $inc->id,
                'student_id' => $inc->student_id,
                'student_name' => $inc->student?->user?->name ?? ($inc->student_name ?? '—'),
                'cne' => $inc->student?->cne ?? ($inc->cne ?? '—'),
                'type' => $cleanType,
                'description' => $inc->description ?? '—',
                'confiscated_items' => $inc->confiscated_items ?? 'Aucun',
            ]);
        }

        if ($incidents->isEmpty()) {
            foreach ($incidentsFromQuery as $incQ) {
                $rawType = strtoupper(trim(str_replace(['🚨', '⚠️', '?', '[?]', '[✓]'], '', $incQ['type'] ?? 'FRAUDE')));
                $cleanType = (empty($rawType) || str_contains($rawType, 'FRAUD')) ? 'FRAUDE' : $rawType;

                $incidents->push((object)[
                    'id' => $incQ['id'] ?? null,
                    'student_id' => $incQ['student_id'] ?? null,
                    'student_name' => $incQ['student_name'] ?? '—',
                    'cne' => $incQ['cne'] ?? '—',
                    'type' => $cleanType,
                    'description' => $incQ['description'] ?? '—',
                    'confiscated_items' => $incQ['confiscated_items'] ?? 'Aucun',
                ]);
            }
        }

        // 🛡️ CRITICAL DEDUPLICATION: Strictly ONE incident per student
        $incidents = $incidents->unique(function($item) {
            $cne = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $item->cne ?? ''));
            return $cne ?: strtolower(trim($item->student_name ?? ''));
        })->values();

        $fraudCnes = [];
        $fraudStudentIds = [];
        $fraudNames = [];
        foreach ($incidents as $inc) {
            if (!empty($inc->student_id)) $fraudStudentIds[] = (int) $inc->student_id;
            if (!empty($inc->cne) && $inc->cne !== '—') {
                $cneClean = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $inc->cne));
                $fraudCnes[] = $cneClean;
                $fraudCnes[] = preg_replace('/^[MN]/', '', $cneClean);
            }
            if (!empty($inc->student_name) && $inc->student_name !== '—') {
                $fraudNames[] = strtolower(trim($inc->student_name));
            }
        }

        $rawSeatings = ExamSeating::with(['student.user'])
            ->where('exam_id', $examId)
            ->orderBy('id', 'asc')
            ->get();

        // 💺 Fix corrupted seat numbers if identical (e.g. all 125)
        $distinctSeats = $rawSeatings->pluck('seat_number')->unique();
        $isCorrupted = $distinctSeats->count() <= 1 || $distinctSeats->contains(125);

        if ($isCorrupted) {
            foreach ($rawSeatings as $i => $item) {
                $item->seat_number = $i + 1;
                try {
                    ExamSeating::where('id', $item->id)->update(['seat_number' => $i + 1]);
                } catch (\Throwable $e) {}
            }
        }

        $seatings = $rawSeatings
            ->map(function ($s, $idx) use ($fraudStudentIds, $fraudCnes, $fraudNames, $incidents, $isCorrupted) {
                $seatVal = ($isCorrupted || empty($s->seat_number) || $s->seat_number == 125)
                    ? ($idx + 1)
                    : (is_numeric($s->seat_number) ? (int)$s->seat_number : ($idx + 1));

                $s->seat_number = 'N° ' . str_pad($seatVal, 2, '0', STR_PAD_LEFT);
                $s->seat_num_val = $seatVal;
                $s->cne = $s->student?->cne ?? ('N13' . str_pad($s->student_id ?? ($idx + 1), 7, '0', STR_PAD_LEFT));
                $s->student_name = $s->student?->user?->name ?? 'Étudiant';

                $cneClean = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $s->cne));
                $cneSuffix = preg_replace('/^[MN]/', '', $cneClean);
                $nameLower = strtolower(trim($s->student_name));

                $isFraud = in_array((int) $s->student_id, $fraudStudentIds)
                    || in_array($cneClean, $fraudCnes)
                    || in_array($cneSuffix, $fraudCnes)
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

        $principalSurv = $surveillances->first(function($s) {
            $r = strtolower($s->role ?? '');
            return str_contains($r, 'principal') || str_contains($r, 'president');
        }) ?? $surveillances->first();

        $secondarySurv = $surveillances->first(function($s) use ($principalSurv) {
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
        $absentCount = $seatings->where('is_present', false)->where('is_fraud', false)->count();
        $presentCount = $seatings->where('is_present', true)->where('is_fraud', false)->count();

        // ✍️ SEPARATE SIGNATURES FOR EACH PROFESSOR
        $principalSig = request()->query('principal_signature')
            ?? request()->input('principal_signature')
            ?? \Illuminate\Support\Facades\Cache::get("exam_pv_principal_signature_{$examId}");

        $secondarySig = request()->query('secondary_signature')
            ?? request()->input('secondary_signature')
            ?? \Illuminate\Support\Facades\Cache::get("exam_pv_secondary_signature_{$examId}");

        // If secondary signature was accidentally mirrored or stored in principal slot, resolve it:
        if ($principalSig && $secondarySig && $principalSig === $secondarySig) {
            $principalSig = null;
            \Illuminate\Support\Facades\Cache::forget("exam_pv_principal_signature_{$examId}");
        } elseif (!$secondarySig && $principalSig) {
            // Check if what was stored in principal was actually Chraibi's drawn signature
            $legacySig = \Illuminate\Support\Facades\Cache::get("exam_pv_signature_{$examId}");
            $secondarySig = $principalSig;
            $principalSig = null;
            \Illuminate\Support\Facades\Cache::put("exam_pv_secondary_signature_{$examId}", $secondarySig, 86400 * 7);
            \Illuminate\Support\Facades\Cache::forget("exam_pv_principal_signature_{$examId}");
        }

        \Illuminate\Support\Facades\Cache::forget("exam_pv_signature_{$examId}");

        $principalSignatureImg = null;
        if ($principalSig && str_starts_with($principalSig, 'data:image')) {
            $principalSignatureImg = $principalSig;
        }

        $secondarySignatureImg = null;
        if ($secondarySig && str_starts_with($secondarySig, 'data:image')) {
            $secondarySignatureImg = $secondarySig;
        }

        $hasPrincipalSignature = !empty($principalSig);
        $hasSecondarySignature = !empty($secondarySig);

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
            'principalName' => $principalName,
            'secondaryName' => $secondaryName,
            'incidents' => $incidents,
            'mode' => $mode,
            'total_students' => $totalCount,
            'present_students' => $presentCount,
            'absent_students' => $absentCount,
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

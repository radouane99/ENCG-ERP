<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Convocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentConvocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // Only return non-draft convocations to students
        $convocations = Convocation::where('student_id', $request->user()->id)
            ->whereIn('status', ['sent', 'viewed', 'printed'])
            ->with(['exam.module', 'room'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['convocations' => $convocations]);
    }

    public function download(int $id, Request $request): JsonResponse
    {
        $convocation = Convocation::where('id', $id)
            ->where('student_id', $request->user()->id)
            ->firstOrFail();

        // Mark as viewed if it's the first time
        if ($convocation->status === 'sent') {
            $convocation->update(['status' => 'viewed']);
        }

        // Generate PDF using dompdf
        if (!class_exists('Barryvdh\DomPDF\Facade\Pdf')) {
            return response()->json(['success' => false, 'message' => 'Le module PDF n\'est pas installé.'], 500);
        }

        $verificationUrl = url("/api/v1/admin/convocations/verify/{$convocation->qr_token}");
        $qrCode = base64_encode(\SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(100)->generate($verificationUrl));

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.convocation', [
            'convocation' => $convocation,
            'exam' => $convocation->exam,
            'student' => $convocation->student,
            'room' => $convocation->room,
            'qrCode' => $qrCode,
            'date' => now()->format('d/m/Y')
        ]);

        return $pdf->download("Convocation_{$convocation->exam->module->name}_{$convocation->student->last_name}.pdf");
    }
}

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
        $user = $request->user();
        $student = \App\Models\Student::where('user_id', $user->id)->first();
        $studentId = $student ? $student->id : 0;
        $sessionType = strtoupper($request->query('session_type', 'ORDINAIRE'));

        // Query real exam seatings from database
        $seatings = \App\Models\ExamSeating::with(['exam.module', 'room'])
            ->where('student_id', $studentId)
            ->get();

        $convocations = $seatings->map(function ($s) {
            $exam = $s->exam;
            return [
                'id' => $s->id,
                'module' => $exam->module->name ?? 'Module d\'Examen',
                'code' => $exam->module->code ?? 'MOD-' . $exam->id,
                'date' => $exam->exam_date ? \Carbon\Carbon::parse($exam->exam_date)->format('d/m/Y') : 'À déterminer',
                'time' => $exam->start_time ? substr($exam->start_time, 0, 5) : '09:00',
                'duration' => ($exam->duration_minutes ?? 120) . ' min',
                'room' => $s->room->name ?? 'Salle 12',
                'seat' => 'Table N° ' . ($s->seat_number ?? 1),
                'status' => 'Publiée',
                'qrToken' => $s->qr_token ?? ('CONV-' . $s->id)
            ];
        });

        return response()->json([
            'success' => true,
            'convocations' => $convocations,
            'session_type' => $sessionType
        ]);
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

    public function walletPass(int $id, Request $request): JsonResponse
    {
        // In a real scenario, this would generate and return a .pkpass file.
        // Here we simulate the generation of the pass.
        
        $seating = \App\Models\ExamSeating::with(['exam.module', 'room'])
            ->where('id', $id)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'message' => 'Passbook generated successfully',
            'pass_url' => url("/api/v1/student-portal/convocations/{$id}/download") // fallback to PDF for simulation
        ]);
    }

    public function declareAbsence(int $id, Request $request): JsonResponse
    {
        $request->validate([
            'reason' => 'required|string',
            'certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048'
        ]);

        $seating = \App\Models\ExamSeating::findOrFail($id);
        
        $path = null;
        if ($request->hasFile('certificate')) {
            $path = $request->file('certificate')->store('certificates', 'public');
        }

        \App\Models\ExamIncident::create([
            'exam_id' => $seating->exam_id,
            'student_id' => $seating->student_id,
            'type' => 'absence_justifiee',
            'description' => $request->input('reason'),
            'attachment_path' => $path,
            'reported_by' => $request->user()->id
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Absence déclarée avec succès.'
        ]);
    }
}

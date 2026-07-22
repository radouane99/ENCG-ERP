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
        $qrCodeBase64 = base64_encode(\SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(100)->generate($verificationUrl));

        $semId = (int) ($convocation->exam?->module?->semester_number ?? $convocation->exam?->module?->semester_id ?? 1);
        if ($semId <= 2) $niveauName = '1ère Année';
        elseif ($semId <= 4) $niveauName = '2ème Année';
        elseif ($semId <= 6) $niveauName = '3ème Année';
        elseif ($semId <= 8) $niveauName = '4ème Année';
        else $niveauName = '5ème Année';
        
        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.convocation', [
            'convocation' => $convocation,
            'exams' => [
                [
                    'date' => $convocation->exam->exam_date ? \Carbon\Carbon::parse($convocation->exam->exam_date)->format('d/m/Y') : 'À déterminer',
                    'time' => $convocation->exam->start_time ? substr($convocation->exam->start_time, 0, 5) : '09:00',
                    'module' => $convocation->exam->module->name ?? 'Module',
                    'room' => $convocation->room->name ?? '-',
                    'seat' => 'Table N° ' . ($convocation->seat_number ?? 1),
                    'enseignant' => '-'
                ]
            ],
            'session_name' => "Session de Fin de Semestre",
            'session_type' => "ORDINAIRE",
            'person_name' => ($convocation->student->user->first_name ?? '') . ' ' . ($convocation->student->user->last_name ?? ''),
            'person_role' => 'Étudiant',
            'person_id' => $convocation->student->cne ?? 'N/A',
            'filiere_name' => $convocation->student->latestPathway?->filiere?->name ?? 'Tronc Commun',
            'niveau_name' => $niveauName,
            'qrCodeBase64' => $qrCodeBase64,
            'logoBase64' => $logoBase64,
            'date' => now()->format('d/m/Y')
        ]);

        $firstName = str_replace(' ', '_', strtolower($convocation->student->user->first_name ?? ''));
        $lastName = str_replace(' ', '_', strtolower($convocation->student->user->last_name ?? ''));
        return $pdf->download("convocation_{$lastName}_{$firstName}.pdf");
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

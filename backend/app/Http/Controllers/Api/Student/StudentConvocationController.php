<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Convocation;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class StudentConvocationController extends Controller
{
    /**
     * Liste des convocations de l'étudiant.
     */
    public function index(Request $request): JsonResponse
    {
        $student   = Student::where('user_id', $request->user()->id)->first();
        $studentId = $student?->id ?? 0;

        $seatings = ExamSeating::with(['exam.module', 'room'])
            ->where('student_id', $studentId)
            ->get();

        $convocations = $seatings->map(function ($s) {
            $exam = $s->exam;
            return [
                'id'       => $s->id,
                'module'   => $exam->module->name ?? 'N/A',
                'code'     => $exam->module->code ?? 'MOD-' . $exam->id,
                'date'     => $exam->exam_date ? Carbon::parse($exam->exam_date)->format('d/m/Y') : 'À déterminer',
                'time'     => $exam->start_time ? substr($exam->start_time, 0, 5) : '09:00',
                'duration' => ($exam->duration_minutes ?? 120) . ' min',
                'room'     => $s->room->name ?? 'N/A',
                'seat'     => 'Table N° ' . ($s->seat_number ?? 1),
                'status'   => 'Publiée',
                'qrToken'  => $s->qr_token ?? ('CONV-' . $s->id),
            ];
        });

        return response()->json([
            'success'       => true,
            'convocations'  => $convocations,
        ]);
    }

    /**
     * Télécharger une convocation en PDF.
     */
    public function download(int $id, Request $request)
    {
        $convocation = Convocation::where('id', $id)
            ->where('student_id', $request->user()->id)
            ->firstOrFail();

        if ($convocation->status === 'sent') {
            $convocation->update(['status' => 'viewed']);
        }

        $verificationUrl = url("/api/v1/admin/convocations/verify/{$convocation->qr_token}");
        $qrCodeBase64    = base64_encode(QrCode::format('svg')->size(100)->generate($verificationUrl));

        $semId = (int) ($convocation->exam?->module?->semester_number ?? 1);
        $niveauName = match (true) {
            $semId <= 2 => '1ère Année',
            $semId <= 4 => '2ème Année',
            $semId <= 6 => '3ème Année',
            $semId <= 8 => '4ème Année',
            default     => '5ème Année',
        };

        $logoPath   = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

        $student   = $convocation->student;
        $firstName = str_replace(' ', '_', strtolower($student->user->first_name ?? ''));
        $lastName  = str_replace(' ', '_', strtolower($student->user->last_name ?? ''));

        $pdf = Pdf::loadView('pdf.convocation', [
            'convocation'   => $convocation,
            'exams'         => [[
                'date'       => $convocation->exam->exam_date ? Carbon::parse($convocation->exam->exam_date)->format('d/m/Y') : 'À déterminer',
                'time'       => $convocation->exam->start_time ? substr($convocation->exam->start_time, 0, 5) : '09:00',
                'module'     => $convocation->exam->module->name ?? 'N/A',
                'room'       => $convocation->room->name ?? '-',
                'seat'       => 'Table N° ' . ($convocation->seat_number ?? 1),
                'enseignant' => '-',
            ]],
            'session_name'  => 'Session de Fin de Semestre',
            'session_type'  => 'ORDINAIRE',
            'person_name'   => ($student->user->first_name ?? '') . ' ' . ($student->user->last_name ?? ''),
            'person_role'   => 'Étudiant',
            'person_id'     => $student->cne ?? 'N/A',
            'filiere_name'  => $student->latestPathway?->filiere?->name ?? 'Tronc Commun',
            'niveau_name'   => $niveauName,
            'qrCodeBase64'  => $qrCodeBase64,
            'logoBase64'    => $logoBase64,
            'date'          => now()->format('d/m/Y'),
        ]);

        return $pdf->download("convocation_{$lastName}_{$firstName}.pdf");
    }

    /**
     * Wallet Pass (simulation).
     */
    public function walletPass(int $id, Request $request): JsonResponse
    {
        ExamSeating::with(['exam.module', 'room'])->findOrFail($id);

        return response()->json([
            'success'  => true,
            'message'  => 'Pass généré.',
            'pass_url' => url("/api/v1/student-portal/convocations/{$id}/download"),
        ]);
    }

    /**
     * Déclarer une absence.
     */
    public function declareAbsence(int $id, Request $request): JsonResponse
    {
        $request->validate([
            'reason'      => 'required|string',
            'certificate' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        $seating = ExamSeating::findOrFail($id);

        $path = $request->hasFile('certificate')
            ? $request->file('certificate')->store('certificates', 'public')
            : null;

        ExamIncident::create([
            'exam_id'         => $seating->exam_id,
            'student_id'      => $seating->student_id,
            'type'            => 'absence_justifiee',
            'description'     => $request->input('reason'),
            'attachment_path' => $path,
            'reported_by'     => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Absence déclarée avec succès.',
        ]);
    }
}
<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Models\Internship;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class InternshipConventionController extends Controller
{
    /**
     * Liste des conventions de stage de l'étudiant connecté.
     */
    public function studentIndex(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::where('user_id', $user->id)->first();
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $internships = Internship::where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $internships,
        ]);
    }

    /**
     * Dépôt d'une demande de convention de stage tripartite.
     */
    public function studentStore(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::where('user_id', $user->id)->first();
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $validated = $request->validate([
            'type' => 'required|in:initiation,application,fin_etudes,pfe',
            'company_name' => 'required|string|max:255',
            'company_address' => 'nullable|string|max:255',
            'company_city' => 'nullable|string|max:100',
            'company_mentor_name' => 'required|string|max:255',
            'company_mentor_title' => 'nullable|string|max:255',
            'supervisor_email' => 'required|email|max:255',
            'supervisor_phone' => 'nullable|string|max:50',
            'position_title' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'monthly_allowance' => 'nullable|numeric|min:0',
            'insurance_policy_number' => 'nullable|string|max:100',
        ]);

        $conventionRef = 'CONV-ENCG-' . date('Y') . '-' . strtoupper(Str::random(6));
        $securityToken = Str::random(40);

        $internship = Internship::create([
            'student_id' => $student->id,
            'institution_id' => $student->institution_id ?? 1,
            'academic_year_id' => $student->academic_year_id ?? 1,
            'type' => $validated['type'],
            'company_name' => $validated['company_name'],
            'company_address' => $validated['company_address'] ?? null,
            'company_city' => $validated['company_city'] ?? 'Casablanca / Fès',
            'company_mentor_name' => $validated['company_mentor_name'],
            'supervisor_name' => $validated['company_mentor_name'],
            'company_mentor_title' => $validated['company_mentor_title'] ?? 'Tuteur Entreprise',
            'supervisor_email' => $validated['supervisor_email'],
            'supervisor_phone' => $validated['supervisor_phone'] ?? null,
            'position_title' => $validated['position_title'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'monthly_allowance' => $validated['monthly_allowance'] ?? 0,
            'insurance_policy_number' => $validated['insurance_policy_number'] ?? ('POL-ENCG-' . date('Y') . '-' . $student->id),
            'insurance_company' => 'MAMDA-MCMA / Assurance Scolaire',
            'insurance_verified' => true,
            'convention_ref' => $conventionRef,
            'convention_status' => 'school_signed', // Pre-validated by ENCG direction
            'school_signed_at' => now(),
            'security_token' => $securityToken,
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Votre convention de stage a été générée et visée avec succès !',
            'data' => $internship,
        ], 201);
    }

    /**
     * Signature électronique par l'entreprise d'accueil (via lien sécurisé).
     */
    public function publicSignCompany(Request $request, string $token): JsonResponse
    {
        $internship = Internship::where('security_token', $token)->firstOrFail();
        $internship->convention_status = 'active';
        $internship->company_signed_at = now();
        $internship->save();

        return response()->json([
            'success' => true,
            'message' => 'La convention de stage a été validée et signée électroniquement par l\'entreprise d\'accueil.',
            'data' => $internship,
        ]);
    }

    /**
     * Téléchargement du PDF officiel de la Convention Tripartite de Stage.
     */
    public function downloadConventionPdf(Request $request, int $id)
    {
        $internship = Internship::with(['student.user', 'student.filiere'])->findOrFail($id);
        $student = $internship->student;

        $trackingCode = $internship->convention_ref ?? ('CONV-ENCG-' . date('Y') . '-' . str_pad($id, 4, '0', STR_PAD_LEFT));
        $verifyUrl = config('app.frontend_url', 'http://localhost:5173') . "/verify/{$trackingCode}";

        $qrBase64 = '';
        if (class_exists(QrCode::class)) {
            try {
                $qrSvg = QrCode::format('svg')->size(90)->margin(0)->generate($verifyUrl);
                $qrBase64 = 'data:image/svg+xml;base64,' . base64_encode($qrSvg);
            } catch (\Throwable $e) {
                Log::warning('QR Code error: ' . $e->getMessage());
            }
        }

        $pdf = Pdf::loadView('pdf.convention_stage', [
            'internship' => $internship,
            'student' => $student,
            'conventionRef' => $trackingCode,
            'academicYear' => '2026/2027',
            'startDateStr' => $internship->start_date ? $internship->start_date->format('d/m/Y') : now()->format('d/m/Y'),
            'endDateStr' => $internship->end_date ? $internship->end_date->format('d/m/Y') : now()->addMonths(2)->format('d/m/Y'),
            'qrBase64' => $qrBase64,
        ]);

        return $pdf->stream("Convention_Stage_{$trackingCode}.pdf", ['Attachment' => false]);
    }
}

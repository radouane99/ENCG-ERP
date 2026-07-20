<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Professor;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;

class DocumentCenterController extends Controller
{
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'document_type' => 'required|string',
        ]);

        $student = Student::with('user')->findOrFail($validated['student_id']);
        $token = Str::random(32);

        return response()->json([
            'success' => true,
            'data' => [
                'message' => 'Document généré avec succès',
                'document_type' => $validated['document_type'],
                'student_name' => trim(($student->user->first_name ?? '') . ' ' . ($student->user->last_name ?? '')),
                'verification_token' => $token,
                'download_url' => url("/api/documents/download/{$validated['document_type']}/{$student->id}?token={$token}"),
                'created_at' => now()->toIso8601String(),
            ]
        ]);
    }

    public function downloadDocument(Request $request, string $type, int $id)
    {
        $token = $request->query('token', Str::random(16));
        $verifyUrl = config('app.url', 'http://localhost:8000') . "/verify/doc/{$token}";
        $qrBase64 = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($verifyUrl);

        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

        $year = '2025/2026';
        $date = now()->format('d/m/Y');

        if (in_array($type, ['attestation_scolarite', 'attestation', 'scolarite'])) {
            $student = Student::with(['user', 'latestPathway.filiere'])->findOrFail($id);
            $pdf = Pdf::loadView('pdf.attestation', [
                'student' => $student->user ? (object)[
                    'first_name' => $student->user->first_name,
                    'last_name' => $student->user->last_name,
                    'cne' => $student->cne_cme ?? $student->student_number,
                    'student_number' => $student->student_number,
                    'latestPathway' => $student->latestPathway
                ] : $student,
                'year' => $year,
                'date' => $date,
                'qrBase64' => $qrBase64,
                'logoBase64' => $logoBase64
            ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);
            
            return $pdf->download("Attestation_Scolarite_{$student->id}.pdf");
        }

        if (in_array($type, ['attestation_travail', 'travail'])) {
            $professor = Professor::with('user')->find($id) ?? (object)[
                'first_name' => 'Enseignant', 'last_name' => 'ENCG', 'cin' => 'F123456', 'specialty' => 'Management'
            ];
            $pdf = Pdf::loadView('pdf.attestation_travail', [
                'professor' => $professor->user ?? $professor,
                'year' => $year,
                'date' => $date,
                'qrBase64' => $qrBase64,
                'logoBase64' => $logoBase64
            ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

            return $pdf->download("Attestation_Travail_{$id}.pdf");
        }

        if (in_array($type, ['convention_stage', 'stage', 'convention'])) {
            $student = Student::with(['user', 'latestPathway.filiere'])->findOrFail($id);
            $pdf = Pdf::loadView('pdf.convention_stage', [
                'student' => $student->user ? (object)[
                    'first_name' => $student->user->first_name,
                    'last_name' => $student->user->last_name,
                    'cne' => $student->cne_cme ?? $student->student_number,
                    'student_number' => $student->student_number,
                    'latestPathway' => $student->latestPathway
                ] : $student,
                'year' => $year,
                'date' => $date,
                'company' => 'Entreprise Partenaire ENCG',
                'qrBase64' => $qrBase64,
                'logoBase64' => $logoBase64
            ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

            return $pdf->download("Convention_Stage_{$student->id}.pdf");
        }

        // Fallback generic report
        $pdf = Pdf::loadView('pdf.generic_report', [
            'title' => strtoupper(str_replace('_', ' ', $type)),
            'content' => "Document officiel type {$type} délivré par l'ENCG Fès.",
            'date' => $date,
            'qrBase64' => $qrBase64,
            'logoBase64' => $logoBase64
        ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

        return $pdf->download("Document_{$type}_{$id}.pdf");
    }
}

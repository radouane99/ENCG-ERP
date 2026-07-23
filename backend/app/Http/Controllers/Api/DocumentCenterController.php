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
        $token = $request->query('token');
        if (!$token) {
            abort(400, 'Token de téléchargement manquant.');
        }

        $verifyUrl = config('app.url', 'http://localhost:8000') . "/verify/doc/{$token}";
        $qrBase64 = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($verifyUrl);

        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,' . base64_encode(file_get_contents($logoPath)) : '';

        $year = '2025/2026';
        $date = now()->format('d/m/Y');

        if (in_array($type, ['attestation_scolarite', 'attestation', 'scolarite'])) {
            $student = Student::with(['user', 'latestPathway.filiere'])->findOrFail($id);
            $pdf = Pdf::loadView('pdf.attestation_officielle', [
                'type' => 'ATTESTATION DE SCOLARITÉ',
                'student' => (object)[
                    'first_name' => $student->user?->first_name ?? $student->first_name,
                    'last_name' => $student->user?->last_name ?? $student->last_name,
                    'cne' => $student->cne_cme ?? $student->cne ?? $student->student_number,
                    'cin' => $student->user?->cin ?? $student->cin ?? 'N/A',
                    'filiere' => $student->latestPathway?->filiere?->name ?? 'Tronc Commun ENCG Fès',
                ],
                'year' => $year,
                'date' => $date,
                'token' => $token,
                'qrBase64' => $qrBase64,
                'logoBase64' => $logoBase64
            ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);
            
            return $pdf->download("Attestation_Scolarite_Officielle_{$student->id}.pdf");
        }

        if (in_array($type, ['attestation_reussite', 'reussite'])) {
            $student = Student::with(['user', 'latestPathway.filiere'])->findOrFail($id);
            $pdf = Pdf::loadView('pdf.attestation_officielle', [
                'type' => 'ATTESTATION DE RÉUSSITE',
                'student' => (object)[
                    'first_name' => $student->user?->first_name ?? $student->first_name,
                    'last_name' => $student->user?->last_name ?? $student->last_name,
                    'cne' => $student->cne_cme ?? $student->cne ?? $student->student_number,
                    'cin' => $student->user?->cin ?? $student->cin ?? 'N/A',
                    'filiere' => $student->latestPathway?->filiere?->name ?? 'Tronc Commun ENCG Fès',
                ],
                'year' => $year,
                'date' => $date,
                'token' => $token,
                'qrBase64' => $qrBase64,
                'logoBase64' => $logoBase64
            ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

            return $pdf->download("Attestation_Reussite_Officielle_{$student->id}.pdf");
        }

        if (in_array($type, ['attestation_decharge', 'decharge'])) {
            $student = Student::with(['user', 'latestPathway.filiere'])->findOrFail($id);
            $pdf = Pdf::loadView('pdf.attestation_decharge', [
                'student' => $student->user ? (object)[
                    'first_name' => $student->user->first_name,
                    'last_name' => $student->user->last_name,
                    'cne' => $student->cne_cme ?? $student->student_number,
                    'student_number' => $student->student_number
                ] : $student,
                'year' => $year,
                'date' => $date,
                'qrBase64' => $qrBase64,
                'logoBase64' => $logoBase64
            ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

            return $pdf->download("Attestation_Decharge_{$student->id}.pdf");
        }

        if (in_array($type, ['attestation_vacations', 'vacations'])) {
            $professor = Professor::with(['user', 'department', 'vacationContracts.module', 'vacationContracts.group'])
                ->findOrFail($id);
            $contracts = $professor->vacationContracts;
            $pdf = Pdf::loadView('pdf.attestation_vacations', [
                'professor' => $professor,
                'contracts' => $contracts,
                'year' => $year,
                'date' => $date,
                'qrBase64' => $qrBase64,
                'logoBase64' => $logoBase64
            ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

            return $pdf->download("Attestation_Vacations_{$professor->last_name}_{$professor->first_name}.pdf");
        }

        if (in_array($type, ['attestation_travail', 'travail'])) {
            $professor = Professor::with(['user', 'department'])->findOrFail($id);
            $pdf = Pdf::loadView('pdf.attestation_travail', [
                'professor' => $professor,
                'year' => $year,
                'date' => $date,
                'qrBase64' => $qrBase64,
                'logoBase64' => $logoBase64
            ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

            return $pdf->download("Attestation_Travail_{$professor->last_name}_{$professor->first_name}.pdf");
        }

        if (in_array($type, ['convention_stage', 'stage', 'convention'])) {
            $student = Student::with(['user', 'latestPathway.filiere'])->findOrFail($id);
            $pdf = Pdf::loadView('pdf.convention_stage', [
                'student' => $student->user ? (object)[
                    'first_name' => $student->user->first_name,
                    'last_name' => $student->user->last_name,
                    'cne' => $student->cne_cme ?? $student->student_number,
                    'student_number' => $student->student_number,
                    'latestPathway' => $student->latestPathway,
                ] : $student,
                'year' => $year,
                'date' => $date,
                'company' => 'Entreprise Partenaire ENCG',
                'qrBase64' => $qrBase64,
                'logoBase64' => $logoBase64,
            ])->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

            return $pdf->download("Convention_Stage_{$student->id}.pdf");
        }

        abort(404, 'Type de document non pris en charge.');
    }
}

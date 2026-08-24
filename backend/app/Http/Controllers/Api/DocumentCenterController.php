<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Professor;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class DocumentCenterController extends Controller
{
    /**
     * Générer un document (métadonnées).
     */
    public function generate(Request $request): JsonResponse
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
                'message' => 'Document généré avec succès.',
                'document_type' => $validated['document_type'],
                'student_name' => trim(($student->user->first_name ?? '').' '.($student->user->last_name ?? '')),
                'verification_token' => $token,
                'download_url' => url("/api/documents/download/{$validated['document_type']}/{$student->id}?token={$token}"),
                'created_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Télécharger un document PDF.
     */
    public function downloadDocument(Request $request, string $type, int $id)
    {
        $token = $request->query('token');
        if (! $token) {
            abort(400, 'Token de téléchargement manquant.');
        }

        $qrBase64 = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='.urlencode(config('app.url')."/verify/doc/{$token}");
        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath)) : '';
        $year = '2025/2026';
        $date = now()->format('d/m/Y');

        $commonData = compact('qrBase64', 'logoBase64', 'year', 'date');

        return match (true) {
            in_array($type, ['attestation_scolarite', 'attestation', 'scolarite']) => $this->downloadStudentPdf($id, 'ATTESTATION DE SCOLARITÉ', 'Attestation_Scolarite', 'pdf.attestation_officielle', $commonData),

            in_array($type, ['attestation_reussite', 'reussite']) => $this->downloadStudentPdf($id, 'ATTESTATION DE RÉUSSITE', 'Attestation_Reussite', 'pdf.attestation_officielle', $commonData),

            in_array($type, ['attestation_decharge', 'decharge']) => $this->downloadStudentPdf($id, null, 'Attestation_Decharge', 'pdf.attestation_decharge', $commonData),

            in_array($type, ['attestation_vacations', 'vacations']) => $this->downloadProfessorPdf($id, 'pdf.attestation_vacations', 'Attestation_Vacations', $commonData),

            in_array($type, ['attestation_travail', 'travail']) => $this->downloadProfessorPdf($id, 'pdf.attestation_travail', 'Attestation_Travail', $commonData),

            in_array($type, ['convention_stage', 'stage', 'convention']) => $this->downloadConventionStagePdf($id, $commonData),

            default => abort(404, 'Type de document non pris en charge.'),
        };
    }

    /**
     * Télécharger un PDF pour un étudiant.
     */
    private function downloadStudentPdf(int $id, ?string $typeLabel, string $prefix, string $view, array $commonData): Response
    {
        $student = Student::with(['user', 'latestPathway.filiere'])->findOrFail($id);

        $data = array_merge($commonData, [
            'student' => (object) [
                'first_name' => $student->user->first_name ?? $student->first_name ?? 'N/A',
                'last_name' => $student->user->last_name ?? $student->last_name ?? 'N/A',
                'cne' => $student->cne ?? $student->student_number ?? 'N/A',
                'cin' => $student->user->cin ?? $student->cin ?? 'N/A',
                'filiere' => $student->latestPathway?->filiere?->name ?? 'Tronc Commun ENCG Fès',
            ],
        ]);

        if ($typeLabel) {
            $data['type'] = $typeLabel;
        }

        $pdf = Pdf::loadView($view, $data)->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

        return $pdf->download("{$prefix}_Officielle_{$student->id}.pdf");
    }

    /**
     * Télécharger un PDF pour un professeur.
     */
    private function downloadProfessorPdf(int $id, string $view, string $prefix, array $commonData): Response
    {
        $professor = Professor::with(['user', 'department', 'vacationContracts.module', 'vacationContracts.group'])->findOrFail($id);

        $data = array_merge($commonData, [
            'professor' => $professor,
            'contracts' => $professor->vacationContracts,
        ]);

        $pdf = Pdf::loadView($view, $data)->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

        return $pdf->download("{$prefix}_{$professor->last_name}_{$professor->first_name}.pdf");
    }

    /**
     * Télécharger une convention de stage.
     */
    private function downloadConventionStagePdf(int $id, array $commonData): Response
    {
        $student = Student::with(['user', 'latestPathway.filiere'])->findOrFail($id);

        $data = array_merge($commonData, [
            'student' => (object) [
                'first_name' => $student->user->first_name ?? $student->first_name ?? 'N/A',
                'last_name' => $student->user->last_name ?? $student->last_name ?? 'N/A',
                'cne' => $student->cne ?? $student->student_number ?? 'N/A',
                'student_number' => $student->student_number,
                'latestPathway' => $student->latestPathway,
            ],
            'company' => 'Entreprise Partenaire ENCG',
        ]);

        $pdf = Pdf::loadView('pdf.convention_stage', $data)->setPaper('a4', 'portrait')->setOptions(['isRemoteEnabled' => true]);

        return $pdf->download("Convention_Stage_{$student->id}.pdf");
    }
}

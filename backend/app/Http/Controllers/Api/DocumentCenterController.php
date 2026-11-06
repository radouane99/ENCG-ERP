<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Professor;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DocumentCenterController extends Controller
{
    /**
     * Télécharger un document PDF.
     */
    public function downloadDocument(Request $request, string $type, int $id)
    {
        $token = $request->query('v') ?? $request->query('token');
        if (! $token) {
            abort(400, 'Token de téléchargement manquant.');
        }

        $qrBase64 = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='.urlencode(config('app.url')."/verify/doc/{$token}");
        $logoPath = public_path('logo-encg.png');
        $logoBase64 = file_exists($logoPath) ? 'data:image/png;base64,'.base64_encode(file_get_contents($logoPath)) : '';
        $year = '2025/2026';
        $date = now()->format('d/m/Y');
        $institutionId = $request->user()->institution_id;

        $commonData = compact('qrBase64', 'logoBase64', 'year', 'date');

        return match (true) {
            in_array($type, ['attestation_scolarite', 'attestation', 'scolarite']) => $this->downloadStudentPdf($institutionId, $id, 'ATTESTATION DE SCOLARITÉ', 'Attestation_Scolarite', 'pdf.attestation_officielle', $commonData),

            in_array($type, ['attestation_reussite', 'reussite']) => $this->downloadStudentPdf($institutionId, $id, 'ATTESTATION DE RÉUSSITE', 'Attestation_Reussite', 'pdf.attestation_officielle', $commonData),

            in_array($type, ['attestation_decharge', 'decharge']) => $this->downloadStudentPdf($institutionId, $id, null, 'Attestation_Decharge', 'pdf.attestation_decharge', $commonData),

            in_array($type, ['attestation_vacations', 'vacations']) => $this->downloadProfessorPdf($institutionId, $id, 'pdf.attestation_vacations', 'Attestation_Vacations', $commonData),

            in_array($type, ['attestation_travail', 'travail']) => $this->downloadProfessorPdf($institutionId, $id, 'pdf.attestation_travail', 'Attestation_Travail', $commonData),

            in_array($type, ['convention_stage', 'stage', 'convention']) => $this->downloadConventionStagePdf($institutionId, $id, $commonData),

            default => abort(404, 'Type de document non pris en charge.'),
        };
    }

    /**
     * Télécharger un PDF pour un étudiant.
     */
    private function downloadStudentPdf(int $institutionId, int $id, ?string $typeLabel, string $prefix, string $view, array $commonData): Response
    {
        $student = Student::with(['user', 'latestPathway.filiere'])->where('institution_id', $institutionId)->findOrFail($id);

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
    private function downloadProfessorPdf(int $institutionId, int $id, string $view, string $prefix, array $commonData): Response
    {
        $professor = Professor::with(['user', 'department', 'vacationContracts.module', 'vacationContracts.group'])->where('institution_id', $institutionId)->findOrFail($id);

        $isVacataire = ($professor->contract_type === 'vacataire')
            || ($professor->type === 'vacataire')
            || (bool) $professor->user?->hasRole('vacataire');

        if ($isVacataire && $view === 'pdf.attestation_travail') {
            abort(403, 'Accès restreint : Un enseignant vacataire ne peut pas obtenir d\'Attestation de Travail statutaire.');
        }

        if (! $isVacataire && $view === 'pdf.attestation_vacations') {
            abort(403, 'Accès restreint : L\'Attestation d\'Heures de Vacation est réservée aux enseignants vacataires.');
        }

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
    private function downloadConventionStagePdf(int $institutionId, int $id, array $commonData): Response
    {
        $student = Student::with(['user', 'latestPathway.filiere'])->where('institution_id', $institutionId)->findOrFail($id);

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

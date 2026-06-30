<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\View;

class AcademicReportController extends Controller
{
    /**
     * Generate PDF Reports for the APOGEE Deliberation Engine
     */
    public function generate(Request $request, string $type)
    {
        // Require dompdf to be available
        if (!class_exists('Barryvdh\DomPDF\Facade\Pdf')) {
            return response()->json(['success' => false, 'message' => 'Le module PDF n\'est pas installé.'], 500);
        }

        $semester = $request->input('semester', '1');
        $session = $request->input('session', 'normale');

        $data = [
            'institution' => 'École Nationale de Commerce et de Gestion - Fès',
            'academic_year' => '2024-2025',
            'semester' => "Semestre $semester",
            'session' => $session === 'normale' ? 'Session Normale' : 'Session de Rattrapage',
            'date' => now()->format('d/m/Y'),
            'type' => $this->getReportTitle($type),
        ];

        // Mock data tailored to the report type
        $data['records'] = $this->getMockDataForType($type);

        $pdf = Pdf::loadView('reports.academic_pdf', $data);
        
        return $pdf->stream("{$type}_S{$semester}_{$session}.pdf");
    }

    private function getReportTitle(string $type): string
    {
        return match($type) {
            'deliberation_pv' => 'Procès-Verbal de Délibération',
            'compensation' => 'Rapport des Compensations Semestrielles',
            'reserved_modules' => 'Bilan des Modules Réservés (1A -> 2A)',
            'jury_proposals' => 'Propositions de Décisions du Jury',
            default => 'Rapport Académique'
        };
    }

    private function getMockDataForType(string $type): array
    {
        switch ($type) {
            case 'compensation':
                return [
                    ['student' => 'Fatima ALAOUI', 'cne' => 'N123456789', 'average' => '10.25', 'detail' => 'Module A (8/20) compensé'],
                    ['student' => 'Youssef BENALI', 'cne' => 'M987654321', 'average' => '11.50', 'detail' => 'Module C (9/20) compensé'],
                ];
            case 'reserved_modules':
                return [
                    ['student' => 'Amina CHRAIBI', 'cne' => 'R112233445', 'average' => '9.50', 'detail' => '2 Modules Réservés (Passage Autorisé)'],
                    ['student' => 'Karim TAZI', 'cne' => 'S556677889', 'average' => '7.20', 'detail' => '3 Modules Réservés (Redoublement)'],
                ];
            default:
                return [
                    ['student' => 'Fatima ALAOUI', 'cne' => 'N123456789', 'average' => '14.50', 'detail' => 'Admis (V)'],
                    ['student' => 'Youssef BENALI', 'cne' => 'M987654321', 'average' => '11.50', 'detail' => 'Admis par compensation (VPC)'],
                    ['student' => 'Karim TAZI', 'cne' => 'S556677889', 'average' => '7.20', 'detail' => 'Ajourné (NV)'],
                ];
        }
    }
}

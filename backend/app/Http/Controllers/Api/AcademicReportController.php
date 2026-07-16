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
        // Use real students from the database
        $students = \App\Models\Student::with('user')->take(10)->get();
        $records = [];

        foreach ($students as $student) {
            $name = $student->user ? $student->user->name : 'Inconnu';
            $cne = $student->cne ?? 'N/A';
            
            // Generate realistic report data based on real students
            switch ($type) {
                case 'compensation':
                    $records[] = [
                        'student' => $name, 
                        'cne' => $cne, 
                        'average' => '10.' . rand(10, 99), 
                        'detail' => 'Module ' . chr(rand(65, 90)) . ' compensé'
                    ];
                    break;
                case 'reserved_modules':
                    $records[] = [
                        'student' => $name, 
                        'cne' => $cne, 
                        'average' => rand(7, 9) . '.' . rand(10, 99), 
                        'detail' => rand(1, 3) . ' Modules Réservés'
                    ];
                    break;
                default:
                    $avg = rand(8, 16);
                    $records[] = [
                        'student' => $name, 
                        'cne' => $cne, 
                        'average' => $avg . '.' . rand(10, 99), 
                        'detail' => $avg >= 10 ? 'Admis' : 'Ajourné'
                    ];
                    break;
            }
        }
        return $records;
    }
}

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

        $data['records'] = $this->getRealReportDataForType($type);

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

    private function getRealReportDataForType(string $type): array
    {
        $students = \App\Models\Student::with(['user', 'grades'])->take(20)->get();
        $records = [];

        foreach ($students as $student) {
            $name = $student->user ? $student->user->name : 'Étudiant ID ' . $student->id;
            $cne = $student->cne ?? 'N/A';
            
            $grades = $student->grades->pluck('value')->filter(fn($v) => is_numeric($v))->map(fn($v) => (float)$v);
            $avg = $grades->count() > 0 ? round($grades->avg(), 2) : 10.00;

            switch ($type) {
                case 'compensation':
                    $records[] = [
                        'student' => $name, 
                        'cne' => $cne, 
                        'average' => number_format($avg, 2), 
                        'detail' => $avg >= 10 ? 'Compensation validée' : 'Non compensé'
                    ];
                    break;
                case 'reserved_modules':
                    $pendingRetakesCount = \Illuminate\Support\Facades\DB::table('student_module_retakes')
                        ->where('student_id', $student->id)
                        ->where('status', 'pending')
                        ->count();
                    $records[] = [
                        'student' => $name, 
                        'cne' => $cne, 
                        'average' => number_format($avg, 2), 
                        'detail' => $pendingRetakesCount . ' Modules Réservés'
                    ];
                    break;
                default:
                    $records[] = [
                        'student' => $name, 
                        'cne' => $cne, 
                        'average' => number_format($avg, 2), 
                        'detail' => $avg >= 10 ? 'Admis' : 'Ajourné'
                    ];
                    break;
            }
        }
        return $records;
    }
}

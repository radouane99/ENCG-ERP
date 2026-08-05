<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentModuleRetake;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicReportController extends Controller
{
    /**
     * Générer un rapport académique PDF.
     */
    public function generate(Request $request, string $type)
    {
        $semester = $request->input('semester', '1');
        $session  = $request->input('session', 'normale');

        $data = [
            'institution'   => 'École Nationale de Commerce et de Gestion - Fès',
            'academic_year' => '2024-2025',
            'semester'      => "Semestre {$semester}",
            'session'       => $session === 'normale' ? 'Session Normale' : 'Session de Rattrapage',
            'date'          => now()->format('d/m/Y'),
            'type'          => $this->getReportTitle($type),
            'records'       => $this->getReportData($type),
        ];

        $pdf = Pdf::loadView('reports.academic_pdf', $data);

        return $pdf->stream("{$type}_S{$semester}_{$session}.pdf");
    }

    /**
     * Titre du rapport selon le type.
     */
    private function getReportTitle(string $type): string
    {
        return match ($type) {
            'deliberation_pv'  => 'Procès-Verbal de Délibération',
            'compensation'     => 'Rapport des Compensations Semestrielles',
            'reserved_modules' => 'Bilan des Modules Réservés (1A -> 2A)',
            'jury_proposals'   => 'Propositions de Décisions du Jury',
            default            => 'Rapport Académique',
        };
    }

    /**
     * Données du rapport selon le type.
     */
    private function getReportData(string $type): array
    {
        $students = Student::with(['user', 'grades'])->take(20)->get();
        $records  = [];

        foreach ($students as $student) {
            $name = $student->user?->name ?? 'Étudiant ID ' . $student->id;
            $cne  = $student->cne ?? 'N/A';

            $grades = $student->grades
                ->pluck('value')
                ->filter(fn($v) => is_numeric($v))
                ->map(fn($v) => (float) $v);

            $avg = $grades->count() > 0 ? round($grades->avg(), 2) : 10.00;

            $records[] = [
                'student' => $name,
                'cne'     => $cne,
                'average' => number_format($avg, 2),
                'detail'  => $this->getDetailForType($type, $avg, $student->id),
            ];
        }

        return $records;
    }

    /**
     * Détail selon le type de rapport.
     */
    private function getDetailForType(string $type, float $avg, int $studentId): string
    {
        return match ($type) {
            'compensation'     => $avg >= 10 ? 'Compensation validée' : 'Non compensé',
            'reserved_modules' => $this->getPendingRetakesCount($studentId) . ' Modules Réservés',
            default            => $avg >= 10 ? 'Admis' : 'Ajourné',
        };
    }

    /**
     * Nombre de rattrapages en attente pour un étudiant.
     */
    private function getPendingRetakesCount(int $studentId): int
    {
        return StudentModuleRetake::where('student_id', $studentId)
            ->where('status', 'pending')
            ->count();
    }
}
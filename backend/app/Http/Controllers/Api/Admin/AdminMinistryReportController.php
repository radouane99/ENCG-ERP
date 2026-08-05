<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\DocumentRequest;
use App\Models\Filiere;
use App\Models\FinalProject;
use App\Models\Grade;
use App\Models\Module;
use App\Models\Student;
use App\Models\StudentRegistration;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminMinistryReportController extends Controller
{
    /**
     * Rapport annuel Ministère MESRSFC.
     */
    public function getReport(): JsonResponse
    {
        // Statistiques étudiants
        $totalStudents = Student::count();
        $femaleCount   = Student::whereIn('gender', ['F', 'female'])->count();
        $maleCount     = Student::whereIn('gender', ['M', 'male'])->count();

        // Par filière
        $byFiliere = Filiere::withCount(['students'])->orderByDesc('students_count')->get()->map(fn($f) => [
            'filiere' => $f->name,
            'count'   => $f->students_count,
        ]);

        // Taux de réussite
        $studentsWithGrades = Grade::selectRaw('student_id, AVG(value) as avg_grade')
            ->groupBy('student_id')
            ->get();

        $totalWithGrades = $studentsWithGrades->count();
        $successCount    = $studentsWithGrades->filter(fn($s) => (float) $s->avg_grade >= 10)->count();
        $successRate     = $totalWithGrades > 0 ? round(($successCount / $totalWithGrades) * 100, 1) : 0;

        // Professeurs
        $totalProfs = User::where('role', 'professor')->count();
        $vacataires = User::where('role', 'vacataire')->count();

        // PFE
        $totalPfe     = FinalProject::count();
        $validatedPfe = FinalProject::whereIn('status', ['validated', 'approved', 'completed'])->count();

        // Modules
        $totalModules = Module::count();

        // Documents
        $totalDocRequests = DocumentRequest::count();
        $deliveredDocs    = DocumentRequest::where('status', 'delivered')->count();

        // Absences
        $totalAbsences      = Attendance::count();
        $justifiedAbsences  = Attendance::where('is_justified', true)->count();

        return response()->json([
            'success'      => true,
            'generated_at' => now()->toIso8601String(),
            'academic_year' => AcademicYear::where('is_current', true)->value('label') ?? '2025-2026',
            'institution'  => [
                'name'        => 'École Nationale de Commerce et de Gestion de Fès',
                'code_massar' => 'ENCG-FES-01',
                'tutelle'     => 'Ministère de l\'Enseignement Supérieur (MESRSFC)',
            ],
            'effectifs' => [
                'total_inscrits'     => $totalStudents,
                'femmes'             => $femaleCount,
                'hommes'             => $maleCount,
                'taux_feminisation'  => $totalStudents > 0 ? round(($femaleCount / $totalStudents) * 100, 1) : 0,
                'par_filiere'        => $byFiliere,
            ],
            'pedagogie' => [
                'taux_reussite'          => $successRate,
                'total_modules'          => $totalModules,
                'total_professeurs'      => $totalProfs,
                'vacataires'             => $vacataires,
                'ratio_etudiants_prof'   => $totalProfs > 0 ? round($totalStudents / $totalProfs, 1) : 0,
            ],
            'stages_pfe' => [
                'total_soumis'    => $totalPfe,
                'total_valides'   => $validatedPfe,
                'taux_validation' => $totalPfe > 0 ? round(($validatedPfe / $totalPfe) * 100, 1) : 0,
            ],
            'mobilite_internationale' => [
                'etudiants_sortants' => 0, // Module mobilité non trouvé
            ],
            'vie_administrative' => [
                'demandes_documents_total' => $totalDocRequests,
                'demandes_delivrees'       => $deliveredDocs,
                'taux_delivrance'          => $totalDocRequests > 0 ? round(($deliveredDocs / $totalDocRequests) * 100, 1) : 0,
                'absences_total'           => $totalAbsences,
                'absences_justifiees'      => $justifiedAbsences,
                'taux_justification'       => $totalAbsences > 0 ? round(($justifiedAbsences / $totalAbsences) * 100, 1) : 0,
            ],
        ]);
    }
}
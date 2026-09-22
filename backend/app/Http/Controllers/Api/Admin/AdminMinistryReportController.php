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
        $femaleCount = Student::whereIn('gender', ['F', 'female'])->count();
        $maleCount = Student::whereIn('gender', ['M', 'male'])->count();

        // Par filière
        $byFiliere = Filiere::withCount(['students'])->orderByDesc('students_count')->get()->map(fn ($f) => [
            'filiere' => $f->name,
            'count' => $f->students_count,
        ]);

        // Taux de réussite
        $studentsWithGrades = Grade::selectRaw('student_id, AVG(value) as avg_grade')
            ->groupBy('student_id')
            ->get();

        $totalWithGrades = $studentsWithGrades->count();
        $successCount = $studentsWithGrades->filter(fn ($s) => (float) $s->avg_grade >= 10)->count();
        $successRate = $totalWithGrades > 0 ? round(($successCount / $totalWithGrades) * 100, 1) : 0;

        // Professeurs
        $totalProfs = User::role('professor')->count();
        if ($totalProfs === 0) {
            $totalProfs = \App\Models\Professor::count();
        }
        $vacataires = User::role('vacataire')->count();

        // PFE
        $totalPfe = FinalProject::count();
        $validatedPfe = FinalProject::whereIn('status', ['validated', 'approved', 'completed'])->count();

        // Modules
        $totalModules = Module::count();

        // Documents
        $totalDocRequests = DocumentRequest::count();
        $deliveredDocs = DocumentRequest::where('status', 'delivered')->count();

        // Absences
        $totalAbsences = Attendance::count();
        $justifiedAbsences = Attendance::where('is_justified', true)->count();

        return response()->json([
            'success' => true,
            'generated_at' => now()->toIso8601String(),
            'academic_year' => AcademicYear::where('is_current', true)->value('label') ?? '2025-2026',
            'institution' => [
                'name' => 'École Nationale de Commerce et de Gestion de Fès',
                'code_massar' => 'ENCG-FES-01',
                'tutelle' => 'Ministère de l\'Enseignement Supérieur (MESRSFC)',
            ],
            'effectifs' => [
                'total_inscrits' => $totalStudents,
                'femmes' => $femaleCount,
                'hommes' => $maleCount,
                'taux_feminisation' => $totalStudents > 0 ? round(($femaleCount / $totalStudents) * 100, 1) : 0,
                'par_filiere' => $byFiliere,
            ],
            'pedagogie' => [
                'taux_reussite' => $successRate,
                'total_modules' => $totalModules,
                'total_professeurs' => $totalProfs,
                'vacataires' => $vacataires,
                'ratio_etudiants_prof' => $totalProfs > 0 ? round($totalStudents / $totalProfs, 1) : 0,
            ],
            'stages_pfe' => [
                'total_soumis' => $totalPfe,
                'total_valides' => $validatedPfe,
                'taux_validation' => $totalPfe > 0 ? round(($validatedPfe / $totalPfe) * 100, 1) : 0,
            ],
            'mobilite_internationale' => [
                'etudiants_sortants' => 0, // Module mobilité non trouvé
            ],
            'vie_administrative' => [
                'demandes_documents_total' => $totalDocRequests,
                'demandes_delivrees' => $deliveredDocs,
                'taux_delivrance' => $totalDocRequests > 0 ? round(($deliveredDocs / $totalDocRequests) * 100, 1) : 0,
                'absences_total' => $totalAbsences,
                'absences_justifiees' => $justifiedAbsences,
                'taux_justification' => $totalAbsences > 0 ? round(($justifiedAbsences / $totalAbsences) * 100, 1) : 0,
            ],
        ]);
    }

    /**
     * Export PDF officiel certifié pour le Ministère MESRSFC.
     */
    public function exportPdf()
    {
        // Statistiques étudiants
        $totalStudents = Student::count();
        $femaleCount = Student::whereIn('gender', ['F', 'female'])->count();
        $maleCount = Student::whereIn('gender', ['M', 'male'])->count();
        $tauxFeminisation = $totalStudents > 0 ? round(($femaleCount / $totalStudents) * 100, 1) : 0;

        // Par filière
        $byFiliere = Filiere::withCount(['students'])->orderByDesc('students_count')->get()->map(fn ($f) => [
            'filiere' => $f->name,
            'code' => $f->code ?? ('FIL-' . str_pad((string)$f->id, 2, '0', STR_PAD_LEFT)),
            'count' => $f->students_count,
            'percentage' => $totalStudents > 0 ? round(($f->students_count / $totalStudents) * 100, 1) : 0,
        ]);

        // Taux de réussite
        $studentsWithGrades = Grade::selectRaw('student_id, AVG(value) as avg_grade')
            ->groupBy('student_id')
            ->get();

        $totalWithGrades = $studentsWithGrades->count();
        $successCount = $studentsWithGrades->filter(fn ($s) => (float) $s->avg_grade >= 10)->count();
        $successRate = $totalWithGrades > 0 ? round(($successCount / $totalWithGrades) * 100, 1) : 0;

        // Professeurs
        $totalProfs = User::role('professor')->count();
        if ($totalProfs === 0) {
            $totalProfs = \App\Models\Professor::count();
        }
        $vacataires = User::role('vacataire')->count();
        $ratioEtudiantProf = $totalProfs > 0 ? round($totalStudents / $totalProfs, 1) : 0;

        // PFE
        $totalPfe = FinalProject::count();
        $validatedPfe = FinalProject::whereIn('status', ['validated', 'approved', 'completed'])->count();
        $tauxValidation = $totalPfe > 0 ? round(($validatedPfe / $totalPfe) * 100, 1) : 0;

        // Modules
        $totalModules = Module::count();

        // Documents
        $totalDocRequests = DocumentRequest::count();
        $deliveredDocs = DocumentRequest::where('status', 'delivered')->count();
        $tauxDelivrance = $totalDocRequests > 0 ? round(($deliveredDocs / $totalDocRequests) * 100, 1) : 0;

        // Absences
        $totalAbsences = Attendance::count();
        $justifiedAbsences = Attendance::where('is_justified', true)->count();
        $tauxJustification = $totalAbsences > 0 ? round(($justifiedAbsences / $totalAbsences) * 100, 1) : 0;

        $academicYear = AcademicYear::where('is_current', true)->value('label') ?? '2025-2026';
        $refNumber = 'MESRSFC/ENCG-FÈS/STAT-' . date('Y') . '/N° 01';
        $generatedDate = now()->translatedFormat('d F Y');
        $sealHash = hash('sha256', 'MESRSFC-ENCG-' . $academicYear . '-' . $totalStudents . '-' . date('Ymd'));
        $verifyUrl = config('app.url', 'https://encg-fes.ac.ma') . '/verify/ministry-report/' . date('Y');

        $logoBase64 = null;
        foreach (['logo-encg.png', 'images/encg_logo.png', 'images/logo-encg.png', 'images/logo.png'] as $candidate) {
            $path = public_path($candidate);
            if (file_exists($path)) {
                $mime = str_ends_with($candidate, '.png') ? 'image/png' : 'image/jpeg';
                $logoBase64 = "data:{$mime};base64," . base64_encode((string) file_get_contents($path));
                break;
            }
        }

        $qrCodeBase64 = null;
        if (class_exists(\SimpleSoftwareIO\QrCode\Facades\QrCode::class)) {
            try {
                $qrSvg = \SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(120)->margin(0)->generate($verifyUrl);
                $qrCodeBase64 = 'data:image/svg+xml;base64,' . base64_encode($qrSvg);
            } catch (\Throwable $e) {
                // Fallback gracefully
            }
        }

        $arKingdom = \App\Helpers\ArabicGlyphReshaper::reshape('المملكة المغربية');
        $arMinistry = \App\Helpers\ArabicGlyphReshaper::reshape('وزارة التعليم العالي والبحث العلمي والابتكار');
        $arUniv = \App\Helpers\ArabicGlyphReshaper::reshape('جامعة سيدي محمد بن عبد الله - فاس');
        $arSchool = \App\Helpers\ArabicGlyphReshaper::reshape('المدرسة الوطنية للتجارة والتسيير بفاس');
        $arDocTitle = \App\Helpers\ArabicGlyphReshaper::reshape('التقرير الإحصائي السنوي الرسمي للوزارة الوصية');

        $data = compact(
            'totalStudents',
            'femaleCount',
            'maleCount',
            'tauxFeminisation',
            'byFiliere',
            'studentsWithGrades',
            'totalWithGrades',
            'successCount',
            'successRate',
            'totalProfs',
            'vacataires',
            'ratioEtudiantProf',
            'totalPfe',
            'validatedPfe',
            'tauxValidation',
            'totalModules',
            'totalDocRequests',
            'deliveredDocs',
            'tauxDelivrance',
            'totalAbsences',
            'justifiedAbsences',
            'tauxJustification',
            'academicYear',
            'refNumber',
            'generatedDate',
            'sealHash',
            'verifyUrl',
            'logoBase64',
            'qrCodeBase64',
            'arKingdom',
            'arMinistry',
            'arUniv',
            'arSchool',
            'arDocTitle'
        );

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.rapport_ministere_mesrsfc', $data)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
            ]);

        return $pdf->stream('Rapport_Officiel_MESRSFC_ENCG_Fes_' . date('Y') . '.pdf');
    }
}

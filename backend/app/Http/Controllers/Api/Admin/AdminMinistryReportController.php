<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminMinistryReportController extends Controller
{
    /**
     * Generate MESRSFC-compliant annual ministry report from real DB data.
     */
    public function getReport(): JsonResponse
    {
        try {
            // ── Student Statistics ─────────────────────────────────────────
            $totalStudents = DB::table('students')->count();

            $byGender = DB::table('students')
                ->select(DB::raw("COALESCE(gender, 'non_renseigne') as gender"), DB::raw('COUNT(*) as count'))
                ->groupBy('gender')
                ->get()
                ->keyBy('gender');

            $femaleCount = $byGender->get('F')->count ?? $byGender->get('female')->count ?? 0;
            $maleCount   = $byGender->get('M')->count ?? $byGender->get('male')->count ?? 0;

            // ── Enrollment by Filiere ──────────────────────────────────────
            $byFiliere = DB::table('student_registrations')
                ->join('filieres', 'student_registrations.filiere_id', '=', 'filieres.id')
                ->select('filieres.name as filiere', DB::raw('COUNT(DISTINCT student_registrations.student_id) as count'))
                ->groupBy('filieres.name')
                ->orderBy('count', 'desc')
                ->get();

            // ── Success Rate ───────────────────────────────────────────────
            $studentsWithGrades = DB::table('grades')
                ->select('student_id', DB::raw('AVG(grade) as avg_grade'))
                ->groupBy('student_id')
                ->get();

            $totalWithGrades = $studentsWithGrades->count();
            $successCount = $studentsWithGrades->filter(fn($s) => (float)$s->avg_grade >= 10)->count();
            $successRate = $totalWithGrades > 0 ? round(($successCount / $totalWithGrades) * 100, 1) : 0;

            // ── Professors ─────────────────────────────────────────────────
            $totalProfs = DB::table('users')->where('role', 'professor')->count();
            $vacataires = DB::table('users')->where('role', 'vacataire')->count();

            // ── Internships / PFE ──────────────────────────────────────────
            $internshipsTable = \Illuminate\Support\Facades\Schema::hasTable('final_projects') ? 'final_projects' : 'internships';
            $totalPfe = DB::table($internshipsTable)->count();
            $validatedPfe = DB::table($internshipsTable)
                ->whereIn('status', ['validated', 'approved', 'completed'])
                ->count();

            // ── Mobility ───────────────────────────────────────────────────
            $totalMobility = \Illuminate\Support\Facades\Schema::hasTable('mobilities')
                ? DB::table('mobilities')->where('status', 'approved')->count()
                : 0;

            // ── Modules ────────────────────────────────────────────────────
            $totalModules = DB::table('modules')->count();

            // ── Document Requests ─────────────────────────────────────────
            $totalDocRequests = DB::table('document_requests')->count();
            $deliveredDocs = DB::table('document_requests')->where('status', 'delivered')->count();

            // ── Absences ──────────────────────────────────────────────────
            $totalAbsences = DB::table('absences')->count();
            $justifiedAbsences = DB::table('absences')->where('is_justified', true)->count();

            return response()->json([
                'success' => true,
                'generated_at' => now()->toIso8601String(),
                'academic_year' => DB::table('academic_years')->where('is_active', true)->value('label') ?? 'S5-S6 2025-2026',
                'institution' => [
                    'name' => 'École Nationale de Commerce et de Gestion de Fès',
                    'code_massar' => 'ENCG-FES-01',
                    'tutelle' => 'Ministère de l\'Enseignement Supérieur, de la Recherche Scientifique et de la Formation des Cadres (MESRSFC)',
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
                    'etudiants_sortants' => $totalMobility,
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
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

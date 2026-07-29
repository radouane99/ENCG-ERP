<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\AdmissionCampaign;
use App\Models\Filiere;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TafemMinistryImportController extends Controller
{
    /**
     * 📥 Import Official Ministry TAFEM Admitted Candidates List (CSV/Excel).
     */
    public function importMinistryList(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
            'admission_campaign_id' => 'nullable|exists:admission_campaigns,id',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');

        if (!$handle) {
            return response()->json(['message' => 'Impossible de lire le fichier CSV.'], 422);
        }

        // Read header
        $header = fgetcsv($handle, 1000, ',');
        if (!$header) {
            fclose($handle);
            return response()->json(['message' => 'Fichier CSV vide ou format invalide.'], 422);
        }

        // Clean header columns and remove UTF-8 BOM
        $header = array_map(function ($h) {
            $cleaned = preg_replace('/[\x{FEFF}\x{FFFE}]/u', '', $h);
            $cleaned = str_replace(["\xEF\xBB\xBF", '\EF\BB\BF', 'EFBBBF'], '', $cleaned);
            return strtolower(trim($cleaned));
        }, $header);

        // Resolve or create Tronc Commun (Années Préparatoires ENCG)
        $tcFiliere = Filiere::where('code', 'TC-S1')
            ->orWhere('code', 'TC')
            ->orWhere('name', 'like', '%Tronc Commun%')
            ->orWhere('name', 'like', '%Préparatoires%')
            ->first();

        if (!$tcFiliere) {
            $deptId = \App\Models\Department::first()?->id ?? 1;
            $institutionId = \App\Models\Institution::first()?->id ?? 1;
            $tcFiliere = Filiere::create([
                'institution_id' => $institutionId,
                'department_id' => $deptId,
                'code' => 'TC-S1',
                'name' => 'Tronc Commun ENCG (Années Préparatoires S1-S4)',
                'cycle' => 'Grande École',
                'duration_years' => 2,
                'is_active' => true,
            ]);
        }

        // Ensure a valid AdmissionCampaign exists for Tronc Commun
        $campaign = AdmissionCampaign::where('status', 'open')->first()
            ?? AdmissionCampaign::first();

        if (!$campaign) {
            $institutionId = \App\Models\Institution::first()?->id ?? 1;
            $academicYear = \App\Models\AcademicYear::where('is_current', true)->first()
                ?? \App\Models\AcademicYear::first();

            if (!$academicYear) {
                $academicYear = \App\Models\AcademicYear::create([
                    'institution_id' => $institutionId,
                    'year' => date('Y') . '-' . (date('Y') + 1),
                    'start_date' => '2026-09-01',
                    'end_date' => '2027-06-30',
                    'is_current' => true,
                ]);
            }

            $campaign = AdmissionCampaign::create([
                'institution_id' => $institutionId,
                'filiere_id' => $tcFiliere->id,
                'academic_year_id' => $academicYear->id,
                'title' => "Concours TAFEM " . date('Y') . " — Tronc Commun ENCG Fès",
                'academic_year' => date('Y') . '-' . (date('Y') + 1),
                'status' => 'open',
                'open_date' => now()->startOfYear(),
                'close_date' => now()->endOfYear(),
            ]);
        }

        $importedCount = 0;
        $updatedCount = 0;
        $errors = [];
        $rowNum = 1;

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle, 1000, ',')) !== false) {
                $rowNum++;
                if (count($row) < 3) continue;

                $data = array_combine($header, array_pad($row, count($header), ''));

                $cne = strtoupper(trim($data['cne'] ?? $data['code_massar'] ?? ''));
                $cin = strtoupper(trim($data['cin'] ?? $data['cnie'] ?? ''));
                $firstName = trim($data['first_name'] ?? $data['prenom'] ?? '');
                $lastName = trim($data['last_name'] ?? $data['nom'] ?? '');
                $bacAverage = (float)($data['bac_average'] ?? $data['moyenne_bac'] ?? 16.0);
                $tafemScore = (float)($data['tafem_score'] ?? $data['note_tafem'] ?? 150.0);
                $listType = strtolower(trim($data['list_type'] ?? $data['liste'] ?? 'liste_principale'));

                if (empty($cne) || empty($firstName) || empty($lastName)) {
                    $errors[] = "Ligne {$rowNum} ignorée : CNE, Nom ou Prénom manquant.";
                    continue;
                }

                $app = Application::where('cne', $cne)->first();

                if ($app) {
                    $app->update([
                        'admission_campaign_id' => $campaign->id,
                        'cin' => $cin ?: $app->cin,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'bac_average' => $bacAverage,
                        'selection_score' => $tafemScore,
                        'status' => 'admis_tafem',
                    ]);
                    $updatedCount++;
                } else {
                    Application::create([
                        'admission_campaign_id' => $campaign->id,
                        'reference_number' => 'TAFEM-' . date('Y') . '-' . strtoupper(substr(md5($cne), 0, 6)),
                        'cne' => $cne,
                        'cin' => $cin,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'email' => strtolower($cne) . '@candidat.tafem.ma',
                        'phone' => '0600000000',
                        'birth_date' => '2006-01-01',
                        'bac_average' => $bacAverage,
                        'bac_year' => date('Y'),
                        'bac_series' => 'Sciences Mathématiques',
                        'selection_score' => $tafemScore,
                        'status' => 'admis_tafem',
                    ]);
                    $importedCount++;
                }
            }

            DB::commit();
            fclose($handle);

            return response()->json([
                'success' => true,
                'message' => "Importation Ministère TAFEM réussie !",
                'summary' => [
                    'imported_candidates' => $importedCount,
                    'updated_candidates'  => $updatedCount,
                    'total_processed'     => $importedCount + $updatedCount,
                    'errors'              => $errors,
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            if ($handle) fclose($handle);
            Log::error("Erreur Importation TAFEM Ministère : " . $e->getMessage());

            return response()->json([
                'message' => "Erreur lors de l'importation : " . $e->getMessage()
            ], 500);
        }
    }

    /**
     * 📥 Download Official Sample CSV Template for Ministry Admitted Candidates.
     */
    public function downloadTemplate(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="modele_import_admis_ministere_tafem.csv"',
        ];

        return response()->stream(function () {
            $file = fopen('php://output', 'w');
            // Write UTF-8 BOM for Excel compatibility
            fputs($file, "\xEF\xBB\xBF");

            // Header row
            fputcsv($file, ['cne', 'cin', 'last_name', 'first_name', 'bac_average', 'tafem_score', 'list_type', 'filiere_code']);

            // Sample rows (Données de test officielles TAFEM)
            fputcsv($file, ['N140091375', 'CD729102', 'El Attahri', 'Hiba', '16.63', '174.50', 'liste_principale', 'TC-S1']);
            fputcsv($file, ['M130089124', 'UB102938', 'Maazouzi', 'Ismaïl', '17.25', '182.00', 'liste_principale', 'TC-S1']);
            fputcsv($file, ['K135198274', 'EE882910', 'Bennani', 'Youssef', '15.80', '162.00', 'liste_attente_1', 'TC-S1']);
            fputcsv($file, ['P120094833', 'HA991823', 'Chraïbi', 'Kenzi', '16.10', '168.50', 'liste_attente_1', 'TC-S1']);

            fclose($file);
        }, 200, $headers);
    }
}

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
            'file' => 'required|file|max:10240',
            'admission_campaign_id' => 'nullable|exists:admission_campaigns,id',
        ]);

        $file = $request->file('file');
        $rawContent = file_get_contents($file->getRealPath());

        if (empty($rawContent)) {
            return response()->json(['message' => 'Fichier CSV vide ou il n\'y a pas de contenu.'], 422);
        }

        // Strip UTF-8 BOM bytes if present
        if (substr($rawContent, 0, 3) === "\xEF\xBB\xBF") {
            $rawContent = substr($rawContent, 3);
        }

        // Convert entire file content to UTF-8 safely to prevent preg_replace /u null returns on Windows-1252
        $utf8Content = mb_convert_encoding($rawContent, 'UTF-8', 'UTF-8, ISO-8859-1, WINDOWS-1252');
        $utf8Content = str_replace(["\xEF\xBB\xBF", "\r\n", "\r"], ["", "\n", "\n"], $utf8Content);

        $lines = array_values(array_filter(explode("\n", trim($utf8Content)), fn($l) => trim($l) !== ''));
        if (empty($lines)) {
            return response()->json(['message' => 'Fichier CSV vide.'], 422);
        }

        // Robust CSV line parser helper to handle Excel outer quote wrapping and weird quotation escapes
        $parseCsvLine = function (string $line, string $delim): array {
            $line = trim($line);
            if (empty($line)) return [];

            // Case 1: Whole row wrapped in double quotes by Excel/WPS
            if (strlen($line) >= 2 && substr($line, 0, 1) === '"' && substr($line, -1) === '"') {
                $unwrapped = substr($line, 1, -1);
                $unwrapped = str_replace('""', '"', $unwrapped);
                $res = str_getcsv($unwrapped, $delim);
                if (count($res) >= 2) {
                    return array_map(fn($item) => trim($item, " \t\n\r\0\x0B\"'"), $res);
                }
            }

            // Case 2: Standard str_getcsv
            $res = str_getcsv($line, $delim);
            if (count($res) >= 2) {
                return array_map(fn($item) => trim($item, " \t\n\r\0\x0B\"'"), $res);
            }

            // Case 3: Manual explode fallback if quotation marks trapped the line in a single element
            $exploded = explode($delim, $line);
            if (count($exploded) >= 2) {
                return array_map(fn($item) => trim($item, " \t\n\r\0\x0B\"'"), $exploded);
            }

            return $res;
        };

        // Auto-detect CSV delimiter (comma, semicolon, tab)
        $firstLine = $lines[0];
        $delimiter = ',';
        $semicolons = substr_count($firstLine, ';');
        $commas = substr_count($firstLine, ',');
        $tabs = substr_count($firstLine, "\t");
        if ($semicolons > $commas && $semicolons > $tabs) {
            $delimiter = ';';
        } elseif ($tabs > $commas && $tabs > $semicolons) {
            $delimiter = "\t";
        }

        $headerLine = array_shift($lines);
        $rawHeader = $parseCsvLine($headerLine, $delimiter);
        $header = array_map(function ($h) {
            $h = str_replace(["\xEF\xBB\xBF", "\r", "\n"], '', $h);
            return strtolower(trim(preg_replace('/[^a-zA-Z0-9_]/', '', $h)));
        }, $rawHeader);

        $institutionId = \App\Models\Institution::first()?->id ?? 1;

        // Resolve or create Tronc Commun (Années Préparatoires ENCG)
        $tcFiliere = Filiere::where('code', 'TC-S1')
            ->orWhere('code', 'TC')
            ->orWhere('name', 'like', '%Tronc Commun%')
            ->orWhere('name', 'like', '%Préparatoires%')
            ->first();

        if (!$tcFiliere) {
            $deptId = \App\Models\Department::first()?->id ?? 1;
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
                'name' => "Concours TAFEM " . date('Y') . " — Tronc Commun ENCG Fès",
                'status' => 'open',
                'open_date' => now()->startOfYear(),
                'close_date' => now()->endOfYear(),
                'target_capacity' => 500,
            ]);
        }

        $importedCount = 0;
        $updatedCount = 0;
        $errors = [];
        $rowNum = 1;

        if (empty($lines)) {
            return response()->json([
                'success' => false,
                'message' => "Fichier CSV ne contient aucun candidat (seulement la têtes de colonnes ou 0 أسطر).",
                'summary' => [
                    'imported_candidates' => 0,
                    'updated_candidates'  => 0,
                    'total_processed'     => 0,
                    'errors'              => ["Le fichier ne contient aucune ligne de données après l'en-tête."],
                ]
            ]);
        }

        DB::beginTransaction();
        try {
            foreach ($lines as $lineStr) {
                $rowNum++;
                $lineStr = trim($lineStr);
                if (empty($lineStr)) continue;

                $row = $parseCsvLine($lineStr, $delimiter);
                if (empty($row) || count($row) < 2) {
                    $errors[] = "Ligne {$rowNum} ignorée : colonnes insuffisantes (délimiteur '{$delimiter}', " . count($row) . " colonnes). Contenu: " . substr($lineStr, 0, 40);
                    continue;
                }

                $data = [];
                foreach ($header as $idx => $key) {
                    $data[$key] = isset($row[$idx]) ? trim($row[$idx]) : '';
                }

                $cne = strtoupper(trim(!empty($data['cne']) ? $data['cne'] : (!empty($data['code_massar']) ? $data['code_massar'] : ($row[0] ?? ''))));
                $cin = strtoupper(trim(!empty($data['cin']) ? $data['cin'] : (!empty($data['cnie']) ? $data['cnie'] : ($row[1] ?? ''))));
                $lastName = mb_convert_encoding(trim(!empty($data['last_name']) ? $data['last_name'] : (!empty($data['nom']) ? $data['nom'] : ($row[2] ?? ''))), 'UTF-8', 'UTF-8, ISO-8859-1, WINDOWS-1252');
                $firstName = mb_convert_encoding(trim(!empty($data['first_name']) ? $data['first_name'] : (!empty($data['prenom']) ? $data['prenom'] : ($row[3] ?? ''))), 'UTF-8', 'UTF-8, ISO-8859-1, WINDOWS-1252');
                $bacAverage = (float)(!empty($data['bac_average']) ? $data['bac_average'] : (!empty($data['moyenne_bac']) ? $data['moyenne_bac'] : ($row[4] ?? 16.0)));
                $tafemScore = (float)(!empty($data['tafem_score']) ? $data['tafem_score'] : (!empty($data['note_tafem']) ? $data['note_tafem'] : ($row[5] ?? 150.0)));
                $listType = strtolower(trim(!empty($data['list_type']) ? $data['list_type'] : (!empty($data['liste']) ? $data['liste'] : ($row[6] ?? 'liste_principale'))));

                // Normalize out-of-range numeric values (e.g. typos like 11100 -> 111.00 for numeric(5,2))
                if ($tafemScore > 999.99) {
                    if ($tafemScore >= 10000) {
                        $tafemScore = round($tafemScore / 100, 2);
                    } elseif ($tafemScore >= 1000) {
                        $tafemScore = round($tafemScore / 10, 2);
                    }
                    if ($tafemScore > 999.99) {
                        $tafemScore = 999.99;
                    }
                }

                if ($bacAverage > 20.0) {
                    if ($bacAverage >= 100) {
                        $bacAverage = round($bacAverage / 10, 2);
                    }
                    if ($bacAverage > 20.0) {
                        $bacAverage = 20.0;
                    }
                }

                if (empty($cne) || empty($firstName) || empty($lastName)) {
                    $errors[] = "Ligne {$rowNum} ignorée : CNE, Nom ou Prénom manquant.";
                    continue;
                }

                $app = Application::where('cne', $cne)->first();
                $appStatus = !empty($listType) ? $listType : (str_contains($listType, 'attente') ? 'liste_attente_1' : 'admis_tafem');

                $hasAppListType = \Illuminate\Support\Facades\Schema::hasColumn('applications', 'list_type');
                $hasStudentListType = \Illuminate\Support\Facades\Schema::hasColumn('students', 'list_type');

                $appData = [
                    'admission_campaign_id' => $campaign->id,
                    'cin' => $cin ?: ($app ? $app->cin : null),
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'bac_average' => $bacAverage,
                    'selection_score' => $tafemScore,
                    'status' => $appStatus,
                ];

                if ($hasAppListType) {
                    $appData['list_type'] = $listType ?: 'liste_principale';
                }

                if ($app) {
                    $app->update($appData);
                    $updatedCount++;
                } else {
                    $appData['reference_number'] = 'TAFEM-' . date('Y') . '-' . strtoupper(substr(md5($cne), 0, 6));
                    $appData['cne'] = $cne;
                    $appData['email'] = strtolower($cne) . '@candidat.tafem.ma';
                    $appData['phone'] = '0600000000';
                    $appData['birth_date'] = '2006-01-01';
                    $appData['bac_year'] = (int)date('Y');
                    $appData['bac_series'] = 'Sciences Mathématiques';
                    $app = Application::create($appData);
                    $importedCount++;
                }

                // Also populate User & Student records so they appear in EnrollmentManager & Student Record List
                $userData = [
                    'name' => $firstName . ' ' . $lastName,
                    'password' => \Illuminate\Support\Facades\Hash::make('encg2026'),
                    'institution_id' => $institutionId,
                    'is_active' => true,
                ];

                if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'first_name')) {
                    $userData['first_name'] = $firstName;
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'last_name')) {
                    $userData['last_name'] = $lastName;
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'cin')) {
                    $userData['cin'] = $cin;
                }
                if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'cne')) {
                    $userData['cne'] = $cne;
                }

                $user = \App\Models\User::firstOrCreate(
                    ['email' => strtolower($cne) . '@candidat.tafem.ma'],
                    $userData
                );

                $studentData = [
                    'institution_id' => $institutionId,
                    'user_id' => $user->id,
                    'student_number' => $cne,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'cin' => $cin,
                    'cne' => $cne,
                    'gender' => !empty($data['gender']) ? $data['gender'] : 'M',
                    'birth_date' => '2006-01-01',
                    'nationality' => 'Marocaine',
                    'filiere_id' => $tcFiliere->id,
                    'status' => 'pending',
                    'inscription_status' => $appStatus,
                    'bac_average' => $bacAverage,
                ];

                if ($hasStudentListType) {
                    $studentData['list_type'] = $listType ?: 'liste_principale';
                }

                \App\Models\Student::updateOrCreate(
                    ['cne' => $cne],
                    $studentData
                );
            }

            DB::commit();

            $totalProcessed = $importedCount + $updatedCount;
            $msg = $totalProcessed > 0
                ? "Importation Ministère TAFEM réussie !"
                : "Avertissement : Aucun candidat n'a été importé. " . implode(' | ', array_slice($errors, 0, 3));

            return response()->json([
                'success' => $totalProcessed > 0,
                'message' => $msg,
                'summary' => [
                    'imported_candidates' => $importedCount,
                    'updated_candidates'  => $updatedCount,
                    'total_processed'     => $totalProcessed,
                    'errors'              => $errors,
                    'debug_lines_read'    => count($lines),
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
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

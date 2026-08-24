<?php

namespace App\Http\Controllers\Api;

use App\Domain\AI\Services\GroundedAiService;
use App\Domain\Student\Models\StudentDossierAuditLog;
use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\Department;
use App\Models\Filiere;
use App\Models\Institution;
use App\Models\Student;
use App\Models\User;
use App\Services\Admissions\TafemQualityReportService;
use App\Support\TemporaryPassword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TafemMinistryImportController extends Controller
{
    /**
     * Import CSV de la liste officielle TAFEM du Ministère.
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
            return response()->json(['success' => false, 'message' => 'Fichier CSV vide.'], 422);
        }

        // Nettoyage UTF-8
        $content = $this->cleanUtf8Content($rawContent);
        $lines = array_values(array_filter(explode("\n", trim($content)), fn ($l) => trim($l) !== ''));

        if (empty($lines)) {
            return response()->json(['success' => false, 'message' => 'Aucune donnée dans le fichier.'], 422);
        }

        // Détection délimiteur
        $delimiter = $this->detectDelimiter($lines[0]);

        // Parse header
        $headerLine = array_shift($lines);
        $header = $this->parseHeader($headerLine, $delimiter);

        // Préparation des référentiels
        $institutionId = Institution::first()?->id ?? 1;
        $tcFiliere = $this->getOrCreateTroncCommun($institutionId);
        $campaign = $this->getOrCreateCampaign($institutionId, $tcFiliere);

        if (empty($lines)) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun candidat dans le fichier.',
            ]);
        }

        $importedCount = 0;
        $updatedCount = 0;
        $errors = [];
        $rowNum = 1;

        DB::transaction(function () use ($lines, $header, $delimiter, $campaign, $institutionId, &$importedCount, &$updatedCount, &$errors, &$rowNum) {
            foreach ($lines as $lineStr) {
                $rowNum++;
                $lineStr = trim($lineStr);
                if (empty($lineStr)) {
                    continue;
                }

                $row = $this->parseCsvLine($lineStr, $delimiter);
                if (empty($row) || count($row) < 2) {
                    $errors[] = "Ligne {$rowNum} : colonnes insuffisantes.";

                    continue;
                }

                $data = $this->mapRowToHeader($header, $row);
                $cne = strtoupper(trim($data['cne'] ?? $data['code_massar'] ?? $row[0] ?? ''));
                $cin = strtoupper(trim($data['cin'] ?? $data['cnie'] ?? $row[1] ?? ''));
                $lastName = trim($data['last_name'] ?? $data['nom'] ?? $row[2] ?? '');
                $firstName = trim($data['first_name'] ?? $data['prenom'] ?? $row[3] ?? '');
                $bacAverage = $this->normalizeScore((float) ($data['bac_average'] ?? $data['moyenne_bac'] ?? $row[4] ?? 16.0), 20);
                $tafemScore = $this->normalizeScore((float) ($data['tafem_score'] ?? $data['note_tafem'] ?? $row[5] ?? 150.0), 999.99);
                $listType = strtolower(trim($data['list_type'] ?? $data['liste'] ?? $row[6] ?? 'liste_principale'));

                if (empty($cne) || empty($firstName) || empty($lastName)) {
                    $errors[] = "Ligne {$rowNum} : CNE, Nom ou Prénom manquant.";

                    continue;
                }

                $appStatus = str_contains($listType, 'attente') ? 'liste_attente_1' : 'admis_tafem';

                // Créer ou mettre à jour l'application
                $app = Application::where('cne', $cne)->first();
                $appData = [
                    'admission_campaign_id' => $campaign->id,
                    'cin' => $cin ?: $app?->cin,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'bac_average' => $bacAverage,
                    'selection_score' => $tafemScore,
                    'status' => $appStatus,
                ];

                if ($app) {
                    $app->update($appData);
                    $updatedCount++;
                } else {
                    $appData['reference_number'] = 'TAFEM-'.date('Y').'-'.strtoupper(substr(md5($cne), 0, 6));
                    $appData['cne'] = $cne;
                    $appData['email'] = strtolower($cne).'@candidat.tafem.ma';
                    $appData['phone'] = '0600000000';
                    $appData['birth_date'] = '2006-01-01';
                    $appData['bac_year'] = (int) date('Y');
                    $appData['bac_series'] = 'Sciences Mathématiques';
                    Application::create($appData);
                    $importedCount++;
                }

                // Créer ou mettre à jour User + Student
                $user = User::firstOrCreate(
                    ['email' => strtolower($cne).'@candidat.tafem.ma'],
                    [
                        'name' => $firstName.' '.$lastName,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'cin' => $cin,
                        'password' => TemporaryPassword::hash(),
                        'must_change_password' => true,
                        'institution_id' => $institutionId,
                        'is_active' => true,
                    ]
                );

                $student = Student::updateOrCreate(
                    ['cne' => $cne],
                    [
                        'institution_id' => $institutionId,
                        'user_id' => $user->id,
                        'student_number' => $cne,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'cin' => $cin,
                        'massar_code' => $data['code_massar'] ?? $data['massar'] ?? $cne,
                        'gender' => $data['gender'] ?? 'M',
                        'birth_date' => '2006-01-01',
                        'nationality' => 'Marocaine',
                        'status' => 'pending',
                        'inscription_status' => $appStatus,
                    ]
                );

                if (class_exists(StudentDossierAuditLog::class)) {
                    StudentDossierAuditLog::log(
                        $student->id,
                        StudentDossierAuditLog::ACTION_DATA_EDITED,
                        'tafem_import',
                        null,
                        ['cne' => $cne, 'cin' => $cin],
                        'Import TAFEM (upsert CNE/Massar)'
                    );
                }
            }
        });

        $totalProcessed = $importedCount + $updatedCount;

        $report = app(TafemQualityReportService::class)->build();

        return response()->json([
            'success' => $totalProcessed > 0,
            'message' => $totalProcessed > 0
                ? "Importation réussie ! {$importedCount} créés, {$updatedCount} mis à jour."
                : 'Aucun candidat importé.',
            'summary' => [
                'imported_candidates' => $importedCount,
                'updated_candidates' => $updatedCount,
                'total_processed' => $totalProcessed,
                'errors' => $errors,
            ],
            'quality_report' => $report,
        ]);
    }

    public function aiReview(GroundedAiService $groundedAi, TafemQualityReportService $quality): JsonResponse
    {
        $report = $quality->build(false);
        $copy = $groundedAi->explain($report, 'tafem_review');

        return response()->json([
            'success' => true,
            'report' => $report,
            'text_fr' => $copy['text_fr'],
            'text_ar' => $copy['text_ar'],
        ]);
    }

    /**
     * Télécharger le template CSV.
     */
    public function downloadTemplate(): StreamedResponse
    {
        return response()->stream(function () {
            $file = fopen('php://output', 'w');
            fwrite($file, "\xEF\xBB\xBF");
            fputcsv($file, ['cne', 'cin', 'last_name', 'first_name', 'bac_average', 'tafem_score', 'list_type', 'filiere_code']);
            fputcsv($file, ['N140091375', 'CD729102', 'El Attahri', 'Hiba', '16.63', '174.50', 'liste_principale', 'TC-S1']);
            fputcsv($file, ['M130089124', 'UB102938', 'Maazouzi', 'Ismaïl', '17.25', '182.00', 'liste_principale', 'TC-S1']);
            fclose($file);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="modele_import_admis_ministere_tafem.csv"',
        ]);
    }

    // ─── HELPERS PRIVÉS ───────────────────────────────────────

    private function cleanUtf8Content(string $content): string
    {
        if (substr($content, 0, 3) === "\xEF\xBB\xBF") {
            $content = substr($content, 3);
        }
        $content = mb_convert_encoding($content, 'UTF-8', 'UTF-8, ISO-8859-1, WINDOWS-1252');

        return str_replace(["\r\n", "\r"], ["\n", "\n"], $content);
    }

    private function detectDelimiter(string $line): string
    {
        $semicolons = substr_count($line, ';');
        $commas = substr_count($line, ',');
        $tabs = substr_count($line, "\t");

        return match (true) {
            $semicolons > $commas && $semicolons > $tabs => ';',
            $tabs > $commas && $tabs > $semicolons => "\t",
            default => ',',
        };
    }

    private function parseHeader(string $line, string $delimiter): array
    {
        $raw = $this->parseCsvLine($line, $delimiter);

        return array_map(fn ($h) => strtolower(trim(preg_replace('/[^a-zA-Z0-9_]/', '', $h))), $raw);
    }

    private function parseCsvLine(string $line, string $delimiter): array
    {
        $line = trim($line);
        if (empty($line)) {
            return [];
        }

        // Cas : ligne entière entre guillemets (Excel)
        if (strlen($line) >= 2 && $line[0] === '"' && $line[-1] === '"') {
            $unwrapped = str_replace('""', '"', substr($line, 1, -1));
            $res = str_getcsv($unwrapped, $delimiter);
            if (count($res) >= 2) {
                return array_map('trim', $res);
            }
        }

        $res = str_getcsv($line, $delimiter);
        if (count($res) >= 2) {
            return array_map('trim', $res);
        }

        return array_map('trim', explode($delimiter, $line));
    }

    private function mapRowToHeader(array $header, array $row): array
    {
        $data = [];
        foreach ($header as $idx => $key) {
            $data[$key] = isset($row[$idx]) ? trim($row[$idx]) : '';
        }

        return $data;
    }

    private function normalizeScore(float $value, float $max): float
    {
        if ($value > $max) {
            $value = $value >= 10000 ? round($value / 100, 2) : round($value / 10, 2);
        }

        return min($value, $max);
    }

    private function getOrCreateTroncCommun(int $institutionId): Filiere
    {
        $tc = Filiere::where('code', 'TC-S1')
            ->orWhere('code', 'TC')
            ->orWhere('name', 'like', '%Tronc Commun%')
            ->first();

        if (! $tc) {
            $tc = Filiere::create([
                'institution_id' => $institutionId,
                'department_id' => Department::first()?->id ?? 1,
                'code' => 'TC-S1',
                'name' => 'Tronc Commun ENCG',
                'duration_years' => 2,
                'is_active' => true,
            ]);
        }

        return $tc;
    }

    private function getOrCreateCampaign(int $institutionId, Filiere $filiere): AdmissionCampaign
    {
        $campaign = AdmissionCampaign::where('status', 'open')->first()
            ?? AdmissionCampaign::first();

        if (! $campaign) {
            $academicYear = AcademicYear::where('is_current', true)->first()
                ?? AcademicYear::create([
                    'institution_id' => $institutionId,
                    'label' => date('Y').'-'.(date('Y') + 1),
                    'start_date' => '2026-09-01',
                    'end_date' => '2027-06-30',
                    'is_current' => true,
                    'start_year' => (int) date('Y'),
                    'end_year' => (int) date('Y') + 1,
                ]);

            $campaign = AdmissionCampaign::create([
                'institution_id' => $institutionId,
                'filiere_id' => $filiere->id,
                'academic_year_id' => $academicYear->id,
                'name' => 'Concours TAFEM '.date('Y'),
                'status' => 'open',
                'open_date' => now()->startOfYear(),
                'close_date' => now()->endOfYear(),
                'target_capacity' => 500,
            ]);
        }

        return $campaign;
    }
}

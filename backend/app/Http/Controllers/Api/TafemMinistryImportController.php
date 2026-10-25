<?php

namespace App\Http\Controllers\Api;

use App\Domain\AI\Services\GroundedAiService;
use App\Http\Controllers\Controller;
use App\Services\Admissions\TafemQualityReportService;
use App\Support\AdmissionAccess;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TafemMinistryImportController extends Controller
{
    /**
     * Import CSV de la liste officielle TAFEM du Ministère.
     */
    public function importMinistryList(Request $request): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->previewImport($request);
    }

    public function aiReview(GroundedAiService $groundedAi, TafemQualityReportService $quality): JsonResponse
    {
        AdmissionAccess::review(request());
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
            fputcsv($file, ['cne', 'cin', 'last_name', 'first_name', 'bac_average', 'tafem_score', 'list_type', 'rank', 'email']);
            fclose($file);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="modele_import_admis_ministere_tafem.csv"',
        ]);
    }
}

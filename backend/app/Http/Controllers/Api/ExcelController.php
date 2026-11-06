<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Core\ExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ExcelController extends Controller
{
    private const ALLOWED_ROLES = [
        'admin',
        'super-admin',
        'super_admin',
        'institution-admin',
        'institution_admin',
        'director',
        'scolarite',
        'department-head',
        'filiere-head',
        'hr-officer',
        'finance-officer',
    ];

    public function __construct(
        private ExportService $exportService
    ) {}

    private function authorizeExcelAccess(Request $request): void
    {
        $user = $request->user();
        abort_if(
            ! $user || $user->hasRole('vacataire') || ! $user->hasAnyRole(self::ALLOWED_ROLES),
            403,
            'Accès refusé : vous n\'êtes pas autorisé à exporter ou importer massivement les données.'
        );
    }

    /**
     * Exporter en Excel.
     */
    public function export(string $model, Request $request)
    {
        $this->authorizeExcelAccess($request);

        $filters = $request->all();
        $filters['institution_id'] = $request->user()?->institution_id;

        $result = $this->exportService->exportToExcel($model, $filters);

        if ($result instanceof Response) {
            return $result;
        }

        return response()->json($result);
    }

    /**
     * Télécharger un template Excel.
     */
    public function template(Request $request, string $model)
    {
        $this->authorizeExcelAccess($request);

        $result = $this->exportService->templateToExcel($model);

        if ($result instanceof Response) {
            return $result;
        }

        return response()->json($result);
    }

    /**
     * Importer depuis Excel.
     */
    public function import(Request $request, string $model): JsonResponse
    {
        $this->authorizeExcelAccess($request);

        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv',
        ]);

        $result = $this->exportService->processImport($model, $request->file('file'));

        return response()->json($result);
    }
}

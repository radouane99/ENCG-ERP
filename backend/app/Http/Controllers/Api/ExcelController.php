<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Core\ExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExcelController extends Controller
{
    public function __construct(
        private ExportService $exportService
    ) {}

    /**
     * Exporter en Excel.
     */
    public function export(string $model, Request $request)
    {
        $result = $this->exportService->exportToExcel($model, $request->all());

        if ($result instanceof \Symfony\Component\HttpFoundation\Response) {
            return $result;
        }

        return response()->json($result);
    }

    /**
     * Télécharger un template Excel.
     */
    public function template(string $model)
    {
        $result = $this->exportService->templateToExcel($model);

        if ($result instanceof \Symfony\Component\HttpFoundation\Response) {
            return $result;
        }

        return response()->json($result);
    }

    /**
     * Importer depuis Excel.
     */
    public function import(Request $request, string $model): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv',
        ]);

        $result = $this->exportService->processImport($model, $request->file('file'));

        return response()->json($result);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Core\ExportService;

class ExcelController extends Controller
{
    protected ExportService $exportService;

    public function __construct(ExportService $exportService)
    {
        $this->exportService = $exportService;
    }

    public function export($model, Request $request): JsonResponse
    {
        // E.g., model = 'students', 'vacataires'
        $result = $this->exportService->exportToExcel($model, $request->all());
        
        return response()->json($result);
    }

    public function template($model): JsonResponse
    {
        return response()->json([
            'success' => true,
            'url' => "/downloads/templates/{$model}_template.xlsx"
        ]);
    }

    public function import(Request $request, $model): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv'
        ]);

        $result = $this->exportService->processImport($model, $request->file('file'));

        return response()->json($result);
    }
}

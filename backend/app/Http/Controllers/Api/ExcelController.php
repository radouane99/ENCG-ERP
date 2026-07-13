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

    public function export($model, Request $request)
    {
        $result = $this->exportService->exportToExcel($model, $request->all());
        
        if ($result instanceof \Symfony\Component\HttpFoundation\Response) {
            return $result;
        }

        return response()->json($result);
    }

    public function template($model)
    {
        $result = $this->exportService->templateToExcel($model);
        
        if ($result instanceof \Symfony\Component\HttpFoundation\Response) {
            return $result;
        }

        return response()->json($result);
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

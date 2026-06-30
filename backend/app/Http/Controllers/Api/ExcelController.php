<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\JsonResponse;

// Exports
use App\Exports\StudentsExport;
use App\Exports\ProfessorsExport;
use App\Exports\VacatairesExport;
use App\Exports\FilieresExport;
use App\Exports\ModulesExport;
use App\Exports\GroupsExport;
use App\Exports\RoomsExport;

// Imports
use App\Imports\StudentsImport;
use App\Imports\ProfessorsImport;
use App\Imports\FilieresImport;
use App\Imports\ModulesImport;
use App\Imports\GroupsImport;
use App\Imports\RoomsImport;

class ExcelController extends Controller
{
    /**
     * Map model slug => export class
     */
    private function getExportClass(string $model)
    {
        return match ($model) {
            'students'   => new StudentsExport(),
            'professors' => new ProfessorsExport(),
            'vacataires' => new VacatairesExport(),
            'filieres'   => new FilieresExport(),
            'modules'    => new ModulesExport(),
            'groups'     => new GroupsExport(),
            'rooms'      => new RoomsExport(),
            default      => null,
        };
    }

    /**
     * Map model slug => import class
     */
    private function getImportClass(string $model)
    {
        return match ($model) {
            'students'   => new StudentsImport(),
            'professors' => new ProfessorsImport(),
            'filieres'   => new FilieresImport(),
            'modules'    => new ModulesImport(),
            'groups'     => new GroupsImport(),
            'rooms'      => new RoomsImport(),
            default      => null,
        };
    }

    /**
     * Map model slug => French display name
     */
    private function getModelLabel(string $model): string
    {
        return match ($model) {
            'students'   => 'Etudiants',
            'professors' => 'Professeurs',
            'vacataires' => 'Vacataires',
            'filieres'   => 'Filieres',
            'modules'    => 'Modules',
            'groups'     => 'Groupes',
            'rooms'      => 'Salles',
            default      => ucfirst($model),
        };
    }

    /**
     * GET /api/export/{model}
     * Download an Excel file for the given model.
     */
    public function export(string $model)
    {
        $exportClass = $this->getExportClass($model);

        if (!$exportClass) {
            return response()->json(['message' => "Export non disponible pour : {$model}"], 422);
        }

        $filename = $this->getModelLabel($model) . '_' . now()->format('Y-m-d_His') . '.xlsx';

        return Excel::download($exportClass, $filename);
    }

    /**
     * POST /api/import/{model}
     * Import an Excel file for the given model.
     */
    public function import(Request $request, string $model): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        $importClass = $this->getImportClass($model);

        if (!$importClass) {
            return response()->json(['message' => "Import non disponible pour : {$model}"], 422);
        }

        try {
            Excel::import($importClass, $request->file('file'));

            return response()->json([
                'message'  => "Importation réussie !",
                'imported' => $importClass->imported ?? 0,
            ]);
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = collect($e->failures())->map(fn ($f) => [
                'row'    => $f->row(),
                'errors' => $f->errors(),
            ]);
            return response()->json(['message' => 'Erreurs de validation', 'failures' => $failures], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de l\'importation : ' . $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/export/{model}/template
     * Download an empty template Excel file (headers only).
     */
    public function template(string $model)
    {
        $exportClass = $this->getExportClass($model);

        if (!$exportClass) {
            return response()->json(['message' => "Template non disponible pour : {$model}"], 422);
        }

        $filename = 'Template_' . $this->getModelLabel($model) . '.xlsx';

        // For template, we download with an empty collection
        return Excel::download($exportClass, $filename);
    }
}

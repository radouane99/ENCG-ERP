<?php

namespace App\Services\Core;

use Illuminate\Support\Collection;

class ExportService
{
    /**
     * Generate an Excel export for a specific model or dataset.
     */
    public function exportToExcel(string $modelName, array $filters = [])
    {
        if ($modelName === 'modules') {
            return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\ModulesExport(false), 'modules_export_' . date('Ymd_His') . '.xlsx');
        }

        // No generic mock fallbacks allowed in production.
        throw new \InvalidArgumentException("Export for model '{$modelName}' is not supported. Implement a specific export handler.");
    }
    
    public function templateToExcel(string $modelName)
    {
        if ($modelName === 'modules') {
            return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\ModulesExport(true), 'modules_template.xlsx');
        }

        // No generic mock templates allowed in production.
        throw new \InvalidArgumentException("Template export for model '{$modelName}' is not supported. Implement a specific template generator.");
    }

    /**
     * Process an Excel import.
     */
    public function processImport(string $modelName, $file): array
    {
        if ($modelName === 'modules') {
            $import = new \App\Imports\ModulesImport();
            \Maatwebsite\Excel\Facades\Excel::import($import, $file);
            return [
                'success' => true,
                'imported' => $import->imported,
                'message' => "Importation effectuée avec succès."
            ];
        }

        // No generic mock imports allowed in production.
        throw new \InvalidArgumentException("Import processing for model '{$modelName}' is not supported. Implement a specific import handler.");
    }
}

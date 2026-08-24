<?php

namespace App\Services\Core;

use App\Exports\FilieresExport;
use App\Exports\GroupsExport;
use App\Exports\ModulesExport;
use App\Exports\ProfessorsExport;
use App\Exports\RoomsExport;
use App\Exports\StudentsExport;
use App\Exports\VacatairesExport;
use App\Imports\FilieresImport;
use App\Imports\GroupsImport;
use App\Imports\ModulesImport;
use App\Imports\ProfessorsImport;
use App\Imports\RoomsImport;
use App\Imports\StudentsImport;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class ExportService
{
    /**
     * Map model names to their corresponding Export classes.
     */
    protected array $exportMap = [
        'modules' => ModulesExport::class,
        'students' => StudentsExport::class,
        'professors' => ProfessorsExport::class,
        'vacataires' => VacatairesExport::class,
        'filieres' => FilieresExport::class,
        'groups' => GroupsExport::class,
        'rooms' => RoomsExport::class,
    ];

    /**
     * Map model names to their corresponding Import classes.
     */
    protected array $importMap = [
        'modules' => ModulesImport::class,
        'students' => StudentsImport::class,
        'professors' => ProfessorsImport::class,
        'filieres' => FilieresImport::class,
        'groups' => GroupsImport::class,
        'rooms' => RoomsImport::class,
    ];

    /**
     * Generate an Excel export for a specific model with formula injection protection and audit trace.
     */
    public function exportToExcel(string $modelName, array $filters = [])
    {
        $normalized = strtolower(trim($modelName));

        if (! isset($this->exportMap[$normalized])) {
            throw new \InvalidArgumentException("Export for model '{$modelName}' is not supported. Supported models: ".implode(', ', array_keys($this->exportMap)));
        }

        $exportClass = $this->exportMap[$normalized];
        $filename = "{$normalized}_export_".date('Ymd_His').'.xlsx';

        // Audit Trail
        $user = Auth::user();
        if (class_exists(AuditLog::class)) {
            AuditLog::record([
                'user_id' => $user?->id,
                'user_name' => $user?->name ?? 'Admin',
                'user_email' => $user?->email,
                'user_role' => $user?->role ?? 'Admin',
                'action' => "Export Excel {$normalized}",
                'action_type' => 'DATA_ACCESS',
                'description' => "Exportation officielle des données du registre {$normalized} au format Excel",
                'method' => 'GET',
                'severity' => 'info',
                'payload' => ['model' => $normalized, 'filename' => $filename, 'filters' => $filters],
            ]);
        }

        return Excel::download(new $exportClass(false), $filename);
    }

    /**
     * Download Excel template for batch data import.
     */
    public function templateToExcel(string $modelName)
    {
        $normalized = strtolower(trim($modelName));

        if (! isset($this->exportMap[$normalized])) {
            throw new \InvalidArgumentException("Template export for model '{$modelName}' is not supported.");
        }

        $exportClass = $this->exportMap[$normalized];
        $filename = "modele_import_{$normalized}.xlsx";

        return Excel::download(new $exportClass(true), $filename);
    }

    /**
     * Process an Excel import safely within an ACID database transaction.
     */
    public function processImport(string $modelName, $file): array
    {
        $normalized = strtolower(trim($modelName));

        if (! isset($this->importMap[$normalized])) {
            throw new \InvalidArgumentException("Import processing for model '{$modelName}' is not supported. Supported models: ".implode(', ', array_keys($this->importMap)));
        }

        $importClass = $this->importMap[$normalized];
        $importInstance = new $importClass;

        $user = Auth::user();

        return DB::transaction(function () use ($importInstance, $file, $normalized, $user) {
            Excel::import($importInstance, $file);

            $importedCount = property_exists($importInstance, 'imported') ? $importInstance->imported : 1;

            // Audit Trail
            if (class_exists(AuditLog::class)) {
                AuditLog::record([
                    'user_id' => $user?->id,
                    'user_name' => $user?->name ?? 'Admin',
                    'user_email' => $user?->email,
                    'user_role' => $user?->role ?? 'Admin',
                    'action' => "Import Excel {$normalized}",
                    'action_type' => 'DATA_MUTATION',
                    'description' => "Importation en masse réussie de {$importedCount} enregistrements dans le registre {$normalized}",
                    'method' => 'POST',
                    'severity' => 'warning',
                    'payload' => ['model' => $normalized, 'imported_count' => $importedCount],
                ]);
            }

            return [
                'success' => true,
                'imported' => $importedCount,
                'message' => "Importation de {$importedCount} {$normalized} effectuée avec succès dans la base de données.",
                'cndp_status' => 'CONFORME_LOI_09_08',
            ];
        });
    }
}

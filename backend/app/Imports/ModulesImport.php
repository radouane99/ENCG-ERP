<?php

namespace App\Imports;

use App\Models\Module;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Illuminate\Support\Str;

class ModulesImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    public int $imported = 0;

    public function model(array $row)
    {
        // Try to find the exact keys. WithHeadingRow transforms headings:
        // 'Code Module' -> 'code_module'
        // 'Intitule du Module' -> 'intitule_du_module'
        // 'ID Filiere' -> 'id_filiere'
        // 'Numero Semestre' -> 'numero_semestre'
        // 'Coefficient' -> 'coefficient'
        // 'Heures de Credit' -> 'heures_de_credit'
        // 'Actif (1 ou 0)' -> 'actif_1_ou_0'

        $code = $row['code_module'] ?? $row['code'] ?? null;
        if (!$code) return null;

        $module = Module::firstOrNew(['code' => $code]);

        $module->name = $row['intitule_du_module'] ?? $row['intitule'] ?? $module->name ?? 'Sans Nom';
        
        if (isset($row['id_filiere']) && $row['id_filiere'] !== '') {
            $module->filiere_id = (int)$row['id_filiere'];
        }
        
        $module->semester_number = isset($row['numero_semestre']) ? (int)$row['numero_semestre'] : ($module->semester_number ?? 1);
        $module->coefficient = isset($row['coefficient']) ? (float)$row['coefficient'] : ($module->coefficient ?? 1.0);
        $module->credit_hours = isset($row['heures_de_credit']) ? (float)$row['heures_de_credit'] : ($module->credit_hours ?? 45.0);
        
        if (isset($row['actif_1_ou_0'])) {
            $module->is_active = (bool)$row['actif_1_ou_0'];
        } else {
            $module->is_active = $module->exists ? $module->is_active : true;
        }
        
        $module->institution_id = 1; // Default institution

        $module->save();

        $this->imported++;
        return $module;
    }
}

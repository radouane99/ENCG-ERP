<?php

namespace App\Imports;

use App\Models\Module;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class ModulesImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    public int $imported = 0;

    public function model(array $row)
    {
        $module = Module::firstOrNew(['code' => $row['code'] ?? null]);

        $module->name        = $row['intitule'] ?? $module->name;
        $module->filiere_id  = $row['filiere_id'] ?? $module->filiere_id;
        $module->semester    = $row['semestre'] ?? $module->semester;
        $module->credits     = $row['credits'] ?? $module->credits ?? 3;
        $module->hours_cm    = $row['heures_cm'] ?? $module->hours_cm ?? 0;
        $module->hours_td    = $row['heures_td'] ?? $module->hours_td ?? 0;
        $module->hours_tp    = $row['heures_tp'] ?? $module->hours_tp ?? 0;
        $module->type        = $row['type'] ?? $module->type ?? 'Obligatoire';
        $module->coefficient = $row['coefficient'] ?? $module->coefficient ?? 1;

        $this->imported++;
        return $module;
    }
}

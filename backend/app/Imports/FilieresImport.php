<?php

namespace App\Imports;

use App\Models\Filiere;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class FilieresImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    public int $imported = 0;

    public function model(array $row)
    {
        $filiere = Filiere::firstOrNew(['code' => $row['code'] ?? null]);

        $filiere->name                = $row['intitule'] ?? $filiere->name;
        $filiere->description         = $row['description'] ?? $filiere->description;
        $filiere->duration_semesters  = $row['duree_semestres'] ?? $filiere->duration_semesters ?? 6;
        $filiere->type                = $row['type'] ?? $filiere->type ?? 'Licence';
        $filiere->is_active           = strtolower($row['statut'] ?? 'actif') === 'actif' ? 1 : 0;

        $this->imported++;
        return $filiere;
    }
}

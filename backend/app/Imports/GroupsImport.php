<?php

namespace App\Imports;

use App\Models\Group;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class GroupsImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    public int $imported = 0;

    public function model(array $row)
    {
        $group = Group::firstOrNew(['code' => $row['code'] ?? null]);

        $group->name         = $row['nom_du_groupe'] ?? $group->name;
        $group->filiere_id   = $row['filiere_id'] ?? $group->filiere_id;
        $group->semester     = $row['semestre'] ?? $group->semester;
        $group->max_students = $row['capacite_max'] ?? $group->max_students ?? 35;
        $group->status       = $row['statut'] ?? $group->status ?? 'active';

        $this->imported++;
        return $group;
    }
}

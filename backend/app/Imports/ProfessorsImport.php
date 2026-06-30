<?php

namespace App\Imports;

use App\Models\Professor;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Illuminate\Support\Facades\Hash;

class ProfessorsImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    public int $imported = 0;

    public function model(array $row)
    {
        $professor = Professor::firstOrNew(['cin' => $row['cin'] ?? null]);

        $professor->last_name        = $row['nom'] ?? $professor->last_name;
        $professor->first_name       = $row['prenom'] ?? $professor->first_name;
        $professor->email            = $row['email'] ?? $professor->email;
        $professor->phone            = $row['telephone'] ?? $professor->phone;
        $professor->grade            = $row['grade'] ?? $professor->grade;
        $professor->speciality       = $row['specialite'] ?? $professor->speciality;
        $professor->department       = $row['departement'] ?? $professor->department;
        $professor->recruitment_date = $row['date_de_recrutement'] ?? $professor->recruitment_date;
        $professor->status           = $row['statut'] ?? $professor->status ?? 'active';

        if (!$professor->exists && $professor->email) {
            $professor->password = Hash::make('password123');
        }

        $this->imported++;
        return $professor;
    }
}

<?php

namespace App\Imports;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsOnError;
use Maatwebsite\Excel\Concerns\SkipsErrors;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StudentsImport implements ToModel, WithHeadingRow, SkipsEmptyRows
{
    public array $errors = [];
    public int $imported = 0;

    public function model(array $row)
    {
        // If a record with the same CNE exists, update it; otherwise create.
        $student = Student::firstOrNew(['cne' => $row['cne'] ?? null]);

        $student->last_name        = $row['nom'] ?? $student->last_name;
        $student->first_name       = $row['prenom'] ?? $student->first_name;
        $student->email            = $row['email'] ?? $student->email;
        $student->phone            = $row['telephone'] ?? $student->phone;
        $student->cin              = $row['cin'] ?? $student->cin;
        $student->massar_code      = $row['code_massar'] ?? $student->massar_code;
        $student->gender           = $row['genre'] ?? $student->gender ?? 'M';
        $student->birth_date       = $row['date_de_naissance'] ?? $student->birth_date;
        $student->city             = $row['ville'] ?? $student->city;
        $student->address          = $row['adresse'] ?? $student->address;
        $student->filiere_id       = $row['filiere_id'] ?? $student->filiere_id;
        $student->bac_year         = $row['annee_bac'] ?? $student->bac_year;
        $student->bac_series       = $row['serie_bac'] ?? $student->bac_series;
        $student->bac_mention      = $row['mention_bac'] ?? $student->bac_mention;
        $student->enrollment_year  = $row['annee_inscription'] ?? $student->enrollment_year ?? date('Y');
        $student->status           = $row['statut'] ?? $student->status ?? 'active';

        if (!$student->exists && $student->email) {
            $student->password = Hash::make(Str::random(16));
        }

        $this->imported++;
        return $student;
    }
}

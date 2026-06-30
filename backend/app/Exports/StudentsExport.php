<?php

namespace App\Exports;

use App\Models\Student;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StudentsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function title(): string { return 'Étudiants'; }

    public function collection()
    {
        return Student::with('filiere')->get();
    }

    public function headings(): array
    {
        return [
            'Nom', 'Prénom', 'Email', 'Téléphone',
            'CIN', 'CNE', 'Code MASSAR', 'Genre',
            'Date de Naissance', 'Ville', 'Adresse',
            'Filière (ID)', 'Année Bac', 'Série Bac', 'Mention Bac',
            'Année Inscription', 'Statut', 'N° Étudiant'
        ];
    }

    public function map($student): array
    {
        return [
            $student->last_name,
            $student->first_name,
            $student->email,
            $student->phone,
            $student->cin,
            $student->cne,
            $student->massar_code,
            $student->gender,
            $student->birth_date,
            $student->city,
            $student->address,
            $student->filiere_id,
            $student->bac_year,
            $student->bac_series,
            $student->bac_mention,
            $student->enrollment_year,
            $student->status,
            $student->student_number,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '1e3a5f']],
            ],
        ];
    }
}

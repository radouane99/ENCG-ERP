<?php

namespace App\Exports;

use App\Models\Professor;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ProfessorsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function title(): string { return 'Professeurs'; }

    public function collection()
    {
        return Professor::all();
    }

    public function headings(): array
    {
        return [
            'Nom', 'Prénom', 'Email', 'Téléphone',
            'CIN', 'Grade', 'Spécialité', 'Département',
            'Date de Recrutement', 'Statut'
        ];
    }

    public function map($professor): array
    {
        return [
            $professor->last_name,
            $professor->first_name,
            $professor->email,
            $professor->phone,
            $professor->cin,
            $professor->grade,
            $professor->speciality,
            $professor->department,
            $professor->recruitment_date,
            $professor->status,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '7c3aed']],
            ],
        ];
    }
}

<?php

namespace App\Exports;

use App\Models\Filiere;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class FilieresExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function title(): string { return 'Filières'; }

    public function collection()
    {
        return Filiere::all();
    }

    public function headings(): array
    {
        return ['Code', 'Intitulé', 'Description', 'Durée (semestres)', 'Type', 'Statut'];
    }

    public function map($filiere): array
    {
        return [
            $filiere->code,
            $filiere->name,
            $filiere->description,
            $filiere->duration_semesters,
            $filiere->type,
            $filiere->is_active ? 'Actif' : 'Inactif',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '059669']],
            ],
        ];
    }
}

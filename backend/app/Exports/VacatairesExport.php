<?php

namespace App\Exports;

use App\Models\VacationContract;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class VacatairesExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function title(): string { return 'Vacataires'; }

    public function collection()
    {
        return VacationContract::with('vacataire')->get();
    }

    public function headings(): array
    {
        return [
            'Nom', 'Prénom', 'Email', 'CIN',
            'Module', 'Heures Prévues', 'Heures Effectuées',
            'Taux Horaire (MAD)', 'Statut Contrat',
            'Date Début', 'Date Fin'
        ];
    }

    public function map($contract): array
    {
        return [
            $contract->vacataire->last_name ?? '',
            $contract->vacataire->first_name ?? '',
            $contract->vacataire->email ?? '',
            $contract->vacataire->cin ?? '',
            $contract->module_name,
            $contract->planned_hours,
            $contract->completed_hours,
            $contract->hourly_rate,
            $contract->status,
            $contract->start_date,
            $contract->end_date,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'f59e0b']],
            ],
        ];
    }
}

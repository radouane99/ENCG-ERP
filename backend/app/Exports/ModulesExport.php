<?php

namespace App\Exports;

use App\Models\Module;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ModulesExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function title(): string { return 'Modules'; }

    public function collection()
    {
        return Module::with('filiere')->get();
    }

    public function headings(): array
    {
        return ['Code', 'Intitulé', 'Filière (ID)', 'Semestre', 'Crédits', 'Heures CM', 'Heures TD', 'Heures TP', 'Type', 'Coefficient'];
    }

    public function map($module): array
    {
        return [
            $module->code,
            $module->name,
            $module->filiere_id,
            $module->semester,
            $module->credits,
            $module->hours_cm,
            $module->hours_td,
            $module->hours_tp,
            $module->type,
            $module->coefficient,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '0ea5e9']],
            ],
        ];
    }
}

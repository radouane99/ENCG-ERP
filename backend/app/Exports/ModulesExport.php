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
    protected bool $isTemplate;

    public function __construct(bool $isTemplate = false)
    {
        $this->isTemplate = $isTemplate;
    }

    public function title(): string { return 'Modules'; }

    public function collection()
    {
        if ($this->isTemplate) {
            return collect([]);
        }
        return Module::with('filiere')->get();
    }

    public function headings(): array
    {
        return [
            'Code Module',
            'Intitule du Module',
            'ID Filiere',
            'Numero Semestre',
            'Coefficient',
            'Heures de Credit',
            'Actif (1 ou 0)'
        ];
    }

    public function map($module): array
    {
        return [
            $module->code,
            $module->name,
            $module->filiere_id,
            $module->semester_number,
            $module->coefficient,
            $module->credit_hours,
            $module->is_active ? 1 : 0,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => '0f2863']],
            ],
        ];
    }
}

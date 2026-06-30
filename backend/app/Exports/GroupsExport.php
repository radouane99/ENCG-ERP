<?php

namespace App\Exports;

use App\Models\Group;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class GroupsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function title(): string { return 'Groupes'; }

    public function collection()
    {
        return Group::with('filiere')->get();
    }

    public function headings(): array
    {
        return ['Code', 'Nom du Groupe', 'Filière (ID)', 'Semestre', 'Capacité Max', 'Nb Étudiants', 'Statut'];
    }

    public function map($group): array
    {
        return [
            $group->code,
            $group->name,
            $group->filiere_id,
            $group->semester,
            $group->max_students,
            $group->students_count ?? 0,
            $group->status,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => 'solid', 'startColor' => ['rgb' => 'f97316']],
            ],
        ];
    }
}

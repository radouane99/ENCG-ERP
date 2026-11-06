<?php

namespace App\Exports;

use App\Models\Group;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class GroupsExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        protected bool $isTemplate = false,
        protected ?int $institutionId = null
    ) {}

    public function title(): string
    {
        return 'Groupes';
    }

    public function collection()
    {
        if ($this->isTemplate) {
            return collect([]);
        }

        $instId = $this->institutionId ?? Auth::user()?->institution_id;

        return Group::with('filiere')
            ->when($instId, fn ($q) => $q->whereHas('filiere', fn ($fq) => $fq->where('institution_id', $instId)))
            ->get();
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

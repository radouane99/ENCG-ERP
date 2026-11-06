<?php

namespace App\Exports;

use App\Models\Student;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StudentsExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping, WithStyles, WithTitle
{
    public function __construct(
        protected bool $isTemplate = false,
        protected ?int $institutionId = null
    ) {}

    public function title(): string
    {
        return 'Étudiants';
    }

    public function collection()
    {
        if ($this->isTemplate) {
            return collect([]);
        }

        $instId = $this->institutionId ?? Auth::user()?->institution_id;

        return Student::with('latestPathway.filiere')
            ->when($instId, fn ($q) => $q->where('institution_id', $instId))
            ->get();
    }

    public function headings(): array
    {
        return [
            'Nom', 'Prénom', 'Email', 'Téléphone',
            'CIN', 'CNE', 'Code MASSAR', 'Genre',
            'Date de Naissance', 'Ville', 'Adresse',
            'Filière (ID)', 'Année Bac', 'Série Bac', 'Mention Bac',
            'Année Inscription', 'Statut', 'N° Étudiant',
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
            $student->latestPathway ? $student->latestPathway->filiere->name : 'N/A',
            $student->bac_year ?? 'N/A',
            $student->bac_series ?? 'N/A',
            $student->bac_mention ?? 'N/A',
            $student->enrollment_year ?? 'N/A',
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

<?php

namespace App\Exports;

use App\Models\Assessment;
use App\Models\Grade;
use App\Models\Module;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class GradesExport implements FromArray, ShouldAutoSize, WithHeadings, WithTitle
{
    public function __construct(
        private Module $module,
        private Collection $students
    ) {}

    public function title(): string
    {
        return 'Notes';
    }

    public function headings(): array
    {
        return ['CNE', 'Nom', 'Prenom', 'Assessment', 'Type', 'Note', 'Absent', 'version'];
    }

    public function array(): array
    {
        $assessments = Assessment::where('module_id', $this->module->id)->get();
        $rows = [];

        foreach ($this->students as $student) {
            foreach ($assessments as $assessment) {
                $grade = Grade::where('student_id', $student->id)
                    ->where('assessment_id', $assessment->id)
                    ->first();

                $rows[] = [
                    $student->cne ?? $student->student_number,
                    $student->last_name,
                    $student->first_name,
                    $assessment->name ?? $assessment->type,
                    $assessment->type,
                    $grade?->value,
                    $grade?->absent ? 1 : 0,
                    $grade?->version ?? 1,
                ];
            }
        }

        if ($rows === []) {
            $rows[] = ['', '', '', 'CC1', 'CC1', '', 0, 1];
        }

        return $rows;
    }
}

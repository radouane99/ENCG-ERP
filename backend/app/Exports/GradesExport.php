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
        private Collection $students,
        private ?Assessment $assessment = null
    ) {}

    public function title(): string
    {
        return $this->assessment ? $this->assessment->type : 'Notes';
    }

    public function headings(): array
    {
        if ($this->assessment) {
            return ['CNE', 'Apogée', 'Nom', 'Prénom', 'Évaluation', 'Note', 'Absent', 'Version'];
        }

        return ['CNE', 'Apogée', 'Nom', 'Prénom', 'Évaluation', 'Type', 'Note', 'Absent', 'Version'];
    }

    public function array(): array
    {
        $rows = [];

        if ($this->assessment) {
            $grades = Grade::where('assessment_id', $this->assessment->id)
                ->whereIn('student_id', $this->students->pluck('id'))
                ->get()
                ->keyBy('student_id');

            foreach ($this->students as $student) {
                $grade = $grades->get($student->id);
                $rows[] = [
                    $student->cne ?? $student->student_number ?? '',
                    $student->student_number ?? '',
                    $student->last_name ?? '',
                    $student->first_name ?? '',
                    $this->assessment->type ?? 'CC',
                    $grade?->value !== null ? (string) $grade->value : '',
                    $grade?->absent ? 1 : 0,
                    $grade?->version ?? 0,
                ];
            }
        } else {
            $assessments = Assessment::where('module_id', $this->module->id)->get();
            $grades = Grade::whereIn('assessment_id', $assessments->pluck('id'))
                ->whereIn('student_id', $this->students->pluck('id'))
                ->get()
                ->groupBy('student_id');

            foreach ($this->students as $student) {
                $studentGrades = $grades->get($student->id, collect())->keyBy('assessment_id');

                foreach ($assessments as $assessment) {
                    $grade = $studentGrades->get($assessment->id);
                    $rows[] = [
                        $student->cne ?? $student->student_number ?? '',
                        $student->student_number ?? '',
                        $student->last_name ?? '',
                        $student->first_name ?? '',
                        $assessment->name ?? $assessment->type,
                        $assessment->type,
                        $grade?->value !== null ? (string) $grade->value : '',
                        $grade?->absent ? 1 : 0,
                        $grade?->version ?? 0,
                    ];
                }
            }
        }

        if ($rows === []) {
            $rows[] = $this->assessment ? ['', '', '', '', $this->assessment->type, '', 0, 0] : ['', '', '', '', '', 'CC', '', 0, 0];
        }

        return $rows;
    }
}

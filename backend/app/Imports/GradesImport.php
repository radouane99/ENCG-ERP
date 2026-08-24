<?php

namespace App\Imports;

use App\Domain\Deliberation\LmdRules;
use App\Models\Assessment;
use App\Models\Grade;
use App\Models\Module;
use App\Models\Student;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class GradesImport implements ToCollection, WithHeadingRow
{
    public int $imported = 0;

    /** @var list<string> */
    public array $warnings = [];

    public function __construct(private Module $module) {}

    public function collection(Collection $rows): void
    {
        foreach ($rows as $row) {
            $cne = trim((string) ($row['cne'] ?? $row['apogee'] ?? ''));
            $type = trim((string) ($row['type'] ?? $row['assessment'] ?? 'CC1'));
            if ($cne === '') {
                continue;
            }

            $student = Student::where('cne', $cne)
                ->orWhere('student_number', $cne)
                ->first();
            if (! $student) {
                $this->warnings[] = "CNE introuvable : {$cne}";

                continue;
            }

            $assessment = Assessment::where('module_id', $this->module->id)
                ->whereRaw('LOWER(type) = ?', [strtolower($type)])
                ->first();

            if (! $assessment) {
                $assessment = Assessment::firstOrCreate(
                    ['module_id' => $this->module->id, 'type' => $type],
                    ['name' => $type, 'weight' => 1]
                );
            }

            $value = isset($row['note']) && $row['note'] !== '' ? (float) $row['note'] : null;
            if ($value !== null && ($value < 0 || $value > 20)) {
                $this->warnings[] = "Note hors 0-20 pour {$cne}";

                continue;
            }

            $grade = Grade::firstOrNew([
                'student_id' => $student->id,
                'assessment_id' => $assessment->id,
            ]);

            if ($row['version'] ?? null) {
                $grade->version = (int) $row['version'];
            }

            $grade->value = $value;
            $grade->absent = (bool) ($row['absent'] ?? false);
            $grade->save();
            $this->imported++;

            if ($value !== null && LmdRules::isEliminatory($value)) {
                $this->warnings[] = "{$cne} : note {$value} < 6/20 (éliminatoire)";
            }
        }
    }
}

<?php

namespace App\Imports;

use App\Actions\Exam\StoreBulkGradesAction;
use App\Models\Assessment;
use App\Models\Grade;
use App\Models\Module;
use App\Models\Student;
use App\Services\Academic\GradeService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class GradesImport implements ToCollection, WithHeadingRow
{
    public int $imported = 0;

    /** @var list<string> */
    public array $warnings = [];

    public function __construct(
        private Module $module,
        private ?int $targetAssessmentId = null
    ) {}

    public function collection(Collection $rows): void
    {
        $moduleAssessments = Assessment::where('module_id', $this->module->id)->get();

        foreach ($rows as $row) {
            $cne = trim((string) ($row['cne'] ?? $row['cne_massar'] ?? $row['massar'] ?? ''));
            $apogee = trim((string) ($row['apogee'] ?? $row['student_number'] ?? $row['code_apogee'] ?? $row['numero_etudiant'] ?? ''));

            if ($cne === '' && $apogee === '') {
                continue;
            }

            $student = null;
            if ($cne !== '') {
                $student = Student::where('cne', $cne)->orWhere('student_number', $cne)->first();
            }
            if (! $student && $apogee !== '') {
                $student = Student::where('student_number', $apogee)->orWhere('cne', $apogee)->first();
            }

            if (! $student) {
                $identifier = $cne ?: $apogee;
                $this->warnings[] = "Étudiant introuvable (CNE/Apogée) : {$identifier}";

                continue;
            }

            $assessment = $this->resolveAssessment($row->toArray(), $moduleAssessments);
            if (! $assessment) {
                $this->warnings[] = "Évaluation non déterminée pour {$student->last_name} {$student->first_name}";

                continue;
            }

            // Extract Note
            $rawNote = isset($row['note']) ? (string) $row['note'] : (isset($row['note_20']) ? (string) $row['note_20'] : null);
            if ($rawNote === null && isset($row['valeur'])) {
                $rawNote = (string) $row['valeur'];
            }
            if ($rawNote === null && isset($row['grade'])) {
                $rawNote = (string) $row['grade'];
            }
            $rawNote = $rawNote !== null ? trim($rawNote) : '';

            // Extract Absent
            $rawAbsent = isset($row['absent']) ? (string) $row['absent'] : (isset($row['absent_1_oui']) ? (string) $row['absent_1_oui'] : null);
            if ($rawAbsent === null && isset($row['absence'])) {
                $rawAbsent = (string) $row['absence'];
            }
            if ($rawAbsent === null && isset($row['ab'])) {
                $rawAbsent = (string) $row['ab'];
            }
            $rawAbsentStr = $rawAbsent !== null ? trim($rawAbsent) : '';
            $isAbsent = in_array(strtolower($rawAbsentStr), ['1', 'true', 'oui', 'yes', 'abs', 'absent', 'x', 'o']);

            $normalizedNote = str_replace(',', '.', $rawNote);
            $value = null;

            if ($rawNote !== '') {
                if (in_array(strtoupper($rawNote), ['ABS', 'ABSENT', 'ABI', 'ABJ'])) {
                    $isAbsent = true;
                    $value = null;
                } elseif (is_numeric($normalizedNote)) {
                    $value = (float) $normalizedNote;
                } else {
                    $this->warnings[] = "Valeur de note invalide '{$rawNote}' pour {$student->last_name} {$student->first_name}";

                    continue;
                }
            }

            // If neither a note was entered nor marked absent, skip row (do not wipe existing assessment or create empty grade)
            if ($rawNote === '' && ! $isAbsent) {
                continue;
            }

            if ($value !== null && ($value < 0 || $value > 20)) {
                $this->warnings[] = "Note hors barème (0-20) pour {$student->last_name} {$student->first_name} : {$value}";

                continue;
            }

            $service = app(GradeService::class);
            $allowed = $service->getRegisteredStudents($this->module, request()->input('group_id'))->pluck('id');
            abort_unless($allowed->contains($student->id), 422, 'Étudiant hors du contexte pédagogique.');
            abort_if($service->isExamLocked($assessment) || $service->isPvSigned($this->module->id), 403, 'Module verrouillé.');
            abort_unless(isset($row['version']) && filter_var($row['version'], FILTER_VALIDATE_INT) !== false && (int) $row['version'] >= 0, 422, 'Colonne Version requise : téléchargez un modèle récent.');
            app(StoreBulkGradesAction::class)->execute($assessment, [[
                'student_id' => $student->id, 'value' => $value, 'absent' => $isAbsent, 'version' => (int) $row['version'],
            ]], $service->getFraudStudentIds($this->module), function ($old, $new, $absent, $studentId, $assessment) {
                activity()->causedBy(request()->user())->withProperties(['student_id' => $studentId, 'assessment_id' => $assessment->id, 'old_value' => $old?->value, 'value' => $new])->log('grade_imported');
            });
            $this->imported++;
        }
    }

    /**
     * Resolve the target assessment for a row.
     */
    private function resolveAssessment(array $row, Collection $moduleAssessments): ?Assessment
    {
        $rawType = trim((string) ($row['type'] ?? $row['assessment'] ?? $row['evaluation'] ?? ''));

        if ($rawType !== '') {
            $lowered = strtolower($rawType);

            // Exact match on type
            $matched = $moduleAssessments->first(fn ($a) => strtolower($a->type) === $lowered);
            if ($matched) {
                return $matched;
            }

            // Exact match on name
            $matched = $moduleAssessments->first(fn ($a) => strtolower($a->name ?? '') === $lowered);
            if ($matched) {
                return $matched;
            }

            // Fuzzy shortcut: CC
            if (str_contains($lowered, 'cc') || str_contains($lowered, 'continu')) {
                $matched = $moduleAssessments->first(fn ($a) => str_contains(strtolower($a->type), 'cc'));
                if ($matched) {
                    return $matched;
                }
            }

            // Fuzzy shortcut: Exam
            if (str_contains($lowered, 'exam') || str_contains($lowered, 'normale') || $lowered === 'sn') {
                $matched = $moduleAssessments->first(fn ($a) => str_contains(strtolower($a->type), 'exam') && ! str_contains(strtolower($a->type), 'rat'));
                if ($matched) {
                    return $matched;
                }
            }

            // Fuzzy shortcut: Rattrapage
            if (str_contains($lowered, 'rat') || str_contains($lowered, 'sr')) {
                $matched = $moduleAssessments->first(fn ($a) => str_contains(strtolower($a->type), 'rat'));
                if ($matched) {
                    return $matched;
                }
            }
        }

        // Context assessment ID if specified from user UI
        if ($this->targetAssessmentId) {
            $matched = $moduleAssessments->firstWhere('id', $this->targetAssessmentId);
            if ($matched) {
                return $matched;
            }
        }

        // Imports never invent evaluation modalities.
        if ($rawType !== '') {
            return null;
        }

        // Default to first assessment of the module
        return $moduleAssessments->first();
    }
}

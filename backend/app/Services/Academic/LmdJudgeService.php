<?php

namespace App\Services\Academic;

use App\Domain\AI\Services\GroundedAiService;
use App\Domain\Deliberation\LmdRules;
use App\Models\Module;
use App\Models\Student;

class LmdJudgeService
{
    public function __construct(
        private DeliberationEngine $engine,
        private GroundedAiService $groundedAi
    ) {}

    public static function verdictFromAverage(float $avg, bool $hasEliminatory = false): string
    {
        if ($hasEliminatory || $avg < LmdRules::ELIMINATORY_THRESHOLD) {
            return 'NV';
        }

        if ($avg >= LmdRules::VALIDATION_THRESHOLD) {
            return 'V';
        }

        if ($avg >= LmdRules::RACHAT_MIN_AVERAGE) {
            return 'RACHAT';
        }

        return LmdRules::decisionFromScore($avg);
    }

    /**
     * @return array<string, mixed>
     */
    public function judge(Student $student, ?int $moduleId = null, ?string $question = null): array
    {
        $student->loadMissing(['grades.assessment.module', 'latestPathway']);
        $facts = $this->snapshot($student, $moduleId);
        $copy = $this->groundedAi->explain($facts + ['question' => $question], 'lmd_judge');

        return [
            'verdict' => $facts['verdict'],
            'facts' => $facts,
            'explanation_fr' => $copy['text_fr'],
            'explanation_ar' => $copy['text_ar'],
            'text_fr' => $copy['text_fr'],
            'text_ar' => $copy['text_ar'],
            'tuition' => 'grande_ecole_free',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function snapshot(Student $student, ?int $moduleId = null): array
    {
        if ($moduleId) {
            $module = Module::with('assessments')->findOrFail($moduleId);
            $result = $this->engine->calculateModuleResult($student, $module);

            return [
                'scope' => 'module',
                'module_id' => $module->id,
                'module_code' => $module->code,
                'average' => $result['average'],
                'verdict' => $result['status'],
                'has_eliminatory' => (bool) ($result['has_eliminatory'] ?? false),
                'eliminatory_threshold' => LmdRules::ELIMINATORY_THRESHOLD,
                'validation_threshold' => LmdRules::VALIDATION_THRESHOLD,
                'rachat_min' => LmdRules::RACHAT_MIN_AVERAGE,
            ];
        }

        $semester = (int) ($student->latestPathway?->current_semester ?? 1);
        $modulesQuery = Module::query()
            ->when($student->latestPathway?->filiere_id, fn ($q) => $q->where('filiere_id', $student->latestPathway->filiere_id));

        $modulesQuery->where(function ($q) use ($semester) {
            $q->where('semester_number', $semester);
            if (\Illuminate\Support\Facades\Schema::hasColumn('modules', 'semester_id')) {
                $q->orWhere('semester_id', $semester);
            }
        });

        $modules = $modulesQuery->with('assessments')->get();

        if ($modules->isEmpty()) {
            $modules = Module::with('assessments')->limit(8)->get();
        }

        $delib = $this->engine->calculateSemesterDeliberation($student, $modules);
        $avg = (float) ($delib['semester_average'] ?? 0);
        $hasElim = (bool) ($delib['has_eliminatory'] ?? false);
        $verdict = self::verdictFromAverage($avg, $hasElim);

        return [
            'scope' => 'semester',
            'semester' => $semester,
            'semester_average' => $avg,
            'verdict' => $verdict,
            'has_eliminatory' => $hasElim,
            'module_count' => $modules->count(),
            'eliminatory_threshold' => LmdRules::ELIMINATORY_THRESHOLD,
            'validation_threshold' => LmdRules::VALIDATION_THRESHOLD,
            'rachat_min' => LmdRules::RACHAT_MIN_AVERAGE,
        ];
    }
}

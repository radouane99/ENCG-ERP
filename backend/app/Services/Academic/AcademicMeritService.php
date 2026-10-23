<?php
namespace App\Services\Academic;

use App\Models\{Assessment, Grade, Module, Student};

final class AcademicMeritService
{
    public function summary(Student $student, int $year, int $from = 1, int $to = 6): array
    {
        return AcademicContext::run($year, function () use ($student, $year, $from, $to) {
            $ids = Assessment::withoutGlobalScopes()->where('academic_year_id', $year)->whereHas('grades', fn ($q) => $q->where('student_id', $student->id))->pluck('module_id');
            $modules = Module::where('institution_id', $student->institution_id)->whereIn('id', $ids)->whereBetween('semester_number', [$from, $to])->get()->keyBy('id');
            $result = ['average' => null, 'language_average' => null, 'complete' => false, 'module_count' => $modules->count()];
            if ($modules->isEmpty() || Assessment::withoutGlobalScopes()->where('academic_year_id', $year)->whereIn('module_id', $modules->keys())->where('needs_review', true)->exists()) return $result;
            foreach (Assessment::whereIn('module_id', $modules->keys())->whereNotIn('type', ['Rattrapage', 'rattrapage', 'R', 'resit', 'rat'])->get() as $a) {
                if (! Grade::where('assessment_id', $a->id)->where('student_id', $student->id)->where(fn ($q) => $q->whereNotNull('value')->orWhere('absent', true))->exists()) return $result;
            }
            $scores = collect();
            foreach ($modules->pluck('semester_number')->unique() as $semester) $scores = $scores->concat(app(\App\Domain\Deliberation\Services\DeliberationEngine::class)->calculateModuleAverages($student->id, (int) $semester, true));
            $sum = 0; $weight = 0; $languages = [];
            foreach ($scores as $r) {
                $m = $modules[$r->module_id] ?? null; if (! $m) continue;
                $coefficient = (float) ($m->coefficient ?? 1); $sum += (float) $r->final_module_score * $coefficient; $weight += $coefficient;
                if (preg_match('/anglais|français|francais|communication|lang/i', $m->name.' '.$m->code)) $languages[] = (float) $r->final_module_score;
            }
            return ['average' => $weight > 0 ? round($sum / $weight, 2) : null, 'language_average' => $languages ? round(array_sum($languages) / count($languages), 2) : null, 'complete' => $weight > 0, 'module_count' => $modules->count()];
        });
    }
}

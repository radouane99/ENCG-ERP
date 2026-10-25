<?php

namespace App\Actions\Academic;

use App\Models\AcademicYear;
use App\Models\Group;
use App\Models\ModuleProfessor;
use App\Models\Professor;
use App\Services\Academic\AcademicContext;
use Illuminate\Support\Facades\DB;

class CarryForwardProfessorAssignmentsAction
{
    public function execute(int $sourceYearId, bool $apply = false): array
    {
        return DB::transaction(function () use ($sourceYearId, $apply) {
            $institution = auth()->user()->institution_id;
            $target = AcademicYear::where('institution_id', $institution)->lockForUpdate()->findOrFail(AcademicContext::yearId());
            abort_if($target->is_locked, 409, 'Année cible verrouillée.');
            $source = AcademicYear::where('institution_id', $institution)->findOrFail($sourceYearId);
            abort_unless($source->start_year < $target->start_year, 422, 'Choisir une année antérieure à l’année cible.');
            $rows = ModuleProfessor::with(['module', 'professor', 'group'])->where('academic_year_id', $source->id)
                ->whereHas('module', fn ($q) => $q->where('institution_id', $institution))->orderBy('id')->get();
            $groups = Group::where('academic_year_id', $target->id)->get();
            $existing = ModuleProfessor::where('academic_year_id', $target->id)->get();
            $candidates = [];
            $skipped = [];
            foreach ($rows as $row) {
                $reason = null;
                $matches = $row->group ? $groups->filter(fn ($g) => $g->name === $row->group->name && (int) $g->filiere_id === (int) $row->module->filiere_id && (int) $g->semester_number === (int) $row->module->semester_number) : collect();
                $group = $matches->count() === 1 ? $matches->first() : null;
                if (! $row->professor?->is_active || (int) $row->professor?->institution_id !== (int) $institution) {
                    $reason = 'Enseignant inactif ou indisponible dans cet établissement.';
                } elseif (! $row->group || ! $group) {
                    $reason = 'Correspondance de groupe absente ou ambiguë : vérifier manuellement.';
                } elseif (! $row->module?->is_active || $row->assigned_hours <= 0 || ! in_array($row->session_type, ['cm', 'td', 'tp'], true)) {
                    $reason = 'Module, volume ou type de séance à vérifier.';
                } elseif ($existing->contains(fn ($a) => (int) $a->module_id === (int) $row->module_id && (! $a->group_id || (int) $a->group_id === (int) $group->id) && $a->session_type === $row->session_type)) {
                    $reason = 'Affectation déjà présente : conservée.';
                }
                $label = ['module' => $row->module?->name, 'group' => $row->group?->name, 'professor_id' => $row->professor_id, 'hours' => $row->assigned_hours, 'session_type' => $row->session_type];
                if ($reason) {
                    $skipped[] = $label + ['reason' => $reason];

                    continue;
                }
                $attributes = ['academic_year_id' => $target->id, 'module_id' => $row->module_id, 'group_id' => $group->id, 'professor_id' => $row->professor_id, 'professor_type' => Professor::class, 'session_type' => $row->session_type, 'assigned_hours' => $row->assigned_hours];
                $existing->push(new ModuleProfessor($attributes));
                if ($apply) {
                    ModuleProfessor::create($attributes);
                }
                $candidates[] = $label;
            }
            if ($apply && $candidates) {
                activity()->causedBy(auth()->user())->withProperties(['source_year_id' => $source->id, 'target_year_id' => $target->id, 'created' => count($candidates)])->log('Reconduction des affectations sans remplacement');
            }

            return ['applied' => $apply, 'source_year' => $source->label, 'target_year' => $target->label, 'candidates' => $candidates, 'skipped' => $skipped, 'created' => $apply ? count($candidates) : 0];
        });
    }
}

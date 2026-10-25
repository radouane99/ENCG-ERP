<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\Group;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\Room;

class SemesterReadinessService
{
    public function summarize(?AcademicYear $year, int $parity, ?int $filiereId = null): array
    {
        if (! $year) {
            return ['configured' => false, 'issues' => ['Configurer une année et un semestre actifs.']];
        }
        $modules = Module::where('institution_id', $year->institution_id)->when($filiereId, fn ($q) => $q->where('filiere_id', $filiereId))->whereRaw('MOD(semester_number, 2) = ?', [$parity])->get();
        $groups = Group::where('academic_year_id', $year->id)->when($filiereId, fn ($q) => $q->where('filiere_id', $filiereId))->whereRaw('MOD(semester_number, 2) = ?', [$parity])->get();
        $assignments = ModuleProfessor::with('professor.user')->whereHas('professor', fn ($q) => $q->where('institution_id', $year->institution_id)->where('is_active', true))->where('academic_year_id', $year->id)->whereIn('module_id', $modules->pluck('id'))->get();
        $missing = [];
        foreach ($modules as $module) {
            foreach ($groups->where('filiere_id', $module->filiere_id)->where('semester_number', $module->semester_number) as $group) {
                $assigned = $assignments->filter(fn ($a) => (int) $a->module_id === (int) $module->id && (! $a->group_id || (int) $a->group_id === (int) $group->id));
                $requiredTypes = collect(['cm' => $module->hours_cm, 'td' => $module->hours_td, 'tp' => $module->hours_tp])->filter(fn ($hours) => $hours > 0)->keys();
                if ($assigned->isEmpty() || $requiredTypes->diff($assigned->pluck('session_type'))->isNotEmpty()) {
                    $missing[] = ['module_id' => $module->id, 'module_name' => $module->name, 'group_name' => $group->name];
                }
            }
        }
        $loads = $assignments->groupBy('professor_id')->map(function ($rows, $id) {
            $user = $rows->first()->professor?->user;

            return ['professor_id' => $id, 'name' => $user?->name ?: trim(($user?->first_name ?? '').' '.($user?->last_name ?? '')),
                'assigned_hours' => round($rows->sum('assigned_hours'), 2), 'unknown_hours' => $rows->filter(fn ($a) => $a->assigned_hours === null || $a->assigned_hours <= 0)->count(), 'assignments' => $rows->count()];
        })->sortByDesc('assigned_hours')->values();
        $rooms = Room::where('institution_id', $year->institution_id)->get();
        $operational = $rooms->filter(fn ($room) => app(TimetableRoomGuard::class)->roomOperational($room));
        $issues = [];
        if ($modules->isEmpty()) {
            $issues[] = 'Aucun module configuré pour cette période.';
        }
        if ($groups->isEmpty()) {
            $issues[] = 'Aucun groupe configuré pour cette période.';
        }
        if ($missing) {
            $issues[] = count($missing).' couples module/groupe sans affectation.';
        }
        if ($loads->sum('unknown_hours')) {
            $issues[] = 'Des volumes horaires restent à renseigner.';
        }
        if ($operational->isEmpty()) {
            $issues[] = 'Aucune salle opérationnelle.';
        }
        $withoutRoom = $groups->filter(fn ($group) => $group->capacity > $operational->max('capacity'))->count();
        if ($withoutRoom) {
            $issues[] = $withoutRoom.' groupes dépassent la capacité de toutes les salles disponibles.';
        }

        return ['configured' => true, 'academic_year_id' => $year->id, 'modules' => $modules->count(), 'groups' => $groups->count(),
            'missing_assignments_count' => count($missing), 'missing_assignments' => array_slice($missing, 0, 30),
            'professor_loads' => $loads, 'operational_rooms' => $operational->count(), 'unavailable_rooms' => $rooms->count() - $operational->count(), 'issues' => $issues];
    }
}

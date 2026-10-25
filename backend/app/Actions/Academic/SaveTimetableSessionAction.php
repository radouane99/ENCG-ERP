<?php

namespace App\Actions\Academic;

use App\Models\AcademicYear;
use App\Models\Group;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\Semester;
use App\Services\Academic\AcademicContext;
use App\Services\Academic\ProfessorAvailabilityService;
use App\Services\Academic\TimetableOccupancyGrid;
use App\Services\Academic\TimetableRoomGuard;
use Illuminate\Support\Facades\DB;

class SaveTimetableSessionAction
{
    public function execute(array $payload, ?int $id = null): Schedule
    {
        return DB::transaction(function () use ($payload, $id) {
            $institutionId = auth()->user()->institution_id;
            $year = AcademicYear::where('institution_id', $institutionId)->lockForUpdate()->findOrFail($payload['academic_year_id'] ?? AcademicContext::yearId());
            abort_if($year->is_locked, 409, 'Année universitaire verrouillée.');
            $schedule = $id ? Schedule::where('institution_id', $institutionId)->where('academic_year_id', $year->id)->lockForUpdate()->findOrFail($id) : new Schedule;
            abort_if($schedule->schedule_version_id, 409, 'Modifier cette séance depuis le brouillon de sa campagne.');
            if ($id && isset($payload['version'])) {
                abort_if((int) $schedule->getAttribute('version') !== (int) $payload['version'], 409, 'Séance modifiée entre-temps. Actualiser la grille.');
            }
            unset($payload['version']);
            $schedule->fill($payload);
            $schedule->institution_id = $institutionId;
            $schedule->academic_year_id = $year->id;
            $module = Module::where('institution_id', $institutionId)->findOrFail($schedule->module_id);
            Group::where('filiere_id', $module->filiere_id)->where('academic_year_id', $year->id)->where('semester_number', $module->semester_number)->findOrFail($schedule->group_id);
            Semester::where('academic_year_id', $year->id)->findOrFail($schedule->semester_id);
            Professor::where('institution_id', $institutionId)->where('is_active', true)->findOrFail($schedule->professor_id);
            $schedule->professor_type = Professor::class;
            $room = Room::where('institution_id', $institutionId)->lockForUpdate()->findOrFail($schedule->room_id);
            $guard = app(TimetableRoomGuard::class);
            abort_unless($guard->roomOperational($room), 422, 'Salle hors service.');
            abort_if($room->capacity < $guard->groupsHeadcount([$schedule->group_id]), 422, 'Capacité de salle insuffisante.');
            $start = substr($schedule->start_time, 0, 8);
            $end = substr($schedule->end_time, 0, 8);
            abort_unless($start < $end, 422, 'Heure de fin invalide.');
            abort_unless(ProfessorAvailabilityService::allows(ProfessorAvailabilityService::map(), (int) $schedule->professor_id, (int) $schedule->day_of_week, $start, $end), 409, 'Enseignant indisponible.');
            $grid = new TimetableOccupancyGrid;
            $guard->seedOccupancy($grid, $id ? [$id] : []);
            abort_if($grid->roomBusy($schedule->day_of_week, $start, $end, $room->id) || $grid->professorBusy($schedule->day_of_week, $start, $end, $schedule->professor_id) || $grid->groupsBusy($schedule->day_of_week, $start, $end, [$schedule->group_id]), 409, 'Conflit de salle, professeur ou groupe.');
            if (! $id) {
                $schedule->is_active = true;
                $schedule->recurrence ??= 'weekly';
            }
            $schedule->save();

            return $schedule->fresh();
        });
    }
}

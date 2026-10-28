<?php

namespace App\Actions\Academic;

use App\Models\AcademicYear;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\ScheduleChangeRequest;
use App\Models\User;
use App\Notifications\SystemNotification;
use App\Services\Academic\AcademicContext;
use App\Services\Academic\ExamWorkflowGuard;
use App\Services\Academic\ProfessorAvailabilityService;
use App\Services\Academic\TimetableOccupancyGrid;
use App\Services\Academic\TimetableRoomGuard;
use Illuminate\Support\Facades\DB;

class ReviewTimetableChangeAction
{
    public function execute(User $actor, ScheduleChangeRequest $request, string $status, string $note): void
    {
        app(ExamWorkflowGuard::class)->manage($actor);
        DB::transaction(function () use ($actor, $request, $status, $note) {
            $year = AcademicYear::where('institution_id', $actor->institution_id)->whereKey($request->timetable_payload['academic_year_id'])->lockForUpdate()->firstOrFail();
            abort_if($year->is_locked, 409, 'Année universitaire verrouillée.');
            $request = ScheduleChangeRequest::whereKey($request->id)->lockForUpdate()->firstOrFail();
            abort_unless($request->status === 'pending', 409, 'Demande déjà traitée.');
            if ($status === 'approved') {
                $payload = $request->timetable_payload;
                $rows = Schedule::with(['module', 'version'])->where('institution_id', $actor->institution_id)->where('academic_year_id', $year->id)->whereIn('id', $payload['schedule_ids'])->orderBy('id')->lockForUpdate()->get();
                abort_unless($rows->count() === count($payload['schedule_ids']) && RequestTimetableChangeAction::fingerprint($rows) === $payload['fingerprint'], 409, 'Le planning a changé depuis la demande. Refusez cette demande périmée pour permettre une nouvelle proposition.');
                abort_if($rows->contains(fn ($r) => ! $r->is_active || ($r->getRelation('version') && $r->getRelation('version')->status !== 'PUBLISHED')), 409, 'Planning remplacé ou non publié.');
                $target = $payload['proposed'];
                $first = $rows->first();
                $room = Room::where('institution_id', $actor->institution_id)->whereKey($target['room_id'])->lockForUpdate()->firstOrFail();
                $guard = app(TimetableRoomGuard::class);
                $groups = $rows->pluck('group_id')->unique()->all();
                $size = $guard->groupsHeadcount($groups);
                abort_unless($guard->roomFits($room, ['group_size' => $size, 'required_type' => $guard->requiredRoomType($first->module->name, $first->session_type, $size)], Room::where('institution_id', $actor->institution_id)->get()), 422, 'Salle indisponible, trop petite ou incompatible.');
                $grid = new TimetableOccupancyGrid;
                AcademicContext::run($year->id, fn () => $guard->seedOccupancy($grid, $payload['schedule_ids']));
                $day = $target['day_of_week'];
                $start = $target['start_time'];
                $end = $target['end_time'];
                abort_if($grid->professorBusy($day, $start, $end, $first->professor_id) || $grid->groupsBusy($day, $start, $end, $groups) || $grid->roomBusy($day, $start, $end, $room->id), 422, 'Créneau impossible : conflit de professeur, groupe ou salle.');
                abort_unless(ProfessorAvailabilityService::allows(ProfessorAvailabilityService::map($year->id), (int) $first->professor_id, $day, $start, $end), 422, 'Enseignant indisponible sur le créneau demandé.');
                $world = Schedule::where('institution_id', $actor->institution_id)->where('academic_year_id', $year->id)->where('day_of_week', $day)->whereNotIn('id', $payload['schedule_ids'])
                    ->where(fn ($q) => $q->where('is_active', true)->orWhereHas('version', fn ($v) => $v->whereIn('status', ['DRAFT', 'PROPOSED', 'PUBLISHED'])))->get();
                $minutes = fn ($rows) => $rows->unique(fn ($r) => substr($r->start_time, 0, 5).'|'.substr($r->end_time, 0, 5))->sum(fn ($r) => TimetableOccupancyGrid::minutes($r->end_time) - TimetableOccupancyGrid::minutes($r->start_time));
                $duration = TimetableOccupancyGrid::minutes($end) - TimetableOccupancyGrid::minutes($start);
                $maximum = (int) (($first->getRelation('version')?->ai_metadata ?? [])['max_daily_hours'] ?? 8) * 60;
                abort_if($minutes($world->where('professor_id', $first->professor_id)) + $duration > $maximum, 422, 'Charge quotidienne maximale de l’enseignant dépassée.');
                foreach ($groups as $groupId) {
                    abort_if($minutes($world->where('group_id', $groupId)) + $duration > $maximum, 422, 'Charge quotidienne maximale du groupe dépassée.');
                }
                Schedule::whereIn('id', $payload['schedule_ids'])->update(['day_of_week' => $day, 'start_time' => $start, 'end_time' => $end]);
                User::where('institution_id', $actor->institution_id)->whereHas('student.registrations', fn ($q) => $q->where('academic_year_id', $year->id)->whereIn('group_id', $groups)->whereIn('status', ['academic_validated', 'admin_validated']))
                    ->chunkById(100, function ($users) use ($first) {
                        foreach ($users as $user) {
                            $user->notifyNow(new SystemNotification('Changement de votre emploi du temps', 'Le créneau de '.$first->module->name.' a été modifié par la scolarité. Consultez votre planning actualisé.', 'info', '/student/schedule'), ['database']);
                        }
                    });
                activity()->causedBy($actor)->performedOn($request)->withProperties(['before' => $payload['original'], 'after' => $target, 'schedule_ids' => $payload['schedule_ids']])->log('published_timetable_change_applied');
            }
            $request->update(['status' => $status, 'review_note' => $note, 'reviewed_by' => $actor->id, 'reviewed_at' => now()]);
            $request->professor->notifyNow(new SystemNotification('Demande de changement d’horaire', $status === 'approved' ? 'Votre changement a été accepté et appliqué au planning.' : 'Votre demande a été refusée : '.$note, 'info', '/professor/schedule'), ['database']);
        });
    }
}

<?php
namespace App\Actions\Academic;

use App\Models\{AcademicYear, Professor, Schedule, ScheduleChangeRequest, User};
use App\Services\Academic\AcademicContext;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RequestTimetableChangeAction
{
    public static function fingerprint(Collection $rows): string
    {
        return hash('sha256', json_encode($rows->sortBy('id')->map(fn ($r) => $r->only(['id','module_id','group_id','professor_id','professor_type','room_id','day_of_week','start_time','end_time','schedule_version_id','is_active','updated_at']))->values()->all()));
    }

    public function execute(User $user, array $data): ScheduleChangeRequest
    {
        return DB::transaction(function () use ($user, $data) {
            $year = AcademicYear::where('institution_id', $user->institution_id)->whereKey(AcademicContext::yearId())->lockForUpdate()->firstOrFail();
            abort_if($year->is_locked, 409, 'Année universitaire verrouillée.');
            $row = Schedule::with('version')->where('institution_id', $user->institution_id)->where('academic_year_id', $year->id)->where('is_active', true)->findOrFail($data['schedule_id']);
            $owns = ($row->professor_type === Professor::class && (int) $row->professor_id === (int) $user->professor?->id)
                || ($row->professor_type === User::class && (int) $row->professor_id === (int) $user->id);
            abort_unless($owns, 403, 'Cette séance ne vous est pas affectée.');
            abort_if($row->getRelation('version') && $row->getRelation('version')->status !== 'PUBLISHED', 409, 'Seul un planning publié peut faire l’objet d’une demande.');
            $rows = Schedule::where('institution_id', $row->institution_id)->where('academic_year_id', $year->id)->where('is_active', true)
                ->where('schedule_version_id', $row->schedule_version_id)->where('module_id', $row->module_id)->where('professor_id', $row->professor_id)->where('professor_type', $row->professor_type)
                ->where('day_of_week', $row->day_of_week)->where('start_time', $row->start_time)->where('end_time', $row->end_time)->where('room_id', $row->room_id)->where('session_type', $row->session_type)->orderBy('id')->lockForUpdate()->get();
            abort_if(ScheduleChangeRequest::where('professor_id', $user->id)->whereIn('schedule_id', $rows->pluck('id'))->where('status', 'pending')->exists(), 409, 'Une demande est déjà en cours pour cette séance.');
            abort_unless(substr($data['start_time'],0,5) < substr($data['end_time'],0,5), 422, 'Heure de fin invalide.');
            $duration = fn ($start, $end) => strtotime($end) - strtotime($start);
            abort_unless($duration($row->start_time, $row->end_time) === $duration($data['start_time'], $data['end_time']), 422, 'Conserver la durée de la séance.');
            abort_if((int) $row->day_of_week === (int) $data['day_of_week'] && substr($row->start_time,0,5) === $data['start_time'] && substr($row->end_time,0,5) === $data['end_time'], 422, 'Proposer un créneau différent.');
            return ScheduleChangeRequest::create(['professor_id' => $user->id, 'schedule_id' => $row->id, 'request_type' => 'timetable_change', 'reason' => $data['reason'], 'status' => 'pending',
                'old_start_time' => $row->start_time, 'proposed_start_time' => $data['start_time'], 'timetable_payload' => [
                    'academic_year_id' => $year->id, 'schedule_ids' => $rows->pluck('id')->all(), 'fingerprint' => self::fingerprint($rows),
                    'original' => ['day_of_week' => $row->day_of_week, 'start_time' => substr($row->start_time,0,5), 'end_time' => substr($row->end_time,0,5), 'room_id' => $row->room_id],
                    'proposed' => ['day_of_week' => (int) $data['day_of_week'], 'start_time' => $data['start_time'], 'end_time' => $data['end_time'], 'room_id' => $row->room_id],
                ]]);
        });
    }
}

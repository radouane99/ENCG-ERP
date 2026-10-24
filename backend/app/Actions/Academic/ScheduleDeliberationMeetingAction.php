<?php
namespace App\Actions\Academic;

use App\Models\{AcademicYear, Deliberation, Room, User};
use App\Notifications\SystemNotification;
use App\Services\Academic\PvWorkflowContext;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScheduleDeliberationMeetingAction
{
    public function execute(Request $request): array
    {
        $context = app(PvWorkflowContext::class)->resolve($request);
        $data = $request->validate(['room_id' => 'required|integer', 'starts_at' => 'required|date|after:now', 'duration_minutes' => 'required|integer|between:30,480', 'president_id' => 'required|integer', 'member_ids' => 'present|array|max:50', 'member_ids.*' => 'integer|distinct', 'version' => 'required|integer|min:0']);
        $ids = collect($data['member_ids'])->push($data['president_id'])->unique()->values();
        $members = User::whereIn('id', $ids)->where('institution_id', $request->user()->institution_id)->where('is_active', true)->whereHas('roles', fn ($q) => $q->whereIn('name', ['professor', 'vacataire', 'department-head', 'filiere-head', 'director', 'admin', 'super-admin', 'institution-admin']))->get();
        abort_unless($members->count() === $ids->count(), 422, 'Les membres doivent être des utilisateurs actifs habilités de votre établissement.');
        return DB::transaction(function () use ($request, $context, $data, $members) {
            $year = AcademicYear::whereKey($context['year']->id)->lockForUpdate()->firstOrFail(); abort_if($year->is_locked, 409, 'Année verrouillée.');
            $room = Room::where('institution_id', $request->user()->institution_id)->whereKey($data['room_id'])->lockForUpdate()->firstOrFail();
            $deliberation = $context['deliberation'] ? Deliberation::whereKey($context['deliberation']->id)->lockForUpdate()->firstOrFail() : Deliberation::firstOrCreate([
                'institution_id' => $request->user()->institution_id, 'academic_year_id' => $year->id, 'semester_id' => $context['semester']->id,
                'filiere_id' => $context['filiere']->id, 'group_id' => $context['group']?->id, 'type' => $context['type'],
            ], ['status' => 'pending']);
            abort_if($deliberation->is_sealed, 423, 'PV déjà scellé.');
            $current = DB::table('deliberation_meetings')->where('deliberation_id', $deliberation->id)->first();
            abort_unless((int)($current->version ?? 0) === $data['version'], 409, 'La réunion a changé. Actualisez avant de la modifier.');
            $start = Carbon::parse($data['starts_at'], config('app.timezone')); $end = $start->copy()->addMinutes($data['duration_minutes']);
            abort_if(DB::table('deliberation_meetings')->where('deliberation_id', '!=', $deliberation->id)->where('starts_at', '<', $end)->where('ends_at', '>', $start)->where(fn ($q) => $q->where('room_id', $room->id)->orWhereIn('deliberation_id', DB::table('deliberation_members')->whereIn('user_id', $members->pluck('id'))->select('deliberation_id')))->exists(), 409, 'Salle ou membre du jury déjà réservé sur cette plage.');
            DB::table('deliberation_meetings')->updateOrInsert(['deliberation_id' => $deliberation->id], ['room_id' => $room->id, 'starts_at' => $start, 'ends_at' => $end, 'version' => ($current->version ?? 0) + 1, 'created_at' => $current->created_at ?? now(), 'updated_at' => now()]);
            $deliberation->update(['president_id' => $data['president_id'], 'deliberation_date' => $start->toDateString()]);
            DB::table('deliberation_members')->where('deliberation_id', $deliberation->id)->delete();
            foreach ($members as $member) {
                DB::table('deliberation_members')->insert(['deliberation_id' => $deliberation->id, 'user_id' => $member->id, 'role' => $member->id === $data['president_id'] ? 'president' : 'member', 'created_at' => now(), 'updated_at' => now()]);
                $member->notify(new SystemNotification('Réunion de délibération', $start->format('d/m/Y H:i').' · '.$room->name.' · '.$context['filiere']->name, 'academic', '/admin/grades/pv?filiere_id='.$context['filiere']->id.'&semester='.$context['semester']->number));
            }
            activity()->causedBy($request->user())->performedOn($deliberation)->withProperties(['room_id' => $room->id, 'starts_at' => $start->toIso8601String()])->log('deliberation_meeting_scheduled');
            return ['deliberation_id' => $deliberation->id, 'notifications_portal' => $members->count(), 'email_sent' => false];
        });
    }
}

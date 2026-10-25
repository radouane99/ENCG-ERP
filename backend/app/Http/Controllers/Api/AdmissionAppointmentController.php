<?php

namespace App\Http\Controllers\Api;

use App\Actions\Admission\ManageDossierAction;
use App\Http\Controllers\Controller;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Support\AdmissionAccess;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdmissionAppointmentController extends Controller
{
    public function slots(Request $request)
    {
        $c = AdmissionAccess::campaign($request);
        $slots = DB::table('admission_slots as s')->leftJoin('admission_appointments as a', 'a.slot_id', '=', 's.id')
            ->where('s.admission_campaign_id', $c->id)->where('s.ends_at', '>', now())
            ->select('s.id', 's.starts_at', 's.ends_at', 's.desk', 's.capacity')->selectRaw('count(a.id) as reserved')
            ->groupBy('s.id', 's.starts_at', 's.ends_at', 's.desk', 's.capacity')->orderBy('s.starts_at')->limit(300)->get();

        return response()->json(['data' => $slots]);
    }

    public function createSlot(Request $request)
    {
        AdmissionAccess::review($request);
        $c = AdmissionAccess::campaign($request);
        $data = $request->validate(['starts_at' => 'required|date|after:now', 'ends_at' => 'required|date|after:starts_at',
            'desk' => 'required|string|max:80', 'capacity' => 'required|integer|min:1|max:1000']);
        $data['starts_at'] = Carbon::parse($data['starts_at'], config('admissions.timezone'))->utc();
        $data['ends_at'] = Carbon::parse($data['ends_at'], config('admissions.timezone'))->utc();
        $id = DB::table('admission_slots')->insertGetId($data + ['admission_campaign_id' => $c->id, 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['id' => $id], 201);
    }

    private function reserve(Application $app, int $slotId): void
    {
        AdmissionAccess::invitationActive($app);
        $slot = DB::table('admission_slots')->where('id', $slotId)->where('admission_campaign_id', $app->admission_campaign_id)->lockForUpdate()->first();
        abort_unless($slot && now()->lessThan($slot->ends_at), 422, 'Créneau indisponible.');
        abort_unless($app->eligibility === 'main' && ! in_array($app->dossier_status, ['rejected', 'approved']), 422, 'Ce dossier ne peut pas réserver de rendez-vous.');
        $old = DB::table('admission_appointments')->where('application_id', $app->id)->first();
        abort_if($old?->checked_in_at, 409, 'Entrée déjà enregistrée.');
        if ($old?->slot_id === $slotId) {
            return;
        }
        abort_if(DB::table('admission_appointments')->where('slot_id', $slotId)->count() >= $slot->capacity, 409, 'Créneau complet. Choisissez une autre disponibilité.');
        DB::table('admission_appointments')->updateOrInsert(['application_id' => $app->id], ['slot_id' => $slotId,
            'entry_token' => (string) Str::uuid(), 'checked_in_at' => null, 'checked_in_by' => null, 'created_at' => now(), 'updated_at' => now()]);
        $app->increment('version');
        app(ManageDossierAction::class)->event($app, 'appointment_reserved', ['slot_id' => $slotId]);
    }

    public function book(Request $request)
    {
        $request->validate(['slot_id' => 'required|integer', 'version' => 'required|integer']);
        $app = AdmissionAccess::dossier($request, true);
        DB::transaction(function () use ($request, $app) {
            AdmissionCampaign::whereKey($app->admission_campaign_id)->lockForUpdate()->firstOrFail();
            $app = Application::whereKey($app->id)->lockForUpdate()->firstOrFail();
            app(ManageDossierAction::class)->version($app, $request);
            $this->reserve($app, $request->integer('slot_id'));
        });

        return app(AdmissionWorkflowController::class)->show($request);
    }

    public function preview(Request $request)
    {
        AdmissionAccess::review($request);
        $c = AdmissionAccess::campaign($request);
        $slots = DB::table('admission_slots')->where('admission_campaign_id', $c->id)->where('ends_at', '>', now())->orderBy('starts_at')->get();
        $apps = Application::where('admission_campaign_id', $c->id)->where('eligibility', 'main')
            ->whereNotIn('dossier_status', ['rejected', 'approved'])->whereNotIn('id', DB::table('admission_appointments')->select('application_id'))
            ->orderByRaw('CASE WHEN ranking IS NULL THEN 1 ELSE 0 END')->orderBy('ranking')->orderBy('id')->limit(1000)->get();
        $plan = [];
        $cursor = 0;
        foreach ($slots as $slot) {
            $free = max(0, $slot->capacity - DB::table('admission_appointments')->where('slot_id', $slot->id)->count());
            while ($free-- > 0 && isset($apps[$cursor])) {
                $app = $apps[$cursor++];
                $plan[] = ['application_id' => $app->id, 'reference' => $app->reference_number, 'version' => $app->version, 'slot_id' => $slot->id, 'starts_at' => $slot->starts_at, 'desk' => $slot->desk];
            }
        }
        $id = (string) Str::uuid();
        DB::table('admission_allocation_plans')->insert(['id' => $id, 'admission_campaign_id' => $c->id,
            'created_by' => auth()->id(), 'assignments' => json_encode($plan), 'expires_at' => now()->addMinutes(15), 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['id' => $id, 'assignments' => $plan, 'unassigned' => $apps->count() - count($plan)]);
    }

    public function commit(Request $request, string $id)
    {
        AdmissionAccess::review($request);
        $n = DB::transaction(function () use ($request, $id) {
            $p = DB::table('admission_allocation_plans')->where('id', $id)->where('created_by', auth()->id())->lockForUpdate()->first();
            abort_unless($p, 404);
            AdmissionCampaign::whereKey($p->admission_campaign_id)->where('institution_id', AdmissionAccess::institution($request))->lockForUpdate()->firstOrFail();
            if ($p->committed_at) {
                return 0;
            }
            abort_if(now()->greaterThan($p->expires_at), 422, 'Aperçu expiré. Relancez la répartition.');
            $rows = json_decode($p->assignments, true);
            foreach ($rows as $row) {
                $app = Application::whereKey($row['application_id'])->lockForUpdate()->firstOrFail();
                abort_if($app->version !== $row['version'] || DB::table('admission_appointments')->where('application_id', $app->id)->exists(), 409, 'Disponibilités modifiées. Actualisez l’aperçu.');
                $this->reserve($app, $row['slot_id']);
            }
            DB::table('admission_allocation_plans')->where('id', $id)->update(['committed_at' => now()]);

            return count($rows);
        });

        return response()->json(['assigned' => $n, 'message' => $n.' rendez-vous enregistrés.']);
    }

    public function scan(Request $request, string $token)
    {
        AdmissionAccess::review($request);
        $a = DB::table('admission_appointments')->where('entry_token', $token)->first();
        abort_unless($a, 404, 'Jeton de rendez-vous inconnu.');
        $app = AdmissionAccess::dossier($request, false, $a->application_id);
        $slot = DB::table('admission_slots')->find($a->slot_id);

        return response()->json(['candidate' => ['application_id' => $app->id, 'name' => trim($app->first_name.' '.$app->last_name),
            'reference' => $app->reference_number, 'desk' => $slot->desk, 'starts_at' => $slot->starts_at, 'ends_at' => $slot->ends_at, 'checked_in_at' => $a->checked_in_at]]);
    }

    public function checkIn(Request $request, string $token)
    {
        AdmissionAccess::review($request);
        DB::transaction(function () use ($request, $token) {
            $a = DB::table('admission_appointments')->where('entry_token', $token)->lockForUpdate()->first();
            abort_unless($a, 404);
            $app = AdmissionAccess::dossier($request, false, $a->application_id);
            abort_unless($app->eligibility === 'main' && $app->dossier_status !== 'rejected', 422, 'Dossier non autorisé.');
            abort_if($a->checked_in_at, 409, 'Entrée déjà enregistrée.');
            $slot = DB::table('admission_slots')->find($a->slot_id);
            abort_unless(now(config('admissions.timezone'))->toDateString() === Carbon::parse($slot->starts_at, 'UTC')->tz(config('admissions.timezone'))->toDateString(), 422, 'Le rendez-vous n’est pas prévu aujourd’hui.');
            DB::table('admission_appointments')->where('id', $a->id)->update(['checked_in_at' => now(), 'checked_in_by' => auth()->id()]);
            app(ManageDossierAction::class)->event($app, 'checked_in');
        });

        return $this->scan($request, $token);
    }

    public function daily(Request $request)
    {
        AdmissionAccess::review($request);
        $request->validate(['date' => 'required|date_format:Y-m-d']);
        $c = AdmissionAccess::campaign($request);
        $rows = DB::table('admission_appointments as a')->join('admission_slots as s', 'a.slot_id', '=', 's.id')
            ->join('applications as p', 'a.application_id', '=', 'p.id')->where('s.admission_campaign_id', $c->id)
            ->whereBetween('s.starts_at', [Carbon::parse($request->input('date'), config('admissions.timezone'))->startOfDay()->utc(), Carbon::parse($request->input('date'), config('admissions.timezone'))->endOfDay()->utc()])->orderBy('s.starts_at')
            ->get(['p.reference_number', 'p.first_name', 'p.last_name', 's.starts_at', 's.desk', 'a.checked_in_at']);

        return response()->json(['appointments' => $rows, 'total_authorized_today' => $rows->count()]);
    }
}

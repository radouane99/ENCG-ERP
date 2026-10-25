<?php

namespace App\Actions\Admission;

use App\Http\Requests\Admissions\AdmissionDeskRequest;
use App\Models\Application;
use App\Models\User;
use App\Support\AdmissionAccess;
use App\Support\AdmissionDeskAccess;
use Illuminate\Support\Facades\DB;

class ManageAdmissionDeskAction
{
    public function arrive(AdmissionDeskRequest $request): object
    {
        $resolved = AdmissionAccess::dossier($request, true);

        return DB::transaction(function () use ($resolved, $request) {
            $resolved->campaign()->lockForUpdate()->firstOrFail();
            $app = Application::whereKey($resolved->id)->lockForUpdate()->firstOrFail();
            AdmissionAccess::campaignOpen($app);
            $day = now(config('admissions.timezone'))->toDateString();
            $existing = DB::table('admission_desk_tickets')->where('application_id', $app->id)->where('service_day', $day)->first();
            if ($existing) {
                return $existing;
            }
            abort_unless($app->eligibility === 'main' && in_array($app->dossier_status, ['submitted', 'under_review', 'needs_correction']), 422, 'Le dossier doit être déposé et admissible avant le passage au guichet.');
            $number = 1 + (int) DB::table('admission_desk_tickets')->where('admission_campaign_id', $app->admission_campaign_id)->where('service_day', $day)->max('number');
            $id = DB::table('admission_desk_tickets')->insertGetId([
                'admission_campaign_id' => $app->admission_campaign_id, 'application_id' => $app->id,
                'service_day' => $day, 'number' => $number, 'desk' => trim($request->validated('desk')),
                'status' => 'waiting', 'version' => 1, 'created_at' => now(), 'updated_at' => now(),
            ]);
            app(ManageDossierAction::class)->event($app, 'desk_arrival', ['ticket_id' => $id, 'number' => $number]);

            return DB::table('admission_desk_tickets')->find($id);
        });
    }

    public function transition(AdmissionDeskRequest $request, int $id): object
    {
        $resolved = DB::table('admission_desk_tickets')->find($id);
        abort_unless($resolved, 404);
        $authorized = AdmissionAccess::dossier($request, false, $resolved->application_id);

        return DB::transaction(function () use ($request, $authorized, $id) {
            $app = Application::whereKey($authorized->id)->lockForUpdate()->firstOrFail();
            User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            $ticket = DB::table('admission_desk_tickets')->where('id', $id)->lockForUpdate()->first();
            abort_unless((int) $ticket->version === $request->integer('version'), 409, 'Le passage a changé. Actualisez la file.');
            $event = $request->validated('event');
            if ($event === 'claim') {
                abort_unless($ticket->service_day === now(config('admissions.timezone'))->toDateString(), 422, 'Ce ticket appartient à une autre journée.');
                AdmissionAccess::campaignOpen($app);
                abort_unless($ticket->status === 'waiting', 409, 'Ce passage ne peut plus être appelé.');
                AdmissionDeskAccess::assertAvailable($app, $request->user()->id);
                abort_if(DB::table('admission_desk_tickets')->where('served_by', $request->user()->id)->where('status', 'serving')->exists(), 409, 'Clôturez ou libérez votre dossier en cours avant le suivant.');
                $changes = ['status' => 'serving', 'served_by' => $request->user()->id, 'called_at' => now()];
            } else {
                abort_unless(in_array($ticket->status, ['waiting', 'serving']), 409, 'Passage déjà terminé.');
                if ($ticket->status === 'serving' && (int) $ticket->served_by !== $request->user()->id) {
                    abort_unless($event === 'release' && $request->user()->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director']), 409, 'Seul l’agent en charge peut libérer ou clôturer ce passage.');
                    abort_unless(mb_strlen(trim((string) $request->validated('reason'))) >= 10, 422, 'Le responsable doit expliquer la libération du dossier.');
                }
                abort_if($ticket->status === 'waiting' && $event !== 'cancel', 422, 'Appelez le candidat avant de clôturer le passage.');
                $changes = $event === 'release' ? ['status' => 'waiting', 'served_by' => null, 'called_at' => null] : [
                    'status' => $event === 'complete' ? 'done' : 'cancelled', 'completed_at' => now(),
                ];
            }
            DB::table('admission_desk_tickets')->where('id', $id)->update($changes + ['version' => $ticket->version + 1, 'updated_at' => now()]);
            app(ManageDossierAction::class)->event($app, 'desk_'.$event, ['ticket_id' => $id, 'previous_agent_id' => $ticket->served_by, 'reason' => $request->validated('reason')]);

            return DB::table('admission_desk_tickets')->find($id);
        });
    }
}

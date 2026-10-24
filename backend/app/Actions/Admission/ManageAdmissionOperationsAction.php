<?php

namespace App\Actions\Admission;

use App\Models\Application;
use App\Models\User;
use App\Support\AdmissionAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ManageAdmissionOperationsAction
{
    public function assign(Request $request, array $data): void
    {
        AdmissionAccess::review($request);
        $app = AdmissionAccess::dossier($request);
        if ($data['assigned_to'] !== null) {
            $agent = User::where('institution_id', AdmissionAccess::institution($request))->findOrFail($data['assigned_to']);
            abort_unless($agent->is_active && AdmissionAccess::staff($agent), 422, 'Le responsable doit appartenir au service des admissions.');
        }
        DB::transaction(function () use ($app, $data, $request) {
            Application::whereKey($app->id)->lockForUpdate()->firstOrFail();
            $current = DB::table('admission_work_items')->where('application_id', $app->id)->lockForUpdate()->first();
            abort_unless((int) ($current->version ?? 0) === $data['version'], 409, 'Le suivi a changé. Actualisez le dossier.');
            DB::table('admission_work_items')->updateOrInsert(['application_id' => $app->id], [
                'assigned_to' => $data['assigned_to'], 'next_action' => $data['next_action'], 'due_on' => $data['due_on'],
                'version' => ($current->version ?? 0) + 1, 'created_at' => $current->created_at ?? now(), 'updated_at' => now(),
            ]);
            app(ManageDossierAction::class)->event($app, 'work_assigned', ['assigned_to' => $data['assigned_to'], 'due_on' => $data['due_on']]);
        });
    }

    public function original(Request $request, array $data): int
    {
        AdmissionAccess::review($request);
        $app = AdmissionAccess::dossier($request);
        return DB::transaction(function () use ($app, $data, $request) {
            Application::whereKey($app->id)->lockForUpdate()->firstOrFail();
            \App\Support\AdmissionDeskAccess::assertAvailable($app, $request->user()->id);
            $previous = DB::table('admission_original_events')->where('operation_id', $data['operation_id'])->first();
            if ($previous) {
                abort_unless((int) $previous->application_id === $app->id && $previous->document_type === $data['document_type'] && $previous->event === $data['event'], 409, 'Référence déjà utilisée.');
                return $previous->id;
            }
            $last = DB::table('admission_original_events')->where('application_id', $app->id)->where('document_type', $data['document_type'])->orderByDesc('id')->first();
            $held = $last && in_array($last->event, ['received', 'relocated'], true);
            abort_if(($data['event'] === 'received' && $held) || ($data['event'] !== 'received' && ! $held), 409, 'État de conservation modifié ou transition impossible. Actualisez le dossier.');
            $id = DB::table('admission_original_events')->insertGetId([
                'application_id' => $app->id, 'operation_id' => $data['operation_id'], 'document_type' => $data['document_type'],
                'event' => $data['event'], 'storage_location' => $data['event'] === 'returned' ? null : $data['storage_location'],
                'note' => $data['note'], 'recorded_by' => $request->user()->id, 'created_at' => now(), 'updated_at' => now(),
            ]);
            app(ManageDossierAction::class)->event($app, 'original_'.$data['event'], ['custody_event_id' => $id, 'document_type' => $data['document_type']]);
            return $id;
        });
    }
}

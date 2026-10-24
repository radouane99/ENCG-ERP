<?php

namespace App\Http\Controllers\Api;

use App\Actions\Admission\ManageAdmissionOperationsAction;
use App\Domain\Admission\AdmissionEntryRules;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admissions\AdmissionOperationRequest;
use App\Models\Application;
use App\Models\StudentDocument;
use App\Models\User;
use App\Services\Admissions\AdmissionConsistencyService;
use App\Support\AdmissionAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdmissionOperationsController extends Controller
{
    public function context(Request $request)
    {
        $app = AdmissionAccess::dossier($request);
        $staff = AdmissionAccess::staff($request->user());
        $events = DB::table('admission_original_events as e')->join('users as u', 'u.id', '=', 'e.recorded_by')->where('e.application_id', $app->id)
            ->orderByDesc('e.id')->limit(100)->get(['e.id', 'e.document_type', 'e.event', 'e.storage_location', 'e.note', 'e.created_at', 'u.name as agent']);
        if (! $staff) $events->transform(function ($event) { unset($event->storage_location, $event->note); return $event; });
        return response()->json(['alerts' => app(AdmissionConsistencyService::class)->inspect($app), 'originals' => $events,
            'work' => $staff ? DB::table('admission_work_items')->where('application_id', $app->id)->first() : null,
            'agents' => $staff ? User::where('institution_id', AdmissionAccess::institution($request))->where('is_active', true)->whereHas('roles', fn ($q) => $q->whereIn('name', AdmissionAccess::REVIEW_ROLES))->orderBy('name')->get(['id', 'name']) : []]);
    }

    public function queue(Request $request)
    {
        AdmissionAccess::review($request);
        $request->validate(['filter' => 'nullable|in:all,attention,physical_ready,mine,overdue', 'page' => 'nullable|integer|min:1']);
        $campaign = AdmissionAccess::campaign($request);
        $q = Application::where('admission_campaign_id', $campaign->id)->leftJoin('admission_work_items as w', 'w.application_id', '=', 'applications.id')->leftJoin('users as agent', 'agent.id', '=', 'w.assigned_to');
        if ($request->input('filter') === 'attention') $q->whereIn('dossier_status', ['draft', 'needs_correction']);
        if ($request->input('filter') === 'mine') $q->where('w.assigned_to', $request->user()->id);
        if ($request->input('filter') === 'overdue') $q->where('w.due_on', '<', now(config('admissions.timezone'))->toDateString())->whereNotIn('dossier_status', ['approved', 'rejected']);
        if ($request->input('filter') === 'physical_ready') {
            $q->whereIn('dossier_status', ['submitted', 'under_review']);
            foreach (AdmissionEntryRules::documents($campaign->entry_route) as $type) $q->whereExists(fn ($d) => $d->selectRaw('1')->from('student_documents')->whereColumn('application_id', 'applications.id')->where('type', $type)->where('is_current', true)->whereNull('withdrawn_at')->where('status', 'verified'));
        }
        $rows = $q->select('applications.*', 'w.assigned_to', 'agent.name as assigned_name', 'w.next_action', 'w.due_on')->orderByRaw('CASE WHEN w.due_on IS NULL THEN 1 ELSE 0 END')->orderBy('w.due_on')->orderBy('applications.id')->paginate(20);
        $rows->setCollection($rows->getCollection()->map(function ($row) use ($campaign) {
            $docs = StudentDocument::where('application_id', $row->id)->where('is_current', true)->whereNull('withdrawn_at')->get()->keyBy('type');
            $latestEvent = DB::table('admission_events')->where('application_id', $row->id)->orderByDesc('id')->first(['type', 'created_at']);
            return ['id' => $row->id, 'name' => trim($row->last_name.' '.$row->first_name), 'cne' => $row->cne, 'status' => $row->dossier_status,
                'missing' => array_values(array_filter(AdmissionEntryRules::documents($campaign->entry_route), fn ($type) => ! isset($docs[$type]))),
                'corrections' => $docs->where('status', 'rejected')->keys()->values(), 'assigned_to' => $row->assigned_to,
                'next_action' => $row->next_action, 'due_on' => $row->due_on, 'assigned_name' => $row->assigned_name, 'updated_at' => $latestEvent?->created_at ?? $row->updated_at, 'last_action' => $latestEvent?->type,
                'alerts_count' => count(app(AdmissionConsistencyService::class)->inspect($row))];
        }));
        return response()->json($rows);
    }

    public function assign(AdmissionOperationRequest $request)
    {
        app(ManageAdmissionOperationsAction::class)->assign($request, $request->validated());
        return $this->context($request);
    }

    public function original(AdmissionOperationRequest $request)
    {
        $id = app(ManageAdmissionOperationsAction::class)->original($request, $request->validated());
        return response()->json(['id' => $id, 'message' => 'Mouvement de l’original enregistré.']);
    }

    public function receipt(Request $request, int $event)
    {
        $record = DB::table('admission_original_events')->find($event); abort_unless($record, 404);
        $app = AdmissionAccess::dossier($request, false, $record->application_id);
        $agent = User::find($record->recorded_by)?->name;
        return \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.admission-original-receipt', compact('app', 'record', 'agent'))
            ->setPaper('a4')->stream('Original-'.$record->id.'.pdf')->header('Cache-Control', 'private, no-store');
    }

    public function monitor(Request $request)
    {
        AdmissionAccess::review($request); $campaign = AdmissionAccess::campaign($request);
        $ids = Application::where('admission_campaign_id', $campaign->id)->select('id');
        $ocr = DB::table('admission_ocr_runs')->whereIn('application_id', $ids)->where(fn ($q) => $q->where('status', 'failed')->orWhere(fn ($q) => $q->whereIn('status', ['queued', 'processing'])->where('updated_at', '<', now()->subMinutes(10))))
            ->orderByDesc('created_at')->limit(50)->get(['id', 'application_id', 'document_id', 'status', 'created_at']);
        $apps = Application::with('campaign')->whereIn('id', $ocr->pluck('application_id'))->get()->keyBy('id');
        $documents = StudentDocument::whereIn('id', $ocr->pluck('document_id'))->get()->keyBy('id');
        $activeDocuments = DB::table('admission_ocr_runs')->whereIn('application_id', $ids)->whereIn('status', ['queued', 'processing'])->where('updated_at', '>=', now()->subMinutes(10))->pluck('document_id')->all();
        $today = now(config('admissions.timezone'))->toDateString();
        foreach ($ocr as $run) {
            $app = $apps->get($run->application_id); $document = $documents->get($run->document_id); $c = $app?->campaign;
            $run->blocker = ! $document?->is_current || $document->withdrawn_at ? 'Pièce remplacée ou retirée.' :
                ((! $c || $c->status !== 'open' || $today < $c->open_date->toDateString() || $today > $c->close_date->toDateString() || in_array($app->dossier_status, ['approved', 'rejected']) || $app->eligibility === 'invitation_expired' || $app->invitation_expires_at?->isPast()) ? 'Dossier ou campagne fermé : vérification administrative requise.' :
                    (in_array($run->document_id, $activeDocuments) ? 'Une extraction est déjà en cours pour cette pièce.' : null));
            $run->can_retry = $run->blocker === null;
        }
        $notifications = DB::table('admission_notifications')->whereIn('application_id', $ids)->where('status', 'failed')->orderByDesc('id')->limit(50)->get(['id', 'application_id', 'type', 'status', 'attempts', 'updated_at']);
        return response()->json(['ocr' => $ocr, 'notifications' => $notifications, 'limit' => 50, 'checked_at' => now()->toIso8601String()]);
    }

    public function retryOcr(Request $request, string $id)
    {
        AdmissionAccess::review($request);
        return DB::transaction(function () use ($request, $id) {
            $run = DB::table('admission_ocr_runs')->where('id', $id)->first(); abort_unless($run, 404);
            $app = AdmissionAccess::dossier($request, true, $run->application_id);
            abort_if($app->dossier_status === 'rejected', 422, 'Le dossier doit être rouvert à correction avant une nouvelle extraction.');
            Application::whereKey($app->id)->lockForUpdate()->firstOrFail();
            $run = DB::table('admission_ocr_runs')->where('id', $id)->lockForUpdate()->first();
            $stale = in_array($run->status, ['queued', 'processing']) && \Carbon\Carbon::parse($run->updated_at)->lt(now()->subMinutes(10));
            abort_unless($run->status === 'failed' || $stale, 409, 'Ce traitement n’est pas en échec.');
            abort_if(DB::table('admission_ocr_runs')->where('application_id', $app->id)->where('document_id', $run->document_id)->where('id', '!=', $id)->whereIn('status', ['queued', 'processing'])->exists(), 409, 'Une extraction est déjà en cours pour cette pièce.');
            DB::table('admission_ocr_runs')->where('id', $id)->update(['status' => $stale ? 'cancelled' : 'retried', 'finished_at' => now(), 'updated_at' => now()]);
            $request->merge(['application_id' => $app->id, 'document_id' => $run->document_id, 'mode' => 'local', 'consent' => true, 'consent_version' => 'admissions-v1']);
            return app(AdmissionWorkflowController::class)->startOcr($request);
        });
    }
}

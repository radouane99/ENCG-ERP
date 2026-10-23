<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Support\AdmissionAccess;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class AdmissionWorkflowPdfController extends Controller
{
    public function receipt(Request $request)
    {
        $app = AdmissionAccess::dossier($request);
        abort_unless($app->submitted_at && ! in_array($app->dossier_status, ['draft', 'rejected']), 422, 'Soumettez votre dossier avant de télécharger son récépissé.');
        return Pdf::loadView('pdf.admission-workflow', ['title' => 'Récépissé de dépôt de dossier', 'campaign' => $app->campaign,
            'applications' => collect([$app]), 'receipt' => true])->setPaper('a4')->stream('Dossier-'.$app->reference_number.'.pdf')->header('Cache-Control', 'private, no-store');
    }

    public function list(Request $request)
    {
        AdmissionAccess::review($request);
        $campaign = AdmissionAccess::campaign($request);
        $eligibility = $request->input('type') === 'waiting' ? 'waiting' : 'main';
        $rows = Application::where('admission_campaign_id', $campaign->id)->where('eligibility', $eligibility)
            ->orderByRaw('CASE WHEN ranking IS NULL THEN 1 ELSE 0 END')->orderBy('ranking')->orderBy('id')->get();
        abort_if($rows->isEmpty(), 422, 'Aucun candidat pour cette liste.');
        abort_if($rows->contains(fn ($a) => $a->ranking === null || $a->selection_score === null || ! $a->official_rank_source), 422, 'Classement officiel incomplet : rapprochez la source avant export.');
        return Pdf::loadView('pdf.admission-workflow', ['title' => $eligibility === 'main' ? 'Liste principale — données officielles importées' : 'Liste d’attente — données officielles importées',
            'campaign' => $campaign, 'applications' => $rows, 'receipt' => false])->setPaper('a4')->stream('Liste-TAFEM-'.$campaign->id.'.pdf')->header('Cache-Control', 'private, no-store');
    }

    public function appointmentLabels(Request $request)
    {
        AdmissionAccess::review($request);
        $request->validate(['slot_id' => 'required|integer']);
        $slot = \Illuminate\Support\Facades\DB::table('admission_slots')->where('id', $request->integer('slot_id'))->first();
        abort_unless($slot, 404);
        $campaign = \App\Models\AdmissionCampaign::whereKey($slot->admission_campaign_id)->where('institution_id', AdmissionAccess::institution($request))->firstOrFail();
        $labels = \Illuminate\Support\Facades\DB::table('admission_appointments as r')->join('applications as a', 'r.application_id', '=', 'a.id')
            ->where('r.slot_id', $slot->id)->orderBy('a.last_name')->orderBy('a.first_name')
            ->get(['a.reference_number', 'a.first_name', 'a.last_name', 'a.cne', 'r.entry_token']);
        abort_if($labels->isEmpty(), 422, 'Aucun rendez-vous enregistré pour ce créneau.');
        return Pdf::loadView('pdf.admission-appointment-labels', ['campaign' => $campaign, 'slot' => $slot, 'labels' => $labels])
            ->setPaper('a4')->stream('Rendez-vous-'.$slot->id.'.pdf')->header('Cache-Control', 'private, no-store');
    }
}

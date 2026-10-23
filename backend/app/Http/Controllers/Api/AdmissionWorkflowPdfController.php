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
            'applications' => collect([$app]), 'receipt' => true])->setPaper('a4')->stream('Dossier-'.$app->reference_number.'.pdf');
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
            'campaign' => $campaign, 'applications' => $rows, 'receipt' => false])->setPaper('a4')->stream('Liste-TAFEM-'.$campaign->id.'.pdf');
    }
}

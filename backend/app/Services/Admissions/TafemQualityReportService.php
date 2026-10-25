<?php

namespace App\Services\Admissions;

use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\StudentDocument;
use Illuminate\Support\Facades\DB;

class TafemQualityReportService
{
    public function build(bool $audit = true): array
    {
        $campaign = request()->input('campaign_id') ?: AdmissionCampaign::where('institution_id', config('erp.institution_id', 1))->where('status', 'open')->latest('id')->value('id');
        $apps = Application::with('owner')->where('admission_campaign_id', $campaign)->get();
        $photos = StudentDocument::whereIn('application_id', $apps->pluck('id'))->where('type', 'photo')->where('is_current', true)->whereNull('withdrawn_at')->pluck('application_id')->all();
        $duplicates = $apps->groupBy('cne')->filter(fn ($g, $cne) => $cne !== '' && $g->count() > 1)->sum(fn ($g) => $g->count());
        $mismatched = [];
        $seen = [];
        foreach (DB::table('admission_ocr_runs as r')->join('student_documents as d', 'r.document_id', '=', 'd.id')
            ->whereIn('r.application_id', $apps->pluck('id'))->where('d.is_current', true)->whereNull('d.withdrawn_at')
            ->whereNotNull('r.fields')->orderByDesc('r.created_at')->get(['r.application_id', 'r.document_id', 'r.fields']) as $run) {
            if (isset($seen[$run->document_id])) {
                continue;
            }
            $seen[$run->document_id] = true;
            $fields = json_decode($run->fields, true) ?: [];
            if (! empty($fields['cne']['conflict'])) {
                $mismatched[$run->application_id] = true;
            }
        }

        return ['duplicates_cne' => $duplicates,
            'missing_cin' => $apps->filter(fn ($a) => trim((string) ($a->owner?->cin ?: $a->cin)) === '')->count(),
            'missing_photo' => $apps->filter(fn ($a) => ! in_array($a->id, $photos))->count(),
            'massar_mismatch' => count($mismatched)];
    }
}

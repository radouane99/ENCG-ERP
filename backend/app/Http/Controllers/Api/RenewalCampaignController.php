<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Support\AdmissionAccess;
use Illuminate\Http\Request;
use App\Services\Academic\RenewalCampaignService;

class RenewalCampaignController extends Controller
{
    public function show(Request $request, RenewalCampaignService $service)
    {
        abort_unless(AdmissionAccess::staff($request->user()) || $request->user()->hasRole('pedagogy_officer'), 403);
        $year = AcademicYear::where('institution_id', $request->user()->institution_id)->where('is_current', true)->firstOrFail();
        return response()->json(['data' => $service->forYear($year), 'can_manage' => AdmissionAccess::staff($request->user())]);
    }
    public function update(Request $request, \App\Actions\Academic\SaveRenewalCampaignAction $action, RenewalCampaignService $service)
    {
        abort_unless(AdmissionAccess::staff($request->user()), 403);
        $data = $request->validate(['version' => 'required|integer|min:0', 'status' => 'required|in:draft,open,closed',
            'opens_on' => 'required|date_format:Y-m-d', 'closes_on' => 'required|date_format:Y-m-d|after_or_equal:opens_on',
            'public_message' => 'nullable|string|max:1000']);
        $campaign = $action->execute($request->user(), $data);
        return response()->json(['data' => $service->forYear(AcademicYear::findOrFail($campaign->academic_year_id)), 'can_manage' => true]);
    }
}

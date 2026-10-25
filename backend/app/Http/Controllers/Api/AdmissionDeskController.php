<?php

namespace App\Http\Controllers\Api;

use App\Actions\Admission\ManageAdmissionDeskAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admissions\AdmissionDeskRequest;
use App\Support\AdmissionAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdmissionDeskController extends Controller
{
    public function index(Request $request)
    {
        AdmissionAccess::review($request);
        $campaign = AdmissionAccess::campaign($request);
        $request->validate(['page' => 'nullable|integer|min:1']);
        $query = DB::table('admission_desk_tickets as t')->where('t.admission_campaign_id', $campaign->id)
            ->where(fn ($q) => $q->where('t.service_day', now(config('admissions.timezone'))->toDateString())->orWhere('t.status', 'serving'));
        $counts = (clone $query)->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $rows = $query->join('applications as a', 'a.id', '=', 't.application_id')->leftJoin('users as u', 'u.id', '=', 't.served_by')
            ->orderByRaw("CASE t.status WHEN 'serving' THEN 0 WHEN 'waiting' THEN 1 ELSE 2 END")->orderBy('t.number')
            ->select('t.*', 'a.first_name', 'a.last_name', 'a.cne', 'u.name as agent')->paginate(20);

        return response()->json(['tickets' => $rows, 'counts' => $counts, 'current_user_id' => $request->user()->id,
            'can_release_other' => $request->user()->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director'])]);
    }

    public function arrive(AdmissionDeskRequest $request, ManageAdmissionDeskAction $action)
    {
        return response()->json($action->arrive($request));
    }

    public function transition(AdmissionDeskRequest $request, int $ticket, ManageAdmissionDeskAction $action)
    {
        return response()->json($action->transition($request, $ticket));
    }
}

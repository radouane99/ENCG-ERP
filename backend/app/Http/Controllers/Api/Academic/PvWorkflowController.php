<?php

namespace App\Http\Controllers\Api\Academic;

use App\Actions\Academic\ScheduleDeliberationMeetingAction;
use App\Http\Controllers\Controller;
use App\Models\Deliberation;
use App\Models\Room;
use App\Models\User;
use App\Services\Academic\PvWorkflowContext;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PvWorkflowController extends Controller
{
    public function context(Request $request, PvWorkflowContext $context)
    {
        $this->authorize('viewAny', Deliberation::class);
        $resolved = $context->resolve($request);
        $deliberation = $resolved['deliberation'];
        $meeting = $deliberation ? DB::table('deliberation_meetings')->where('deliberation_id', $deliberation->id)->first() : null;
        if ($meeting) {
            $meeting->starts_at = Carbon::parse($meeting->starts_at, 'UTC')->toIso8601String();
            $meeting->ends_at = Carbon::parse($meeting->ends_at, 'UTC')->toIso8601String();
        }

        return response()->json([
            'deliberation' => $deliberation,
            'meeting' => $meeting,
            'members' => $deliberation ? DB::table('deliberation_members')->where('deliberation_id', $deliberation->id)->get() : [],
            'rooms' => Room::where('institution_id', $request->user()->institution_id)->orderBy('name')->get(['id', 'name']),
            'agents' => User::where('institution_id', $request->user()->institution_id)->where('is_active', true)->whereHas('roles', fn ($q) => $q->whereIn('name', ['professor', 'vacataire', 'department-head', 'filiere-head', 'director', 'admin', 'super-admin', 'institution-admin']))->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function schedule(Request $request, ScheduleDeliberationMeetingAction $action)
    {
        $this->authorize('create', Deliberation::class);

        return response()->json($action->execute($request));
    }
}

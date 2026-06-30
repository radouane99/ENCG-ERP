<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ApplicationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('admission.view'), 403);

        $query = Application::with('campaign');

        if ($request->search) {
            $s = $request->search;
            $query->where(fn ($q) =>
                $q->where('first_name', 'like', "%$s%")
                  ->orWhere('last_name', 'like', "%$s%")
                  ->orWhere('cne', 'like', "%$s%")
                  ->orWhere('cin', 'like', "%$s%")
                  ->orWhere('reference_number', 'like', "%$s%")
            );
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $apps = $query->latest()->get()->map(fn ($a) => [
            'id'               => $a->id,
            'reference_number' => $a->reference_number,
            'first_name'       => $a->first_name,
            'last_name'        => $a->last_name,
            'email'            => $a->email,
            'phone'            => $a->phone,
            'cin'              => $a->cin,
            'cne'              => $a->cne,
            'bac_mention'      => $a->bac_mention,
            'bac_average'      => $a->bac_average,
            'bac_year'         => $a->bac_year,
            'status'           => $a->status,
            'selection_score'  => $a->selection_score,
            'campaign'         => $a->campaign?->label ?? '—',
        ]);

        $total    = Application::count();
        $pending  = Application::where('status', 'pending')->count();
        $accepted = Application::where('status', 'accepted')->count();
        $rejected = Application::where('status', 'rejected')->count();

        return response()->json([
            'data'  => $apps,
            'stats' => compact('total', 'pending', 'accepted', 'rejected'),
        ]);
    }

    public function updateStatus(Request $request, Application $application): JsonResponse
    {
        abort_unless($request->user()->can('admission.review-applications'), 403);

        $validated = $request->validate([
            'status'           => 'required|in:pending,under_review,accepted,rejected,waitlisted',
            'rejection_reason' => 'nullable|string',
            'selection_score'  => 'nullable|numeric',
        ]);

        $application->update([
            ...$validated,
            'reviewed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Statut de la candidature mis à jour.',
            'data'    => $application,
        ]);
    }

    public function destroy(Application $application): JsonResponse
    {
        abort_unless(request()->user()->can('admission.edit'), 403);

        $application->delete();
        return response()->json(['message' => 'Candidature supprimée.']);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Spatie\Activitylog\Models\Activity;

class TimelineController extends Controller
{
    /**
     * Retrieve the centralized activity timeline.
     */
    public function index(Request $request): JsonResponse
    {
        if (!class_exists('Spatie\Activitylog\Models\Activity')) {
            return response()->json(['success' => false, 'message' => 'Module d’activité introuvable.'], 500);
        }

        try {
            $query = Activity::with(['causer', 'subject'])->latest();

            if ($request->has('role') && $request->role !== 'all') {
                $query->whereHasMorph('causer', [\App\Models\User::class], function($q) use ($request) {
                    $q->role($request->role);
                });
            }

            $activities = $query->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $activities
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Activity log unavailable: ' . $e->getMessage()], 500);
        }
    }
}

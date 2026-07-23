<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Holiday;

class HolidayController extends Controller
{
    public function index()
    {
        $holidays = Holiday::orderBy('start_date', 'asc')->get();
        return response()->json([
            'success' => true,
            'data' => $holidays
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'required|string',
            'description' => 'nullable|string',
        ]);

        $holiday = Holiday::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Jour férié ajouté avec succès',
            'data' => $holiday
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $holiday = Holiday::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'type' => 'sometimes|string',
            'description' => 'nullable|string',
        ]);

        $holiday->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Jour férié mis à jour avec succès',
            'data' => $holiday
        ]);
    }

    public function destroy($id)
    {
        $holiday = Holiday::findOrFail($id);
        $holiday->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jour férié supprimé'
        ]);
    }

    /**
     * Calculate impact of a holiday on teaching schedules and propose catch-ups.
     */
    public function impact($id)
    {
        $holiday = Holiday::findOrFail($id);
        $startDate = \Carbon\Carbon::parse($holiday->start_date);
        $endDate = \Carbon\Carbon::parse($holiday->end_date);

        $affectedDays = [];
        $cancelledSessions = [];
        $current = $startDate->copy();

        while ($current->lte($endDate)) {
            $dayOfWeek = $current->dayOfWeekIso; // 1 = Mon, 7 = Sun
            
            $schedules = \Illuminate\Support\Facades\DB::table('schedules')
                ->join('modules', 'schedules.module_id', '=', 'modules.id')
                ->leftJoin('groups', 'schedules.group_id', '=', 'groups.id')
                ->where('schedules.day_of_week', $dayOfWeek)
                ->where('schedules.is_active', true)
                ->select(
                    'schedules.id as schedule_id',
                    'schedules.start_time',
                    'schedules.end_time',
                    'modules.name as module_name',
                    'groups.name as group_name',
                    'schedules.professor_id'
                )
                ->get();

            if ($schedules->isNotEmpty()) {
                $affectedDays[] = [
                    'date' => $current->format('Y-m-d'),
                    'day_name' => $current->locale('fr')->dayName,
                    'sessions_count' => $schedules->count(),
                ];

                foreach ($schedules as $s) {
                    $cancelledSessions[] = [
                        'date' => $current->format('Y-m-d'),
                        'module_name' => $s->module_name,
                        'group_name' => $s->group_name ?? 'Tous les groupes',
                        'time' => substr($s->start_time, 0, 5) . ' - ' . substr($s->end_time, 0, 5),
                        'suggested_catchup_date' => $current->copy()->next(\Carbon\Carbon::SATURDAY)->format('Y-m-d')
                    ];
                }
            }

            $current->addDay();
        }

        return response()->json([
            'success' => true,
            'holiday' => $holiday,
            'total_cancelled_sessions' => count($cancelledSessions),
            'affected_days' => $affectedDays,
            'cancelled_sessions' => $cancelledSessions,
        ]);
    }
}

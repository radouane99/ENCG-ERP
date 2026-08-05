<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    /**
     * Liste des jours fériés.
     */
    public function index(): JsonResponse
    {
        $holidays = Holiday::orderBy('start_date')->get();

        return response()->json([
            'success' => true,
            'data'    => $holidays,
        ]);
    }

    /**
     * Ajouter un jour férié.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'type'        => 'required|string',
            'description' => 'nullable|string',
        ]);

        $holiday = Holiday::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Jour férié ajouté avec succès.',
            'data'    => $holiday,
        ], 201);
    }

    /**
     * Mettre à jour un jour férié.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $holiday = Holiday::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'start_date'  => 'sometimes|date',
            'end_date'    => 'sometimes|date|after_or_equal:start_date',
            'type'        => 'sometimes|string',
            'description' => 'nullable|string',
        ]);

        $holiday->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Jour férié mis à jour.',
            'data'    => $holiday,
        ]);
    }

    /**
     * Supprimer un jour férié.
     */
    public function destroy(int $id): JsonResponse
    {
        Holiday::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Jour férié supprimé.',
        ]);
    }

    /**
     * Impact d'un jour férié sur l'emploi du temps.
     */
    public function impact(int $id): JsonResponse
    {
        $holiday   = Holiday::findOrFail($id);
        $startDate = Carbon::parse($holiday->start_date);
        $endDate   = Carbon::parse($holiday->end_date);

        $affectedDays      = [];
        $cancelledSessions = [];
        $current           = $startDate->copy();

        while ($current->lte($endDate)) {
            $dayOfWeek = $current->dayOfWeekIso;

            $schedules = Schedule::with(['module', 'group'])
                ->where('day_of_week', $dayOfWeek)
                ->where('is_active', true)
                ->get();

            if ($schedules->isNotEmpty()) {
                $affectedDays[] = [
                    'date'           => $current->format('Y-m-d'),
                    'day_name'       => $current->locale('fr')->dayName,
                    'sessions_count' => $schedules->count(),
                ];

                foreach ($schedules as $s) {
                    $cancelledSessions[] = [
                        'date'                   => $current->format('Y-m-d'),
                        'module_name'            => $s->module->name ?? 'N/A',
                        'group_name'             => $s->group->name ?? 'Tous les groupes',
                        'time'                   => substr($s->start_time, 0, 5) . ' - ' . substr($s->end_time, 0, 5),
                        'suggested_catchup_date' => $current->copy()->next(Carbon::SATURDAY)->format('Y-m-d'),
                    ];
                }
            }

            $current->addDay();
        }

        return response()->json([
            'success'                  => true,
            'holiday'                  => $holiday,
            'total_cancelled_sessions' => count($cancelledSessions),
            'affected_days'            => $affectedDays,
            'cancelled_sessions'       => $cancelledSessions,
        ]);
    }
}
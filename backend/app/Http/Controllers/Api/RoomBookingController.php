<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RoomBooking;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomBookingController extends Controller
{
    /**
     * Liste des réservations.
     */
    public function index(): JsonResponse
    {
        $bookings = RoomBooking::with(['booker', 'room'])
            ->orderByDesc('start_time')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $bookings,
        ]);
    }

    /**
     * Créer une réservation.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id'    => 'required|exists:rooms,id',
            'room_name'  => 'required|string',
            'booked_by'  => 'required|exists:users,id',
            'purpose'    => 'required|string',
            'start_time' => 'required|date',
            'end_time'   => 'required|date|after:start_time',
            'status'     => 'required|string|in:pending,approved,rejected,cancelled',
        ]);

        if ($this->hasConflict($validated['room_id'], $validated['start_time'], $validated['end_time'])) {
            return response()->json([
                'success' => false,
                'message' => 'Conflit détecté : la salle est déjà réservée sur ce créneau.',
            ], 409);
        }

        $booking = RoomBooking::create($validated);

        return response()->json([
            'success' => true,
            'data'    => $booking->load(['booker', 'room']),
        ], 201);
    }

    /**
     * Mettre à jour une réservation.
     */
    public function update(Request $request, RoomBooking $roomBooking): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|string|in:pending,approved,rejected,cancelled',
        ]);

        $roomBooking->update($validated);

        return response()->json([
            'success' => true,
            'data'    => $roomBooking->fresh(['booker', 'room']),
        ]);
    }

    /**
     * Supprimer une réservation.
     */
    public function destroy(RoomBooking $roomBooking): JsonResponse
    {
        $roomBooking->delete();

        return response()->json([
            'success' => true,
            'message' => 'Réservation supprimée.',
        ]);
    }

    /**
     * Vérifier la disponibilité d'une salle.
     */
    public function checkAvailability(Request $request): JsonResponse
    {
        $request->validate([
            'room_id'    => 'required|exists:rooms,id',
            'date'       => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'required|date_format:H:i|after:start_time',
        ]);

        $startDateTime = Carbon::parse($request->date . ' ' . $request->start_time);
        $endDateTime   = Carbon::parse($request->date . ' ' . $request->end_time);

        $hasConflict = $this->hasConflict($request->room_id, $startDateTime, $endDateTime);

        return response()->json([
            'success' => true,
            'data'    => ['is_available' => !$hasConflict],
        ]);
    }

    /**
     * Vérifie les conflits de réservation et d'emploi du temps.
     */
    private function hasConflict(int $roomId, string $startDateTime, string $endDateTime): bool
    {
        $start = Carbon::parse($startDateTime);
        $end   = Carbon::parse($endDateTime);

        // 1. Conflit avec les réservations existantes
        $bookingConflict = RoomBooking::where('room_id', $roomId)
            ->whereIn('status', ['pending', 'approved'])
            ->where(function ($query) use ($start, $end) {
                $query->whereBetween('start_time', [$start, $end])
                    ->orWhereBetween('end_time', [$start, $end])
                    ->orWhere(fn($q) => $q->where('start_time', '<=', $start)->where('end_time', '>=', $end));
            })
            ->exists();

        if ($bookingConflict) return true;

        // 2. Conflit avec l'emploi du temps
        $dayOfWeek = $start->dayOfWeekIso;
        $timeStart = $start->format('H:i:s');
        $timeEnd   = $end->format('H:i:s');

        return Schedule::where('room_id', $roomId)
            ->where('is_active', true)
            ->where('day_of_week', $dayOfWeek)
            ->whereTime('start_time', '<', $timeEnd)
            ->whereTime('end_time', '>', $timeStart)
            ->exists();
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Services\Academic\TimetableRoomGuard;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomBookingController extends Controller
{
    private const APPROVER_ROLES = [
        'super-admin', 'institution-admin', 'director', 'scolarite',
    ];

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
            'data' => $bookings,
        ]);
    }

    /**
     * Créer une réservation.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'room_name' => 'nullable|string',
            'booked_by' => 'nullable|exists:users,id',
            'purpose' => 'required|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'status' => 'nullable|string|in:pending,approved,rejected,cancelled',
        ]);

        $user = $request->user();
        $canApprove = $this->userCanApprove($user);

        $validated['booked_by'] = $validated['booked_by'] ?? $user?->id;
        $validated['room_name'] = $validated['room_name']
            ?? Room::query()->whereKey($validated['room_id'])->value('name')
            ?? 'Salle';
        $requestedStatus = $validated['status'] ?? null;
        unset($validated['status']);
        if ($canApprove) {
            $validated['status'] = $requestedStatus ?? 'approved';
        } else {
            $validated['status'] = 'pending';
        }

        if ($this->hasConflict($validated['room_id'], $validated['start_time'], $validated['end_time'])) {
            return response()->json([
                'success' => false,
                'message' => 'Conflit détecté : la salle est déjà réservée sur ce créneau.',
            ], 409);
        }

        $booking = RoomBooking::create($validated);

        return response()->json([
            'success' => true,
            'data' => $booking->load(['booker', 'room']),
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

        if (array_key_exists('status', $validated) && ! $this->userCanApprove($request->user())) {
            $isOwnCancellation = $validated['status'] === 'cancelled'
                && (int) $roomBooking->booked_by === (int) $request->user()?->id;
            abort_unless($isOwnCancellation, 403, 'Seule la scolarité peut valider ou refuser une réservation.');
        }

        $roomBooking->update($validated);

        return response()->json([
            'success' => true,
            'data' => $roomBooking->fresh(['booker', 'room']),
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
            'room_id' => 'required|exists:rooms,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $startDateTime = Carbon::parse($request->date.' '.$request->start_time);
        $endDateTime = Carbon::parse($request->date.' '.$request->end_time);

        $hasConflict = $this->hasConflict($request->room_id, $startDateTime, $endDateTime);

        return response()->json([
            'success' => true,
            'data' => ['is_available' => ! $hasConflict],
        ]);
    }

    /**
     * Liste des salles libres pour une séance extra / rattrapage.
     */
    public function availableRooms(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'headcount' => 'nullable|integer|min:1|max:500',
            'kind' => 'nullable|string|in:all,td,amphi',
        ]);

        $start = Carbon::parse($validated['date'].' '.$validated['start_time']);
        $end = Carbon::parse($validated['date'].' '.$validated['end_time']);

        $data = app(TimetableRoomGuard::class)->availableRooms(
            $start,
            $end,
            (int) ($validated['headcount'] ?? 0),
            $validated['kind'] ?? 'all'
        );

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Assistant intelligent de disponibilité & alternatives de salles (Rattrapages, extras).
     */
    public function smartFind(Request $request, \App\Services\Academic\RoomAvailabilityService $service): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'preferred_room_id' => 'nullable|integer',
            'session_type' => 'nullable|string',
            'headcount' => 'nullable|integer|min:1|max:500',
            'filiere_id' => 'nullable|integer',
            'group_ids' => 'nullable|array',
            'group_ids.*' => 'integer',
        ]);

        $result = $service->smartFind($validated);

        return response()->json($result);
    }

    /**
     * Matrice d'occupation en temps réel de toutes les salles pour une date.
     */
    public function occupancyMatrix(Request $request, \App\Services\Academic\RoomAvailabilityService $service): JsonResponse
    {
        $request->validate([
            'date' => 'nullable|date',
            'type' => 'nullable|string',
            'search' => 'nullable|string',
        ]);

        $date = $request->input('date', now()->format('Y-m-d'));
        $type = $request->input('type');
        $search = $request->input('search');

        $result = $service->getOccupancyMatrix($date, $type, $search);

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    private function userCanApprove(?object $user): bool
    {
        return $user && method_exists($user, 'hasAnyRole') && $user->hasAnyRole(self::APPROVER_ROLES);
    }

    /**
     * Vérifie les conflits (EDT + réservations) à la date demandée.
     */
    private function hasConflict(int|string $roomId, Carbon|string $startDateTime, Carbon|string $endDateTime): bool
    {
        return app(TimetableRoomGuard::class)->isRoomBusyAt(
            (string) $roomId,
            Carbon::parse($startDateTime),
            Carbon::parse($endDateTime)
        );
    }
}

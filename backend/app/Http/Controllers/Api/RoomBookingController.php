<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RoomBooking;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Carbon\Carbon;

class RoomBookingController extends Controller
{
    public function index()
    {
        $bookings = RoomBooking::with(['booker', 'room'])->orderBy('start_time', 'desc')->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $bookings
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'room_name' => 'required|string',
            'booked_by' => 'required|exists:users,id',
            'purpose' => 'required|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'status' => 'required|string|in:pending,approved,rejected,cancelled',
        ]);

        if ($this->hasConflict($validated['room_id'], $validated['start_time'], $validated['end_time'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Conflict detected: The room is already booked or scheduled during this time.'
            ], 409);
        }

        $booking = RoomBooking::create($validated);

        return response()->json([
            'status' => 'success',
            'data' => $booking->load(['booker', 'room'])
        ], 201);
    }

    public function update(Request $request, RoomBooking $roomBooking)
    {
        $validated = $request->validate([
            'status' => 'sometimes|string|in:pending,approved,rejected,cancelled',
            // Allow other fields to be updated if needed
        ]);

        $roomBooking->update($validated);

        return response()->json([
            'status' => 'success',
            'data' => $roomBooking->fresh(['booker', 'room'])
        ]);
    }

    public function destroy(RoomBooking $roomBooking)
    {
        $roomBooking->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Booking deleted successfully'
        ]);
    }

    public function checkAvailability(Request $request)
    {
        $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);

        $startDateTime = Carbon::parse($request->date . ' ' . $request->start_time);
        $endDateTime = Carbon::parse($request->date . ' ' . $request->end_time);

        $hasConflict = $this->hasConflict($request->room_id, $startDateTime, $endDateTime);

        return response()->json([
            'status' => 'success',
            'data' => [
                'is_available' => !$hasConflict
            ]
        ]);
    }

    private function hasConflict($roomId, $startDateTime, $endDateTime)
    {
        $start = Carbon::parse($startDateTime);
        $end = Carbon::parse($endDateTime);

        // 1. Check existing RoomBookings
        $bookingConflict = RoomBooking::where('room_id', $roomId)
            ->whereIn('status', ['pending', 'approved'])
            ->where(function ($query) use ($start, $end) {
                $query->whereBetween('start_time', [$start, $end])
                      ->orWhereBetween('end_time', [$start, $end])
                      ->orWhere(function ($q) use ($start, $end) {
                          $q->where('start_time', '<=', $start)
                            ->where('end_time', '>=', $end);
                      });
            })
            ->exists();

        if ($bookingConflict) {
            return true;
        }

        // 2. Check existing Schedules
        $dayOfWeek = $start->dayOfWeekIso; // 1 (Monday) to 7 (Sunday)
        $timeStart = $start->format('H:i:s');
        $timeEnd = $end->format('H:i:s');

        $scheduleConflict = Schedule::where('room_id', $roomId)
            ->where('is_active', 1)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($query) use ($timeStart, $timeEnd) {
                $query->where(function ($q) use ($timeStart, $timeEnd) {
                    $q->whereTime('start_time', '<', $timeEnd)
                      ->whereTime('end_time', '>', $timeStart);
                });
            })
            ->exists();

        return $scheduleConflict;
    }
}

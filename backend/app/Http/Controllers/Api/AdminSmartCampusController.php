<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;

class AdminSmartCampusController extends Controller
{
    public function getCampusData(): JsonResponse
    {
        $now = now();
        $currentDay = $now->dayOfWeekIso;
        $currentTime = $now->format('H:i:s');

        $rooms = Room::query()
            ->orderBy('name')
            ->get()
            ->map(function (Room $room) use ($currentDay, $currentTime, $now) {
                $activeSchedule = Schedule::with(['module', 'group'])
                    ->where('room_id', $room->id)
                    ->where('day_of_week', $currentDay)
                    ->where('start_time', '<=', $currentTime)
                    ->where('end_time', '>=', $currentTime)
                    ->where('is_active', true)
                    ->first();

                $activeBooking = RoomBooking::where('room_id', $room->id)
                    ->whereIn('status', ['pending', 'approved'])
                    ->where('start_time', '<=', $now)
                    ->where('end_time', '>=', $now)
                    ->first();

                $occupied = $activeSchedule || $activeBooking;
                $capacity = (int) ($room->capacity ?? 0);
                $estimatedOccupancy = $occupied ? min(100, max(10, (int) round(($capacity > 0 ? min($capacity, max(1, (int) floor($capacity * 0.7))) : 1) / max($capacity, 1)) * 100))) : 0;

                $equipmentStatus = $room->equipment_status ?? [];
                $brokenEquipments = [];
                if (($equipmentStatus['projector'] ?? 'ok') !== 'ok') $brokenEquipments[] = 'Projecteur';
                if (($equipmentStatus['ac'] ?? 'ok') !== 'ok') $brokenEquipments[] = 'Climatisation';
                if (($equipmentStatus['sound'] ?? 'ok') !== 'ok') $brokenEquipments[] = 'Sonorisation';
                if (($equipmentStatus['pc_lab'] ?? 'ok') !== 'ok') $brokenEquipments[] = 'Postes PC';

                $alertText = !empty($brokenEquipments) ? 'Maintenance: ' . implode(', ', $brokenEquipments) . ' en panne' : null;

                return [
                    'id' => $room->id,
                    'name' => $room->name,
                    'type' => $room->type ?? 'Salle',
                    'occupancy' => $estimatedOccupancy . '%',
                    'status' => $occupied ? 'occupied' : 'empty',
                    'temp' => '21°C',
                    'energy' => $occupied ? 'Medium' : 'Low',
                    'alert' => $alertText,
                    'equipment_status' => $equipmentStatus,
                ];
            });

        $occupants = $rooms->reduce(function (int $carry, array $room) {
            return $carry + ($room['status'] === 'occupied' ? max(1, (int) rtrim($room['occupancy'], '%')) : 0);
        }, 0);

        return response()->json([
            'success' => true,
            'data' => [
                'energy' => $rooms->where('status', 'occupied')->count() . ' salles actives',
                'occupants' => $occupants,
                'rooms' => $rooms->values(),
            ],
        ]);
    }
}

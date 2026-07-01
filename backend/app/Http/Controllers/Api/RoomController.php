<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RoomController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('infrastructure.view'), 403);

        $query = Room::query();
        if ($request->type)   $query->where('type', $request->type);
        if ($request->search) $query->where('name', 'like', "%{$request->search}%")->orWhere('code', 'like', "%{$request->search}%");

        $rooms = $query->get()->map(fn ($r) => [
            'id'            => $r->id,
            'name'          => $r->name,
            'code'          => $r->code,
            'type'          => $r->type,
            'capacity'      => $r->capacity,
            'has_projector' => $r->has_projector,
            'has_ac'        => $r->has_ac,
            'is_available'  => $r->is_available,
        ]);

        return response()->json([
            'data'  => $rooms,
            'stats' => [
                'total'           => $rooms->count(),
                'available'       => $rooms->where('is_available', true)->count(),
                'amphitheatres'   => $rooms->where('type', 'amphitheatre')->count(),
                'total_capacity'  => $rooms->sum('capacity'),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('infrastructure.create'), 403);

        $validated = $request->validate([
            'name'          => 'required|string|max:100',
            'code'          => 'required|string|max:20|unique:rooms,code',
            'type'          => 'required|in:classroom,amphitheatre,lab,seminar,admin',
            'capacity'      => 'required|integer|min:1',
            'has_projector' => 'boolean',
            'has_ac'        => 'boolean',
            'is_available'  => 'boolean',
        ]);
        $validated['institution_id'] = 1;
        $room = Room::create($validated);
        return response()->json(['message' => 'Salle créée avec succès.', 'data' => $room], 201);
    }

    public function update(Request $request, Room $room): JsonResponse
    {
        abort_unless($request->user()->can('infrastructure.edit'), 403);

        $validated = $request->validate([
            'name'          => 'sometimes|required|string|max:100',
            'code'          => 'sometimes|required|string|max:20|unique:rooms,code,' . $room->id,
            'type'          => 'sometimes|required|in:classroom,amphitheatre,lab,seminar,admin',
            'capacity'      => 'sometimes|required|integer|min:1',
            'has_projector' => 'boolean',
            'has_ac'        => 'boolean',
            'is_available'  => 'boolean',
        ]);
        $room->update($validated);
        return response()->json(['message' => 'Salle mise à jour.', 'data' => $room]);
    }

    public function destroy(Request $request, Room $room): JsonResponse
    {
        abort_unless($request->user()->can('infrastructure.delete'), 403);

        $room->delete();
        return response()->json(['message' => 'Salle supprimée.']);
    }
}

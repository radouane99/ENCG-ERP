<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Club;
use Illuminate\Http\Request;

class ClubController extends Controller
{
    public function index()
    {
        $clubs = Club::with(['events', 'members.user'])->get();
        return response()->json(['success' => true, 'data' => $clubs]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'institution_id' => 'required|exists:institutions,id',
            'name' => 'required|string|max:255',
            'category' => 'required|string',
            'description' => 'nullable|string',
            'president_name' => 'nullable|string',
        ]);

        $club = Club::create($validated);

        return response()->json(['success' => true, 'message' => 'Club créé', 'data' => $club]);
    }

    public function show($id)
    {
        $club = Club::with(['events', 'members.user'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $club]);
    }

    public function update(Request $request, $id)
    {
        $club = Club::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'string|max:255',
            'category' => 'string',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $club->update($validated);

        return response()->json(['success' => true, 'message' => 'Club mis à jour', 'data' => $club]);
    }
}

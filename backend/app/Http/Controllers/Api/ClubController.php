<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\StudentLifeService;

class ClubController extends Controller
{
    protected StudentLifeService $studentLifeService;

    public function __construct(StudentLifeService $studentLifeService)
    {
        $this->studentLifeService = $studentLifeService;
    }

    /**
     * Display a listing of the clubs.
     */
    public function index(): JsonResponse
    {
        $clubs = $this->studentLifeService->getAllClubs();
        
        return response()->json([
            'success' => true,
            'data' => $clubs
        ]);
    }

    /**
     * Store a newly created club.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'description'  => 'required|string',
            'president_id' => 'required|integer|exists:students,id',
            'logo_url'     => 'nullable|url'
        ]);

        $club = $this->studentLifeService->createClub($validated);

        return response()->json([
            'success' => true,
            'message' => 'Club créé et en attente de validation.',
            'data' => $club
        ], 201);
    }

    /**
     * Update the specified club (e.g. change status).
     */
    public function update(Request $request, $id): JsonResponse
    {
        // Simple update wrapper (e.g. status validation)
        if ($request->has('status')) {
            try {
                $club = $this->studentLifeService->updateClubStatus((int) $id, $request->status);
                return response()->json(['success' => true, 'data' => $club]);
            } catch (\Exception $e) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
            }
        }

        return response()->json(['success' => false, 'message' => 'Mise à jour non supportée ici.'], 400);
    }
}

<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClubController extends Controller
{
    /**
     * Liste des clubs et événements récents.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->input('per_page', 30), 100);
        $clubs = Club::withCount('members')->latest()->paginate($perPage);
        $posts = ClubEvent::with('club')->latest()->take(5)->get();

        return response()->json([
            'success' => true,
            'clubs' => $clubs->items(),
            'posts' => $posts,
            'meta' => [
                'total' => $clubs->total(),
                'per_page' => $clubs->perPage(),
                'current_page' => $clubs->currentPage(),
                'last_page' => $clubs->lastPage(),
            ],
        ]);
    }
}

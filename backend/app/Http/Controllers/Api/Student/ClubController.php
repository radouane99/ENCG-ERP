<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\Club;
use App\Models\ClubEvent;
use Illuminate\Http\JsonResponse;

class ClubController extends Controller
{
    /**
     * Liste des clubs et événements récents.
     */
    public function index(): JsonResponse
    {
        $clubs = Club::withCount('members')->get();
        $posts = ClubEvent::with('club')->latest()->take(5)->get();

        return response()->json([
            'success' => true,
            'clubs' => $clubs,
            'posts' => $posts,
        ]);
    }
}

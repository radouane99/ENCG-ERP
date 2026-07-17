<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ClubController extends Controller
{
    public function index()
    {
        $clubs = \App\Models\Club::withCount('members')->get();
        $posts = \App\Models\ClubEvent::with('club')->latest()->take(5)->get();
        
        return response()->json([
            'clubs' => $clubs,
            'posts' => $posts
        ]);
    }
}

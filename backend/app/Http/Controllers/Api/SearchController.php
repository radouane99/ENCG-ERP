<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use App\Models\Module;
use App\Models\Room;
use Illuminate\Support\Facades\DB;

class SearchController extends Controller
{
    /**
     * Universal Search Endpoint.
     * Currently mocked to search Users (Students/Professors).
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q');
        
        if (empty($query) || strlen($query) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $results = [];

        // 1. Search Users (Students, Professors)
        $users = User::whereRaw('MATCH(first_name, last_name, email) AGAINST(? IN BOOLEAN MODE)', ["*{$query}*"])
            ->take(5)
            ->get();

        foreach ($users as $user) {
            $role = $user->roles->first()->name ?? 'user';
            $results[] = [
                'id' => 'user_' . $user->id,
                'title' => $user->name,
                'subtitle' => $user->email,
                'type' => $role === 'student' ? 'student' : 'professor',
                'url' => $role === 'student' ? "/students/{$user->id}" : "/professors/{$user->id}",
            ];
        }

        // 2. Real Modules Search
        $modules = Module::where('name', 'like', "%{$query}%")
            ->take(5)
            ->get();

        foreach ($modules as $mod) {
            $results[] = [
                'id' => 'mod_' . $mod->id,
                'title' => $mod->name,
                'subtitle' => 'Module d\'enseignement',
                'type' => 'module',
                'url' => "/academic/modules", // Or whatever the actual route is
            ];
        }

        // 3. Real Rooms Search
        $rooms = Room::where('name', 'like', "%{$query}%")
            ->take(5)
            ->get();

        foreach ($rooms as $room) {
            $results[] = [
                'id' => 'room_' . $room->id,
                'title' => $room->name,
                'subtitle' => 'Capacité: ' . $room->capacity,
                'type' => 'room',
                'url' => "/timetable",
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $results
        ]);
    }
}

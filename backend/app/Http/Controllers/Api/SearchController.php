<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Module;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Recherche universelle.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q');

        if (empty($query) || strlen($query) < 2) {
            return response()->json(['success' => true, 'data' => []]);
        }

        $results = [];

        // 1. Utilisateurs
        $users = User::with('roles')
            ->where(function ($q) use ($query) {
                $q->where('first_name', 'like', "%{$query}%")
                  ->orWhere('last_name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");
            })
            ->take(5)
            ->get();

        foreach ($users as $user) {
            $role = $user->roles->first()?->name ?? 'user';
            $results[] = [
                'id'       => 'user_' . $user->id,
                'title'    => $user->name,
                'subtitle' => $user->email,
                'type'     => $role === 'student' ? 'student' : 'professor',
                'url'      => $role === 'student' ? "/students/{$user->id}" : "/professors/{$user->id}",
            ];
        }

        // 2. Modules
        Module::where('name', 'like', "%{$query}%")
            ->take(5)
            ->get()
            ->each(function ($mod) use (&$results) {
                $results[] = [
                    'id'       => 'mod_' . $mod->id,
                    'title'    => $mod->name,
                    'subtitle' => 'Module d\'enseignement',
                    'type'     => 'module',
                    'url'      => '/academic/modules',
                ];
            });

        // 3. Salles
        Room::where('name', 'like', "%{$query}%")
            ->take(5)
            ->get()
            ->each(function ($room) use (&$results) {
                $results[] = [
                    'id'       => 'room_' . $room->id,
                    'title'    => $room->name,
                    'subtitle' => 'Capacité : ' . $room->capacity,
                    'type'     => 'room',
                    'url'      => '/timetable',
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $results,
        ]);
    }
}
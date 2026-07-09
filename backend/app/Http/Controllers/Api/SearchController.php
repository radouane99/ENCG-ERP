<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\User;
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

        // 2. Mock Modules Search
        $mockModules = [
            'Analyse Financière',
            'Comptabilité Générale',
            'Mathématiques Financières',
            'Marketing Digital'
        ];

        foreach ($mockModules as $idx => $mod) {
            if (stripos($mod, $query) !== false) {
                $results[] = [
                    'id' => 'mod_' . $idx,
                    'title' => $mod,
                    'subtitle' => 'Module d\'enseignement',
                    'type' => 'module',
                    'url' => "/academic/modules",
                ];
            }
        }

        // 3. Mock Rooms Search
        if (stripos('Amphi 1', $query) !== false || stripos('Salle 102', $query) !== false) {
             $results[] = [
                'id' => 'room_1',
                'title' => 'Amphi 1',
                'subtitle' => 'Capacité: 300',
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

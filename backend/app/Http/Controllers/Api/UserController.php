<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with("roles")
            ->whereDoesntHave('roles', function($q) {
                $q->where('name', 'student');
            })
            ->get();
        
        $roleLabels = [
            'super-admin' => 'Super Administrateur',
            'institution-admin' => 'Admin Institution',
            'director' => 'Directeur',
            'department-head' => 'Chef de DǸpartement',
            'professor' => 'Professeur',
            'vacataire' => 'Vacataire',
            'finance-officer' => 'Finance',
            'hr-officer' => 'Ressources Humaines',
            'library-manager' => 'Bibliothcaire',
            'discipline-committee' => 'ComitǸ de Discipline'
        ];

        $adminRoles = ['super-admin', 'institution-admin', 'director', 'finance-officer', 'hr-officer', 'library-manager', 'discipline-committee'];

        $mapped = $users->map(function ($u) use ($roleLabels, $adminRoles) {
            $roles = $u->roles->pluck("name")->toArray();
            $primaryRole = count($roles) > 0 ? $roles[0] : 'professor';
            
            $isAdmin = false;
            foreach ($roles as $role) {
                if (in_array($role, $adminRoles)) {
                    $isAdmin = true;
                    $primaryRole = $role; // Prioritize showing admin role if they have multiple
                    break;
                }
            }
            
            return [
                "id" => $u->id,
                "name" => $u->name,
                "first_name" => $u->name, // For frontend compatibility
                "last_name" => "",
                "email" => $u->email,
                "phone" => $u->phone,
                "type" => $isAdmin ? "admin" : "professor",
                "role_label" => $roleLabels[$primaryRole] ?? 'Professeur',
                "department" => "Non assignǸ",
                "speciality" => "Non assignǸ",
                "roles" => $roles
            ];
        });

        return response()->json(["data" => $mapped]);
    }

    public function show($id)
    {
        $user = User::with('roles')->findOrFail($id);
        $roles = $user->roles->pluck('name')->toArray();
        $primaryRole = count($roles) > 0 ? $roles[0] : 'professor';
        
        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $primaryRole
            ]
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'sometimes|required|string'
        ]);

        if (isset($validated['name'])) $user->name = $validated['name'];
        if (isset($validated['email'])) $user->email = $validated['email'];
        if (!empty($validated['password'])) {
            $user->password = bcrypt($validated['password']);
        }
        $user->save();

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        return response()->json(['success' => true, 'message' => 'Utilisateur mis à jour avec succès', 'data' => $user]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['success' => true, 'message' => 'Utilisateur supprimé avec succès']);
    }
}


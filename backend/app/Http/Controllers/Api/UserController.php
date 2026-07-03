<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with("roles")->get();
        
        $mapped = $users->map(function ($u) {
            $roles = $u->roles->pluck("name")->toArray();
            $isAdmin = in_array("super-admin", $roles) || in_array("institution-admin", $roles) || in_array("admin", $roles);
            
            return [
                "id" => $u->id,
                "name" => $u->name,
                "first_name" => $u->name, // For frontend compatibility
                "last_name" => "",
                "email" => $u->email,
                "phone" => $u->phone,
                "type" => $isAdmin ? "admin" : "professor",
                "department" => "Non assign",
                "speciality" => "Non assign",
                "roles" => $roles
            ];
        });

        return response()->json(["data" => $mapped]);
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['success' => true, 'message' => 'Utilisateur supprimé avec succès']);
    }
}


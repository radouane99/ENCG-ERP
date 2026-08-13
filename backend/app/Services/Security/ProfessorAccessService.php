<?php

namespace App\Services\Security;

use App\Models\User;
use App\Models\Professor;
use App\Models\Module;
use App\Models\Filiere;
use App\Models\Group;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProfessorAccessService
{
    /**
     * Obtenir les IDs de modules autorisés pour un utilisateur.
     */
    public function getAuthorizedModuleIds(?User $user): Collection
    {
        if (!$user) {
            return collect();
        }

        // Les administrateurs et directeurs ont accès à tous les modules
        if ($user->hasAnyRole(['super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director'])) {
            return Module::pluck('id');
        }

        $prof = Professor::where('user_id', $user->id)->first();
        if (!$prof) {
            $userName = trim($user->name);
            $prof = Professor::where('email', $user->email)
                ->orWhereHas('user', fn($q) => $q->where('email', $user->email))
                ->orWhere('first_name', 'LIKE', "%{$user->first_name}%")
                ->orWhere('last_name', 'LIKE', "%{$user->last_name}%")
                ->orWhereHas('user', fn($q) => $q->where('name', 'LIKE', "%{$userName}%"))
                ->orWhere('id', $user->id)
                ->first();
            if ($prof && (!$prof->user_id || $prof->user_id !== $user->id)) {
                $prof->update(['user_id' => $user->id]);
            }
        }

        if (!$prof) {
            return collect();
        }

        $allProfIds = DB::table('professors')
            ->where('user_id', $user->id)
            ->orWhere('id', $prof->id)
            ->orWhere('email', $user->email)
            ->orWhere('first_name', 'LIKE', "%{$user->first_name}%")
            ->pluck('id')
            ->toArray();

        $profIds = array_unique(array_filter(array_merge([$prof->id, $user->id], $allProfIds)));

        $assignedModuleIds = DB::table('module_professor')
            ->whereIn('professor_id', $profIds)
            ->pluck('module_id');

        $today = now()->format('Y-m-d');
        $substituteModuleIds = DB::table('professor_substitutions')
            ->whereIn('substitute_professor_id', $profIds)
            ->where('status', 'active')
            ->where('start_date', '<=', $today)
            ->where('end_date', '>=', $today)
            ->pluck('module_id');

        return $assignedModuleIds->merge($substituteModuleIds)->unique()->filter();
    }

    /**
     * Obtenir les IDs de filières autorisées pour un utilisateur.
     */
    public function getAuthorizedFiliereIds(?User $user): Collection
    {
        if (!$user) {
            return collect();
        }

        if ($user->hasAnyRole(['super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director'])) {
            return Filiere::pluck('id');
        }

        $moduleIds = $this->getAuthorizedModuleIds($user);

        if ($moduleIds->isEmpty()) {
            return collect();
        }

        return DB::table('modules')
            ->whereIn('id', $moduleIds)
            ->pluck('filiere_id')
            ->unique()
            ->filter();
    }

    /**
     * Obtenir les IDs de groupes autorisés pour un utilisateur.
     */
    public function getAuthorizedGroupIds(?User $user): Collection
    {
        if (!$user) {
            return collect();
        }

        if ($user->hasAnyRole(['super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director'])) {
            return Group::pluck('id');
        }

        $prof = Professor::where('user_id', $user->id)->first();
        if (!$prof) {
            return collect();
        }

        $assignedGroupIds = DB::table('module_professor')
            ->where('professor_id', $prof->id)
            ->whereNotNull('group_id')
            ->pluck('group_id')
            ->unique()
            ->filter();

        if ($assignedGroupIds->isNotEmpty()) {
            return $assignedGroupIds;
        }

        // Si aucun groupe spécifique n'est lié, retourner tous les groupes des filières autorisées
        $filiereIds = $this->getAuthorizedFiliereIds($user);
        if ($filiereIds->isEmpty()) {
            return collect();
        }

        return DB::table('groups')
            ->whereIn('filiere_id', $filiereIds)
            ->pluck('id')
            ->unique()
            ->filter();
    }

    /**
     * Vérifier si un utilisateur est autorisé à gérer un module.
     */
    public function isAuthorizedForModule(?User $user, int $moduleId): bool
    {
        if (!$user) return false;
        if ($user->hasAnyRole(['super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director'])) {
            return true;
        }

        return $this->getAuthorizedModuleIds($user)->contains($moduleId);
    }
}

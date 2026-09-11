<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AdminRolePermissionController extends Controller
{
    /**
     * Obtenir l'ensemble des rôles, permissions groupées et utilisateurs pour la matrice.
     */
    public function getData(Request $request): JsonResponse
    {
        // 1. Liste des rôles système
        $allRoles = Role::all();
        if ($allRoles->isEmpty()) {
            $defaultRoles = [
                'super-admin', 'institution-admin', 'director', 'department-head',
                'filiere-head', 'professor', 'vacataire', 'student', 'scolarite-agent',
                'finance-officer', 'hr-officer',
            ];
            foreach ($defaultRoles as $dr) {
                Role::findOrCreate($dr);
            }
            $allRoles = Role::all();
        }

        $roles = $allRoles->map(fn ($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'label' => $this->formatRoleLabel($r->name),
        ]);

        // 2. Liste des permissions système avec catégorisation
        $allPermissions = Permission::all();
        if ($allPermissions->isEmpty()) {
            $allPermissions = $this->seedSystemPermissions();
        }

        $groupedPermissions = $this->groupPermissions($allPermissions);

        // 3. Liste des utilisateurs avec leurs rôles et permissions
        $query = User::with(['roles', 'permissions']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $roleName = $request->role;
            $query->whereHas('roles', fn ($q) => $q->where('name', $roleName));
        }

        if ($request->filled('category') && $request->category !== 'ALL') {
            $cat = strtoupper($request->category);
            if ($cat === 'ADMINS') {
                $query->whereHas('roles', fn ($q) => $q->whereIn('name', [
                    'super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director', 'admin',
                ]));
            } elseif ($cat === 'PROFS') {
                $query->whereHas('roles', fn ($q) => $q->whereIn('name', [
                    'professor', 'enseignant', 'vacataire', 'department-head', 'filiere-head',
                ]));
            } elseif ($cat === 'STAFF') {
                $query->whereHas('roles', fn ($q) => $q->whereIn('name', [
                    'scolarite-agent', 'finance-officer', 'hr-officer', 'library-manager', 'discipline-committee',
                ]));
            } elseif ($cat === 'STUDENTS') {
                $query->where(function ($sq) {
                    $sq->whereHas('roles', fn ($q) => $q->whereIn('name', ['student', 'etudiant']))
                        ->orWhereDoesntHave('roles');
                });
            }
        }

        // Priorité d'affichage : Administrateurs et Responsables en tête de liste
        $query->orderByRaw("CASE 
            WHEN EXISTS (SELECT 1 FROM model_has_roles mhr JOIN roles r ON mhr.role_id = r.id WHERE mhr.model_id = users.id AND r.name IN ('super-admin', 'super_admin', 'admin', 'institution-admin', 'director')) THEN 1
            WHEN EXISTS (SELECT 1 FROM model_has_roles mhr JOIN roles r ON mhr.role_id = r.id WHERE mhr.model_id = users.id AND r.name IN ('department-head', 'filiere-head', 'professor', 'vacataire')) THEN 2
            WHEN EXISTS (SELECT 1 FROM model_has_roles mhr JOIN roles r ON mhr.role_id = r.id WHERE mhr.model_id = users.id AND r.name IN ('scolarite-agent', 'finance-officer', 'hr-officer')) THEN 3
            ELSE 4 END ASC")
            ->orderBy('id', 'asc');

        $users = $query->paginate($request->input('per_page', 50))->through(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'avatar' => $u->avatar ?? null,
                'roles' => $u->roles->pluck('name'),
                'permissions' => $u->permissions->pluck('name'),
                'created_at' => $u->created_at ? $u->created_at->format('Y-m-d') : null,
            ];
        });

        // Totaux par catégorie pour les filtres rapides
        $counts = [
            'total' => User::count(),
            'admins' => User::whereHas('roles', fn ($q) => $q->whereIn('name', ['super-admin', 'super_admin', 'institution-admin', 'director', 'admin']))->count(),
            'profs' => User::whereHas('roles', fn ($q) => $q->whereIn('name', ['professor', 'enseignant', 'vacataire', 'department-head', 'filiere-head']))->count(),
            'staff' => User::whereHas('roles', fn ($q) => $q->whereIn('name', ['scolarite-agent', 'finance-officer', 'hr-officer']))->count(),
            'students' => User::where(function ($sq) {
                $sq->whereHas('roles', fn ($q) => $q->whereIn('name', ['student', 'etudiant']))
                    ->orWhereDoesntHave('roles');
            })->count(),
        ];

        return response()->json([
            'success' => true,
            'roles' => $roles,
            'permissions' => $groupedPermissions,
            'users' => $users,
            'counts' => $counts,
        ]);
    }

    /**
     * Mettre à jour les rôles et permissions spécifiques d'un utilisateur.
     */
    public function updateUserPermissions(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'roles' => 'present|array',
            'roles.*' => 'string',
            'permissions' => 'present|array',
            'permissions.*' => 'string',
        ]);

        // Assurer que les rôles existent
        foreach ($validated['roles'] as $roleName) {
            Role::findOrCreate($roleName);
        }

        // Assurer que les permissions existent
        foreach ($validated['permissions'] as $permName) {
            Permission::findOrCreate($permName);
        }

        // Synchroniser Spatie RBAC
        $user->syncRoles($validated['roles']);
        $user->syncPermissions($validated['permissions']);

        return response()->json([
            'success' => true,
            'message' => "Accès et permissions mis à jour pour {$user->name}.",
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'roles' => $user->fresh()->roles->pluck('name'),
                'permissions' => $user->fresh()->permissions->pluck('name'),
            ],
        ]);
    }

    private function formatRoleLabel(string $role): string
    {
        $map = [
            'super-admin' => 'Super Administrateur System',
            'institution-admin' => 'Administrateur Institutionnel',
            'director' => 'Direction Académique',
            'department-head' => 'Chef de Département',
            'filiere-head' => 'Coordonnateur de Filière',
            'professor' => 'Professeur Permanent',
            'vacataire' => 'Enseignant Vacataire',
            'student' => 'Étudiant ENCG',
            'scolarite-agent' => 'Agent de Scolarité',
            'finance-officer' => 'Responsable Financier',
            'hr-officer' => 'Responsable Ressources Humaines',
        ];

        return $map[$role] ?? ucfirst(str_replace(['-', '_'], ' ', $role));
    }

    private function groupPermissions($permissions): array
    {
        $groups = [
            'Notes & Délibérations' => [
                'grades.view', 'grades.edit', 'grades.validate', 'pv.generate', 'pv.sign',
            ],
            'Scolarité & Inscriptions' => [
                'students.view', 'students.edit', 'enrollments.manage', 'cards.issue', 'attestations.sign',
            ],
            'Département & Cours' => [
                'textbooks.write', 'textbooks.validate', 'substitutions.manage', 'schedules.manage',
            ],
            'RH & Vacataires' => [
                'professors.manage', 'vacataires.manage', 'contracts.sign', 'payroll.validate',
            ],
            'Administration Système' => [
                'users.manage', 'roles.manage', 'audit.view', 'system.settings',
            ],
        ];

        $result = [];
        foreach ($groups as $category => $permList) {
            $items = [];
            foreach ($permList as $permName) {
                Permission::findOrCreate($permName);
                $items[] = [
                    'name' => $permName,
                    'label' => ucfirst(str_replace(['.', '_'], ' ', $permName)),
                ];
            }
            $result[] = [
                'category' => $category,
                'permissions' => $items,
            ];
        }

        return $result;
    }

    private function seedSystemPermissions()
    {
        $perms = [
            'grades.view', 'grades.edit', 'grades.validate', 'pv.generate', 'pv.sign',
            'students.view', 'students.edit', 'enrollments.manage', 'cards.issue', 'attestations.sign',
            'textbooks.write', 'textbooks.validate', 'substitutions.manage', 'schedules.manage',
            'professors.manage', 'vacataires.manage', 'contracts.sign', 'payroll.validate',
            'users.manage', 'roles.manage', 'audit.view', 'system.settings',
        ];

        foreach ($perms as $p) {
            Permission::findOrCreate($p);
        }

        return Permission::all();
    }
}

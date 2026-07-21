<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\Institution;

/**
 * RbacSeeder
 *
 * Seeds the complete RBAC (Role-Based Access Control) system:
 * - All permissions organized by domain
 * - All roles with their permission matrix
 * - Default users for each role
 */
class RbacSeeder extends Seeder
{
    /**
     * Complete permission matrix organized by domain.
     * Format: 'domain.action' or 'domain.entity.action'
     */
    private array $permissions = [
        // ── Institution Management ─────────────────────────────
        'institution.view', 'institution.create', 'institution.edit', 'institution.delete',

        // ── User Management ────────────────────────────────────
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.impersonate',

        // ── Students ───────────────────────────────────────────
        'students.view', 'students.create', 'students.edit', 'students.delete',
        'students.view-sensitive', // CIN, CNE (Law 09-08 controlled)
        'students.export',

        // ── Professors ─────────────────────────────────────────
        'professors.view', 'professors.create', 'professors.edit', 'professors.delete',

        // ── Vacataires ─────────────────────────────────────────
        'vacataires.view', 'vacataires.create', 'vacataires.edit', 'vacataires.delete',
        'vacataires.validate-session', 'vacataires.generate-payment', 'vacataires.export-payment',

        // ── Admission ──────────────────────────────────────────
        'admission.view', 'admission.create', 'admission.edit',
        'admission.review-applications', 'admission.accept', 'admission.reject',

        // ── Academic Structure ─────────────────────────────────
        'academic.view', 'academic.create', 'academic.edit', 'academic.delete',
        'academic.lock-year', 'academic.manage-modules', 'academic.assign-professors',

        // ── Timetable ──────────────────────────────────────────
        'timetable.view', 'timetable.create', 'timetable.edit', 'timetable.delete',

        // ── Attendance ─────────────────────────────────────────
        'attendance.view', 'attendance.mark', 'attendance.edit', 'attendance.export',
        'attendance.justify-absence', 'attendance.review-justification',

        // ── Grades & Exams ─────────────────────────────────────
        'grades.view', 'grades.enter', 'grades.edit', 'grades.delete', 'grades.validate', 'grades.publish',
        'exams.view', 'exams.create', 'exams.edit', 'exams.delete',

        // ── Deliberation ───────────────────────────────────────
        'deliberation.view', 'deliberation.run', 'deliberation.edit-decision',
        'deliberation.lock', 'deliberation.generate-pv',

        // ── Documents ──────────────────────────────────────────
        'documents.request', 'documents.view-own',
        'documents.process', 'documents.generate', 'documents.templates',

        // ── Diplomas ───────────────────────────────────────────
        'diplomas.view', 'diplomas.generate', 'diplomas.issue',

        // ── LMS ────────────────────────────────────────────────
        'lms.view', 'lms.create-content', 'lms.manage-assignments', 'lms.grade-submissions',

        // ── Communication ──────────────────────────────────────
        'announcements.view', 'announcements.create', 'announcements.delete',
        'messages.send', 'messages.view',

        // ── Library ────────────────────────────────────────────
        'library.view', 'library.borrow', 'library.manage', 'library.return',

        // ── Discipline ─────────────────────────────────────────
        'discipline.view', 'discipline.create', 'discipline.decide',

        // ── PFE & Internships ──────────────────────────────────
        'internships.view', 'internships.create', 'internships.evaluate',
        'finalprojects.view', 'finalprojects.create', 'finalprojects.assign-jury',

        // ── AI ─────────────────────────────────────────────────
        'ai.use-tutor', 'ai.generate-content', 'ai.view-predictions',

        // ── Support ────────────────────────────────────────────
        'tickets.create', 'tickets.view-own', 'tickets.manage',

        // ── Reporting & Analytics ──────────────────────────────
        'reports.view', 'reports.export', 'reports.advanced',

        // ── Compliance (Law 09-08) ─────────────────────────────
        'compliance.audit-logs', 'compliance.data-export', 'compliance.manage-consent',

        // ── System ─────────────────────────────────────────────
        'system.settings', 'system.horizon', 'system.logs',
        
        // ── Infrastructure ─────────────────────────────────────
        'infrastructure.view', 'infrastructure.create', 'infrastructure.edit', 'infrastructure.delete',
    ];

    /**
     * Role permission matrix.
     * '*' means all permissions.
     */
    private array $rolePermissions = [
        'super-admin' => ['*'],

        'institution-admin' => [
            'institution.view', 'institution.edit',
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'students.*', 'professors.*', 'vacataires.*',
            'admission.*', 'academic.*', 'timetable.*',
            'attendance.*', 'grades.*', 'exams.*', 'deliberation.*',
            'documents.*', 'diplomas.*', 'lms.*',
            'announcements.*', 'messages.send', 'messages.view',
            'library.manage', 'library.view',
            'discipline.*', 'internships.*', 'finalprojects.*',
            'ai.*', 'tickets.manage', 'reports.*', 'compliance.*',
            'infrastructure.*', 'system.*',
        ],

        'director' => [
            'students.view', 'students.edit', 'students.export',
            'professors.view', 'professors.edit',
            'academic.view', 'academic.edit', 'academic.assign-professors',
            'timetable.view', 'timetable.create', 'timetable.edit',
            'grades.view', 'grades.validate', 'deliberation.*',
            'documents.process', 'documents.generate', 'diplomas.*',
            'announcements.*', 'discipline.*',
            'reports.view', 'reports.export',
        ],

        'department-head' => [
            'students.view', 'professors.view',
            'academic.view', 'academic.edit', 'academic.assign-professors',
            'timetable.view', 'timetable.create', 'timetable.edit',
            'grades.view', 'grades.validate', 'exams.view',
            'reports.view',
        ],

        'professor' => [
            'students.view',
            'timetable.view',
            'attendance.mark', 'attendance.edit', 'attendance.view',
            'attendance.review-justification',
            'grades.enter', 'grades.edit', 'exams.view',
            'lms.create-content', 'lms.manage-assignments', 'lms.grade-submissions',
            'messages.send', 'messages.view',
            'announcements.view',
            'internships.view', 'internships.evaluate',
            'finalprojects.view', 'finalprojects.assign-jury',
            'ai.use-tutor', 'ai.generate-content',
            'tickets.create', 'tickets.view-own',
        ],

        'vacataire' => [
            'timetable.view',
            'attendance.mark',
            'grades.enter',
            'lms.create-content', 'lms.manage-assignments',
            'messages.send', 'messages.view',
            'announcements.view',
            'tickets.create', 'tickets.view-own',
        ],

        'student' => [
            'timetable.view',
            'grades.view',
            'lms.view',
            'announcements.view',
            'messages.send', 'messages.view',
            'documents.request', 'documents.view-own',
            'library.view', 'library.borrow',
            'internships.create',
            'finalprojects.create',
            'ai.use-tutor',
            'tickets.create', 'tickets.view-own',
            'attendance.justify-absence',
        ],

        'finance-officer' => [
            'vacataires.view', 'vacataires.generate-payment', 'vacataires.export-payment',
            'students.view',
            'reports.view', 'reports.export',
        ],

        'hr-officer' => [
            'professors.view', 'professors.create', 'professors.edit',
            'vacataires.view', 'vacataires.create', 'vacataires.edit',
            'vacataires.validate-session',
            'reports.view',
        ],

        'library-manager' => [
            'library.view', 'library.manage', 'library.return',
            'students.view',
        ],

        'discipline-committee' => [
            'students.view',
            'discipline.view', 'discipline.create', 'discipline.decide',
        ],
    ];

    public function run(): void
    {
        $institution = Institution::first();

        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create all permissions
        foreach ($this->permissions as $permission) {
            Permission::findOrCreate($permission, 'sanctum');
        }

        // Create roles and assign permissions
        foreach ($this->rolePermissions as $roleName => $permissions) {
            $role = Role::findOrCreate($roleName, 'sanctum');

            if (in_array('*', $permissions)) {
                $role->givePermissionTo(Permission::all());
            } else {
                // Resolve wildcard permissions (e.g., 'students.*')
                $resolvedPermissions = collect($permissions)->flatMap(function ($perm) {
                    if (str_ends_with($perm, '.*')) {
                        $prefix = str_replace('.*', '.', $perm);
                        return Permission::where('name', 'like', "{$prefix}%")->pluck('name');
                    }
                    return [$perm];
                })->unique()->toArray();

                $role->syncPermissions($resolvedPermissions);
            }
        }

        // Create default seeded users
        $this->createDefaultUsers($institution);
    }

    private function createDefaultUsers(?Institution $institution): void
    {
        $users = [
            [
                'name'  => 'Super Administrateur',
                'email' => 'superadmin@encg-fes.ma',
                'role'  => 'super-admin',
                'institution_id' => null,
            ],
            [
                'name'  => 'Admin ENCG Fès',
                'email' => 'admin@encg-fes.ma',
                'role'  => 'institution-admin',
                'institution_id' => $institution?->id,
            ],
            [
                'name'  => 'Directeur ENCG',
                'email' => 'directeur@encg-fes.ma',
                'role'  => 'director',
                'institution_id' => $institution?->id,
            ],
            // Sample accounts removed for production safety. Add real seeded accounts via environment-driven seeders if needed.
            [
                'name'  => 'RH — Khalid BENJELLOUN',
                'email' => 'rh@encg-fes.ma',
                'role'  => 'hr-officer',
                'institution_id' => $institution?->id,
            ],
            [
                'name'  => 'Finance — Samira HADDAD',
                'email' => 'finance@encg-fes.ma',
                'role'  => 'finance-officer',
                'institution_id' => $institution?->id,
            ],
            [
                'name'  => 'Bibliothèque — Omar TAZI',
                'email' => 'bibliotheque@encg-fes.ma',
                'role'  => 'library-manager',
                'institution_id' => $institution?->id,
            ],
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            unset($userData['role']);

            $seededPassword = env('INITIAL_USER_PASSWORD', env('DEFAULT_SEEDED_USER_PASSWORD'));

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'password'          => $seededPassword ? Hash::make($seededPassword) : Hash::make(Str::random(24)),
                    'email_verified_at' => now(),
                    'is_active'         => true,
                ])
            );

            $user->syncRoles([$role]);
        }
    }
}

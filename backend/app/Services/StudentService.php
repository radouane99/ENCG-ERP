<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Student;
use App\Models\StudentRegistration;
use App\Models\User;
use App\Support\TemporaryPassword;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class StudentService
{
    /**
     * Liste paginée des étudiants.
     */
    public function getPaginatedStudents(array $filters, int $perPage = 20, string $sortField = 'last_name', string $sortOrder = 'asc'): LengthAwarePaginator
    {
        // On sélectionne explicitement `students.*` et on fait un leftJoin sur `users`
        // pour permettre le tri et la recherche rapide sur first_name, last_name, email.
        $query = Student::with(['latestPathway.filiere', 'latestPathway.group', 'user'])
            ->select('students.*')
            ->leftJoin('users', 'students.user_id', '=', 'users.id');

        if (! empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('students.student_number', 'ilike', "%{$search}%")
                    ->orWhere('students.cne', 'ilike', "%{$search}%")
                    ->orWhere('students.massar_code', 'ilike', "%{$search}%")
                    ->orWhere('users.first_name', 'ilike', "%{$search}%")
                    ->orWhere('users.last_name', 'ilike', "%{$search}%")
                    ->orWhere('users.email', 'ilike', "%{$search}%")
                    ->orWhere('users.cin', 'ilike', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('students.status', $filters['status']);
        }

        if (! empty($filters['filiere_id'])) {
            $filiereId = is_numeric($filters['filiere_id'])
                ? (int) $filters['filiere_id']
                : Filiere::where('code', $filters['filiere_id'])->value('id');

            if ($filiereId) {
                $query->where(function ($q) use ($filiereId) {
                    $q->whereHas('pathways', fn ($p) => $p->where('filiere_id', $filiereId))
                        ->orWhereHas('registrations', fn ($r) => $r->where('filiere_id', $filiereId));
                });
            }
        }

        if (! empty($filters['group_id'])) {
            $groupId = (int) $filters['group_id'];
            $targetGroup = Group::find($groupId);
            $matchingGroupIds = [$groupId];

            if ($targetGroup?->name) {
                preg_match('/(G\d+|Group\s*\d+|G\s*\d+)$/i', $targetGroup->name, $matches);
                if (! empty($matches[1])) {
                    $suffix = $matches[1];
                    $siblingIds = Group::where('name', 'like', "%{$suffix}")->pluck('id')->toArray();
                    $matchingGroupIds = array_unique(array_merge($matchingGroupIds, $siblingIds));
                }
            }

            $query->where(function ($q) use ($matchingGroupIds) {
                $q->whereHas('pathways', fn ($p) => $p->whereIn('group_id', $matchingGroupIds))
                    ->orWhereHas('registrations', fn ($r) => $r->whereIn('group_id', $matchingGroupIds));
            });
        }

        if (! empty($filters['sub_group'])) {
            $subGroup = trim($filters['sub_group']);
            $query->where(function ($q) use ($subGroup) {
                $q->whereHas('pathways', fn ($p) => $p->where('sub_group', $subGroup))
                    ->orWhereHas('registrations', fn ($r) => $r->where('sub_group', $subGroup));
            });
        }

        $allowedUserSorts = ['last_name', 'first_name', 'email'];
        $allowedStudentSorts = ['student_number', 'created_at', 'status'];

        $sortOrder = strtolower($sortOrder) === 'desc' ? 'desc' : 'asc';

        if (in_array($sortField, $allowedUserSorts)) {
            $query->orderBy('users.'.$sortField, $sortOrder);
        } elseif (in_array($sortField, $allowedStudentSorts)) {
            $query->orderBy('students.'.$sortField, $sortOrder);
        } else {
            $query->orderBy('users.last_name', $sortOrder);
        }

        return $query->paginate($perPage);
    }

    /**
     * Créer un étudiant.
     */
    public function createStudent(array $data, int $institutionId = 1): Student
    {
        return DB::transaction(function () use ($data, $institutionId) {
            $user = User::provision([
                'name' => trim($data['first_name'].' '.$data['last_name']),
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'cin' => $data['cin'] ?? null,
                'password' => TemporaryPassword::hash(),
                'must_change_password' => true,
                'is_active' => true,
            ]);

            unset($data['first_name'], $data['last_name'], $data['email'], $data['phone'], $data['cin']);

            $filiereCode = $data['current_filiere'] ?? null;
            $semester = $data['current_semester'] ?? 1;
            unset($data['current_filiere'], $data['current_semester']);

            $data['student_number'] = $data['student_number'] ?? (date('Y').str_pad(Student::whereYear('created_at', date('Y'))->count() + 1, 4, '0', STR_PAD_LEFT));
            $data['institution_id'] = $institutionId;
            $data['user_id'] = $user->id;

            $student = Student::create($data);

            if ($filiereCode) {
                $filiere = Filiere::where('code', $filiereCode)->orWhere('id', $filiereCode)->first();
                if ($filiere) {
                    $academicYear = AcademicYear::where('is_current', true)->first();
                    $academicYearId = $academicYear?->id ?? 1;

                    $student->pathways()->create([
                        'filiere_id' => $filiere->id,
                        'current_semester' => $semester,
                        'academic_year_id' => $academicYearId,
                        'is_current' => true,
                    ]);

                    // Inscriptions S1 et S2
                    $sem1 = ($semester % 2 === 1) ? (int) $semester : ((int) $semester - 1);
                    foreach ([$sem1, $sem1 + 1] as $sNum) {
                        if ($sNum >= 1 && $sNum <= 10) {
                            StudentRegistration::updateOrCreate(
                                ['student_id' => $student->id, 'academic_year_id' => $academicYearId, 'semester_number' => $sNum],
                                ['filiere_id' => $filiere->id, 'status' => 'active']
                            );
                        }
                    }
                }
            }

            return $student;
        });
    }

    /**
     * Mettre à jour un étudiant.
     */
    public function updateStudent(Student $student, array $data): Student
    {
        return DB::transaction(function () use ($student, $data) {
            $userFields = array_intersect_key($data, array_flip(['first_name', 'last_name', 'email', 'phone', 'cin']));
            if (! empty($userFields)) {
                if (isset($userFields['first_name']) || isset($userFields['last_name'])) {
                    $fn = $userFields['first_name'] ?? $student->user->first_name;
                    $ln = $userFields['last_name'] ?? $student->user->last_name;
                    $userFields['name'] = trim("{$fn} {$ln}");
                }
                $student->user->update($userFields);
            }

            unset($data['first_name'], $data['last_name'], $data['email'], $data['phone'], $data['cin']);
            unset($data['current_filiere'], $data['current_semester']);

            if (! empty($data)) {
                $student->update($data);
            }

            return $student->fresh(['user', 'latestPathway.filiere']);
        });
    }
}

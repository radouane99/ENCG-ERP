<?php

namespace App\Services;

use App\Models\Student;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StudentService
{
    /**
     * Get a paginated list of students with optimized eager loading.
     */
    public function getPaginatedStudents(array $filters, int $perPage = 20, string $sortField = 'last_name', string $sortOrder = 'asc'): LengthAwarePaginator
    {
        $query = Student::with(['latestPathway.filiere', 'latestPathway.group', 'user'])
            ->join('users', 'students.user_id', '=', 'users.id')
            ->select('students.*', 'users.first_name', 'users.last_name', 'users.email', 'users.phone', 'students.gender');

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('users.first_name', 'like', "%{$search}%")
                  ->orWhere('users.last_name', 'like', "%{$search}%")
                  ->orWhere('users.email', 'like', "%{$search}%")
                  ->orWhere('users.cin', 'like', "%{$search}%")
                  ->orWhere('users.phone', 'like', "%{$search}%")
                  ->orWhere('students.student_number', 'like', "%{$search}%")
                  ->orWhere('students.cne', 'like', "%{$search}%")
                  ->orWhere('users.cin', 'like', "%{$search}%")
                  ->orWhere('students.massar_code', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('students.status', $filters['status']);
        }

        if (!empty($filters['filiere_id']) || !empty($filters['semester']) || !empty($filters['group_id'])) {
            $filiereId = null;
            if (!empty($filters['filiere_id'])) {
                if (is_numeric($filters['filiere_id'])) {
                    $filiereId = (int) $filters['filiere_id'];
                } else {
                    $filiereId = \App\Models\Filiere::where('code', $filters['filiere_id'])->value('id');
                }
            }

            $requestedSem = !empty($filters['semester']) ? (int) str_replace('S', '', $filters['semester']) : null;
            $groupId = !empty($filters['group_id']) ? (int) $filters['group_id'] : null;

            if ($requestedSem !== null) {
                // Pair semesters by academic year: S1<->S2 (Year 1), S3<->S4 (Year 2), S5<->S6 (Year 3), S7<->S8 (Year 4), S9<->S10 (Year 5)
                $pairedSem = ($requestedSem % 2 === 1) ? ($requestedSem + 1) : ($requestedSem - 1);
                $allowedSemesters = [$requestedSem, $pairedSem];
            } else {
                $allowedSemesters = null;
            }

            $query->where(function ($q) use ($filiereId, $requestedSem, $allowedSemesters, $groupId) {
                // 1. Regular enrolled students in the corresponding academic year (same semester pair S1/S2, S3/S4, etc.)
                $q->whereHas('pathways', function ($q2) use ($filiereId, $allowedSemesters, $groupId) {
                    if ($filiereId !== null) {
                        $q2->where('filiere_id', $filiereId);
                    }
                    if ($allowedSemesters !== null) {
                        $q2->whereIn('current_semester', $allowedSemesters);
                    }
                    if ($groupId !== null) {
                        $q2->where('group_id', $groupId);
                    }
                });

                // 2. "Réservistes": Students carrying over modules from this requested semester
                if ($requestedSem !== null || $filiereId !== null) {
                    $q->orWhereExists(function ($q2) use ($requestedSem, $filiereId) {
                        $q2->select(DB::raw(1))
                           ->from('student_module_retakes')
                           ->join('modules', 'student_module_retakes.module_id', '=', 'modules.id')
                           ->whereColumn('student_module_retakes.student_id', 'students.id')
                           ->where('student_module_retakes.status', 'pending');
                           
                        if ($requestedSem !== null) {
                            $q2->where('modules.semester_number', $requestedSem);
                        }
                        if ($filiereId !== null) {
                            $q2->where('modules.filiere_id', $filiereId);
                        }
                    });
                }
            });
        }

        // Validate sort field to prevent SQL injection
        $allowedSorts = ['last_name', 'first_name', 'student_number', 'created_at', 'status'];
        if (!in_array($sortField, $allowedSorts)) {
            $sortField = 'users.last_name';
        } else {
            if (in_array($sortField, ['first_name', 'last_name'])) {
                $sortField = 'users.' . $sortField;
            } else {
                $sortField = 'students.' . $sortField;
            }
        }
        $sortOrder = strtolower($sortOrder) === 'desc' ? 'desc' : 'asc';

        return $query->orderBy($sortField, $sortOrder)->paginate($perPage);
    }

    /**
     * Map a paginated collection of students to a DTO-like array for the API response.
     */
    public function mapStudentCollection(LengthAwarePaginator $paginator): array
    {
        return $paginator->getCollection()->map(function ($student) {
            $latestPathway = $student->latestPathway;
            return [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'cne' => $student->cne,
                'massar_code' => $student->massar_code,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'email' => $student->email,
                'phone' => $student->phone,
                'gender' => $student->gender,
                'birth_date' => $student->birth_date,
                'status' => $student->status ?? 'active',
                'scholarship_type' => $student->scholarship_type,
                'current_filiere' => $latestPathway?->filiere?->code,
                'current_semester' => $latestPathway?->current_semester,
                'current_group' => null, // Reserved for Phase 2
                'created_at' => $student->created_at,
            ];
        })->toArray();
    }

    /**
     * Create a new student with transaction safety.
     */
    public function createStudent(array $data, int $institutionId = 1): Student
    {
        return DB::transaction(function () use ($data, $institutionId) {
            // Create user first
            $user = \App\Models\User::create([
                'name' => trim($data['first_name'] . ' ' . $data['last_name']),
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'cin' => $data['cin'] ?? null,
                'password' => bcrypt('password'), // default password, should trigger reset email
                'is_active' => true,
            ]);

            // Clean up student data
            unset($data['first_name'], $data['last_name'], $data['email'], $data['phone'], $data['cin']);

            $filiereCode = $data['current_filiere'] ?? null;
            $semester = $data['current_semester'] ?? 1;
            unset($data['current_filiere'], $data['current_semester']);

            // Auto-generate student number
            $year = date('Y');
            $count = Student::whereYear('created_at', $year)->count() + 1;
            
            $data['student_number'] = $data['student_number'] ?? ($year . str_pad($count, 4, '0', STR_PAD_LEFT));
            $data['cne'] = $data['cne'] ?? ('CNE' . $data['student_number']);
            $data['gender'] = $data['gender'] ?? 'male';
            $data['status'] = $data['status'] ?? 'active';
            $data['institution_id'] = $institutionId;
            $data['user_id'] = $user->id;

            $student = Student::create($data);

            if ($filiereCode) {
                $filiere = \App\Models\Filiere::where('code', $filiereCode)->orWhere('id', $filiereCode)->first();
                if ($filiere) {
                    $academicYear = \App\Models\AcademicYear::where('is_current', true)->first();
                    $student->pathways()->create([
                        'filiere_id' => $filiere->id,
                        'current_semester' => $semester,
                        'academic_year_id' => $academicYear ? $academicYear->id : 1,
                        'is_current' => true,
                    ]);
                }
            }

            return $student;
        });
    }

    /**
     * Update an existing student.
     */
    public function updateStudent(Student $student, array $data): Student
    {
        return DB::transaction(function () use ($student, $data) {
            // Extract user fields
            $userData = [];
            foreach (['first_name', 'last_name', 'email', 'phone', 'cin'] as $field) {
                if (array_key_exists($field, $data)) {
                    $userData[$field] = $data[$field];
                    unset($data[$field]);
                }
            }

            if (!empty($userData)) {
                $student->user()->update($userData);
            }

            $filiereCode = $data['current_filiere'] ?? null;
            $semester = $data['current_semester'] ?? null;
            
            unset($data['current_filiere'], $data['current_semester']);
            
            if (!empty($data)) {
                $student->update($data);
            }

            if ($filiereCode !== null || $semester !== null) {
                $pathway = $student->latestPathway()->first();
                $pathwayData = [];
                
                if ($semester !== null) {
                    $pathwayData['current_semester'] = $semester;
                }
                
                if ($filiereCode) {
                    $filiere = \App\Models\Filiere::where('code', $filiereCode)->first();
                    if ($filiere) {
                        $pathwayData['filiere_id'] = $filiere->id;
                    }
                }
                
                if ($pathway) {
                    $pathway->update($pathwayData);
                } else if (isset($pathwayData['filiere_id'])) {
                    $academicYear = \App\Models\AcademicYear::where('is_current', true)->first();
                    $student->pathways()->create([
                        'filiere_id' => $pathwayData['filiere_id'],
                        'current_semester' => $pathwayData['current_semester'] ?? 1,
                        'academic_year_id' => $academicYear ? $academicYear->id : 1,
                        'is_current' => true,
                    ]);
                }
            }

            return $student->refresh();
        });
    }
}

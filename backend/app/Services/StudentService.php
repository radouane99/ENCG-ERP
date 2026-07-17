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
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                if (DB::connection()->getDriverName() === 'sqlite') {
                    $q->where('users.first_name', 'like', "%{$search}%")
                      ->orWhere('users.last_name', 'like', "%{$search}%")
                      ->orWhere('users.email', 'like', "%{$search}%");
                } else {
                    $q->whereRaw('MATCH(users.first_name, users.last_name, users.email) AGAINST (? IN BOOLEAN MODE)', [$search . '*']);
                }
                $q->orWhere('students.student_number', 'like', "%{$search}%")
                  ->orWhere('students.cne', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('students.status', $filters['status']);
        }

        if (!empty($filters['filiere_id']) || !empty($filters['semester']) || !empty($filters['group_id'])) {
            $query->where(function ($q) use ($filters) {
                // 1. Regular enrolled students
                $q->whereHas('latestPathway', function ($q2) use ($filters) {
                    if (!empty($filters['filiere_id'])) {
                        $q2->where('filiere_id', $filters['filiere_id']);
                    }
                    if (!empty($filters['semester'])) {
                        $semesterNum = str_replace('S', '', $filters['semester']);
                        $q2->where('semester_number', $semesterNum);
                    }
                    if (!empty($filters['group_id'])) {
                        $q2->where('group_id', $filters['group_id']);
                    }
                });

                // 2. "Reservistes" (Students carrying over modules from this semester/filiere)
                // Only if filtering by semester or filiere. (group_id usually applies to current year, not retakes).
                if (!empty($filters['semester']) || !empty($filters['filiere_id'])) {
                    $q->orWhereExists(function ($q2) use ($filters) {
                        $q2->select(DB::raw(1))
                           ->from('student_module_retakes')
                           ->join('modules', 'student_module_retakes.module_id', '=', 'modules.id')
                           ->whereColumn('student_module_retakes.student_id', 'students.id')
                           ->where('student_module_retakes.status', 'pending');
                           
                        if (!empty($filters['semester'])) {
                            $semesterNum = str_replace('S', '', $filters['semester']);
                            $q2->where('modules.semester_number', $semesterNum);
                        }
                        if (!empty($filters['filiere_id'])) {
                            $q2->where('modules.filiere_id', $filters['filiere_id']);
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

            // Auto-generate student number
            $year = date('Y');
            // This count could have race conditions in high-concurrency, but DB locks or redis sequence would be overkill for now
            $count = Student::whereYear('created_at', $year)->count() + 1;
            
            $data['student_number'] = $year . str_pad($count, 4, '0', STR_PAD_LEFT);
            $data['institution_id'] = $institutionId;
            $data['user_id'] = $user->id;

            return Student::create($data);
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

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
        $query = Student::with(['latestPathway.filiere']); // Eager loading

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('student_number', 'like', "%{$search}%")
                  ->orWhere('cne', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Validate sort field to prevent SQL injection
        $allowedSorts = ['last_name', 'first_name', 'student_number', 'created_at', 'status'];
        if (!in_array($sortField, $allowedSorts)) {
            $sortField = 'last_name';
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
            // Auto-generate student number
            $year = date('Y');
            // This count could have race conditions in high-concurrency, but DB locks or redis sequence would be overkill for now
            $count = Student::whereYear('created_at', $year)->count() + 1;
            
            $data['student_number'] = $year . str_pad($count, 4, '0', STR_PAD_LEFT);
            $data['institution_id'] = $institutionId;

            return Student::create($data);
        });
    }

    /**
     * Update an existing student.
     */
    public function updateStudent(Student $student, array $data): Student
    {
        $student->update($data);
        return $student;
    }
}

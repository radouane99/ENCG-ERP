<?php

namespace App\Actions\Student;

use App\Models\Student;
use App\Services\StudentService;
use Illuminate\Database\QueryException;

class CreateStudentAction
{
    protected StudentService $studentService;

    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    public function execute(array $data): Student
    {
        try {
            $student = $this->studentService->createStudent($data);

            activity()
                ->causedBy(auth()->user())
                ->performedOn($student)
                ->log('Student created');

            return $student;
        } catch (QueryException $e) {
            // Handle specific DB errors or rethrow
            throw $e;
        }
    }
}

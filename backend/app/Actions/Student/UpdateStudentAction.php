<?php

namespace App\Actions\Student;

use App\Models\Student;
use App\Services\StudentService;
use Illuminate\Database\QueryException;

class UpdateStudentAction
{
    protected StudentService $studentService;

    public function __construct(StudentService $studentService)
    {
        $this->studentService = $studentService;
    }

    public function execute(Student $student, array $data): Student
    {
        try {
            $student = $this->studentService->updateStudent($student, $data);

            activity()
                ->causedBy(auth()->user())
                ->performedOn($student)
                ->withProperties($student->getChanges())
                ->log('Student updated');

            return $student;
        } catch (QueryException $e) {
            throw $e;
        }
    }
}

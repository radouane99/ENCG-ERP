<?php

namespace App\Actions\Student;

use App\Models\Student;

class DeleteStudentAction
{
    public function execute(Student $student): bool
    {
        $result = $student->delete();

        if ($result) {
            activity()
                ->causedBy(auth()->user())
                ->performedOn($student)
                ->log('Student deleted');
        }

        return $result;
    }
}

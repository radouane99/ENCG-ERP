<?php

namespace App\Actions\Professor;

use App\Models\Professor;

class DeleteProfessorAction
{
    public function execute(Professor $professor): bool
    {
        $result = $professor->delete();

        if ($result) {
            activity()
                ->causedBy(auth()->user())
                ->performedOn($professor)
                ->log('Professor deleted');
        }

        return $result;
    }
}

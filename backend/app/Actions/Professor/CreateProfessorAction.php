<?php

namespace App\Actions\Professor;

use App\Models\Professor;
use App\Services\HR\ProfessorService;
use Illuminate\Database\QueryException;

class CreateProfessorAction
{
    protected ProfessorService $professorService;

    public function __construct(ProfessorService $professorService)
    {
        $this->professorService = $professorService;
    }

    public function execute(array $data): Professor
    {
        try {
            $professor = $this->professorService->createProfessor($data);

            activity()
                ->causedBy(auth()->user())
                ->performedOn($professor)
                ->log('Professor created');

            return $professor;
        } catch (QueryException $e) {
            throw $e;
        }
    }
}

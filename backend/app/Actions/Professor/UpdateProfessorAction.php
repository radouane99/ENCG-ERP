<?php

namespace App\Actions\Professor;

use App\Models\Professor;
use App\Services\HR\ProfessorService;
use Illuminate\Database\QueryException;

class UpdateProfessorAction
{
    protected ProfessorService $professorService;

    public function __construct(ProfessorService $professorService)
    {
        $this->professorService = $professorService;
    }

    public function execute(Professor $professor, array $data): Professor
    {
        try {
            $professor = $this->professorService->updateProfessor($professor, $data);

            activity()
                ->causedBy(auth()->user())
                ->performedOn($professor)
                ->withProperties($professor->getChanges())
                ->log('Professor updated');

            return $professor;
        } catch (QueryException $e) {
            throw $e;
        }
    }
}

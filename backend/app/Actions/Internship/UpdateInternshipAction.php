<?php

namespace App\Actions\Internship;

use App\Models\Internship;
use App\Services\Academic\CareerService;
use Illuminate\Database\QueryException;
use InvalidArgumentException;

class UpdateInternshipAction
{
    protected CareerService $careerService;

    public function __construct(CareerService $careerService)
    {
        $this->careerService = $careerService;
    }

    public function execute(Internship $internship, array $data): Internship
    {
        try {
            if ($data['action'] === 'validate') {
                $internship = $this->careerService->validateInternship($internship->id);
                $logMessage = 'Internship validated';
            } elseif ($data['action'] === 'assign_supervisor') {
                $internship = $this->careerService->assignSupervisor($internship->id, $data['supervisor_id']);
                $logMessage = 'Internship supervisor assigned';
            } else {
                throw new InvalidArgumentException("Action not supported.");
            }

            activity()
                ->causedBy(auth()->user())
                ->performedOn($internship)
                ->withProperties($internship->getChanges())
                ->log($logMessage);

            return $internship;
        } catch (QueryException $e) {
            throw $e;
        }
    }
}

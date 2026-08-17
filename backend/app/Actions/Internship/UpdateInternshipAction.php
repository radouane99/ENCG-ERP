<?php

namespace App\Actions\Internship;

use App\Models\Internship;
use App\Services\Academic\CareerService;
use Illuminate\Support\Facades\Log;
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
                throw new InvalidArgumentException('Action not supported.');
            }

            try {
                if (function_exists('activity') && auth()->user()) {
                    activity()
                        ->causedBy(auth()->user())
                        ->performedOn($internship)
                        ->withProperties($internship->getChanges())
                        ->log($logMessage);
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to log internship activity: '.$e->getMessage());
            }

            return $internship;
        } catch (\Throwable $e) {
            throw $e;
        }
    }
}

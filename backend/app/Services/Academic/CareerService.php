<?php

namespace App\Services\Academic;

use Illuminate\Support\Facades\DB;
use App\Models\Internship;
use App\Models\FinalProject;
use Illuminate\Database\Eloquent\Collection;

class CareerService
{
    /**
     * Get all internships with Eager Loading to avoid N+1 queries.
     */
    public function getAllInternships(): Collection
    {
        return Internship::with(['student', 'company', 'supervisor'])
            ->latest()
            ->get();
    }

    /**
     * Validate an internship convention.
     */
    public function validateInternship(int $internshipId): Internship
    {
        return DB::transaction(function () use ($internshipId) {
            $internship = Internship::findOrFail($internshipId);
            $internship->status = 'validated';
            $internship->save();

            return $internship;
        });
    }

    /**
     * Assign a professor supervisor to an internship.
     */
    public function assignSupervisor(int $internshipId, int $professorId): Internship
    {
        return DB::transaction(function () use ($internshipId, $professorId) {
            $internship = Internship::findOrFail($internshipId);
            $internship->supervisor_id = $professorId;
            $internship->save();

            return $internship;
        });
    }

    /**
     * Get all final projects (PFE) with Eager Loading.
     */
    public function getAllFinalProjects(): Collection
    {
        return FinalProject::with(['student', 'supervisor', 'juryMembers'])
            ->latest()
            ->get();
    }

    /**
     * Update PFE defense date and status.
     */
    public function scheduleDefense(int $projectId, array $data): FinalProject
    {
        return DB::transaction(function () use ($projectId, $data) {
            $project = FinalProject::findOrFail($projectId);
            
            $project->defense_date = $data['defense_date'];
            $project->room_id = $data['room_id'] ?? null;
            $project->status = 'scheduled';
            
            $project->save();

            return $project;
        });
    }
}

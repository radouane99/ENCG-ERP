<?php

namespace App\Services\Academic;

use App\Models\FinalProject;
use App\Models\Internship;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CareerService
{
    /**
     * Récupérer tous les stages.
     */
    public function getAllInternships(): Collection
    {
        return Internship::with(['student.user', 'supervisor.user'])
            ->latest()
            ->get();
    }

    /**
     * Valider une convention de stage.
     */
    public function validateInternship(int $internshipId): Internship
    {
        return DB::transaction(function () use ($internshipId) {
            $internship = Internship::findOrFail($internshipId);
            $internship->update(['status' => 'validated']);

            return $internship;
        });
    }

    /**
     * Assigner un encadrant à un stage.
     */
    public function assignSupervisor(int $internshipId, int $professorId): Internship
    {
        return DB::transaction(function () use ($internshipId, $professorId) {
            $internship = Internship::findOrFail($internshipId);
            $internship->update(['supervisor_id' => $professorId]);

            return $internship;
        });
    }

    /**
     * Récupérer tous les PFE.
     */
    public function getAllFinalProjects(): Collection
    {
        return FinalProject::with(['student', 'supervisor', 'projectDefenses'])
            ->latest()
            ->get();
    }

    /**
     * Planifier une soutenance PFE.
     */
    public function scheduleDefense(int $projectId, array $data): FinalProject
    {
        return DB::transaction(function () use ($projectId, $data) {
            $project = FinalProject::findOrFail($projectId);
            $project->update([
                'defense_date' => $data['defense_date'],
                'room_id' => $data['room_id'] ?? null,
                'status' => 'scheduled',
            ]);

            return $project;
        });
    }
}

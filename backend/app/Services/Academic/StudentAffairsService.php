<?php

namespace App\Services\Academic;

use Illuminate\Support\Facades\DB;
use App\Models\DisciplineCase;
use Illuminate\Database\Eloquent\Collection;

class StudentAffairsService
{
    /**
     * Get all discipline cases with related entities.
     */
    public function getAllDisciplineCases(): Collection
    {
        // We assume DisciplineCase model has relations: student, reportedBy (User/Professor)
        return DisciplineCase::with(['student', 'reportedBy'])
            ->latest()
            ->get();
    }

    /**
     * Store a new discipline incident.
     */
    public function reportIncident(array $data, int $reporterId): DisciplineCase
    {
        return DB::transaction(function () use ($data, $reporterId) {
            return DisciplineCase::create([
                'student_id'   => $data['student_id'],
                'reported_by'  => $reporterId,
                'incident_date'=> $data['incident_date'],
                'type'         => $data['type'], // e.g. cheating, absence, behavior
                'description'  => $data['description'],
                'status'       => 'pending',
                'severity'     => $data['severity'] ?? 'medium'
            ]);
        });
    }

    /**
     * Make a decision on a discipline case (Conseil de discipline).
     */
    public function makeDecision(int $caseId, string $decision, ?string $notes = null): DisciplineCase
    {
        $validDecisions = ['warning', 'blame', 'exclusion', 'dismissed'];

        if (!in_array($decision, $validDecisions)) {
            throw new \InvalidArgumentException("Invalid decision type.");
        }

        return DB::transaction(function () use ($caseId, $decision, $notes) {
            $case = DisciplineCase::findOrFail($caseId);
            $case->status = 'resolved';
            $case->decision = $decision;
            if ($notes) {
                $case->decision_notes = $notes;
            }
            $case->save();

            // Additional logic: If exclusion, update student status
            if ($decision === 'exclusion') {
                $case->student->update(['status' => 'excluded']);
            }

            return $case;
        });
    }
}

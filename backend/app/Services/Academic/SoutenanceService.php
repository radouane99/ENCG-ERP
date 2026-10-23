<?php

namespace App\Services\Academic;

use App\Models\Soutenance;
use Illuminate\Support\Facades\DB;

class SoutenanceService
{
    /**
     * Schedule a new soutenance (jury defense).
     */
    public function schedule(array $data): Soutenance
    {
        // Add logic for schedule conflict using ConflictResolutionService if needed.
        return Soutenance::create([
            'internship_id' => $data['internship_id'],
            'date_time' => $data['date_time'],
            'room_id' => $data['room_id'],
            'president_id' => $data['president_id'],
            'examiner_id' => $data['examiner_id'],
            'status' => 'scheduled',
        ]);
    }

    /**
     * Evaluate the internship (Professor).
     */
    public function evaluate(int $soutenanceId, float $grade, ?string $remarks = null): Soutenance
    {
        return DB::transaction(function () use ($soutenanceId, $grade, $remarks) {
            $soutenance = Soutenance::whereKey($soutenanceId)->lockForUpdate()->firstOrFail();
            abort_unless(auth()->user(), 403);
            \App\Support\InternshipAccess::defense(auth()->user(), $soutenance);
            abort_unless($soutenance->status === 'scheduled', 409, 'Cette soutenance a déjà été traitée ou annulée.');
            abort_if($soutenance->date_time && $soutenance->date_time->isFuture(), 422, 'La soutenance n’a pas encore eu lieu.');
            $soutenance->update([
                'grade' => $grade,
                'remarks' => $remarks,
                'status' => 'completed',
            ]);

            // Also mark internship as completed
            $soutenance->internship()->update(['status' => 'completed']);
            activity()->causedBy(auth()->user())->performedOn($soutenance)->withProperties(['grade' => $grade])->log('defense_evaluated');

            return $soutenance;
        });
    }
}

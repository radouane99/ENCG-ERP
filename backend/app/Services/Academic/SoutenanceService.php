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
        return DB::transaction(function () use ($data) {
            $actor = auth()->user(); abort_unless($actor && \App\Support\InternshipAccess::staff($actor), 403);
            $stage = \App\Models\Internship::whereKey($data['internship_id'])->lockForUpdate()->firstOrFail();
            \App\Support\InternshipAccess::stage($actor, $stage);
            abort_unless(in_array($stage->status->value, ['active', 'validated'], true) && $stage->convention_status === 'active', 422, 'La convention doit être acceptée par l’entreprise avant la soutenance.');
            abort_unless($stage->supervisor_id, 422, 'Affectez un encadrant académique.');
            abort_unless($stage->internshipDocuments()->where('document_type', 'rapport_final')->where('status', 'approved')->exists(), 422, 'Le rapport final doit être déposé et approuvé.');
            $room = \App\Models\Room::where('institution_id', $actor->institution_id)->whereKey($data['room_id'])->lockForUpdate()->firstOrFail();
            abort_if($room->is_out_of_service, 422, 'Salle hors service.');
            $jury = array_unique([$data['president_id'], $data['examiner_id'], $stage->supervisor_id]); sort($jury);
            abort_unless(\App\Models\Professor::where('institution_id', $actor->institution_id)->whereIn('id', $jury)->orderBy('id')->lockForUpdate()->get()->count() === count($jury), 422, 'Jury hors de l’établissement.');
            $start = \Carbon\Carbon::parse($data['date_time']); abort_unless($start->isFuture(), 422, 'Choisissez une date future.');
            abort_if(Soutenance::where('internship_id', $stage->id)->where('status', '!=', 'cancelled')->exists(), 409, 'Une soutenance existe déjà pour ce stage.');
            $busy = Soutenance::where('status', '!=', 'cancelled')->where('date_time', '>', $start->copy()->subMinutes(90))->where('date_time', '<', $start->copy()->addMinutes(90))
                ->where(fn ($q) => $q->where('room_id', $room->id)->orWhereIn('president_id', $jury)->orWhereIn('examiner_id', $jury)->orWhereIn('supervisor_id', $jury))->exists();
            abort_if($busy, 409, 'La salle ou un membre du jury a déjà une soutenance sur ce créneau de 90 minutes.');
            $s = Soutenance::create(['internship_id' => $stage->id, 'date_time' => $start, 'room_id' => $room->id, 'president_id' => $data['president_id'], 'examiner_id' => $data['examiner_id'], 'supervisor_id' => $stage->supervisor_id, 'status' => 'scheduled']);
            activity()->causedBy($actor)->performedOn($s)->log('defense_scheduled'); return $s;
        });
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

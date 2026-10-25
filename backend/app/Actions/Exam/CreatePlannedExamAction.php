<?php

namespace App\Actions\Exam;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\ExamSurveillance;
use App\Models\Group;
use App\Models\Module;
use App\Models\Room;
use App\Models\User;
use App\Services\Academic\ExamSlotCatalog;
use App\Services\Academic\ExamWorkflowGuard;
use App\Services\Academic\TimetableRoomGuard;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreatePlannedExamAction
{
    public function execute(array $data, ?Exam $existing = null): Exam
    {
        $guard = app(ExamWorkflowGuard::class);
        $guard->manage();

        return DB::transaction(function () use ($data, $guard, $existing) {
            $session = ExamSession::whereKey($data['exam_session_id'])->lockForUpdate()->firstOrFail();
            $guard->mutableSession($session);
            if ($existing) {
                $existing = Exam::whereKey($existing->id)->lockForUpdate()->firstOrFail();
                $guard->mutablePlan($existing);
                abort_unless(hash_equals($existing->planningRevision(), $data['planning_revision']), 409, 'Le planning a changé. Rechargez l’épreuve avant de modifier.');
            }
            $module = Module::where('institution_id', $session->institution_id)->findOrFail($data['module_id']);
            $group = Group::where('academic_year_id', $session->academic_year_id)->where('filiere_id', $module->filiere_id)->where('semester_number', $module->semester_number)->findOrFail($data['group_id']);
            $date = Carbon::parse($data['exam_date'])->toDateString();
            if ($date < $session->start_date->toDateString() || $date > $session->end_date->toDateString()) {
                throw ValidationException::withMessages(['exam_date' => 'La date doit appartenir à la période de la session.']);
            }
            $slot = ExamSlotCatalog::normalizeForStorage($data['start_time']);
            $room = Room::where('institution_id', $session->institution_id)->whereKey($data['room_id'])->lockForUpdate()->firstOrFail();
            abort_if(! $room->is_available, 422, 'Salle indisponible.');
            $start = Carbon::parse($date.' '.$slot['start_time']);
            $end = $start->copy()->addMinutes($slot['duration_minutes']);
            abort_if(app(TimetableRoomGuard::class)->isRoomBusyAt((string) $room->id, $start, $end), 409, 'Salle occupée par un cours ou une réservation approuvée.');
            $conflict = Exam::whereDate('exam_date', $date)
                ->when($existing, fn ($q) => $q->whereKeyNot($existing->id))
                ->where(fn ($q) => $q->where('room_id', $room->id)->orWhere('group_id', $group->id)->orWhereHas('seatings', fn ($q) => $q->where('room_id', $room->id)))
                ->get()->contains(function ($exam) use ($date, $start, $end) {
                    $other = Carbon::parse($date.' '.$exam->start_time);

                    return $start->lt($other->copy()->addMinutes($exam->duration_minutes)) && $end->gt($other);
                });
            abort_if($conflict, 409, 'Chevauchement de salle ou de groupe avec une autre épreuve.');
            $attributes = [
                'exam_session_id' => $session->id, 'module_id' => $module->id,
                'group_id' => $group->id, 'room_id' => $room->id,
                'exam_date' => $date, 'start_time' => $slot['start_time'],
                'duration_minutes' => $slot['duration_minutes'], 'type' => $existing?->type ?? 'written',
            ];
            if ($existing) {
                $proctors = $existing->surveillances()->pluck('professor_id');
                $proposed = clone $existing;
                $proposed->fill($attributes);
                foreach (User::whereIn('id', $proctors)->get() as $proctor) {
                    abort_unless($guard->allowsProctor($proctor, $proposed), 409, 'Un surveillant est indisponible sur le nouveau créneau.');
                }
                $students = $existing->seatings()->pluck('student_id');
                foreach (Exam::whereDate('exam_date', $date)->whereKeyNot($existing->id)->whereHas('seatings', fn ($q) => $q->whereIn('student_id', $students))->get() as $other) {
                    $otherStart = Carbon::parse($date.' '.$other->start_time);
                    abort_if($start->lt($otherStart->copy()->addMinutes($other->duration_minutes)) && $end->gt($otherStart), 409, 'Un candidat est déjà convoqué à une autre épreuve sur ce créneau.');
                }
                foreach (ExamSurveillance::with('exam')->whereIn('professor_id', $proctors)->where('exam_id', '!=', $existing->id)->whereHas('exam', fn ($q) => $q->whereDate('exam_date', $date))->get() as $other) {
                    $otherStart = Carbon::parse($date.' '.$other->exam->start_time);
                    abort_if($start->lt($otherStart->copy()->addMinutes($other->exam->duration_minutes)) && $end->gt($otherStart), 409, 'Un surveillant est déjà affecté à une autre épreuve sur ce créneau.');
                }
                if ((int) $existing->room_id !== (int) $room->id) {
                    abort_if($existing->seatings()->where('room_id', '!=', $existing->room_id)->exists(), 422, 'Épreuve répartie sur plusieurs salles : revoir le placement avant de déplacer la salle principale.');
                    abort_if($existing->seatings()->count() > ($room->exam_capacity ?? floor($room->capacity / 2)), 422, 'Capacité d’examen insuffisante.');
                    $existing->seatings()->update(['room_id' => $room->id]);
                    $existing->surveillances()->update(['room_id' => $room->id]);
                }
                $existing->update($attributes);
                activity()->causedBy(auth()->user())->performedOn($existing)->log('exam_planning_updated');

                return $existing;
            }

            return Exam::create($attributes);
        });
    }
}

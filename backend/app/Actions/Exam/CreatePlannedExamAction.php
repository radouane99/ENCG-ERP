<?php

namespace App\Actions\Exam;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Group;
use App\Models\Module;
use App\Models\Room;
use App\Services\Academic\ExamSlotCatalog;
use App\Services\Academic\ExamWorkflowGuard;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreatePlannedExamAction
{
    public function execute(array $data): Exam
    {
        $guard = app(ExamWorkflowGuard::class);
        $guard->manage();
        return DB::transaction(function () use ($data, $guard) {
            $session = ExamSession::whereKey($data['exam_session_id'])->lockForUpdate()->firstOrFail();
            $guard->mutableSession($session);
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
            abort_if(app(\App\Services\Academic\TimetableRoomGuard::class)->isRoomBusyAt((string) $room->id, $start, $end), 409, 'Salle occupée par un cours ou une réservation approuvée.');
            $conflict = Exam::whereDate('exam_date', $date)
                ->where(fn ($q) => $q->where('room_id', $room->id)->orWhere('group_id', $group->id)->orWhereHas('seatings', fn ($q) => $q->where('room_id', $room->id)))
                ->get()->contains(function ($exam) use ($date, $start, $end) {
                    $other = Carbon::parse($date.' '.$exam->start_time);
                    return $start->lt($other->copy()->addMinutes($exam->duration_minutes)) && $end->gt($other);
                });
            abort_if($conflict, 409, 'Chevauchement de salle ou de groupe avec une autre épreuve.');
            return Exam::create([
                'exam_session_id' => $session->id, 'module_id' => $module->id,
                'group_id' => $group->id, 'room_id' => $room->id,
                'exam_date' => $date, 'start_time' => $slot['start_time'],
                'duration_minutes' => $slot['duration_minutes'], 'type' => 'written',
            ]);
        });
    }
}

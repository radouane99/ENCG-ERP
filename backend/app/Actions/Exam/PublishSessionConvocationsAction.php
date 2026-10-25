<?php

namespace App\Actions\Exam;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Room;
use App\Services\Academic\ExamSchedulingService;
use App\Services\Academic\ExamWorkflowGuard;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class PublishSessionConvocationsAction
{
    public function execute(int $id): int
    {
        $guard = app(ExamWorkflowGuard::class);
        $guard->manage();

        return DB::transaction(function () use ($id, $guard) {
            $session = ExamSession::whereKey($id)->lockForUpdate()->firstOrFail();
            $guard->mutableSession($session);
            abort_unless($session->is_active, 422, 'Ouvrir la session avant de diffuser les convocations.');
            $exams = $session->exams()->with('seatings', 'surveillances')->orderBy('id')->lockForUpdate()->get();
            abort_if($exams->isEmpty(), 422, 'Aucune épreuve à diffuser.');
            foreach ($exams as $exam) {
                abort_if($exam->seatings->isEmpty(), 422, 'Placement incomplet pour une épreuve.');
                foreach ($exam->seatings->groupBy('room_id') as $roomId => $seats) {
                    $room = Room::where('institution_id', $session->institution_id)->findOrFail($roomId);
                    abort_if(! $room->is_available || $seats->count() > ($room->exam_capacity ?? floor($room->capacity / 2)), 422, 'Salle indisponible ou capacité insuffisante.');
                    abort_if($seats->contains(fn ($seat) => ! $seat->qr_token), 422, 'Générer tous les QR avant diffusion.');
                    abort_unless($exam->surveillances->contains('room_id', $roomId), 422, 'Une salle ne dispose d’aucun surveillant.');
                }
                $start = Carbon::parse($exam->exam_date->toDateString().' '.$exam->start_time);
                $end = $start->copy()->addMinutes($exam->duration_minutes);
                foreach (Exam::with('seatings', 'surveillances')->whereDate('exam_date', $exam->exam_date)->whereKeyNot($exam->id)->get() as $other) {
                    $otherStart = Carbon::parse($other->exam_date->toDateString().' '.$other->start_time);
                    if ($start->gte($otherStart->copy()->addMinutes($other->duration_minutes)) || $end->lte($otherStart)) {
                        continue;
                    }
                    abort_if($exam->seatings->pluck('room_id')->intersect($other->seatings->pluck('room_id')->push($other->room_id))->isNotEmpty()
                        || $exam->seatings->pluck('student_id')->intersect($other->seatings->pluck('student_id'))->isNotEmpty()
                        || $exam->surveillances->pluck('professor_id')->intersect($other->surveillances->pluck('professor_id'))->isNotEmpty(), 422, 'Conflit de salle, de candidat ou de surveillant : publication refusée.');
                }
            }
            $count = 0;
            foreach ($exams as $exam) {
                $count += app(ExamSchedulingService::class)->publishConvocations($exam->id);
            }

            return $count;
        });
    }
}

<?php

namespace App\Actions\Exam;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Student;
use App\Models\User;
use App\Notifications\SystemNotification;
use App\Services\Academic\ExamSchedulingService;
use App\Services\Academic\ExamWorkflowGuard;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReschedulePublishedExamAction
{
    public function execute(Exam $exam, array $data): Exam
    {
        $guard = app(ExamWorkflowGuard::class);
        $guard->manage();

        return DB::transaction(function () use ($exam, $data, $guard) {
            $session = ExamSession::whereKey($exam->exam_session_id)->lockForUpdate()->firstOrFail();
            $guard->mutableSession($session);
            $exam = Exam::whereKey($exam->id)->lockForUpdate()->firstOrFail();
            abort_unless(hash_equals($exam->planningRevision(), $data['planning_revision']), 409, 'Le dossier a changé. Rechargez avant de reprogrammer.');
            abort_unless($session->is_active, 409, 'La session doit être ouverte.');
            abort_if($exam->is_locked || $exam->grades_published || $exam->incidents()->exists(), 409, 'Épreuve clôturée ou avec incident : reprogrammation interdite.');
            abort_if(Carbon::parse($exam->exam_date->toDateString().' '.$exam->start_time)->lte(now()), 409, 'Une épreuve commencée ne peut plus être reprogrammée.');
            abort_if(Carbon::parse($data['exam_date'].' '.$data['start_time'])->lte(now()), 422, 'Le nouveau créneau doit être futur.');
            abort_if($exam->exam_date->toDateString() === Carbon::parse($data['exam_date'])->toDateString()
                && substr($exam->start_time, 0, 5) === $data['start_time']
                && (int) $exam->room_id === (int) $data['room_id'], 422, 'Modifier la date, le créneau ou la salle avant de réémettre.');
            $seats = $exam->seatings()->lockForUpdate()->get();
            $proctors = $exam->surveillances()->lockForUpdate()->get();
            abort_if($seats->isEmpty() || $proctors->isEmpty(), 422, 'Compléter le placement et la surveillance.');
            abort_if($seats->contains(fn ($s) => $s->is_present !== null || in_array($s->status, ['present', 'absent', 'late'], true)) || $proctors->contains(fn ($p) => $p->signed_at !== null), 409, 'Un pointage ou visa existe : reprogrammation interdite.');
            abort_unless($seats->contains(fn ($s) => $s->sent_at || $s->status === 'sent') || $exam->convocations()->where('status', '!=', 'draft')->exists(), 422, 'Utiliser la modification ordinaire pour un brouillon.');
            $before = $exam->only(['exam_date', 'start_time', 'room_id', 'duration_minutes']);
            $legacyBefore = $exam->convocations()->lockForUpdate()->get()->toArray();
            $exam->seatings()->update(['status' => 'draft', 'sent_at' => null]);
            $exam->convocations()->update(['status' => 'draft']);
            $exam->surveillances()->update(['sent_at' => null, 'confirmed_at' => null]);
            $data['planning_revision'] = $exam->fresh()->planningRevision();
            $exam = app(CreatePlannedExamAction::class)->execute($data + $exam->only(['exam_session_id', 'module_id', 'group_id']), $exam);
            foreach ($exam->seatings()->get() as $seat) {
                $seat->update(['qr_token' => (string) Str::uuid()]);
                $exam->convocations()->where('student_id', $seat->student?->user_id)->update(['reference' => $seat->qr_token, 'room_id' => $seat->room_id, 'seat_number' => $seat->seat_number]);
            }
            foreach ($exam->surveillances()->get() as $proctor) {
                $proctor->update(['qr_token' => (string) Str::uuid()]);
            }
            app(ExamSchedulingService::class)->publishConvocations($exam->id);
            $message = 'Épreuve reprogrammée au '.Carbon::parse($exam->exam_date)->format('d/m/Y').' à '.$exam->start_time.'. Téléchargez votre nouvelle convocation; l’ancien QR est invalidé.';
            $studentUsers = Student::whereIn('id', $seats->pluck('student_id'))->pluck('user_id');
            foreach (User::whereIn('id', $studentUsers->merge($proctors->pluck('professor_id'))->unique())->get() as $user) {
                $user->notify(new SystemNotification('Modification du planning des examens', $message, 'warning', '/dashboard'));
            }
            activity()->causedBy(auth()->user())->performedOn($exam)->withProperties(['before' => $before, 'after' => $exam->only(array_keys($before)), 'reason' => $data['reason'], 'previous_seatings' => $seats->toArray(), 'previous_surveillances' => $proctors->toArray(), 'previous_convocations' => $legacyBefore])->log('exam_reprogrammed_and_reissued');

            return $exam->fresh();
        });
    }
}

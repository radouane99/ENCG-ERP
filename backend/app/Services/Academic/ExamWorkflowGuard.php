<?php

namespace App\Services\Academic;

use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\ExamSurveillance;
use App\Models\User;

/** Shared invariants for the legacy and current exam HTTP entry points. */
class ExamWorkflowGuard
{
    public function manage(?User $user = null): void
    {
        $user ??= auth()->user();
        abort_unless($user && $user->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director', 'department-head', 'filiere-head', 'scolarite']), 403, 'Gestion des examens réservée à la scolarité.');
    }

    public function session(ExamSession $session): void
    {
        if (auth()->check()) {
            abort_unless((int) $session->institution_id === (int) auth()->user()->institution_id, 404);
        }
    }

    public function mutableSession(ExamSession $session): void
    {
        $this->session($session);
        abort_if($session->is_locked, 409, 'Session verrouillée : modification interdite.');
    }

    public function viewExam(Exam $exam): void
    {
        $this->session($exam->examSession()->firstOrFail());
        $user = auth()->user();
        abort_unless($user && ($user->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director', 'department-head', 'filiere-head', 'scolarite', 'discipline-committee']) || $exam->surveillances()->where('professor_id', $user->id)->exists()), 403);
    }

    public function mutablePlan(Exam $exam): void
    {
        $this->mutableSession($exam->examSession()->firstOrFail());
        abort_if($exam->is_locked || $exam->grades_published, 409, 'Examen verrouillé ou résultats publiés.');
        abort_if($exam->seatings()->where(fn ($q) => $q->whereNotNull('sent_at')->orWhereIn('status', ['sent', 'present', 'absent', 'late'])->orWhere('is_present', true))->exists()
            || $exam->convocations()->where('status', '!=', 'draft')->exists()
            || $exam->surveillances()->where(fn ($q) => $q->whereNotNull('signed_at')->orWhereNotNull('confirmed_at')->orWhereNotNull('sent_at'))->exists()
            || $exam->incidents()->exists(), 409, 'Épreuve déjà diffusée, confirmée ou émargée : conserver les convocations et le PV.');
    }

    public function attendance(Exam $exam, ?int $roomId = null): void
    {
        $this->mutableSession($exam->examSession()->firstOrFail());
        abort_if($exam->is_locked, 409, 'PV verrouillé : émargement interdit.');
        $user = auth()->user();
        $rows = ExamSurveillance::where('exam_id', $exam->id)->when($roomId, fn ($q) => $q->where('room_id', $roomId))->get();
        $admin = $user && $user->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director', 'scolarite']);
        abort_unless($admin || ($user && $rows->contains('professor_id', $user->id)), 403, 'Aucune surveillance affectée pour cette salle.');
        abort_if($rows->contains(fn ($row) => $row->signed_at !== null), 409, 'PV visé : une réouverture est requise.');
    }

    public function allowsProctor(User $user, Exam $exam, ?array $availability = null): bool
    {
        $profile = $user->professor?->id;
        if (! $profile) { return true; }
        $start = \Carbon\Carbon::parse($exam->exam_date->toDateString().' '.$exam->start_time);
        $end = $start->copy()->addMinutes($exam->duration_minutes);
        return ProfessorAvailabilityService::allows($availability ?? ProfessorAvailabilityService::map($exam->examSession->academic_year_id), $profile, $start->dayOfWeekIso, $start->format('H:i:s'), $end->format('H:i:s'));
    }

    public function eligibleCandidates(ExamSession $session, int $moduleId, \Illuminate\Support\Collection $studentIds): \Illuminate\Support\Collection
    {
        if (! in_array(strtolower($session->type), ['rattrapage', 'resit'], true)) { return $studentIds; }
        return \App\Models\ResitEligibility::where('module_id', $moduleId)->where('is_eligible', true)->whereIn('student_id', $studentIds)
            ->where('academic_year_id', $session->academic_year_id)
            ->distinct()->pluck('student_id');
    }
}

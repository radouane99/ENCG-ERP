<?php

namespace App\Services\Security;

use App\Models\{AcademicYear, Grade, GradeRectification, Group, User};
use App\Services\Academic\{AcademicContext, ClassroomRosterService, GradeService};
use Illuminate\Support\Facades\{Cache, DB};
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class GradeRectificationService
{
    private function authorizeGrade(User $user, Grade $grade): ?Group
    {
        $assessment = $grade->assessment()->withoutGlobalScopes()->firstOrFail();
        $module = $assessment->module;
        abort_unless((int) $module->institution_id === (int) $user->institution_id
            && (int) $grade->student->institution_id === (int) $user->institution_id, 403);
        abort_unless((int) $assessment->academic_year_id === (int) AcademicContext::yearId(), 409, 'Note hors de l’année académique active.');
        $access = app(ClassroomAccessService::class);
        $access->authorize($user, $module, write: true);
        foreach (Group::where('filiere_id', $module->filiere_id)->where('academic_year_id', $assessment->academic_year_id)->where('semester_number', $module->semester_number)->get() as $group) {
            if (! app(ClassroomRosterService::class)->students($group, $user->institution_id)->whereKey($grade->student_id)->exists()) continue;
            try {
                $access->authorize($user, $module, $group, write: true);
                return $group;
            } catch (HttpExceptionInterface $exception) {
                if ($exception->getStatusCode() !== 403) throw $exception;
            }
        }
        abort_unless($user->hasAnyRole(['super-admin', 'institution-admin', 'admin', 'director', 'scolarite']), 403, 'Étudiant hors des groupes affectés.');
        return null;
    }

    public function request(User $user, int $gradeId, float $proposed, string $reason): array
    {
        return DB::transaction(function () use ($user, $gradeId, $proposed, $reason) {
            $grade = Grade::withoutGlobalScopes()->whereKey($gradeId)->lockForUpdate()->firstOrFail();
            $group = $this->authorizeGrade($user, $grade);
            abort_unless(is_finite($proposed) && $proposed >= 0 && $proposed <= 20, 422);
            $reference = 'RECT-ENCG-'.$grade->id.'-'.strtoupper(bin2hex(random_bytes(8)));
            $payload = ['id' => $reference, 'grade_id' => $grade->id, 'student_id' => $grade->student_id,
                'assessment_id' => $grade->assessment_id, 'group_id' => $group?->id,
                'old_value' => (float) $grade->value, 'proposed_value' => round($proposed, 2),
                'justification' => $reason, 'requested_by_user_id' => $user->id,
                'requested_by_name' => $user->name, 'status' => 'pending_second_approver',
                'director_signature_hmac' => null, 'approved_by_user_id' => null, 'created_at' => now()->toIso8601String()];
            $payload['professor_signature_hmac'] = 'SIG-PROF-'.strtoupper(substr(hash_hmac('sha256', json_encode($payload, JSON_THROW_ON_ERROR), config('app.key')), 0, 16));
            GradeRectification::create(['reference' => $reference, 'institution_id' => $user->institution_id,
                'academic_year_id' => $grade->assessment()->withoutGlobalScopes()->value('academic_year_id'),
                'grade_id' => $grade->id, 'grade_version' => $grade->version, 'requested_by_user_id' => $user->id,
                'status' => 'pending_second_approver', 'payload' => $payload]);
            activity()->causedBy($user)->performedOn($grade)->withProperties(['reference' => $reference])->log('grade_rectification_requested');
            return $payload;
        });
    }

    public function approve(User $user, string $reference): array
    {
        abort_unless($user->hasAnyRole(['super-admin', 'institution-admin', 'director', 'scolarite-admin']), 403);
        return DB::transaction(function () use ($user, $reference) {
            $record = GradeRectification::where('reference', $reference)->where('institution_id', $user->institution_id)->lockForUpdate()->firstOrFail();
            abort_unless($record->status === 'pending_second_approver', 409, 'Demande déjà traitée.');
            abort_if((int) $record->requested_by_user_id === (int) $user->id, 403, 'Le demandeur ne peut pas approuver sa propre rectification.');
            $grade = Grade::withoutGlobalScopes()->whereKey($record->grade_id)->lockForUpdate()->firstOrFail();
            $requester = User::findOrFail($record->requested_by_user_id);
            $this->authorizeGrade($requester, $grade);
            $group = $this->authorizeGrade($user, $grade);
            abort_if(AcademicYear::whereKey($record->academic_year_id)->value('is_locked'), 409, 'Année verrouillée.');
            abort_unless((int) $grade->version === (int) $record->grade_version
                && abs((float) $grade->value - (float) $record->payload['old_value']) < 0.005, 409, 'La note a changé depuis la demande.');
            $assessment = $grade->assessment()->withoutGlobalScopes()->firstOrFail();
            $grades = app(GradeService::class);
            abort_if($grades->isPvSigned($assessment->module_id, null, $group?->id), 409, 'Réouvrez le PV signé avant de rectifier la note.');
            abort_if($grades->isExamLocked($assessment), 409, 'Épreuve verrouillée.');
            $grade->update(['value' => $record->payload['proposed_value']]);
            $payload = $record->payload;
            $payload['status'] = 'approved_and_sealed';
            $payload['approved_by_user_id'] = $user->id;
            $payload['approved_by_name'] = $user->name;
            $payload['approved_at'] = now()->toIso8601String();
            $payload['director_signature_hmac'] = 'SIG-DIR-'.strtoupper(substr(hash_hmac('sha256', $reference.'|'.$payload['professor_signature_hmac'].'|'.$user->id.'|'.$payload['approved_at'], config('app.key')), 0, 16));
            $record->update(['status' => 'approved_and_sealed', 'approved_by_user_id' => $user->id, 'approved_at' => now(), 'payload' => $payload]);
            $seal = app(CryptoLedgerService::class)->sealGradeLedger($user->institution_id, $user->id);
            activity()->causedBy($user)->performedOn($grade)->withProperties(['reference' => $reference])->log('grade_rectification_approved');
            return ['rectification' => $payload, 'ledger_seal' => $seal];
        });
    }

    public function importLegacy(): int
    {
        $count = 0;
        foreach ((array) Cache::get('encg_four_eyes_grade_rectifications', []) as $entry) {
            if (! is_array($entry) || empty($entry['id']) || GradeRectification::where('reference', $entry['id'])->exists()) continue;
            $grade = Grade::withoutGlobalScopes()->find($entry['grade_id'] ?? null);
            $assessment = $grade?->assessment()->withoutGlobalScopes()->first();
            if (! $grade || ! $assessment || ! User::find($entry['requested_by_user_id'] ?? null)) continue;
            GradeRectification::firstOrCreate(['reference' => $entry['id']], ['institution_id' => $assessment->module->institution_id,
                'academic_year_id' => $assessment->academic_year_id, 'grade_id' => $grade->id, 'grade_version' => $grade->version,
                'requested_by_user_id' => $entry['requested_by_user_id'], 'approved_by_user_id' => User::find($entry['approved_by_user_id'] ?? null)?->id,
                'status' => $entry['status'] ?? 'pending_second_approver', 'approved_at' => $entry['approved_at'] ?? null, 'payload' => $entry]);
            $count++;
        }
        return $count;
    }
}

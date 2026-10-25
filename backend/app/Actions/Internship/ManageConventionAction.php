<?php

namespace App\Actions\Internship;

use App\Models\AcademicYear;
use App\Models\Internship;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ManageConventionAction
{
    public function create(Student $student, array $data): Internship
    {
        return DB::transaction(function () use ($student, $data) {
            Student::whereKey($student->id)->lockForUpdate()->firstOrFail();
            $year = AcademicYear::where('institution_id', $student->institution_id)->where('is_current', true)->firstOrFail();
            $attributes = Arr::only($data, ['type', 'company_name', 'company_address', 'company_city', 'supervisor_name', 'supervisor_email', 'supervisor_phone', 'position_title', 'start_date', 'end_date', 'company_mentor_name', 'company_mentor_title', 'monthly_allowance', 'insurance_company', 'insurance_policy_number']);

            return Internship::create(array_merge($attributes, ['student_id' => $student->id, 'academic_year_id' => $year->id,
                'supervisor_name' => $data['supervisor_name'] ?? $data['company_mentor_name'] ?? null,
                'insurance_verified' => false, 'convention_ref' => 'CONV-'.Str::uuid(), 'convention_status' => 'pending', 'status' => 'pending']));
        });
    }

    public function approve(User $actor, int $id, array $data): array
    {
        abort_unless($actor->hasAnyRole(['super-admin', 'institution-admin', 'director', 'admin']), 403);

        return DB::transaction(function () use ($actor, $id, $data) {
            $stage = Internship::whereKey($id)->lockForUpdate()->firstOrFail();
            abort_unless((int) $stage->student->institution_id === (int) $actor->institution_id, 404);
            abort_unless($stage->status->value === 'pending' && in_array($stage->convention_status, ['pending', null], true), 409, 'Convention déjà traitée ou annulée.');
            $token = Str::random(64);
            $stage->fill(['insurance_policy_number' => $data['insurance_policy_number'], 'insurance_company' => $data['insurance_company'],
                'insurance_verified' => true, 'insurance_verified_by' => $actor->id, 'school_signed_by' => $actor->id, 'school_signed_at' => now(), 'convention_status' => 'school_signed',
                'company_token_hash' => hash('sha256', $token), 'company_token_expires_at' => now()->addDays(7)])->save();
            activity()->causedBy($actor)->performedOn($stage)->withProperties(['reason' => $data['reason']])->log('internship_convention_approved');

            return ['stage' => $stage, 'company_link' => rtrim(config('app.frontend_url'), '/').'/conventions/sign/'.$token];
        });
    }

    public function resolveToken(string $token, bool $lock = false): Internship
    {
        $q = Internship::where(fn ($q) => $q->where('company_token_hash', hash('sha256', $token))->orWhere('security_token', $token));
        if ($lock) {
            $q->lockForUpdate();
        }
        $stage = $q->firstOrFail();
        abort_unless($stage->company_token_hash && $stage->company_token_expires_at && now()->lessThan(Carbon::parse($stage->company_token_expires_at))
            && $stage->status->value !== 'cancelled' && $stage->convention_status === 'school_signed' && $stage->school_signed_by && $stage->insurance_verified_by && ! $stage->company_signed_at, 422, 'Lien expiré, annulé ou déjà utilisé.');

        return $stage;
    }

    public function sign(string $token, array $data): Internship
    {
        return DB::transaction(function () use ($token, $data) {
            $stage = $this->resolveToken($token, true);
            abort_unless(strtolower(trim($stage->supervisor_email)) === strtolower(trim($data['email'])), 422, 'Le contact ne correspond pas au destinataire de la convention.');
            $stage->fill(['company_signer_name' => $data['name'], 'company_signer_email' => $data['email'], 'company_signed_at' => now(), 'convention_status' => 'active', 'status' => 'active'])->save();
            activity()->performedOn($stage)->withProperties(['company_acceptance' => true])->log('company_convention_accepted');

            return $stage;
        });
    }
}

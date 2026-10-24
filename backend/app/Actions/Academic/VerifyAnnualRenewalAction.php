<?php

namespace App\Actions\Academic;

use App\Models\Student;
use App\Models\StudentRegistration;
use App\Support\AdmissionAccess;
use Illuminate\Support\Facades\DB;

final class VerifyAnnualRenewalAction
{
    public const CHECKLIST = ['identity_verified' => 'Identité et numéro étudiant rapprochés', 'academic_decision_verified' => 'Décision académique annuelle vérifiée', 'annual_file_received' => 'Pièces requises du dossier annuel contrôlées'];

    public function execute(Student $student, array $data): object
    {
        abort_unless(AdmissionAccess::staff(auth()->user()) && (int) $student->institution_id === (int) auth()->user()->institution_id, 403);

        return DB::transaction(function () use ($student, $data) {
            $student = Student::whereKey($student->id)->lockForUpdate()->firstOrFail();
            abort_if($student->status === 'graduated', 422, 'Cursus clôturé : le dossier est suivi parmi les lauréats.');
            $context = app(ConfirmStudentRenewalAction::class);
            $year = $context->year($student);
            abort_if($year->is_locked, 422, 'Année verrouillée.');
            $receipt = DB::table('student_renewals')->where('student_id', $student->id)->where('academic_year_id', $year->id)->lockForUpdate()->first();
            abort_unless($receipt, 422, 'Le retour de confirmation de l’étudiant est requis avant le contrôle administratif.');
            abort_if($student->graduations()->where('filiere_id', $receipt->filiere_id)->exists(), 422, 'Ce cursus est déjà clôturé dans le registre des lauréats.');
            if ($receipt->physical_verified_at) {
                return $receipt;
            }
            foreach (self::CHECKLIST as $key => $label) {
                validator($data, ['checklist.'.$key => 'required|accepted'])->validate();
            }
            $rows = StudentRegistration::where('student_id', $student->id)->where('academic_year_id', $year->id)->where('registration_type', 're_enrollment')->whereIn('status', ['academic_validated', 'admin_validated'])->lockForUpdate()->get();
            abort_unless($rows->count() === 1, 409, 'Inscription annuelle ambiguë : rapprochez le dossier avant validation.');
            $registration = $rows->first();
            abort_unless($context->eligibleRegistration($student, $year->id)?->id === $registration->id, 409, 'Le niveau ou le cursus annuel nécessite un rapprochement.');
            abort_unless((int) $registration->semester_number === (int) $receipt->target_semester && (int) $registration->filiere_id === (int) $receipt->filiere_id, 409, 'Confirmation et décision académique incohérentes.');
            if ($registration->filiere->requiresTuitionPayment()) {
                $invoice = DB::table('tuition_invoices')->where('student_id', $student->id)->where('academic_year_id', $year->id)->where('filiere_id', $registration->filiere_id)->lockForUpdate()->first();
                abort_unless($invoice && $invoice->status === 'paid' && (float) $invoice->paid_amount >= (float) $invoice->amount, 402, 'La régularisation du cursus payant reste requise.');
            }
            $registration->update(['status' => 'admin_validated', 'admin_validated_at' => now()]);
            DB::table('student_renewals')->where('id', $receipt->id)->update(['physical_verified_at' => now(), 'physical_verified_by' => auth()->id(), 'physical_checklist' => json_encode($data['checklist']), 'physical_observation' => $data['observation'] ?? null, 'updated_at' => now()]);
            activity()->causedBy(auth()->user())->performedOn($student)->withProperties(['renewal_id' => $receipt->id, 'checklist' => $data['checklist']])->log('annual_renewal_physically_verified');

            return DB::table('student_renewals')->find($receipt->id);
        });
    }
}

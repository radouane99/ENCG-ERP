<?php
namespace App\Actions\Academic;

use App\Models\{AcademicYear, Filiere, Student, StudentPathway, StudentRegistration};
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ConfirmStudentRenewalAction
{
    public function year(Student $student): AcademicYear { return AcademicYear::where('institution_id', $student->institution_id)->where('is_current', true)->firstOrFail(); }
    public function eligibleRegistration(Student $student, int $year)
    {
        return StudentRegistration::where('student_id', $student->id)->where('academic_year_id', $year)->where('registration_type', 're_enrollment')
            ->whereIn('status', ['academic_validated', 'admin_validated'])->orderBy('semester_number')->first();
    }
    public function execute(Student $student, array $data): object
    {
        return DB::transaction(function () use ($student, $data) {
            $student = Student::whereKey($student->id)->lockForUpdate()->firstOrFail();
            $year = $this->year($student);
            $existing = DB::table('student_renewals')->where('student_id', $student->id)->where('academic_year_id', $year->id)->first();
            if ($existing) return $existing;
            abort_if($year->is_locked, 422, 'Année universitaire verrouillée.');
            $registration = $this->eligibleRegistration($student, $year->id);
            $filiere = $registration ? Filiere::whereKey($registration->filiere_id)->where('institution_id', $student->institution_id)->firstOrFail() : null;
            // Payment is checked from a server-verified invoice, never a browser-provided status.
            $requestedFiliere = $filiere ?? Filiere::whereKey($data['filiere_id'] ?? $student->latestPathway?->filiere_id)->where('institution_id', $student->institution_id)->first();
            if ($requestedFiliere?->requiresTuitionPayment()) {
                $invoice = DB::table('tuition_invoices')->where('student_id', $student->id)->where('academic_year_id', $year->id)->where('filiere_id', $requestedFiliere->id)->lockForUpdate()->first();
                abort_unless($invoice && $invoice->status === 'paid' && (float) $invoice->amount > 0 && (float) $invoice->paid_amount >= (float) $invoice->amount, 402, 'Un paiement vérifié par la régie est requis.');
            }
            abort_unless($registration && $filiere, 422, 'La décision académique annuelle doit être validée par l’administration avant confirmation.');
            abort_if(isset($data['filiere_id']) && (int) $data['filiere_id'] !== (int) $filiere->id, 422, 'La filière doit correspondre à la décision académique.');
            $source = $student->pathways()->where('is_current', true)->first();
            $target = $student->pathways()->where('academic_year_id', $year->id)->first();
            if ($target) abort_unless((int) $target->current_semester === (int) $registration->semester_number && (int) $target->filiere_id === (int) $registration->filiere_id, 409, 'Parcours et inscription annuelle incohérents : rapprochez le dossier.');
            $student->pathways()->where('is_current', true)->update(['is_current' => false]);
            $target ??= new StudentPathway(['student_id' => $student->id, 'academic_year_id' => $year->id]);
            $target->fill(['filiere_id' => $registration->filiere_id, 'group_id' => $registration->group_id, 'current_semester' => $registration->semester_number, 'is_current' => true])->save();
            $student->user->update(['phone' => $data['phone'], 'address' => $data['address'], 'city' => $data['city']]);
            $student->update(['status' => 'active']);
            $registration->update(['status' => 'admin_validated', 'payment_status' => $filiere->requiresTuitionPayment() ? 'paid' : 'not_applicable', 'admin_validated_at' => now()]);
            $id = DB::table('student_renewals')->insertGetId(['student_id' => $student->id, 'academic_year_id' => $year->id, 'source_pathway_id' => $source?->id,
                'filiere_id' => $filiere->id, 'target_semester' => $registration->semester_number, 'receipt_reference' => 'REC-'.Str::uuid(), 'confirmed_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
            activity()->causedBy(auth()->user())->performedOn($student)->withProperties(['academic_year_id' => $year->id, 'registration_id' => $registration->id])->log('student_renewal_confirmed');
            return DB::table('student_renewals')->find($id);
        });
    }
}

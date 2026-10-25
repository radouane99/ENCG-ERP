<?php

namespace App\Actions\Finance;

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ManageTuitionInvoiceAction
{
    public function authorize(User $actor): void
    {
        abort_unless($actor->hasAnyRole(['super-admin', 'admin', 'institution-admin', 'director', 'finance-officer']) || $actor->can('finance.manage'), 403);
    }

    public function create(User $actor, array $data): object
    {
        $this->authorize($actor);

        return DB::transaction(function () use ($actor, $data) {
            $student = Student::where('institution_id', $actor->institution_id)->whereKey($data['student_id'])->lockForUpdate()->firstOrFail();
            AcademicYear::where('institution_id', $actor->institution_id)->findOrFail($data['academic_year_id']);
            $filiere = Filiere::where('institution_id', $actor->institution_id)->findOrFail($data['filiere_id']);
            abort_unless($filiere->requiresTuitionPayment(), 422, 'Cette formation est gratuite : aucune facturation de scolarité n’est autorisée.');
            abort_unless($student->registrations()->where('academic_year_id', $data['academic_year_id'])->where('filiere_id', $filiere->id)->exists()
                || $student->pathways()->where('academic_year_id', $data['academic_year_id'])->where('filiere_id', $filiere->id)->exists(), 422, 'Aucune inscription correspondante à facturer.');
            abort_if(DB::table('tuition_invoices')->where('student_id', $student->id)->where('academic_year_id', $data['academic_year_id'])->where('filiere_id', $filiere->id)->exists(), 409, 'La facture de ce cursus et de cette année existe déjà.');
            $id = DB::table('tuition_invoices')->insertGetId($data + ['reference' => 'FACT-'.Str::uuid(), 'created_by' => $actor->id, 'created_at' => now(), 'updated_at' => now()]);
            activity()->causedBy($actor)->performedOn($student)->withProperties(['invoice_id' => $id])->log('tuition_invoice_created');

            return DB::table('tuition_invoices')->find($id);
        });
    }

    public function confirm(User $actor, int $id, array $data): object
    {
        $this->authorize($actor);

        return DB::transaction(function () use ($actor, $id, $data) {
            $invoice = DB::table('tuition_invoices')->where('id', $id)->whereIn('student_id', Student::where('institution_id', $actor->institution_id)->select('id'))->lockForUpdate()->first();
            abort_unless($invoice, 404);
            $filiere = Filiere::where('institution_id', $actor->institution_id)->findOrFail($invoice->filiere_id);
            abort_unless($filiere->requiresTuitionPayment(), 422, 'Cette formation est gratuite : aucun règlement de scolarité n’est autorisé.');
            $prior = DB::table('tuition_payments')->where('reference', $data['reference'])->first();
            if ($prior) {
                abort_unless((int) $prior->invoice_id === $id && (float) $prior->amount === (float) $data['amount'], 409, 'Référence de paiement déjà utilisée.');

                return $prior;
            }
            $amount = (int) round((float) $data['amount'] * 100);
            $remaining = (int) round(((float) $invoice->amount - (float) $invoice->paid_amount) * 100);
            abort_unless($amount > 0 && $amount <= $remaining, 422, 'Montant incompatible avec le solde de la facture.');
            $payment = DB::table('tuition_payments')->insertGetId(['invoice_id' => $id, 'amount' => $data['amount'], 'reference' => $data['reference'], 'provider' => $data['provider'],
                'verification_note' => $data['verification_note'], 'verified_by' => $actor->id, 'verified_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
            DB::table('tuition_invoices')->where('id', $id)->update(['paid_amount' => ((int) round((float) $invoice->paid_amount * 100) + $amount) / 100, 'status' => $remaining === $amount ? 'paid' : 'partial', 'updated_at' => now()]);
            activity()->causedBy($actor)->withProperties(['invoice_id' => $id, 'payment_id' => $payment, 'reference' => $data['reference']])->log('tuition_payment_verified');

            return DB::table('tuition_payments')->find($payment);
        });
    }
}

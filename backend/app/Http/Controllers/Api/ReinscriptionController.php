<?php
namespace App\Http\Controllers\Api;

use App\Actions\Academic\ConfirmStudentRenewalAction;
use App\Http\Controllers\Controller;
use App\Models\{AcademicYear, Student, StudentRegistration};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReinscriptionController extends Controller
{
    public function __construct(private ConfirmStudentRenewalAction $action) {}
    public function getStatus(Request $request)
    {
        $student = Student::with('user', 'latestPathway.filiere')->where('user_id', $request->user()->id)->firstOrFail();
        $year = $this->action->year($student); $registration = $this->action->eligibleRegistration($student, $year->id);
        $receipt = DB::table('student_renewals')->where('student_id', $student->id)->where('academic_year_id', $year->id)->first();
        $filiere = $registration?->filiere ?? $student->latestPathway?->filiere;
        $invoice = DB::table('tuition_invoices')->where('student_id', $student->id)->where('academic_year_id', $year->id)->where('filiere_id', $filiere?->id)->first();
        return response()->json(['success' => true, 'data' => ['student_id' => $student->id, 'student_name' => $student->user->name, 'cne' => $student->cne, 'cin' => $student->user->cin,
            'email' => $student->user->email, 'phone' => $student->user->phone, 'address' => $student->user->address, 'city' => $student->user->city,
            'academic_year' => $year->label, 'current_semester' => $student->latestPathway?->current_semester, 'current_level' => 'Semestre S'.$student->latestPathway?->current_semester,
            'target_semester' => $registration?->semester_number, 'target_level' => $registration ? 'Semestre S'.$registration->semester_number : 'Décision annuelle en attente',
            'current_filiere' => $filiere?->name, 'is_admis' => (bool) $registration, 'average_grade' => null, 'failed_modules' => null,
            'is_confirmed' => (bool) $receipt, 'receipt_reference' => $receipt?->receipt_reference, 'confirmed_at' => $receipt?->confirmed_at,
            'filieres' => [], 'requires_filiere_choice' => false, 'payment_required' => (bool) $filiere?->requiresTuitionPayment(),
            'payment_status' => $filiere?->requiresTuitionPayment() ? ($invoice?->status ?? 'pending') : 'not_applicable',
            'blocking_reason' => $registration ? null : 'La scolarité doit valider votre inscription académique annuelle.']]);
    }
    public function confirm(Request $request)
    {
        $data = $request->validate(['phone' => 'required|string|max:20', 'address' => 'required|string|max:255', 'city' => 'required|string|max:100', 'filiere_id' => 'nullable|integer', 'has_insurance' => 'boolean']);
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();
        $receipt = $this->action->execute($student, $data);
        return response()->json(['success' => true, 'message' => 'Réinscription annuelle confirmée.', 'receipt_reference' => $receipt->receipt_reference, 'target_level' => 'Semestre S'.$receipt->target_semester, 'confirmed_at' => $receipt->confirmed_at]);
    }
    public function simulatePay(Request $request)
    {
        return response()->json(['success' => false, 'message' => 'La simulation ne constitue pas un paiement. Contactez la régie pour une confirmation vérifiée.'], 422);
    }
    public function getAdminStats(Request $request)
    {
        $year = AcademicYear::where('institution_id', $request->user()->institution_id)->where('is_current', true)->firstOrFail();
        $rows = StudentRegistration::with('student.user', 'filiere')->where('academic_year_id', $year->id)->where('registration_type', 're_enrollment')->whereIn('status', ['academic_validated', 'admin_validated'])->get()->unique('student_id');
        $receipts = DB::table('student_renewals')->where('academic_year_id', $year->id)->get()->keyBy('student_id');
        $students = $rows->map(fn ($r) => ['id' => $r->student_id, 'name' => $r->student->user->name, 'cne' => $r->student->cne, 'cin' => $r->student->user->cin,
            'email' => $r->student->user->email, 'phone' => $r->student->user->phone, 'current_level' => 'S'.$r->semester_number, 'filiere' => $r->filiere->name,
            'is_confirmed' => isset($receipts[$r->student_id]), 'confirmed_at' => $receipts[$r->student_id]->confirmed_at ?? null, 'receipt_ref' => $receipts[$r->student_id]->receipt_reference ?? null])->values();
        return response()->json(['success' => true, 'data' => ['academic_year' => $year->label, 'total_eligible' => $rows->count(), 'total_confirmed' => $receipts->count(),
            'total_pending' => $students->where('is_confirmed', false)->count(), 'confirmation_rate' => $rows->isEmpty() ? 0 : round($receipts->count() * 100 / $rows->count(), 1), 'by_level' => [], 'students' => $students]]);
    }
    public function sendReminders(Request $request)
    {
        $year = AcademicYear::where('institution_id', $request->user()->institution_id)->where('is_current', true)->firstOrFail();
        $students = Student::whereHas('registrations', fn ($q) => $q->where('academic_year_id', $year->id)->where('registration_type', 're_enrollment')->where('status', 'academic_validated'))
            ->whereNotIn('id', DB::table('student_renewals')->where('academic_year_id', $year->id)->select('student_id'))->with('user')->get();
        foreach ($students as $student) $student->user->notify(new \App\Notifications\SystemNotification('Réinscription annuelle', 'Votre inscription académique est validée. Complétez votre confirmation.', 'info', '/student/reinscription'));
        return response()->json(['success' => true, 'message' => 'Rappels dans les espaces personnels enregistrés.', 'sent_count' => $students->count()]);
    }
}

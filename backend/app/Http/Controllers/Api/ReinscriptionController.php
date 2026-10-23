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
        $requiresPayment = (bool) $filiere?->requiresTuitionPayment();
        $invoice = $requiresPayment ? DB::table('tuition_invoices')->where('student_id', $student->id)->where('academic_year_id', $year->id)->where('filiere_id', $filiere->id)->first() : null;
        return response()->json(['success' => true, 'data' => ['student_id' => $student->id, 'student_name' => $student->user->name, 'cne' => $student->cne, 'cin' => $student->user->cin,
            'email' => $student->user->email, 'phone' => $student->user->phone, 'address' => $student->user->address, 'city' => $student->user->city,
            'academic_year' => $year->label, 'current_semester' => $student->latestPathway?->current_semester, 'current_level' => 'Semestre S'.$student->latestPathway?->current_semester,
            'target_semester' => $registration?->semester_number, 'target_level' => $registration ? 'Semestre S'.$registration->semester_number : 'Décision annuelle en attente',
            'current_filiere' => $filiere?->name, 'is_admis' => (bool) $registration, 'average_grade' => null, 'failed_modules' => null,
            'is_confirmed' => (bool) $receipt, 'receipt_reference' => $receipt?->receipt_reference, 'confirmed_at' => $receipt?->confirmed_at,
            'filieres' => [], 'requires_filiere_choice' => false, 'payment_required' => (bool) $filiere?->requiresTuitionPayment(),
            'payment_status' => $filiere?->requiresTuitionPayment() ? ($invoice?->status ?? 'pending') : 'not_applicable',
            'invoice_reference' => $invoice?->reference, 'invoice_remaining' => $invoice ? max(0, round((float) $invoice->amount - (float) $invoice->paid_amount, 2)) : null,
            'can_confirm' => ! $year->is_locked && (bool) $registration && (! $filiere?->requiresTuitionPayment() || ($invoice && $invoice->status === 'paid' && (float) $invoice->paid_amount >= (float) $invoice->amount)),
            'blocking_reason' => $year->is_locked ? 'L’année universitaire est verrouillée. Contactez la scolarité.' : ($registration ? null : 'La scolarité doit valider votre inscription académique annuelle.')]]);
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
        $student = Student::with('latestPathway.filiere')->where('user_id', $request->user()->id)->firstOrFail();
        $year = $this->action->year($student);
        $filiere = $this->action->eligibleRegistration($student, $year->id)?->filiere ?? $student->latestPathway?->filiere;
        abort_unless($filiere?->requiresTuitionPayment(), 403, 'Aucun règlement de scolarité ne s’applique à cette formation.');
        return response()->json(['success' => false, 'message' => 'La simulation ne constitue pas un paiement. Contactez la régie pour une confirmation vérifiée.'], 422);
    }
    private function annualRoster(Request $request): array
    {
        abort_unless(\App\Support\AdmissionAccess::staff($request->user()) || $request->user()->hasRole('pedagogy_officer'), 403);
        $year = AcademicYear::where('institution_id', $request->user()->institution_id)->where('is_current', true)->firstOrFail();
        $rows = StudentRegistration::with('student.user', 'filiere')->whereHas('student', fn ($q) => $q->where('institution_id', $request->user()->institution_id))->where('academic_year_id', $year->id)->where('registration_type', 're_enrollment')->whereNotIn('status', ['rejected','cancelled'])->get();
        $receipts = DB::table('student_renewals')->where('academic_year_id', $year->id)->whereIn('student_id', $rows->pluck('student_id'))->get()->keyBy('student_id');
        $students = $rows->groupBy('student_id')->map(function ($registrations) use ($receipts) {
            $r = $registrations->first(); $receipt = $receipts->get($r->student_id); $conflict = $registrations->count() !== 1;
            $ready = !$conflict && in_array($r->status, ['academic_validated','admin_validated'], true);
            $state = $conflict ? 'needs_review' : (!$ready ? 'academic_pending' : (!$receipt ? 'pending' : ($receipt->physical_verified_at ? 'verified' : 'physical_pending')));
            return ['id'=>$r->student_id,'name'=>$r->student->user->name,'cne'=>$r->student->cne,'cin'=>$r->student->user->cin,'email'=>$r->student->user->email,'phone'=>$r->student->user->phone,'current_level'=>'S'.$r->semester_number,'level_code'=>ceil($r->semester_number/2).'A','filiere'=>$r->filiere?->name,'is_confirmed'=>(bool)$receipt,'academic_ready'=>$ready,'status'=>$state,'confirmed_at'=>$receipt->confirmed_at ?? null,'receipt_ref'=>$receipt->receipt_reference ?? null,'physical_verified_at'=>$receipt->physical_verified_at ?? null,'physical_checklist'=>$receipt?->physical_checklist ? json_decode($receipt->physical_checklist,true) : null,'physical_verified_by'=>$receipt?->physical_verified_by ? \App\Models\User::find($receipt->physical_verified_by)?->name : null];
        })->values();
        return [$year,$students];
    }
    private function filterRoster(Request $request, $students) {
        if ($request->filled('level') && $request->input('level') !== 'all') $students = $students->where('level_code',$request->input('level'));
        if ($request->filled('status') && $request->input('status') !== 'all') $students = $request->input('status') === 'confirmed' ? $students->where('is_confirmed',true) : $students->where('status',$request->input('status'));
        if ($request->filled('search')) { $term = mb_strtolower(trim($request->input('search'))); $students = $students->filter(fn ($s) => str_contains(mb_strtolower($s['name'].' '.$s['cne'].' '.$s['cin']),$term)); }
        return $students->values();
    }
    public function getAdminStats(Request $request) {
        [$year,$students] = $this->annualRoster($request); $filtered=$this->filterRoster($request,$students); $page=max(1,$request->integer('page',1)); $perPage=50;
        return response()->json(['success'=>true,'data'=>['academic_year'=>$year->label,'total_eligible'=>$students->where('academic_ready',true)->count(),'total_confirmed'=>$students->where('is_confirmed',true)->count(),'total_pending'=>$students->where('status','pending')->count(),'total_physical_pending'=>$students->where('status','physical_pending')->count(),'total_verified'=>$students->where('status','verified')->count(),'total_needs_review'=>$students->whereIn('status',['needs_review','academic_pending'])->count(),'by_level'=>$students->groupBy('level_code')->map(fn ($g)=>['total'=>$g->count(),'confirmed'=>$g->where('is_confirmed',true)->count(),'pending'=>$g->where('status','pending')->count(),'verified'=>$g->where('status','verified')->count()]),'students'=>$filtered->forPage($page,$perPage)->values(),'meta'=>['total'=>$filtered->count(),'current_page'=>$page,'last_page'=>max(1,(int)ceil($filtered->count()/$perPage))],'physical_requirements'=>\App\Actions\Academic\VerifyAnnualRenewalAction::CHECKLIST]]]);
    }
    public function verifyPhysical(Request $request, int $student) {
        $data=$request->validate(['checklist'=>'required|array','observation'=>'nullable|string|max:2000']);
        $receipt=app(\App\Actions\Academic\VerifyAnnualRenewalAction::class)->execute(Student::findOrFail($student),$data);
        return response()->json(['success'=>true,'message'=>'Contrôle physique annuel enregistré.','physical_verified_at'=>$receipt->physical_verified_at]);
    }
    public function exportRoster(Request $request) {
        [, $students]=$this->annualRoster($request); $students=$this->filterRoster($request,$students);
        return response()->streamDownload(function () use ($students) { $out=fopen('php://output','w'); fwrite($out,"\xEF\xBB\xBF"); fputcsv($out,['Nom','CNE','CIN','Niveau','Formation','État du dossier','Référence','Contrôle physique'], ';','"',''); foreach($students as $s) fputcsv($out,array_map(fn($v)=>preg_match('/^[=+@\-\t\r]/u',(string)$v) ? "'".$v : $v,[$s['name'],$s['cne'],$s['cin'],$s['current_level'],$s['filiere'],$s['status'],$s['receipt_ref'],$s['physical_verified_at']]),';','"',''); fclose($out); },'Reinscriptions_Annuelles.csv',['Content-Type'=>'text/csv; charset=UTF-8','Cache-Control'=>'private, no-store']);
    }
    public function sendReminders(Request $request) {
        [$year,$students]=$this->annualRoster($request); $students=$this->filterRoster($request,$students)->where('status','pending'); $sent=0; $queued=0;
        foreach($students as $s) DB::transaction(function () use ($s,$year,$request,&$sent,&$queued) {
            $student=Student::with('user')->whereKey($s['id'])->lockForUpdate()->firstOrFail();
            if(DB::table('student_renewals')->where('student_id',$student->id)->where('academic_year_id',$year->id)->exists()) return;
            $today=now(config('admissions.timezone'))->toDateString();
            if(DB::table('student_renewal_reminders')->where('student_id',$student->id)->where('academic_year_id',$year->id)->where('reminder_date',$today)->exists()) return;
            $email=filter_var($student->user->email,FILTER_VALIDATE_EMAIL) !== false;
            DB::table('student_renewal_reminders')->insert(['student_id'=>$student->id,'academic_year_id'=>$year->id,'reminder_date'=>$today,'sent_by'=>$request->user()->id,'email_queued'=>$email,'created_at'=>now(),'updated_at'=>now()]);
            $student->user->notify(new \App\Notifications\SystemNotification('Réinscription annuelle','Votre inscription académique est validée. Confirmez vos coordonnées puis suivez les indications de la scolarité.','info','/student/reinscription'));
            if($email) { \Illuminate\Support\Facades\Mail::to($student->user->email)->queue(new \App\Mail\RenewalReminderMail($student->user->name,$year->label)); $queued++; } $sent++;
        });
        return response()->json(['success'=>true,'message'=>$sent.' notification(s) enregistrée(s), '.$queued.' email(s) mis en file. Une relance maximum par étudiant et par jour.','sent_count'=>$sent,'email_queued_count'=>$queued]);
    }
}
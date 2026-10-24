<?php
namespace App\Http\Controllers\Api;

use App\Actions\Academic\ConfirmStudentRenewalAction;
use App\Http\Controllers\Controller;
use App\Models\{AcademicYear, DeliberationDecision, Module, Student, StudentRegistration};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReinscriptionController extends Controller
{
    public function __construct(private ConfirmStudentRenewalAction $action) {}

    /**
     * Analyse la situation académique de l'étudiant (notes, moyenne, délibération et dettes).
     */
    private function getStudentAcademicSituation(Student $student): array
    {
        // 1. Récupération de la dernière décision de délibération officielle
        $decision = DeliberationDecision::where('student_id', $student->id)->latest('id')->first();

        // 2. Recherche des modules en dette / réserve (notes < 10 aux semestres antérieurs ou rattrapages en cours)
        $failedGradesModules = DB::table('grades')
            ->join('assessments', 'grades.assessment_id', '=', 'assessments.id')
            ->join('modules', 'assessments.module_id', '=', 'modules.id')
            ->where('grades.student_id', $student->id)
            ->where('grades.score', '<', 10)
            ->whereNotExists(function ($sub) use ($student) {
                // Vérifier s'il n'a pas validé ce module lors d'une session ultérieure
                $sub->select(DB::raw(1))
                    ->from('grades as g2')
                    ->join('assessments as a2', 'g2.assessment_id', '=', 'a2.id')
                    ->whereColumn('a2.module_id', 'modules.id')
                    ->where('g2.student_id', $student->id)
                    ->where('g2.score', '>=', 10);
            })
            ->select('modules.id', 'modules.code', 'modules.name', 'modules.semester_number', DB::raw('ROUND(MIN(grades.score), 2) as grade'))
            ->groupBy('modules.id', 'modules.code', 'modules.name', 'modules.semester_number')
            ->get();

        // Ajout des retakes enregistrés dans student_module_retakes s'il y en a
        $retakeModuleIds = DB::table('student_module_retakes')
            ->where('student_id', $student->id)
            ->whereIn('status', ['pending', 'failed', 'enrolled'])
            ->pluck('module_id')
            ->toArray();

        $additionalRetakes = collect();
        if (! empty($retakeModuleIds)) {
            $alreadyIncluded = $failedGradesModules->pluck('id')->toArray();
            $missingIds = array_diff($retakeModuleIds, $alreadyIncluded);
            if (! empty($missingIds)) {
                $additionalRetakes = Module::whereIn('id', $missingIds)->get()->map(fn ($m) => (object) [
                    'id' => $m->id,
                    'code' => $m->code,
                    'name' => $m->name,
                    'semester_number' => $m->semester_number,
                    'grade' => null,
                ]);
            }
        }

        $allReserve = $failedGradesModules->concat($additionalRetakes)->map(function ($m) {
            return [
                'id' => $m->id,
                'code' => $m->code ?? 'MOD-'.$m->id,
                'name' => $m->name,
                'semester' => 'S' . ($m->semester_number ?? '?'),
                'grade' => $m->grade ? (float) $m->grade : null,
                'status' => 'en_dette',
                'status_label' => 'Module en réserve (à rattraper cette année)',
            ];
        })->values();

        $annualAverage = $decision?->annual_average ?? $decision?->semester_average;
        $decisionType = strtoupper((string) ($decision?->decision ?? ($allReserve->isNotEmpty() ? 'VC' : 'V')));

        $decisionLabel = match ($decisionType) {
            'V', 'ADMITTED' => 'Admis direct en année supérieure',
            'VC', 'COMPENSATED' => 'Admis par compensation (avec module(s) en réserve)',
            'RAT', 'RETAKE' => 'Admis sous réserve de session de rattrapage',
            'RED', 'EXCLUDED' => 'Redoublement',
            default => $allReserve->isNotEmpty() ? 'Admis avec module(s) en réserve' : 'Admis en année supérieure',
        };

        return [
            'annual_average' => $annualAverage ? round((float) $annualAverage, 2) : null,
            'decision_code' => $decisionType,
            'decision_label' => $decisionLabel,
            'was_compensated' => (bool) ($decision?->was_compensated || $decisionType === 'VC'),
            'has_reserve_modules' => $allReserve->isNotEmpty(),
            'reserve_modules_count' => $allReserve->count(),
            'failed_modules' => $allReserve->toArray(),
        ];
    }

    public function getStatus(Request $request)
    {
        $student = Student::with('user', 'latestPathway.filiere')->where('user_id', $request->user()->id)->firstOrFail();
        $year = $this->action->year($student);
        $registration = $this->action->eligibleRegistration($student, $year->id);
        $receipt = DB::table('student_renewals')->where('student_id', $student->id)->where('academic_year_id', $year->id)->first();
        $filiere = $registration?->filiere ?? $student->latestPathway?->filiere;
        $requiresPayment = (bool) $filiere?->requiresTuitionPayment();
        $invoice = $requiresPayment ? DB::table('tuition_invoices')->where('student_id', $student->id)->where('academic_year_id', $year->id)->where('filiere_id', $filiere->id)->first() : null;

        $currentSem = (int) ($student->latestPathway?->current_semester ?? 1);
        $targetSem = (int) ($registration?->semester_number ?? match (true) {
            $currentSem <= 2 => 3,
            $currentSem <= 4 => 5,
            $currentSem <= 6 => 7,
            $currentSem <= 8 => 9,
            default => 9,
        });

        $academicSituation = $this->getStudentAcademicSituation($student);

        return response()->json(['success' => true, 'data' => [
            'student_id' => $student->id,
            'student_name' => $student->user->name,
            'cne' => $student->cne,
            'cin' => $student->user->cin,
            'email' => $student->user->email,
            'phone' => $student->user->phone,
            'address' => $student->user->address,
            'city' => $student->user->city,
            'academic_year' => $year->label,
            'current_semester' => $currentSem,
            'current_level' => 'Semestre S' . $currentSem,
            'previous_level' => 'Semestre S' . $currentSem . ' (' . ceil($currentSem / 2) . 'A)',
            'target_semester' => $targetSem,
            'target_level' => 'Semestre S' . $targetSem . ' (' . ceil($targetSem / 2) . 'A)',
            'target_year_label' => ceil($targetSem / 2) . 'ème Année ENCG',
            'current_filiere' => $filiere?->name ?? 'Grande École de Commerce et de Gestion',
            'is_admis' => true,
            'annual_average' => $academicSituation['annual_average'],
            'decision_code' => $academicSituation['decision_code'],
            'decision_label' => $academicSituation['decision_label'],
            'was_compensated' => $academicSituation['was_compensated'],
            'has_reserve_modules' => $academicSituation['has_reserve_modules'],
            'reserve_modules_count' => $academicSituation['reserve_modules_count'],
            'failed_modules' => $academicSituation['failed_modules'],
            'is_confirmed' => (bool) $receipt,
            'receipt_reference' => $receipt?->receipt_reference,
            'confirmed_at' => $receipt?->confirmed_at,
            'filieres' => [],
            'requires_filiere_choice' => false,
            'payment_required' => (bool) $filiere?->requiresTuitionPayment(),
            'payment_status' => $filiere?->requiresTuitionPayment() ? ($invoice?->status ?? 'pending') : 'not_applicable',
            'invoice_reference' => $invoice?->reference,
            'invoice_remaining' => $invoice ? max(0, round((float) $invoice->amount - (float) $invoice->paid_amount, 2)) : null,
            'can_confirm' => ! $year->is_locked && (! $filiere?->requiresTuitionPayment() || ($invoice && $invoice->status === 'paid' && (float) $invoice->paid_amount >= (float) $invoice->amount)),
            'blocking_reason' => $year->is_locked ? 'L’année universitaire est verrouillée. Contactez la scolarité.' : null,
        ]]);
    }

    public function confirm(Request $request)
    {
        $data = $request->validate([
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:100',
            'filiere_id' => 'nullable|integer',
            'has_insurance' => 'boolean',
        ]);
        $student = Student::where('user_id', $request->user()->id)->firstOrFail();
        $receipt = $this->action->execute($student, $data);
        return response()->json([
            'success' => true,
            'message' => 'Réinscription annuelle confirmée avec succès.',
            'receipt_reference' => $receipt->receipt_reference,
            'target_level' => 'Semestre S'.$receipt->target_semester,
            'confirmed_at' => $receipt->confirmed_at,
        ]);
    }

    public function simulatePay(Request $request)
    {
        $student = Student::with('latestPathway.filiere')->where('user_id', $request->user()->id)->firstOrFail();
        $year = $this->action->year($student);
        $filiere = $this->action->eligibleRegistration($student, $year->id)?->filiere ?? $student->latestPathway?->filiere;
        abort_unless($filiere?->requiresTuitionPayment(), 403, 'Aucun règlement de scolarité ne s’applique à cette formation.');
        return response()->json(['success' => false, 'message' => 'La simulation ne constitue pas un paiement. Contactez la régie pour une confirmation vérifiée.'], 422);
    }

    /**
     * Initialise automatiquement les dossiers de réinscription des étudiants actifs pour l'année courante.
     */
    private function autoInitializeRoster(AcademicYear $year, int $institutionId): int
    {
        $students = Student::where('institution_id', $institutionId)
            ->whereIn('status', ['active', 'inscrit', 'reinscrit'])
            ->with(['latestPathway.filiere'])
            ->get();

        $count = 0;
        foreach ($students as $student) {
            $currentSem = (int) ($student->latestPathway?->current_semester ?? 1);
            $targetSem = match (true) {
                $currentSem <= 2 => 3,
                $currentSem <= 4 => 5,
                $currentSem <= 6 => 7,
                $currentSem <= 8 => 9,
                default => 9,
            };
            $filiereId = $student->latestPathway?->filiere_id ?? 1;

            $exists = StudentRegistration::where('student_id', $student->id)
                ->where('academic_year_id', $year->id)
                ->where('registration_type', 're_enrollment')
                ->exists();

            if (! $exists) {
                StudentRegistration::create([
                    'student_id' => $student->id,
                    'academic_year_id' => $year->id,
                    'filiere_id' => $filiereId,
                    'semester_number' => $targetSem,
                    'registration_type' => 're_enrollment',
                    'status' => 'academic_validated',
                    'academic_validated_at' => now(),
                ]);
                $count++;
            }
        }
        return $count;
    }

    public function initializeCampaign(Request $request)
    {
        abort_unless(\App\Support\AdmissionAccess::staff($request->user()) || $request->user()->hasRole('pedagogy_officer'), 403);
        $year = AcademicYear::where('institution_id', $request->user()->institution_id)->where('is_current', true)->firstOrFail();
        $count = $this->autoInitializeRoster($year, (int) $request->user()->institution_id);

        return response()->json([
            'success' => true,
            'message' => "Campagne de réinscription {$year->label} initialisée ! {$count} nouveau(x) dossier(s) annuel(s) préparé(s).",
            'count' => $count,
        ]);
    }

    private function annualRoster(Request $request): array
    {
        abort_unless(\App\Support\AdmissionAccess::staff($request->user()) || $request->user()->hasRole('pedagogy_officer'), 403);
        $year = AcademicYear::where('institution_id', $request->user()->institution_id)->where('is_current', true)->firstOrFail();

        $rows = StudentRegistration::with('student.user', 'filiere')
            ->whereHas('student', fn ($q) => $q->where('institution_id', $request->user()->institution_id))
            ->where('academic_year_id', $year->id)
            ->where('registration_type', 're_enrollment')
            ->whereNotIn('status', ['rejected','cancelled'])
            ->get();

        // Auto-découverte si la cohorte n'a pas encore été initialisée
        if ($rows->isEmpty()) {
            $this->autoInitializeRoster($year, (int) $request->user()->institution_id);
            $rows = StudentRegistration::with('student.user', 'filiere')
                ->whereHas('student', fn ($q) => $q->where('institution_id', $request->user()->institution_id))
                ->where('academic_year_id', $year->id)
                ->where('registration_type', 're_enrollment')
                ->whereNotIn('status', ['rejected','cancelled'])
                ->get();
        }

        $receipts = DB::table('student_renewals')->where('academic_year_id', $year->id)->whereIn('student_id', $rows->pluck('student_id'))->get()->keyBy('student_id');

        $students = $rows->groupBy('student_id')->map(function ($registrations) use ($receipts) {
            $r = $registrations->first();
            $receipt = $receipts->get($r->student_id);
            $conflict = $registrations->count() !== 1;
            $ready = ! $conflict && in_array($r->status, ['academic_validated','admin_validated'], true);
            $state = $conflict ? 'needs_review' : (! $ready ? 'academic_pending' : (! $receipt ? 'pending' : ($receipt->physical_verified_at ? 'verified' : 'physical_pending')));

            $targetLevelCode = ceil($r->semester_number / 2) . 'A';
            $originLevelCode = max(1, (int) ceil(($r->semester_number - 2) / 2)) . 'A';

            return [
                'id' => $r->student_id,
                'name' => $r->student->user->name,
                'cne' => $r->student->cne,
                'cin' => $r->student->user->cin,
                'email' => $r->student->user->email,
                'phone' => $r->student->user->phone,
                'origin_level' => $originLevelCode,
                'current_level' => 'S' . $r->semester_number,
                'level_code' => $targetLevelCode,
                'filiere' => $r->filiere?->name,
                'is_confirmed' => (bool) $receipt,
                'academic_ready' => $ready,
                'status' => $state,
                'confirmed_at' => $receipt->confirmed_at ?? null,
                'receipt_ref' => $receipt->receipt_reference ?? null,
                'physical_verified_at' => $receipt->physical_verified_at ?? null,
                'physical_checklist' => $receipt?->physical_checklist ? json_decode($receipt->physical_checklist, true) : null,
                'physical_verified_by' => $receipt?->physical_verified_by ? \App\Models\User::find($receipt->physical_verified_by)?->name : null,
            ];
        })->values();

        return [$year, $students];
    }

    private function filterRoster(Request $request, $students)
    {
        if ($request->filled('level') && $request->input('level') !== 'all') {
            $students = $students->where('level_code', $request->input('level'));
        }
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $students = $request->input('status') === 'confirmed' ? $students->where('is_confirmed', true) : $students->where('status', $request->input('status'));
        }
        if ($request->filled('search')) {
            $term = mb_strtolower(trim($request->input('search')));
            $students = $students->filter(fn ($s) => str_contains(mb_strtolower($s['name'].' '.$s['cne'].' '.$s['cin']), $term));
        }
        return $students->values();
    }

    public function getAdminStats(Request $request)
    {
        [$year, $students] = $this->annualRoster($request);
        $filtered = $this->filterRoster($request, $students);
        $page = max(1, $request->integer('page', 1));
        $perPage = 50;

        return response()->json(['success' => true, 'data' => [
            'academic_year' => $year->label,
            'total_eligible' => $students->where('academic_ready', true)->count(),
            'total_confirmed' => $students->where('is_confirmed', true)->count(),
            'total_pending' => $students->where('status', 'pending')->count(),
            'total_physical_pending' => $students->where('status', 'physical_pending')->count(),
            'total_verified' => $students->where('status', 'verified')->count(),
            'total_needs_review' => $students->whereIn('status', ['needs_review', 'academic_pending'])->count(),
            'by_level' => $students->groupBy('level_code')->map(fn ($g) => [
                'total' => $g->count(),
                'confirmed' => $g->where('is_confirmed', true)->count(),
                'pending' => $g->where('status', 'pending')->count(),
                'verified' => $g->where('status', 'verified')->count(),
            ]),
            'students' => $filtered->forPage($page, $perPage)->values(),
            'meta' => [
                'total' => $filtered->count(),
                'current_page' => $page,
                'last_page' => max(1, (int) ceil($filtered->count() / $perPage)),
            ],
            'physical_requirements' => \App\Actions\Academic\VerifyAnnualRenewalAction::CHECKLIST,
        ]]);
    }

    public function verifyPhysical(Request $request, int $student)
    {
        $data = $request->validate([
            'checklist' => 'required|array',
            'observation' => 'nullable|string|max:2000',
        ]);
        $receipt = app(\App\Actions\Academic\VerifyAnnualRenewalAction::class)->execute(Student::findOrFail($student), $data);
        return response()->json([
            'success' => true,
            'message' => 'Contrôle physique annuel enregistré avec succès.',
            'physical_verified_at' => $receipt->physical_verified_at,
        ]);
    }

    public function exportRoster(Request $request)
    {
        [, $students] = $this->annualRoster($request);
        $students = $this->filterRoster($request, $students);

        return response()->streamDownload(function () use ($students) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Nom & Prénom', 'CNE', 'CIN', 'Niveau Cible', 'Formation', 'État du dossier', 'Réf Récépissé', 'Contrôle physique'], ';', '"', '');
            foreach ($students as $s) {
                fputcsv($out, array_map(fn ($v) => preg_match('/^[=+@\-\t\r]/u', (string) $v) ? "'".$v : $v, [
                    $s['name'],
                    $s['cne'],
                    $s['cin'],
                    $s['current_level'],
                    $s['filiere'],
                    $s['status'],
                    $s['receipt_ref'],
                    $s['physical_verified_at'],
                ]), ';', '"', '');
            }
            fclose($out);
        }, 'Reinscriptions_Annuelles_ENCG.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'private, no-store',
        ]);
    }

    public function sendReminders(Request $request)
    {
        [$year, $students] = $this->annualRoster($request);
        $students = $this->filterRoster($request, $students)->where('status', 'pending');
        $sent = 0;
        $queued = 0;

        foreach ($students as $s) {
            DB::transaction(function () use ($s, $year, $request, &$sent, &$queued) {
                $student = Student::with('user')->whereKey($s['id'])->lockForUpdate()->firstOrFail();
                if (DB::table('student_renewals')->where('student_id', $student->id)->where('academic_year_id', $year->id)->exists()) {
                    return;
                }
                $today = now(config('admissions.timezone'))->toDateString();
                if (DB::table('student_renewal_reminders')->where('student_id', $student->id)->where('academic_year_id', $year->id)->where('reminder_date', $today)->exists()) {
                    return;
                }
                $email = filter_var($student->user->email, FILTER_VALIDATE_EMAIL) !== false;
                DB::table('student_renewal_reminders')->insert([
                    'student_id' => $student->id,
                    'academic_year_id' => $year->id,
                    'reminder_date' => $today,
                    'sent_by' => $request->user()->id,
                    'email_queued' => $email,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $student->user->notify(new \App\Notifications\SystemNotification('Réinscription annuelle', 'Votre inscription académique est validée. Confirmez vos coordonnées puis suivez les indications de la scolarité.', 'info', '/student/reinscription'));
                if ($email) {
                    \Illuminate\Support\Facades\Mail::to($student->user->email)->queue(new \App\Mail\RenewalReminderMail($student->user->name, $year->label));
                    $queued++;
                }
                $sent++;
            });
        }
        return response()->json([
            'success' => true,
            'message' => $sent.' notification(s) enregistrée(s), '.$queued.' email(s) mis en file. Une relance maximum par étudiant et par jour.',
            'sent_count' => $sent,
            'email_queued_count' => $queued,
        ]);
    }
}
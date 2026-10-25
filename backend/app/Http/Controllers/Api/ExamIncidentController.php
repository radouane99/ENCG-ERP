<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\DisciplinaryCase;
use App\Models\DocumentRequest;
use App\Models\Exam;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\Filiere;
use App\Models\FinalProject;
use App\Models\Grade;
use App\Models\Module;
use App\Models\Student;
use App\Models\User;
use App\Services\Academic\ExamCourseAttendanceService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamIncidentController extends Controller
{
    /**
     * Liste des incidents.
     */
    public function index(Request $request): JsonResponse
    {
        // Récupération des incidents d'examen
        $query = ExamIncident::with(['exam.module.filiere', 'exam.examSession', 'student.user', 'reporter'])->whereHas('exam.examSession', fn ($q) => $q->where('institution_id', $request->user()->institution_id));
        $staff = $request->user()->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director', 'department-head', 'filiere-head', 'scolarite', 'discipline-committee']);
        if (! $staff) {
            $query->whereHas('exam.surveillances', fn ($q) => $q->where('professor_id', $request->user()->id));
        }

        if ($request->filled('session_id')) {
            $query->whereHas('exam', fn ($q) => $q->where('exam_session_id', $request->session_id));
        }

        if ($request->filled('exam_id')) {
            $query->where('exam_id', $request->exam_id);
        }

        $incidents = $query->latest()->get()->map(function ($inc) {
            $student = $inc->student;
            $user = $student?->user;
            $exam = $inc->exam;
            $module = $exam?->module;
            $filiere = $module?->filiere;

            $firstNameFr = $user?->first_name ?? ($user ? explode(' ', $user->name)[0] : 'Étudiant');
            $lastNameFr = $user?->last_name ?? ($user ? (explode(' ', $user->name)[1] ?? '') : '');
            $fullNameFr = trim(($firstNameFr ?: ($user?->name ?? 'Étudiant')).' '.$lastNameFr);
            $firstNameAr = $student?->first_name_ar ?? '';
            $lastNameAr = $student?->last_name_ar ?? '';
            $fullNameAr = trim($firstNameAr.' '.$lastNameAr);
            $cneVal = $student?->cne ?? 'N/A';

            return [
                'id' => $inc->id,
                'student_id' => $inc->student_id,
                'student_name' => $fullNameFr,
                'student_name_ar' => $fullNameAr,
                'cne' => $cneVal,
                'student' => [
                    'id' => $inc->student_id,
                    'first_name' => $firstNameFr,
                    'last_name' => $lastNameFr,
                    'first_name_ar' => $firstNameAr,
                    'last_name_ar' => $lastNameAr,
                    'full_name_ar' => $fullNameAr,
                    'cne' => $cneVal,
                    'email' => $user?->email ?? 'N/A',
                    'filiere' => $filiere?->name ?? 'Tronc Commun ENCG',
                    'phone' => $student?->parent_phone ?? $student?->father_phone ?? null,
                ],
                'exam_id' => $inc->exam_id,
                'module_name' => $module?->name ?? 'Épreuve Semestrielle',
                'filiere_name' => $filiere?->name ?? 'ENCG Fès',
                'exam_date' => $exam?->exam_date ?? $inc->created_at?->format('Y-m-d'),
                'type' => $inc->type,
                'type_label' => match ($inc->type) {
                    'fraude_antiseche', 'antiseche' => '📝 Fraude Antisèche / Documents',
                    'fraude_smartphone', 'smartphone' => '📱 Usage Smartphone / IA',
                    'usurpation' => '👤 Usurpation d\'Identité',
                    'perturbation' => '⚠️ Perturbation & Refus d\'Obtempérer',
                    'plagiat' => '📑 Plagiat Académique',
                    'suspicion_fraude' => '🔍 Suspicion de Fraude',
                    default => str_starts_with(strtolower($inc->type), 'fraude') ? '🚨 Fraude à l\'Examen' : ucfirst($inc->type),
                },
                'description' => $inc->description,
                'confiscated_items' => $inc->confiscated_items,
                'severity' => in_array($inc->severity ?? '', ['low', 'medium', 'high']) ? $inc->severity : (str_contains(strtolower($inc->type), 'fraude') ? 'high' : 'medium'),
                'status' => $inc->status ?? 'pending',
                'hearing_date' => $inc->hearing_date,
                'hearing_room' => $inc->hearing_room,
                'hearing_notes' => $inc->hearing_notes,
                'decision' => $inc->decision,
                'sanction_scope' => $inc->sanction_scope,
                'created_at' => $inc->created_at?->format('Y-m-d H:i'),
            ];
        });

        // Inclure et harmoniser également les dossiers disciplinaires existants (DisciplinaryCase)
        $existingStudentIds = $incidents->pluck('student_id')->toArray();
        $casesQuery = DisciplinaryCase::with(['student.user', 'decision'])->where('institution_id', $request->user()->institution_id);
        if (! $staff) { $casesQuery->whereRaw('1 = 0'); }
        if ($request->filled('exam_id') || $request->filled('session_id') || str_contains($request->path(), 'exam-incidents')) { $casesQuery->whereRaw('1 = 0'); }
        if (! empty($existingStudentIds)) {
            $casesQuery->whereNotIn('student_id', $existingStudentIds);
        }

        $disciplinaryCases = $casesQuery->latest()->get()->map(function ($case) {
            $student = $case->student;
            $user = $student?->user;
            $firstNameFr = $user?->first_name ?? ($user ? explode(' ', $user->name)[0] : 'Étudiant');
            $lastNameFr = $user?->last_name ?? ($user ? (explode(' ', $user->name)[1] ?? '') : '');
            $fullNameFr = trim(($firstNameFr ?: ($user?->name ?? 'Étudiant')).' '.$lastNameFr);
            $firstNameAr = $student?->first_name_ar ?? '';
            $lastNameAr = $student?->last_name_ar ?? '';
            $fullNameAr = trim($firstNameAr.' '.$lastNameAr);
            $cneVal = $student?->cne ?? 'N/A';

            $normalizedType = match (strtolower($case->infraction_type ?? '')) {
                'fraud', 'fraude' => 'fraude_antiseche',
                'misconduct' => 'perturbation',
                default => $case->infraction_type ?: 'fraude_antiseche',
            };

            $normalizedStatus = match ($case->status) {
                'closed' => 'resolved',
                'convoked' => 'convoked',
                'pending' => 'pending',
                default => $case->status ?: 'resolved',
            };

            return [
                'id' => 50000 + $case->id,
                'is_disciplinary_case' => true,
                'disciplinary_case_id' => $case->id,
                'student_id' => $case->student_id,
                'student_name' => $fullNameFr,
                'student_name_ar' => $fullNameAr,
                'cne' => $cneVal,
                'student' => [
                    'id' => $case->student_id,
                    'first_name' => $firstNameFr,
                    'last_name' => $lastNameFr,
                    'first_name_ar' => $firstNameAr,
                    'last_name_ar' => $lastNameAr,
                    'full_name_ar' => $fullNameAr,
                    'cne' => $cneVal,
                    'email' => $user?->email ?? 'N/A',
                    'filiere' => 'ENCG Fès',
                    'phone' => $student?->emergency_contact_phone ?? $student?->father_phone ?? null,
                ],
                'exam_id' => null,
                'module_name' => str_contains($case->description ?? '', 'Comptabilité Approfondie') ? 'Comptabilité Approfondie' : 'Épreuve Semestrielle',
                'filiere_name' => 'ENCG Fès',
                'exam_date' => $case->incident_date ? Carbon::parse($case->incident_date)->format('Y-m-d') : ($case->created_at?->format('Y-m-d') ?? now()->format('Y-m-d')),
                'type' => $normalizedType,
                'type_label' => match ($normalizedType) {
                    'fraude_antiseche', 'antiseche' => '📝 Fraude Antisèche / Documents',
                    'fraude_smartphone', 'smartphone' => '📱 Usage Smartphone / IA',
                    'perturbation' => '⚠️ Perturbation & Refus d\'Obtempérer',
                    default => '🚨 Fraude à l\'Examen',
                },
                'description' => $case->description,
                'confiscated_items' => null,
                'severity' => in_array(strtolower($case->infraction_type ?? ''), ['fraud', 'fraude']) ? 'high' : 'medium',
                'status' => $normalizedStatus,
                'hearing_date' => null,
                'hearing_room' => null,
                'hearing_notes' => $case->student_statement,
                'decision' => $case->decision?->decision_text,
                'sanction_scope' => $case->decision?->sanction_type,
                'created_at' => $case->created_at?->format('Y-m-d H:i') ?? now()->format('Y-m-d H:i'),
            ];
        });

        $allData = $incidents->concat($disciplinaryCases)->values();

        return response()->json([
            'success' => true,
            'data' => $allData,
        ]);
    }

    /**
     * Liste des étudiants et des examens pour la création de dossier.
     */
    public function studentsList(): JsonResponse
    {
        $students = Student::with(['user'])->limit(150)->get()->map(function ($s) {
            $user = $s->user;
            $firstNameFr = $user?->first_name ?? ($user ? explode(' ', $user->name)[0] : '');
            $lastNameFr = $user?->last_name ?? ($user ? (explode(' ', $user->name)[1] ?? '') : '');
            $fullNameFr = trim(($firstNameFr ?: ($user?->name ?? 'Étudiant')).' '.$lastNameFr);
            $fullNameAr = trim(($s->first_name_ar ?? '').' '.($s->last_name_ar ?? ''));

            return [
                'id' => $s->id,
                'name' => $fullNameFr,
                'name_ar' => $fullNameAr,
                'cne' => $s->cne,
                'email' => $user?->email,
            ];
        });

        $exams = Exam::with('module')->latest()->limit(50)->get()->map(function ($e) {
            return [
                'id' => $e->id,
                'module_name' => $e->module?->name ?? "Examen #{$e->id}",
                'exam_date' => $e->exam_date,
            ];
        });

        return response()->json([
            'success' => true,
            'students' => $students,
            'exams' => $exams,
        ]);
    }

    /**
     * Créer un incident / dossier disciplinaire.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'exam_id' => 'required|exists:exams,id',
            'type' => 'required|string',
            'severity' => 'nullable|string|in:low,medium,high',
            'description' => 'required|string|min:5|max:10000',
            'confiscated_items' => 'nullable|string',
        ]);

        $exam = Exam::with('examSession')->findOrFail($validated['exam_id']);
        app(\App\Services\Academic\ExamWorkflowGuard::class)->attendance($exam);
        abort_unless(ExamSeating::where('exam_id', $exam->id)->where('student_id', $validated['student_id'])->exists(), 422, 'Cet étudiant ne figure pas dans les convocations de cette épreuve.');
        $incident = ExamIncident::create([
            'exam_id' => $exam->id, 'student_id' => $validated['student_id'],
            'reported_by' => $request->user()->id, 'type' => $validated['type'],
            'description' => $validated['description'],
            'confiscated_items' => $validated['confiscated_items'] ?? null, 'status' => 'pending',
        ]);
        activity()->causedBy($request->user())->performedOn($incident)->log('exam_incident_reported');

        return response()->json([
            'success' => true,
            'message' => 'Dossier disciplinaire enregistré avec succès.',
            'data' => $incident,
        ], 201);
    }

    /**
     * Convoquer au conseil de discipline.
     */
    public function convoke(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director', 'discipline-committee']), 403);
        $data = $request->validate(['hearing_date' => 'required|date_format:Y-m-d \à H:i', 'hearing_room' => 'required|string|max:255', 'send_email' => 'sometimes|boolean']);
        $incident = ExamIncident::with('exam.examSession')->findOrFail($id);
        app(\App\Services\Academic\ExamWorkflowGuard::class)->session($incident->exam->examSession);
        abort_unless(in_array($incident->status, ['pending', 'convoked'], true), 409, 'Ce dossier a déjà fait l’objet d’une décision.');
        $incident->update(['hearing_date' => $data['hearing_date'], 'hearing_room' => $data['hearing_room'], 'status' => 'convoked']);
        $incident->student?->user?->notify(new \App\Notifications\SystemNotification('Convocation à une audition', 'Une audition est prévue le '.$data['hearing_date'].' — '.$data['hearing_room'].'. Contactez la scolarité pour votre convocation.', 'info', '/dashboard'));
        $emailStatus = 'not_requested';
        if ($data['send_email'] ?? false) {
            $recipient = $incident->student?->user;
            if (! $recipient || ! filter_var($recipient->email, FILTER_VALIDATE_EMAIL)) {
                $emailStatus = 'missing_address';
            } else {
                try {
                    $pdf = app(PdfExportController::class)->convocationDisciplinePdf($incident->id)->getContent();
                    \Illuminate\Support\Facades\Mail::to($recipient->email)->send(new \App\Mail\DisciplineHearingMail($recipient->name, $data['hearing_date'], $data['hearing_room'], $pdf, $incident->id));
                    $emailStatus = 'accepted';
                    activity()->causedBy($user)->performedOn($incident)->log('discipline_hearing_email_accepted');
                } catch (\Throwable $error) {
                    report($error);
                    $emailStatus = 'failed';
                }
            }
        }
        $message = $emailStatus === 'accepted' ? 'Convocation enregistrée; email accepté par le transport.' : ($emailStatus === 'not_requested' ? 'Convocation enregistrée; PDF disponible et notification portail créée.' : 'Convocation enregistrée, mais email non envoyé. Remettez le PDF ou réessayez.');
        return response()->json(['success' => true, 'message' => $message, 'email_status' => $emailStatus, 'data' => $incident]);
    }

    /**
     * Prononcer la décision du conseil de discipline.
     */
    public function decide(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'sanction' => 'required|string|in:module,semestre,blame,avertissement,exclusion,annee,dismissed,classement',
            'observations' => 'required|string|min:5|max:10000',
        ]);
        $incident = app(\App\Actions\Exam\DecideExamIncidentAction::class)->execute($id, $data);
        return response()->json(['success' => true, 'message' => 'Décision enregistrée et application contrôlée.', 'data' => $incident]);
    }

    /**
     * Supprimer un dossier disciplinaire.
     */
    public function destroy(int $id): JsonResponse
    {
        app(\App\Services\Academic\ExamWorkflowGuard::class)->manage();
        $incident = ExamIncident::with('exam.examSession')->findOrFail($id);
        app(\App\Services\Academic\ExamWorkflowGuard::class)->session($incident->exam->examSession);
        abort_unless($incident->status === 'pending', 409, 'Un dossier convoqué ou décidé doit être conservé.');
        activity()->causedBy(auth()->user())->performedOn($incident)->withProperties($incident->toArray())->log('exam_incident_removed_before_hearing');
        $incident->delete();
        return response()->json(['success' => true, 'message' => 'Signalement retiré; trace conservée dans le journal.']);
    }

    /**
     * Générer des dossiers de démonstration (environnement local uniquement).
     * Ne supprime jamais les dossiers existants.
     */
    public function seedSamples(): JsonResponse
    {
        if (! app()->environment('local')) {
            return response()->json([
                'success' => false,
                'message' => 'La génération de dossiers de démonstration est désactivée hors environnement de développement.',
            ], 403);
        }

        $this->seedRealisticSamples();

        return response()->json([
            'success' => true,
            'message' => 'Dossiers disciplinaires de démonstration générés.',
        ]);
    }

    /**
     * Génère des cas réalistes conformes à l'ENCG Fès.
     */
    private function seedRealisticSamples(): void
    {
        $students = Student::with('user')->limit(10)->get();
        $exams = Exam::with('module')->limit(6)->get();

        if ($students->count() < 3 || $exams->isEmpty()) {
            return;
        }

        $reporter = User::where('email', 'like', '%prof%')->orWhere('email', 'like', '%admin%')->value('id');

        $samples = [
            [
                'student_idx' => 0, // Ghita Berrada
                'exam_idx' => 0,
                'type' => 'fraude_antiseche',
                'description' => 'Documents manuscrits d\'aide mémoire (formules de probabilités) dissimulés sous la table d\'examen et consultés pendant l\'épreuve.',
                'confiscated_items' => '3 fiches cartonnées manuscrites recto-verso',
                'status' => 'pending',
                'hearing_date' => null,
                'hearing_room' => null,
                'decision' => null,
                'sanction_scope' => null,
            ],
            [
                'student_idx' => 1, // Othmane El Alami
                'exam_idx' => 1,
                'type' => 'fraude_smartphone',
                'description' => 'Utilisation active d\'un smartphone connecté à une application d\'IA générative lors de l\'épreuve.',
                'confiscated_items' => 'iPhone 13 Noir avec session active',
                'status' => 'convoked',
                'hearing_date' => '2026-09-25 à 10h30',
                'hearing_room' => 'Salle des Actes — ENCG Fès',
                'decision' => null,
                'sanction_scope' => null,
            ],
            [
                'student_idx' => 2, // Malak Guessous
                'exam_idx' => 2,
                'type' => 'fraude_antiseche',
                'description' => 'Tentative de communication et échange de brouillons avec le candidat voisin lors de l\'épreuve de Comptabilité.',
                'confiscated_items' => 'Feuille de brouillon double annotée',
                'status' => 'resolved',
                'hearing_date' => '2026-09-12 à 11h00',
                'hearing_room' => 'Salle du Conseil de Direction',
                'decision' => 'Note 0.00/20 attribuée d\'office au module avec mention FRAUDE au PV',
                'sanction_scope' => 'module',
            ],
            [
                'student_idx' => 3, // Hajar El Fassi
                'exam_idx' => 3,
                'type' => 'perturbation',
                'description' => 'Refus de déposer les effets personnels à l\'entrée de la salle, contestation véhémente et perturbation du déroulement de l\'examen.',
                'confiscated_items' => null,
                'status' => 'resolved',
                'hearing_date' => '2026-09-10 à 14h30',
                'hearing_room' => 'Salle des Actes — ENCG Fès',
                'decision' => 'Blâme officiel avec inscription irréversible au dossier académique',
                'sanction_scope' => 'blame',
            ],
            [
                'student_idx' => 4, // Anas Tazi
                'exam_idx' => 4,
                'type' => 'suspicion_fraude',
                'description' => 'Suspicion de détention de documents non autorisés. Après audition et vérification des copies, aucun élément matériel n\'a été établi.',
                'confiscated_items' => 'Brouillon officiel blanc',
                'status' => 'dismissed',
                'hearing_date' => '2026-09-08 à 09h30',
                'hearing_room' => 'Bureau du Directeur Adjoint',
                'decision' => 'Classement sans suite — Aucune charge retenue après audition contradictoire',
                'sanction_scope' => 'dismissed',
            ],
        ];

        foreach ($samples as $sample) {
            $student = $students[$sample['student_idx']] ?? $students->first();
            $exam = $exams[$sample['exam_idx'] % $exams->count()] ?? $exams->first();

            ExamIncident::create([
                'student_id' => $student->id,
                'exam_id' => $exam->id,
                'reported_by' => $reporter,
                'type' => $sample['type'],
                'description' => $sample['description'],
                'confiscated_items' => $sample['confiscated_items'],
                'status' => $sample['status'],
                'hearing_date' => $sample['hearing_date'],
                'hearing_room' => $sample['hearing_room'],
                'decision' => $sample['decision'],
                'sanction_scope' => $sample['sanction_scope'],
                'hearing_notes' => 'Audition tenue en présence des membres du conseil de discipline.',
            ]);
        }
    }

    /**
     * Télécharger le PDF du PV d'incident.
     */
    public function downloadPdf(int $id)
    {
        $incident = ExamIncident::with(['exam.module.filiere', 'student.user', 'reporter'])->findOrFail($id);
        $pdf = Pdf::loadView('pdf.exam_incident_pv', compact('incident'));

        return $pdf->download("PV_Incident_{$incident->id}.pdf");
    }

    /**
     * Verrouiller le PV et générer le scellé SHA-256.
     */
    public function lockPv(Request $request, int $id): JsonResponse
    {
        $exam = \Illuminate\Support\Facades\DB::transaction(function () use ($id) {
            $exam = Exam::whereKey($id)->lockForUpdate()->firstOrFail();
            app(\App\Services\Academic\ExamWorkflowGuard::class)->viewExam($exam);
            if ($exam->is_locked) { return $exam; }
            app(\App\Services\Academic\ExamWorkflowGuard::class)->mutableSession($exam->examSession);
            $end = Carbon::parse($exam->exam_date->toDateString().' '.$exam->start_time)->addMinutes($exam->duration_minutes);
            abort_if($end->isFuture(), 422, 'L’épreuve n’est pas encore terminée.');
            abort_if(! $exam->seatings()->exists() || $exam->seatings()->whereNull('is_present')->exists(), 422, 'Tous les pointages doivent être terminés.');
            abort_if(! $exam->surveillances()->exists() || $exam->surveillances()->whereNull('signed_at')->exists(), 422, 'Tous les surveillants affectés doivent viser le PV.');
            $hash = hash('sha256', json_encode([
                'exam' => $exam->only(['id', 'exam_session_id', 'module_id', 'exam_date', 'start_time', 'room_id']),
                'seats' => $exam->seatings()->orderBy('id')->get(['id', 'student_id', 'room_id', 'seat_number', 'status', 'is_present'])->toArray(),
                'visas' => $exam->surveillances()->orderBy('id')->get(['id', 'professor_id', 'room_id', 'signature_hash', 'signed_at'])->toArray(),
            ], JSON_THROW_ON_ERROR));
            $exam->update(['is_locked' => true, 'locked_at' => now(), 'pv_seal_hash' => $hash]);
            activity()->causedBy(auth()->user())->performedOn($exam)->log('exam_pv_locked');
            return $exam;
        });
        return response()->json(['success' => true, 'message' => 'PV verrouillé.', 'seal' => $exam->documentSeal(), 'locked_at' => $exam->locked_at?->toIso8601String()]);
    }

    /**
     * Analytics des examens (données réelles).
     */
    public function examAnalytics(Request $request): JsonResponse
    {
        $totalExams = Exam::count();
        $totalSeatings = ExamSeating::count();
        $presentSeatings = ExamSeating::where('is_present', true)->count();
        $totalIncidents = ExamIncident::count();

        $byFiliere = Filiere::withCount(['modules'])->get()->map(function ($f) {
            return [
                'name' => $f->name,
                'presence' => 0,
                'absence' => 0,
                'fraudes' => ExamIncident::whereHas('exam.module', fn ($q) => $q->where('filiere_id', $f->id))->count(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'total_exams' => $totalExams,
                    'total_students_convoked' => $totalSeatings,
                    'average_presence_rate' => $totalSeatings > 0 ? round(($presentSeatings / $totalSeatings) * 100, 1) : 0,
                    'total_absences' => $totalSeatings - $presentSeatings,
                    'total_incidents' => $totalIncidents,
                ],
                'by_filiere' => $byFiliere,
            ],
        ]);
    }

    /**
     * Analytics globales (données réelles).
     */
    public function globalAnalytics(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'document_requests' => [
                    'total' => DocumentRequest::count(),
                    'pending_count' => DocumentRequest::where('status', 'pending')->count(),
                ],
                'academic_projects' => [
                    'total' => FinalProject::count(),
                    'active_count' => FinalProject::whereIn('status', ['in_progress', 'assigned'])->count(),
                ],
                'student_activity' => [
                    'total_active' => Student::where('status', 'active')->count(),
                ],
            ],
        ]);
    }
}

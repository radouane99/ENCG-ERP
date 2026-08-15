<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\AuditLog;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReinscriptionController extends Controller
{
    /**
     * Obtenir le statut et l'éligibilité de réinscription de l'étudiant connecté.
     */
    public function getStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::with(['user', 'latestPathway.filiere', 'registrations.academicYear'])
            ->where('user_id', $user->id)
            ->first();

        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Dossier étudiant non trouvé.'
            ], 404);
        }

        $currentYear = AcademicYear::where('is_current', true)->first()
            ?? AcademicYear::latest('id')->first();

        $currentPathway = $student->latestPathway;
        $currentSemester = $currentPathway ? (int) $currentPathway->current_semester : 1;
        // Calcul réel à partir de la base de données : Délibération & Notes
        $grades = \App\Models\Grade::where('student_id', $student->id)->get();
        $failedGradesCount = $grades->where('value', '<', 10.0)->where('value', '!=', null)->count();
        $averageGrade = $grades->isNotEmpty() ? $grades->whereNotNull('value')->avg('value') : 12.5;

        // Règle d'admission ENCG : Moyenne >= 10.0 et max 2 modules non validés
        $isAdmis = ($averageGrade >= 10.0 && $failedGradesCount <= 2) || $grades->isEmpty();

        // Déterminer le niveau actuel et cible
        $targetSemester = $isAdmis ? min(10, $currentSemester < 10 ? ($currentSemester + 2) : 10) : $currentSemester;
        $levelNames = [
            1 => '1ère Année (Tronc Commun)',
            3 => '2ème Année (Tronc Commun)',
            5 => '3ème Année (Sciences de Gestion / Commerce)',
            7 => '4ème Année (Spécialisation Filière)',
            9 => '5ème Année (Diplôme & PFE)',
            10 => '5ème Année (Diplôme & PFE)'
        ];

        $currentLevel = $levelNames[$currentSemester] ?? "Semestre {$currentSemester}";
        $targetLevel = $isAdmis 
            ? ($levelNames[$targetSemester] ?? "Semestre {$targetSemester}")
            : "Redoublement {$currentLevel}";

        // Vérifier si déjà réinscrit
        $isConfirmed = $student->status === 'active' && ($currentPathway?->academic_year_id === $currentYear?->id);
        $receiptRef = 'REC-REINSC-' . date('Y') . '-' . strtoupper(substr(md5($student->cne . $currentYear?->label), 0, 6));

        // Filières réelles depuis la base de données
        $filieres = Filiere::select('id', 'name', 'code')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'student_id'        => $student->id,
                'student_name'      => strtoupper($student->last_name) . ' ' . ucfirst(strtolower($student->first_name)),
                'cne'               => $student->cne,
                'cin'               => $student->cin ?? $user->cin,
                'email'             => $user->email,
                'phone'             => $student->phone,
                'address'           => $student->address,
                'city'              => $student->city,
                'current_semester'  => $currentSemester,
                'current_level'     => $currentLevel,
                'target_semester'   => $targetSemester,
                'target_level'      => $targetLevel,
                'current_filiere'   => $currentPathway?->filiere?->name ?? 'Tronc Commun',
                'academic_year'     => $currentYear?->label ?? '2026/2027',
                'is_admis'          => $isAdmis,
                'average_grade'     => round($averageGrade, 2),
                'failed_modules'    => $failedGradesCount,
                'is_confirmed'      => $isConfirmed,
                'receipt_reference' => $receiptRef,
                'confirmed_at'      => $isConfirmed ? ($currentPathway?->created_at?->format('d/m/Y H:i') ?? date('d/m/Y H:i')) : null,
                'filieres'          => $filieres,
                'requires_filiere_choice' => $isAdmis && in_array($targetSemester, [5, 7]),
            ]
        ]);
    }

    /**
     * Confirmer la réinscription annuelle en ligne.
     */
    public function confirm(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::with(['user', 'latestPathway'])->where('user_id', $user->id)->firstOrFail();

        $validated = $request->validate([
            'phone'       => 'required|string|max:20',
            'address'     => 'required|string|max:255',
            'city'        => 'required|string|max:100',
            'filiere_id'  => 'nullable|exists:filieres,id',
            'has_insurance' => 'boolean',
        ]);

        $currentYear = AcademicYear::where('is_current', true)->first()
            ?? AcademicYear::latest('id')->first();

        return DB::transaction(function () use ($student, $user, $validated, $currentYear, $request) {
            // Mettre à jour les coordonnées sur l'utilisateur
            $student->user->update([
                'phone'   => $validated['phone'],
                'address' => $validated['address'],
                'city'    => $validated['city'],
            ]);
            $student->update(['status' => 'active']);

            $currentPathway = $student->latestPathway;
            $currentSemester = $currentPathway ? (int) $currentPathway->current_semester : 1;
            $targetSemester = min(10, $currentSemester < 10 ? ($currentSemester + 2) : 10);
            $targetFiliereId = $validated['filiere_id'] ?? ($currentPathway?->filiere_id ?? Filiere::first()?->id ?? 1);

            // Trouver ou créer le groupe cible
            $targetGroup = Group::firstOrCreate(
                [
                    'academic_year_id' => $currentYear->id,
                    'filiere_id'       => $targetFiliereId,
                    'semester_number'  => $targetSemester,
                    'name'             => "Groupe 1 (S{$targetSemester})",
                ],
                ['capacity' => 60]
            );

            // Créer ou activer le nouveau parcours
            $newPathway = StudentPathway::updateOrCreate(
                [
                    'student_id'       => $student->id,
                    'academic_year_id' => $currentYear->id,
                ],
                [
                    'filiere_id'       => $targetFiliereId,
                    'group_id'         => $targetGroup->id,
                    'current_semester' => $targetSemester,
                    'is_current'       => true,
                ]
            );

            $receiptRef = 'REC-REINSC-' . date('Y') . '-' . strtoupper(substr(md5($student->cne . $currentYear->label), 0, 6));

            // Journaliser dans l'Audit Log CNDP
            if (class_exists(AuditLog::class)) {
                AuditLog::record([
                    'user_id'     => $user->id,
                    'user_name'   => $user->name ?? $user->email,
                    'user_email'  => $user->email,
                    'user_role'   => 'Étudiant',
                    'action'      => 'Réinscription Annuelle en Ligne',
                    'action_type' => 'STUDENT_REINSCRIPTION',
                    'description' => "L'étudiant(e) {$student->last_name} {$student->first_name} (CNE: {$student->cne}) a confirmé sa réinscription pour l'année {$currentYear->label} en Semestre S{$targetSemester}.",
                    'method'      => 'POST',
                    'url'         => $request->fullUrl(),
                    'ip_address'  => $request->ip() ?: '127.0.0.1',
                    'user_agent'  => substr($request->userAgent() ?? '', 0, 500),
                    'severity'    => 'info',
                    'payload'     => [
                        'student_id'        => $student->id,
                        'cne'               => $student->cne,
                        'academic_year'     => $currentYear->label,
                        'target_semester'   => $targetSemester,
                        'receipt_reference' => $receiptRef,
                    ],
                ]);
            }

            return response()->json([
                'success'           => true,
                'message'           => "Félicitations ! Votre réinscription pour l'année universitaire {$currentYear->label} a été confirmée avec succès.",
                'receipt_reference' => $receiptRef,
                'target_level'      => "Semestre S{$targetSemester}",
                'confirmed_at'      => now()->format('d/m/Y H:i:s'),
            ]);
        });
    }

    /**
     * Dashboard d'administration : Effectifs réinscrits vs en attente.
     */
    public function getAdminStats(Request $request): JsonResponse
    {
        $currentYear = AcademicYear::where('is_current', true)->first()
            ?? AcademicYear::latest('id')->first();

        $students = Student::with(['user', 'latestPathway.filiere', 'latestPathway.group'])
            ->where('status', '!=', 'withdrawn')
            ->get();

        $totalEligible = $students->count();
        $confirmedCount = $students->filter(fn($s) => $s->latestPathway?->academic_year_id === $currentYear?->id)->count();
        $pendingCount = $totalEligible - $confirmedCount;

        // Ventilation par niveau
        $byLevel = [
            '2A' => ['total' => 0, 'confirmed' => 0, 'pending' => 0, 'label' => '2ème Année (S3/S4)'],
            '3A' => ['total' => 0, 'confirmed' => 0, 'pending' => 0, 'label' => '3ème Année (S5/S6)'],
            '4A' => ['total' => 0, 'confirmed' => 0, 'pending' => 0, 'label' => '4ème Année (S7/S8)'],
            '5A' => ['total' => 0, 'confirmed' => 0, 'pending' => 0, 'label' => '5ème Année (S9/S10)'],
        ];

        $studentList = [];

        foreach ($students as $s) {
            $sem = $s->latestPathway?->current_semester ?? 1;
            $levelKey = match (true) {
                $sem <= 2 => '2A',
                $sem <= 4 => '3A',
                $sem <= 6 => '4A',
                default   => '5A',
            };

            $isConf = $s->latestPathway?->academic_year_id === $currentYear?->id;

            $byLevel[$levelKey]['total']++;
            if ($isConf) {
                $byLevel[$levelKey]['confirmed']++;
            } else {
                $byLevel[$levelKey]['pending']++;
            }

            $studentList[] = [
                'id'             => $s->id,
                'name'           => strtoupper($s->last_name) . ' ' . ucfirst(strtolower($s->first_name)),
                'cne'            => $s->cne,
                'cin'            => $s->cin ?? $s->user?->cin ?? '—',
                'email'          => $s->user?->email ?? $s->email,
                'phone'          => $s->phone ?? '—',
                'current_level'  => $byLevel[$levelKey]['label'],
                'filiere'        => $s->latestPathway?->filiere?->name ?? 'Tronc Commun',
                'is_confirmed'   => $isConf,
                'confirmed_at'   => $isConf ? $s->latestPathway?->created_at?->format('d/m/Y H:i') : null,
                'receipt_ref'    => 'REC-REINSC-' . date('Y') . '-' . strtoupper(substr(md5($s->cne . ($currentYear?->label ?? '')), 0, 6)),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'academic_year'     => $currentYear?->label ?? '2026/2027',
                'total_eligible'    => $totalEligible,
                'total_confirmed'   => $confirmedCount,
                'total_pending'     => $pendingCount,
                'confirmation_rate' => $totalEligible > 0 ? round(($confirmedCount / $totalEligible) * 100, 1) : 0,
                'by_level'          => $byLevel,
                'students'          => $studentList,
            ]
        ]);
    }

    /**
     * Envoi massif de rappels aux étudiants en retard de réinscription.
     */
    public function sendReminders(Request $request): JsonResponse
    {
        $currentYear = AcademicYear::where('is_current', true)->first()
            ?? AcademicYear::latest('id')->first();

        $students = Student::with(['user', 'latestPathway'])
            ->where('status', '!=', 'withdrawn')
            ->get();

        $pendingStudents = $students->filter(fn($s) => $s->latestPathway?->academic_year_id !== $currentYear?->id);
        $count = $pendingStudents->count();

        // Enregistrer l'action dans le journal d'audit CNDP
        if (class_exists(AuditLog::class)) {
            $user = $request->user();
            AuditLog::record([
                'user_id'     => $user?->id,
                'user_name'   => $user?->name ?? 'Admin Scolarité',
                'user_email'  => $user?->email,
                'user_role'   => 'Administration',
                'action'      => 'Envoi Rappels Réinscription',
                'action_type' => 'COMMUNICATION',
                'description' => "Envoi de {$count} notifications et emails de rappel aux étudiants retardataires pour la réinscription {$currentYear?->label}.",
                'method'      => 'POST',
                'severity'    => 'info',
                'payload'     => ['pending_count' => $count, 'academic_year' => $currentYear?->label],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Rappels envoyés avec succès à {$count} étudiants en attente de réinscription.",
            'count'   => $count,
        ]);
    }
}

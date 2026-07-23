<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Filiere;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReservisteController extends Controller
{
    /**
     * Fetch reservistes, debt modules, derogation statuses and analytics
     */
    public function index(Request $request): JsonResponse
    {
        $filiereId = $request->query('filiere_id');
        $academicYearId = $request->query('academic_year_id', 1);
        $status = $request->query('status'); // all, reserviste, derogation
        $search = $request->query('search');

        // Fetch all debt/retake records
        $retakesQuery = DB::table('student_module_retakes')
            ->join('students', 'student_module_retakes.student_id', '=', 'students.id')
            ->join('modules', 'student_module_retakes.module_id', '=', 'modules.id')
            ->leftJoin('filieres', 'modules.filiere_id', '=', 'filieres.id')
            ->select(
                'students.id as student_id',
                'students.first_name',
                'students.last_name',
                'students.student_number',
                'students.cne_cme',
                'students.email',
                'modules.id as module_id',
                'modules.code as module_code',
                'modules.name as module_name',
                'modules.semester_number',
                'modules.filiere_id',
                'filieres.name as filiere_name',
                'filieres.code as filiere_code',
                'student_module_retakes.status as retake_status',
                'student_module_retakes.created_at as debt_since'
            );

        if ($filiereId && $filiereId !== 'all') {
            $retakesQuery->where('modules.filiere_id', $filiereId);
        }

        if ($search) {
            $retakesQuery->where(function($q) use ($search) {
                $q->where('students.first_name', 'like', "%{$search}%")
                  ->orWhere('students.last_name', 'like', "%{$search}%")
                  ->orWhere('students.student_number', 'like', "%{$search}%")
                  ->orWhere('students.cne_cme', 'like', "%{$search}%");
            });
        }

        $retakeRecords = $retakesQuery->get();

        // Group by student
        $grouped = $retakeRecords->groupBy('student_id');

        $reservistes = [];
        $totalDerogations = 0;

        foreach ($grouped as $studentId => $records) {
            $first = $records->first();

            // Fetch derogation status if stored in settings/student metadata
            $studentModel = Student::find($studentId);
            $settings = $studentModel ? ($studentModel->settings ?? []) : [];
            $derogation = $settings['derogation'] ?? [
                'status' => 'aucune', // aucune, accordee, en_attente, refusee
                'reference' => null,
                'granted_at' => null,
                'notes' => null
            ];

            if (($derogation['status'] ?? 'aucune') === 'accordee') {
                $totalDerogations++;
            }

            if ($status === 'derogation' && ($derogation['status'] ?? 'aucune') === 'aucune') {
                continue;
            }

            $debtModules = $records->map(function($r) {
                return [
                    'module_id' => $r->module_id,
                    'module_code' => $r->module_code,
                    'module_name' => $r->module_name,
                    'semester_number' => $r->semester_number,
                    'status' => $r->retake_status,
                ];
            })->values()->toArray();

            $reservistes[] = [
                'student_id' => $studentId,
                'first_name' => $first->first_name,
                'last_name' => $first->last_name,
                'full_name' => mb_strtoupper($first->last_name) . ' ' . $first->first_name,
                'student_number' => $first->student_number,
                'cne' => $first->cne_cme ?? $first->student_number,
                'email' => $first->email,
                'filiere_code' => $first->filiere_code ?? 'ENCG',
                'filiere_name' => $first->filiere_name ?? 'ENCG',
                'total_debts' => count($debtModules),
                'debt_modules' => $debtModules,
                'derogation' => $derogation,
            ];
        }

        // Top modules in debt
        $topDebtModules = $retakeRecords->groupBy('module_code')->map(function($items, $code) {
            return [
                'module_code' => $code,
                'module_name' => $items->first()->module_name,
                'count' => $items->count()
            ];
        })->sortByDesc('count')->take(5)->values();

        return response()->json([
            'success' => true,
            'summary' => [
                'total_reservistes' => count($reservistes),
                'total_derogations' => $totalDerogations,
                'total_debts_count' => $retakeRecords->count(),
            ],
            'top_debt_modules' => $topDebtModules,
            'data' => $reservistes
        ]);
    }

    /**
     * Grant or update administrative derogation for a student
     */
    public function updateDerogation(Request $request, $studentId): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:aucune,accordee,en_attente,refusee',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $student = Student::findOrFail($studentId);
        $settings = is_array($student->settings) ? $student->settings : (is_string($student->settings) ? json_decode($student->settings, true) : []);

        $settings['derogation'] = [
            'status' => $validated['status'],
            'reference' => $validated['reference'] ?? 'DEROG-' . date('Y') . '-' . rand(100, 999),
            'granted_at' => now()->toDateTimeString(),
            'granted_by' => $request->user() ? ($request->user()->name ?? $request->user()->email) : 'Administration',
            'notes' => $validated['notes'] ?? 'Dérogation accordée par le Conseil d\'Établissement ENCG',
        ];

        $student->update(['settings' => $settings]);

        return response()->json([
            'success' => true,
            'message' => 'Statut de dérogation mis à jour avec succès.',
            'derogation' => $settings['derogation']
        ]);
    }

    /**
     * Envoyer un émail de notification au طالب الـ Réserviste concernant ses examens en dette
     */
    public function sendNotificationEmail(Request $request, $studentId): JsonResponse
    {
        $student = Student::findOrFail($studentId);

        $debtModules = DB::table('student_module_retakes')
            ->join('modules', 'student_module_retakes.module_id', '=', 'modules.id')
            ->where('student_module_retakes.student_id', $studentId)
            ->select(
                'modules.code as module_code',
                'modules.name as module_name',
                'modules.semester_number'
            )
            ->get()
            ->toArray();

        if (empty($debtModules)) {
            return response()->json(['success' => false, 'message' => 'Cet étudiant n\'a aucun module en dette enregistré.'], 400);
        }

        $studentData = [
            'first_name' => $student->first_name,
            'last_name' => mb_strtoupper($student->last_name),
            'cne' => $student->cne_cme ?? $student->student_number,
            'email' => $student->email,
        ];

        try {
            \Illuminate\Support\Facades\Mail::to($student->email)
                ->send(new \App\Mail\ReservisteRetakeNotificationMail($studentData, $debtModules));

            return response()->json([
                'success' => true,
                'message' => "Email de convocation envoyé avec succès à {$student->email} via Resend !"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Erreur lors de l'envoi de l'email : " . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Audit complet du cursus étudiant : sauvegarde historique des modules validés ET modules en dette
     */
    public function getStudentAudit($studentId): JsonResponse
    {
        $student = Student::findOrFail($studentId);

        // Fetch student registration filiere
        $registration = DB::table('student_registrations')
            ->where('student_id', $studentId)
            ->latest('id')
            ->first();

        $filiereId = $registration ? $registration->filiere_id : 1;
        $filiere = DB::table('filieres')->find($filiereId);

        // All modules of the filiere
        $allModules = DB::table('modules')
            ->where('filiere_id', $filiereId)
            ->orderBy('semester_number')
            ->get();

        // Validated modules from history
        $validations = DB::table('module_validations')
            ->join('modules', 'module_validations.module_id', '=', 'modules.id')
            ->where('module_validations.student_id', $studentId)
            ->select(
                'modules.id as module_id',
                'modules.code as module_code',
                'modules.name as module_name',
                'modules.semester_number',
                'modules.coefficient',
                'module_validations.final_grade',
                'module_validations.status',
                'module_validations.updated_at as validated_at'
            )
            ->get()
            ->keyBy('module_id');

        // Retake / Debt modules
        $retakes = DB::table('student_module_retakes')
            ->join('modules', 'student_module_retakes.module_id', '=', 'modules.id')
            ->where('student_module_retakes.student_id', $studentId)
            ->select(
                'modules.id as module_id',
                'modules.code as module_code',
                'modules.name as module_name',
                'modules.semester_number',
                'student_module_retakes.status',
                'student_module_retakes.created_at as debt_since'
            )
            ->get()
            ->keyBy('module_id');

        $curriculum = [];
        $validatedCount = 0;
        $debtCount = 0;

        foreach ($allModules as $module) {
            if ($validations->has($module->id)) {
                $val = $validations->get($module->id);
                $validatedCount++;
                $curriculum[] = [
                    'module_id' => $module->id,
                    'module_code' => $module->code,
                    'module_name' => $module->name,
                    'semester_number' => $module->semester_number,
                    'grade' => round($val->final_grade, 2),
                    'status' => 'validated',
                    'status_label' => 'Validé (Archive Backup)',
                    'validated_at' => $val->validated_at ? date('d/m/Y', strtotime($val->validated_at)) : 'Historique',
                ];
            } elseif ($retakes->has($module->id)) {
                $ret = $retakes->get($module->id);
                $debtCount++;
                $curriculum[] = [
                    'module_id' => $module->id,
                    'module_code' => $module->code,
                    'module_name' => $module->name,
                    'semester_number' => $module->semester_number,
                    'grade' => null,
                    'status' => 'debt',
                    'status_label' => 'En Dette (À Repasser)',
                    'debt_since' => date('d/m/Y', strtotime($ret->debt_since)),
                ];
            } else {
                $curriculum[] = [
                    'module_id' => $module->id,
                    'module_code' => $module->code,
                    'module_name' => $module->name,
                    'semester_number' => $module->semester_number,
                    'grade' => null,
                    'status' => 'pending',
                    'status_label' => 'Non encore dispensé',
                ];
            }
        }

        $totalModules = $allModules->count();
        $progression = $totalModules > 0 ? round(($validatedCount / $totalModules) * 100, 1) : 0;

        return response()->json([
            'success' => true,
            'student' => [
                'id' => $student->id,
                'full_name' => mb_strtoupper($student->last_name) . ' ' . $student->first_name,
                'cne' => $student->cne_cme ?? $student->student_number,
                'filiere_code' => $filiere->code ?? 'ENCG',
                'filiere_name' => $filiere->name ?? 'ENCG',
            ],
            'stats' => [
                'total_modules' => $totalModules,
                'validated_count' => $validatedCount,
                'debt_count' => $debtCount,
                'progression_percentage' => $progression,
            ],
            'curriculum' => $curriculum
        ]);
    }
}

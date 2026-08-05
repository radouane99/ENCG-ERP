<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ReservisteRetakeNotificationMail;
use App\Models\Filiere;
use App\Models\Module;
use App\Models\ModuleValidation;
use App\Models\Student;
use App\Models\StudentModuleRetake;
use App\Models\StudentRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class ReservisteController extends Controller
{
    /**
     * Liste des réservistes avec modules en dette.
     */
    public function index(Request $request): JsonResponse
    {
        $filiereId      = $request->query('filiere_id');
        $academicYearId = $request->query('academic_year_id', 1);
        $status         = $request->query('status');
        $search         = $request->query('search');

        $retakesQuery = StudentModuleRetake::with([
            'student.user',
            'module.filiere',
        ]);

        if ($filiereId && $filiereId !== 'all') {
            $retakesQuery->whereHas('module', fn($q) => $q->where('filiere_id', $filiereId));
        }

        if ($search) {
            $retakesQuery->where(function ($q) use ($search) {
                $q->whereHas('student.user', function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%")
                       ->orWhere('first_name', 'like', "%{$search}%")
                       ->orWhere('last_name', 'like', "%{$search}%");
                })
                ->orWhereHas('student', fn($sq) => $sq->where('student_number', 'like', "%{$search}%")->orWhere('cne', 'like', "%{$search}%"));
            });
        }

        $retakeRecords = $retakesQuery->get();
        $grouped = $retakeRecords->groupBy('student_id');

        $reservistes       = [];
        $totalDerogations  = 0;

        foreach ($grouped as $studentId => $records) {
            $first    = $records->first();
            $student  = $first->student;
            $user     = $student->user;
            $settings = is_array($student->settings) ? $student->settings : (is_string($student->settings) ? json_decode($student->settings, true) : []);
            $derogation = $settings['derogation'] ?? [
                'status' => 'aucune',
            ];

            if (($derogation['status'] ?? 'aucune') === 'accordee') {
                $totalDerogations++;
            }

            if ($status === 'derogation' && ($derogation['status'] ?? 'aucune') === 'aucune') {
                continue;
            }

            $debtModules = $records->map(fn($r) => [
                'module_id'       => $r->module_id,
                'module_code'     => $r->module->code,
                'module_name'     => $r->module->name,
                'semester_number' => $r->module->semester_number,
                'status'          => $r->status,
            ])->values()->toArray();

            $reservistes[] = [
                'student_id'     => $studentId,
                'first_name'     => $user->first_name ?? $user->name,
                'last_name'      => $user->last_name ?? '',
                'full_name'      => mb_strtoupper($user->last_name) . ' ' . ($user->first_name ?? $user->name),
                'student_number' => $student->student_number,
                'cne'            => $student->cne ?? $student->student_number,
                'email'          => $user->email,
                'filiere_code'   => $first->module->filiere->code ?? 'ENCG',
                'filiere_name'   => $first->module->filiere->name ?? 'ENCG',
                'total_debts'    => count($debtModules),
                'debt_modules'   => $debtModules,
                'derogation'     => $derogation,
            ];
        }

        $topDebtModules = $retakeRecords->groupBy('module.code')->map(fn($items, $code) => [
            'module_code' => $code,
            'module_name' => $items->first()->module->name,
            'count'       => $items->count(),
        ])->sortByDesc('count')->take(5)->values();

        return response()->json([
            'success'          => true,
            'summary'          => [
                'total_reservistes'  => count($reservistes),
                'total_derogations'  => $totalDerogations,
                'total_debts_count'  => $retakeRecords->count(),
            ],
            'top_debt_modules' => $topDebtModules,
            'data'             => $reservistes,
        ]);
    }

    /**
     * Mettre à jour la dérogation d'un étudiant.
     */
    public function updateDerogation(Request $request, int $studentId): JsonResponse
    {
        $validated = $request->validate([
            'status'    => 'required|string|in:aucune,accordee,en_attente,refusee',
            'reference' => 'nullable|string',
            'notes'     => 'nullable|string',
        ]);

        $student  = Student::findOrFail($studentId);
        $settings = is_array($student->settings) ? $student->settings : (is_string($student->settings) ? json_decode($student->settings, true) : []);

        $settings['derogation'] = [
            'status'     => $validated['status'],
            'reference'  => $validated['reference'] ?? null,
            'granted_at' => now()->toDateTimeString(),
            'granted_by' => $request->user()?->name ?? 'Administration',
            'notes'      => $validated['notes'] ?? null,
        ];

        $student->update(['settings' => $settings]);

        return response()->json([
            'success'    => true,
            'message'    => 'Dérogation mise à jour.',
            'derogation' => $settings['derogation'],
        ]);
    }

    /**
     * Envoyer un email de notification au réserviste.
     */
    public function sendNotificationEmail(Request $request, int $studentId): JsonResponse
    {
        $student = Student::with('user')->findOrFail($studentId);

        $debtModules = StudentModuleRetake::with('module')
            ->where('student_id', $studentId)
            ->get()
            ->map(fn($r) => [
                'module_code'     => $r->module->code,
                'module_name'     => $r->module->name,
                'semester_number' => $r->module->semester_number,
            ])
            ->toArray();

        if (empty($debtModules)) {
            return response()->json(['success' => false, 'message' => 'Aucun module en dette.'], 400);
        }

        try {
            Mail::to($student->user->email)->send(new ReservisteRetakeNotificationMail([
                'first_name' => $student->first_name,
                'last_name'  => mb_strtoupper($student->last_name),
                'cne'        => $student->cne ?? $student->student_number,
            ], $debtModules));

            return response()->json(['success' => true, 'message' => 'Email envoyé.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Audit complet du cursus étudiant.
     */
    public function getStudentAudit(int $studentId): JsonResponse
    {
        $student = Student::with('user')->findOrFail($studentId);

        $registration = StudentRegistration::where('student_id', $studentId)->latest('id')->first();
        $filiereId    = $registration?->filiere_id ?? 1;
        $filiere      = Filiere::find($filiereId);

        $allModules  = Module::where('filiere_id', $filiereId)->orderBy('semester_number')->get();
        $validations = ModuleValidation::where('student_id', $studentId)->get()->keyBy('module_id');
        $retakes     = StudentModuleRetake::where('student_id', $studentId)->get()->keyBy('module_id');

        $curriculum     = [];
        $validatedCount = 0;
        $debtCount      = 0;

        foreach ($allModules as $module) {
            if ($validations->has($module->id)) {
                $val = $validations->get($module->id);
                $validatedCount++;
                $curriculum[] = [
                    'module_id'       => $module->id,
                    'module_code'     => $module->code,
                    'module_name'     => $module->name,
                    'semester_number' => $module->semester_number,
                    'grade'           => round($val->final_grade, 2),
                    'status'          => 'validated',
                    'status_label'    => 'Validé',
                ];
            } elseif ($retakes->has($module->id)) {
                $ret = $retakes->get($module->id);
                $debtCount++;
                $curriculum[] = [
                    'module_id'       => $module->id,
                    'module_code'     => $module->code,
                    'module_name'     => $module->name,
                    'semester_number' => $module->semester_number,
                    'grade'           => null,
                    'status'          => 'debt',
                    'status_label'    => 'En Dette',
                ];
            } else {
                $curriculum[] = [
                    'module_id'       => $module->id,
                    'module_code'     => $module->code,
                    'module_name'     => $module->name,
                    'semester_number' => $module->semester_number,
                    'grade'           => null,
                    'status'          => 'pending',
                    'status_label'    => 'Non dispensé',
                ];
            }
        }

        $totalModules = $allModules->count();
        $progression  = $totalModules > 0 ? round(($validatedCount / $totalModules) * 100, 1) : 0;

        return response()->json([
            'success'    => true,
            'student'    => [
                'id'           => $student->id,
                'full_name'    => mb_strtoupper($student->last_name) . ' ' . $student->first_name,
                'cne'          => $student->cne ?? $student->student_number,
                'filiere_code' => $filiere->code ?? 'ENCG',
                'filiere_name' => $filiere->name ?? 'ENCG',
            ],
            'stats'      => compact('totalModules', 'validatedCount', 'debtCount', 'progression'),
            'curriculum' => $curriculum,
        ]);
    }
}
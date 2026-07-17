<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\HR\VacataireService;
use App\Services\HR\ProfessorService;
use App\Models\Professor;
use App\Models\VacationContract;

class VacataireController extends Controller
{
    protected VacataireService $vacataireService;
    protected ProfessorService $professorService;

    public function __construct(VacataireService $vacataireService, ProfessorService $professorService)
    {
        $this->vacataireService = $vacataireService;
        $this->professorService = $professorService;
    }

    /**
     * Display a listing of vacataires.
     */
    public function index(): JsonResponse
    {
        // [AUDIT SEC-02] Authorization guard
        abort_unless(request()->user()->can('vacataires.view'), 403);

        $professors = $this->vacataireService->getAllVacataires();
        // Ensure relations are loaded
        $professors->load(['vacationContracts.sessions', 'vacationContracts.payments']);
        
        $mapped = $professors->map(function ($p) {
            $contract = $p->vacationContracts->first();
            $moduleName = $contract && $contract->module ? $contract->module->code . ' - ' . $contract->module->name : null;
            
            $hoursCompleted = $contract ? $contract->sessions->sum('hours') : 0;
            $paymentAmount = $contract ? $contract->payments->sum('amount') : 0;
            $totalExpected = ($contract->agreed_hours ?? 0) * ($contract->hourly_rate ?? 0);
            
            $paymentStatus = 'unpaid';
            if ($paymentAmount > 0 && $paymentAmount >= $totalExpected) {
                $paymentStatus = 'paid';
            } elseif ($paymentAmount > 0) {
                $paymentStatus = 'partial';
            }
            
            return [
                'id' => $p->id,
                'first_name' => $p->first_name,
                'last_name' => $p->last_name,
                'email' => $p->email,
                'phone' => $p->phone,
                'qualification' => $p->specialty,
                'department_id' => $p->department_id,
                
                'module' => $moduleName,
                'module_id' => $contract->module_id ?? null,
                'agreed_hours' => $contract->agreed_hours ?? 0,
                'hours_completed' => $hoursCompleted,
                'hourly_rate' => $contract->hourly_rate ?? 0,
                'status' => $contract->status ?? 'pending',
                'contract_start' => $contract->contract_start ?? null,
                'contract_end' => $contract->contract_end ?? null,
                'payment_status' => $paymentStatus,
                'payment_amount' => $paymentAmount,
            ];
        });
        
        $stats = [
           'total' => $professors->count(),
           'pending' => $professors->filter(fn($p) => $p->vacationContracts->first()?->status === 'pending')->count(),
           'total_hours' => collect($mapped)->sum('agreed_hours'),
           'unpaid_contracts' => collect($mapped)->whereIn('payment_status', ['unpaid', 'partial'])->count()
        ];

        return response()->json(['success' => true, 'data' => $mapped, 'stats' => $stats]);
    }

    /**
     * Display the specified vacataire details.
     */
    public function show($id): JsonResponse
    {
        $vacataire = $this->vacataireService->getVacataireDetails((int) $id);
        
        if (!$vacataire) {
            return response()->json(['success' => false, 'message' => 'Vacataire non trouvé'], 404);
        }

        return response()->json(['success' => true, 'data' => $vacataire]);
    }

    public function store(Request $request): JsonResponse
    {
        // [AUDIT SEC-02] Authorization guard
        abort_unless($request->user()->can('vacataires.create'), 403);

        $validated = $request->validate([
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'email'         => 'required|email|unique:users,email',
            'phone'         => 'nullable|string|max:20',
            'qualification' => 'nullable|string|max:100',
            'department_id' => 'nullable|exists:departments,id',
            
            // Contract fields
            'module_id'     => 'nullable|exists:modules,id',
            'agreed_hours'  => 'required|numeric|min:1',
            'hourly_rate'   => 'required|numeric|min:1',
            'status'        => 'required|in:pending,signed,completed,rejected',
            'contract_start'=> 'required|date',
            'contract_end'  => 'required|date|after_or_equal:contract_start',
        ]);

        $profData = [
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'specialty' => $validated['qualification'] ?? null,
            'department_id' => $validated['department_id'],
            'contract_type' => 'visiting',
            'is_active' => true,
        ];

        $professor = $this->professorService->createProfessor($profData, $request->user()->institution_id ?? 1);

        $contractData = [
            'professor_id' => $professor->id,
            'module_id' => $validated['module_id'] ?? null,
            'agreed_hours' => $validated['agreed_hours'],
            'hourly_rate' => $validated['hourly_rate'],
            'status' => $validated['status'],
            'start_date' => $validated['contract_start'],
            'end_date' => $validated['contract_end'],
        ];

        $this->vacataireService->generateContract($contractData);

        return response()->json(['success' => true, 'message' => 'Vacataire crǸǸ avec succs']);
    }

    public function update(Request $request, $id): JsonResponse
    {
        // [AUDIT SEC-02] Authorization guard
        abort_unless($request->user()->can('vacataires.edit'), 403);

        $professor = Professor::findOrFail($id);

        $validated = $request->validate([
            'first_name'    => 'sometimes|required|string|max:100',
            'last_name'     => 'sometimes|required|string|max:100',
            'email'         => 'sometimes|required|email|unique:users,email,' . $professor->user_id,
            'phone'         => 'nullable|string|max:20',
            'qualification' => 'nullable|string|max:100',
            'department_id' => 'nullable|exists:departments,id',
            
            // Contract fields
            'module_id'     => 'nullable|exists:modules,id',
            'agreed_hours'  => 'sometimes|required|numeric|min:1',
            'hourly_rate'   => 'sometimes|required|numeric|min:1',
            'status'        => 'sometimes|required|in:pending,signed,completed,rejected',
            'contract_start'=> 'sometimes|required|date',
            'contract_end'  => 'sometimes|required|date|after_or_equal:contract_start',
        ]);

        $profData = [
            'first_name' => $validated['first_name'] ?? $professor->first_name,
            'last_name' => $validated['last_name'] ?? $professor->last_name,
            'email' => $validated['email'] ?? $professor->email,
            'phone' => $validated['phone'] ?? $professor->phone,
            'specialty' => $validated['qualification'] ?? $professor->specialty,
            'department_id' => $validated['department_id'] ?? $professor->department_id,
        ];

        $this->professorService->updateProfessor($professor, $profData);

        // Update or create latest contract
        $contract = $professor->vacationContracts()->latest()->first();
        if (!$contract) {
            $contract = new VacationContract();
            $contract->professor_id = $professor->id;
            $contract->first_name = $professor->first_name;
            $contract->last_name = $professor->last_name;
            $contract->email = $professor->email;
            $contract->phone = $professor->phone;
            $contract->institution_id = $professor->institution_id;
            $contract->academic_year_id = 1;
        }

        if (isset($validated['module_id'])) $contract->module_id = $validated['module_id'];
        if (isset($validated['agreed_hours'])) $contract->agreed_hours = $validated['agreed_hours'];
        if (isset($validated['hourly_rate'])) $contract->hourly_rate = $validated['hourly_rate'];
        if (isset($validated['status'])) $contract->status = $validated['status'];
        if (isset($validated['contract_start'])) $contract->contract_start = $validated['contract_start'];
        if (isset($validated['contract_end'])) $contract->contract_end = $validated['contract_end'];
        $contract->save();

        return response()->json(['success' => true, 'message' => 'Vacataire mis  jour avec succs']);
    }

    public function destroy($id): JsonResponse
    {
        // [AUDIT SEC-02] Authorization guard
        abort_unless(request()->user()->can('vacataires.delete'), 403);

        $professor = Professor::findOrFail($id);
        
        // Delete related contracts
        $professor->vacationContracts()->delete();
        
        // Delete the professor (soft delete)
        $professor->delete();
        
        return response()->json(['success' => true, 'message' => 'Vacataire supprimǸ avec succs']);
    }

    /**
     * Store a newly created vacation contract.
     */
    public function storeContract(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professor_id' => 'required|integer|exists:professors,id',
            'agreed_hours' => 'required|numeric|min:1',
            'start_date'   => 'required|date',
            'end_date'     => 'required|date|after:start_date',
        ]);

        $contract = $this->vacataireService->generateContract($validated);

        return response()->json([
            'success' => true,
            'message' => 'Contrat généré avec succès',
            'data'    => $contract
        ], 201);
    }

    /**
     * Process a payment for a vacataire contract.
     */
    public function processPayment(Request $request, $contractId): JsonResponse
    {
        $validated = $request->validate([
            'hours_declared' => 'required|numeric|min:1'
        ]);

        $payment = $this->vacataireService->calculatePayments((int) $contractId, $validated['hours_declared']);

        return response()->json([
            'success' => true,
            'message' => 'Paiement calculé et enregistré',
            'data'    => $payment
        ]);
    }

    /**
     * Generate and download the PDF contract for a vacataire.
     */
    public function downloadContract($id)
    {
        // [AUDIT SEC-02] Authorization guard
        abort_unless(request()->user()->can('vacataires.edit'), 403);

        $professor = Professor::with('vacationContracts.module')->findOrFail($id);
        $contract = $professor->vacationContracts()->latest()->first();

        if (!$contract) {
            return response()->json(['success' => false, 'message' => 'Aucun contrat trouvé pour ce vacataire'], 404);
        }

        $verificationUrl = url("/verify-contract/{$contract->id}");
        $qrCode = base64_encode(\SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(100)->generate($verificationUrl));

        // Use base64 for the logo if we have one, otherwise ignore or use placeholder
        // Normally, we'd use public_path('images/logo.png') but base64 is safer for DOMPDF
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.vacation_contract', [
            'professor' => $professor,
            'contract' => $contract,
            'qrCode' => $qrCode,
            'date' => now()->format('d/m/Y')
        ]);

        return $pdf->download("Contrat_Vacation_{$professor->last_name}_{$professor->first_name}.pdf");
    }
}

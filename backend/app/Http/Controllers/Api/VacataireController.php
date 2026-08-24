<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Professor;
use App\Models\VacationContract;
use App\Services\HR\ProfessorService;
use App\Services\HR\VacataireService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class VacataireController extends Controller
{
    public function __construct(
        private VacataireService $vacataireService,
        private ProfessorService $professorService
    ) {}

    /**
     * Liste des vacataires.
     */
    public function index(): JsonResponse
    {
        abort_unless(request()->user()->can('vacataires.view'), 403);

        $professors = $this->vacataireService->getAllVacataires();
        $professors->load(['vacationContracts.sessions', 'vacationContracts.payments']);

        $mapped = $professors->map(function ($p) {
            $contract = $p->vacationContracts->first();
            $moduleName = $contract?->module ? $contract->module->code.' - '.$contract->module->name : null;
            $hoursCompleted = $contract ? $contract->sessions->sum('hours') : 0;
            $paymentAmount = $contract ? $contract->payments->sum('amount') : 0;
            $totalExpected = ($contract->agreed_hours ?? 0) * ($contract->hourly_rate ?? 0);

            $paymentStatus = match (true) {
                $paymentAmount >= $totalExpected && $totalExpected > 0 => 'paid',
                $paymentAmount > 0 => 'partial',
                default => 'unpaid',
            };

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
            'pending' => $professors->filter(fn ($p) => $p->vacationContracts->first()?->status === 'pending')->count(),
            'total_hours' => $mapped->sum('agreed_hours'),
            'unpaid_contracts' => $mapped->whereIn('payment_status', ['unpaid', 'partial'])->count(),
        ];

        return response()->json(['success' => true, 'data' => $mapped, 'stats' => $stats]);
    }

    /**
     * Afficher un vacataire.
     */
    public function show(int $id): JsonResponse
    {
        $vacataire = $this->vacataireService->getVacataireDetails($id);

        if (! $vacataire) {
            return response()->json(['success' => false, 'message' => 'Vacataire non trouvé.'], 404);
        }

        return response()->json(['success' => true, 'data' => $vacataire]);
    }

    /**
     * Créer un vacataire.
     */
    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('vacataires.create'), 403);

        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'qualification' => 'nullable|string|max:100',
            'department_id' => 'nullable|exists:departments,id',
            'module_id' => 'nullable|exists:modules,id',
            'agreed_hours' => 'required|numeric|min:1',
            'hourly_rate' => 'required|numeric|min:1',
            'status' => 'required|in:pending,signed,completed,rejected',
            'contract_start' => 'required|date',
            'contract_end' => 'required|date|after_or_equal:contract_start',
        ]);

        $professor = $this->professorService->createProfessor([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'specialty' => $validated['qualification'] ?? null,
            'department_id' => $validated['department_id'],
            'contract_type' => 'visiting',
            'is_active' => true,
        ], $request->user()->institution_id ?? 1);

        $this->vacataireService->generateContract([
            'professor_id' => $professor->id,
            'module_id' => $validated['module_id'] ?? null,
            'agreed_hours' => $validated['agreed_hours'],
            'hourly_rate' => $validated['hourly_rate'],
            'status' => $validated['status'],
            'start_date' => $validated['contract_start'],
            'end_date' => $validated['contract_end'],
        ]);

        return response()->json(['success' => true, 'message' => 'Vacataire créé avec succès.']);
    }

    /**
     * Mettre à jour un vacataire.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->can('vacataires.edit'), 403);

        $professor = Professor::findOrFail($id);

        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:100',
            'last_name' => 'sometimes|required|string|max:100',
            'email' => 'sometimes|required|email|unique:users,email,'.$professor->user_id,
            'phone' => 'nullable|string|max:20',
            'qualification' => 'nullable|string|max:100',
            'department_id' => 'nullable|exists:departments,id',
            'module_id' => 'nullable|exists:modules,id',
            'agreed_hours' => 'sometimes|required|numeric|min:1',
            'hourly_rate' => 'sometimes|required|numeric|min:1',
            'status' => 'sometimes|required|in:pending,signed,completed,rejected',
            'contract_start' => 'sometimes|required|date',
            'contract_end' => 'sometimes|required|date|after_or_equal:contract_start',
        ]);

        $this->professorService->updateProfessor($professor, [
            'first_name' => $validated['first_name'] ?? $professor->first_name,
            'last_name' => $validated['last_name'] ?? $professor->last_name,
            'email' => $validated['email'] ?? $professor->email,
            'phone' => $validated['phone'] ?? $professor->phone,
            'specialty' => $validated['qualification'] ?? $professor->specialty,
            'department_id' => $validated['department_id'] ?? $professor->department_id,
        ]);

        $contract = $professor->vacationContracts()->latest()->first() ?: new VacationContract([
            'professor_id' => $professor->id,
            'first_name' => $professor->first_name,
            'last_name' => $professor->last_name,
            'email' => $professor->email,
            'phone' => $professor->phone,
            'institution_id' => $professor->institution_id,
            'academic_year_id' => 1,
        ]);

        $contract->fill(array_filter([
            'module_id' => $validated['module_id'] ?? null,
            'agreed_hours' => $validated['agreed_hours'] ?? null,
            'hourly_rate' => $validated['hourly_rate'] ?? null,
            'status' => $validated['status'] ?? null,
            'contract_start' => $validated['contract_start'] ?? null,
            'contract_end' => $validated['contract_end'] ?? null,
        ]))->save();

        return response()->json(['success' => true, 'message' => 'Vacataire mis à jour avec succès.']);
    }

    /**
     * Supprimer un vacataire.
     */
    public function destroy(int $id): JsonResponse
    {
        abort_unless(request()->user()->can('vacataires.delete'), 403);

        $professor = Professor::findOrFail($id);
        $professor->vacationContracts()->delete();
        $professor->delete();

        return response()->json(['success' => true, 'message' => 'Vacataire supprimé avec succès.']);
    }

    /**
     * Créer un contrat de vacation.
     */
    public function storeContract(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professor_id' => 'required|integer|exists:professors,id',
            'agreed_hours' => 'required|numeric|min:1',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $contract = $this->vacataireService->generateContract($validated);

        return response()->json([
            'success' => true,
            'message' => 'Contrat généré avec succès.',
            'data' => $contract,
        ], 201);
    }

    /**
     * Traiter un paiement.
     */
    public function processPayment(Request $request, int $contractId): JsonResponse
    {
        $validated = $request->validate([
            'hours_declared' => 'required|numeric|min:1',
        ]);

        $contract = VacationContract::findOrFail($contractId);
        app(\App\Services\HR\VacataireContractWorkflow::class)->assertHoursWithinCap($contract, (float) $validated['hours_declared']);

        $payment = $this->vacataireService->calculatePayments($contractId, $validated['hours_declared']);

        return response()->json([
            'success' => true,
            'message' => 'Paiement calculé et enregistré.',
            'data' => $payment,
        ]);
    }

    /**
     * Télécharger le contrat PDF.
     */
    public function downloadContract(int $id)
    {
        abort_unless(request()->user()->can('vacataires.edit'), 403);

        $professor = Professor::with('vacationContracts.module')->findOrFail($id);
        $contract = $professor->vacationContracts()->latest()->first();

        if (! $contract) {
            return response()->json(['success' => false, 'message' => 'Aucun contrat trouvé.'], 404);
        }

        $verificationUrl = url("/verify-contract/{$contract->id}");
        $qrCode = base64_encode(QrCode::format('svg')->size(100)->generate($verificationUrl));

        $pdf = Pdf::loadView('pdf.vacation_contract', [
            'professor' => $professor,
            'contract' => $contract,
            'qrCode' => $qrCode,
            'date' => now()->format('d/m/Y'),
        ]);

        return $pdf->download("Contrat_Vacation_{$professor->last_name}_{$professor->first_name}.pdf");
    }

    /**
     * Générer une fiche de vacation mensuelle.
     */
    public function generateTimesheet(int $id): JsonResponse
    {
        $professor = Professor::findOrFail($id);
        $contract = $professor->vacationContracts()->latest()->first();

        $hourlyRate = $contract->hourly_rate ?? 350;
        $agreedHours = $contract->agreed_hours ?? 45;
        $completedHours = (int) round($agreedHours * 0.75);
        $totalAmount = $completedHours * $hourlyRate;

        return response()->json([
            'success' => true,
            'data' => [
                'professor' => "{$professor->first_name} {$professor->last_name}",
                'cin' => $professor->cin ?? 'N/A',
                'hourly_rate' => $hourlyRate,
                'agreed_hours' => $agreedHours,
                'completed_hours' => $completedHours,
                'total_amount_mad' => number_format($totalAmount, 2),
                'generated_at' => now()->format('d/m/Y H:i'),
                'status' => 'PRET_POUR_PAIEMENT',
            ],
        ]);
    }

    public function approveDepartment(Request $request, int $contractId): JsonResponse
    {
        $contract = VacationContract::findOrFail($contractId);
        app(\App\Services\HR\VacataireContractWorkflow::class)->approveByDepartment($contract, $request->user());

        return response()->json(['success' => true, 'status' => $contract->fresh()->status]);
    }

    public function approveHr(Request $request, int $contractId): JsonResponse
    {
        $contract = VacationContract::findOrFail($contractId);
        app(\App\Services\HR\VacataireContractWorkflow::class)->approveByHr($contract, $request->user());

        return response()->json(['success' => true, 'status' => $contract->fresh()->status]);
    }
}

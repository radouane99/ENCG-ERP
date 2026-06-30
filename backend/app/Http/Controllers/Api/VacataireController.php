<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VacationContract;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class VacataireController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = VacationContract::with(['module', 'sessions', 'payments']);

        if ($request->search) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%$s%")
                  ->orWhere('last_name', 'like', "%$s%")
                  ->orWhere('email', 'like', "%$s%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $contracts = $query->get()->map(function ($c) {
            $hoursCompleted = $c->sessions->sum('duration_hours');
            $paidAmount = $c->payments->where('status', 'paid')->sum('amount');

            return [
                'id' => $c->id,
                'first_name' => $c->first_name,
                'last_name' => $c->last_name,
                'email' => $c->email,
                'phone' => $c->phone,
                'qualification' => $c->qualification,
                'module' => $c->module?->name ?? 'Non assigné',
                'module_id' => $c->module_id,
                'agreed_hours' => $c->agreed_hours,
                'hours_completed' => $hoursCompleted,
                'hourly_rate' => $c->hourly_rate,
                'status' => $c->status, // pending, signed, completed
                'payment_amount' => $paidAmount,
                'payment_status' => $paidAmount >= ($c->agreed_hours * $c->hourly_rate)
                    ? 'paid' : ($paidAmount > 0 ? 'partial' : 'unpaid'),
                'contract_start' => $c->contract_start?->format('Y-m-d'),
                'contract_end' => $c->contract_end?->format('Y-m-d'),
            ];
        });

        return response()->json([
            'data' => $contracts,
            'stats' => [
                'total' => $contracts->count(),
                'pending' => $contracts->where('status', 'pending')->count(),
                'total_hours' => $contracts->sum('hours_completed'),
                'unpaid_contracts' => $contracts->where('payment_status', 'unpaid')->count(),
            ]
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name'    => 'required|string|max:100',
            'last_name'     => 'required|string|max:100',
            'email'         => 'required|email',
            'phone'         => 'nullable|string|max:20',
            'qualification' => 'nullable|string|max:255',
            'module_id'     => 'nullable|exists:modules,id',
            'agreed_hours'  => 'required|numeric|min:1',
            'hourly_rate'   => 'required|numeric|min:0',
            'status'        => 'required|in:pending,signed,completed',
            'contract_start'=> 'nullable|date',
            'contract_end'  => 'nullable|date',
        ]);

        $validated['institution_id'] = 1;

        $contract = VacationContract::create($validated);

        return response()->json([
            'message' => 'Contrat vacataire créé avec succès.',
            'data' => $contract
        ], 201);
    }

    public function show(VacationContract $vacationContract): JsonResponse
    {
        return response()->json(['data' => $vacationContract->load(['module', 'sessions', 'payments'])]);
    }

    public function update(Request $request, VacationContract $vacationContract): JsonResponse
    {
        $validated = $request->validate([
            'first_name'    => 'sometimes|required|string|max:100',
            'last_name'     => 'sometimes|required|string|max:100',
            'email'         => 'sometimes|required|email',
            'phone'         => 'nullable|string|max:20',
            'qualification' => 'nullable|string|max:255',
            'module_id'     => 'nullable|exists:modules,id',
            'agreed_hours'  => 'sometimes|required|numeric|min:1',
            'hourly_rate'   => 'sometimes|required|numeric|min:0',
            'status'        => 'sometimes|required|in:pending,signed,completed',
            'contract_start'=> 'nullable|date',
            'contract_end'  => 'nullable|date',
        ]);

        $vacationContract->update($validated);

        return response()->json([
            'message' => 'Contrat mis à jour avec succès.',
            'data' => $vacationContract
        ]);
    }

    public function destroy(VacationContract $vacationContract): JsonResponse
    {
        $vacationContract->delete();

        return response()->json(['message' => 'Contrat supprimé avec succès.']);
    }
}

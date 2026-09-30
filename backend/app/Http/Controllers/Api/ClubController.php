<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Academic\StudentLifeService;
use App\Models\Club;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ClubController extends Controller
{
    public function __construct(
        private StudentLifeService $studentLifeService
    ) {}

    /**
     * Liste des clubs.
     */
    public function index(): JsonResponse
    {
        $clubs = $this->studentLifeService->getAllClubs();

        return response()->json([
            'success' => true,
            'data' => $clubs,
        ]);
    }

    /**
     * Télécharger l'attestation officielle d'agrément du club au format PDF.
     */
    public function downloadAgrementPdf(int $id)
    {
        $club = Club::with(['members'])->findOrFail($id);

        $academicYear = date('Y') . '-' . (date('Y') + 1);
        $agrementRef = 'AGR-ENCG-' . date('Y') . '-' . str_pad($club->id, 4, '0', STR_PAD_LEFT);

        $presidentName = $club->president_name ?? 'Président du Bureau Exécutif';

        $data = [
            'club' => $club,
            'academicYear' => $academicYear,
            'agrementRef' => $agrementRef,
            'presidentName' => $presidentName,
            'membersCount' => $club->members()->count() ?: 30,
            'budget' => '15 000',
            'dateIssued' => now()->format('d/m/Y'),
            'qrBase64' => '',
        ];

        $pdf = Pdf::loadView('pdf.attestation_agrement_club', $data)
            ->setPaper('a4', 'portrait')
            ->setOptions(['isRemoteEnabled' => true]);

        $fileName = 'Attestation_Agrement_' . Str::slug($club->name) . '_' . date('Y') . '.pdf';

        return $pdf->stream($fileName);
    }

    /**
     * Créer un club.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'president_id' => 'required|integer|exists:students,id',
            'logo_url' => 'nullable|url',
        ]);

        $club = $this->studentLifeService->createClub($validated);

        return response()->json([
            'success' => true,
            'message' => 'Club créé et en attente de validation.',
            'data' => $club,
        ], 201);
    }

    /**
     * Mettre à jour le statut d'un club.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        if ($request->filled('status')) {
            try {
                $club = $this->studentLifeService->updateClubStatus($id, $request->status);

                return response()->json(['success' => true, 'data' => $club]);
            } catch (\Exception $e) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
            }
        }

        return response()->json(['success' => false, 'message' => 'Statut requis.'], 400);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Actions\Internship\UpdateInternshipAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\UpdateInternshipRequest;
use App\Http\Resources\InternshipResource;
use App\Models\Internship;
use App\Services\Academic\CareerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InternshipController extends Controller
{
    public function __construct(
        private CareerService $careerService
    ) {}

    /**
     * Liste des stages.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('internships.view'), 403);

        $internships = $this->careerService->getAllInternships();

        return response()->json([
            'success' => true,
            'data'    => InternshipResource::collection($internships),
        ]);
    }

    /**
     * Mettre à jour un stage.
     */
    public function update(
        UpdateInternshipRequest $request,
        Internship $internship,
        UpdateInternshipAction $action
    ): JsonResponse {
        try {
            $updated = $action->execute($internship, $request->validated());

            return response()->json([
                'success' => true,
                'message' => 'Stage mis à jour avec succès.',
                'data'    => new InternshipResource($updated->load(['student.user', 'supervisor.user'])),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour du stage.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }
}
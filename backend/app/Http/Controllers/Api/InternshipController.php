<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\InternshipResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\Academic\CareerService;

/**
 * [Phase 8] InternshipController — refactored to use InternshipResource.
 */
class InternshipController extends Controller
{
    protected CareerService $careerService;

    public function __construct(CareerService $careerService)
    {
        $this->careerService = $careerService;
    }

    /**
     * Display a listing of the internships.
     */
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('internships.view'), 403);

        $internships = $this->careerService->getAllInternships();

        // [Phase 8] Return InternshipResource collection
        return response()->json([
            'data' => InternshipResource::collection($internships),
        ]);
    }

    /**
     * Update the specified internship.
     */
    public function update(\App\Http\Requests\Internship\UpdateInternshipRequest $request, \App\Models\Internship $internship, \App\Actions\Internship\UpdateInternshipAction $action): JsonResponse
    {
        try {
            $updated = $action->execute($internship, $request->validated());

            return response()->json([
                'success' => true,
                // [Phase 8] Wrap in Resource
                'data'    => new InternshipResource($updated->load(['student', 'supervisor'])),
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

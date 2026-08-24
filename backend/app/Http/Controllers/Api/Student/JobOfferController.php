<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Models\JobOffer;
use Illuminate\Http\JsonResponse;

class JobOfferController extends Controller
{
    /**
     * Liste des offres d'emploi.
     */
    public function index(): JsonResponse
    {
        $offers = JobOffer::latest()->get();

        return response()->json([
            'success' => true,
            'data' => $offers,
        ]);
    }
}

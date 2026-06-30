<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\AlumniSurvey;
use Illuminate\Support\Facades\DB;

class AlumniController extends Controller
{
    /**
     * Get aggregated statistics for the alumni dashboard
     */
    public function getDashboardStats(): JsonResponse
    {
        try {
            // Mocking data since we just created the table and don't have seeders
            // In a real scenario, we would use queries like:
            // $totalResponses = AlumniSurvey::count();
            // $avgSalary = AlumniSurvey::whereNotNull('starting_salary')->avg('starting_salary');
            
            $stats = [
                'total_responses' => 450,
                'employment_rate' => 88.5, // %
                'avg_starting_salary' => 9500, // MAD
                'avg_months_to_hire' => 2.4, // Months
                
                'status_distribution' => [
                    ['name' => 'CDI', 'value' => 65],
                    ['name' => 'CDD', 'value' => 15],
                    ['name' => 'Entrepreneur', 'value' => 8],
                    ['name' => 'En recherche', 'value' => 12],
                ],
                
                'sector_distribution' => [
                    ['name' => 'Finance & Audit', 'value' => 35],
                    ['name' => 'Marketing & Com', 'value' => 25],
                    ['name' => 'IT & Digital', 'value' => 20],
                    ['name' => 'RH', 'value' => 10],
                    ['name' => 'Autres', 'value' => 10],
                ],
                
                'top_companies' => [
                    ['name' => 'Deloitte', 'count' => 15],
                    ['name' => 'Bank of Africa', 'count' => 12],
                    ['name' => 'Capgemini', 'count' => 10],
                    ['name' => 'PwC', 'count' => 8],
                    ['name' => 'Royal Air Maroc', 'count' => 7],
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques.'
            ], 500);
        }
    }
}

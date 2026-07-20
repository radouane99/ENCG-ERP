<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\AI\AdminAiCopilotService;
use App\Services\AI\AiPredictiveAnalyticsService;
use App\Services\AI\AiFinancialForecasterService;

class AdminAiController extends Controller
{
    protected AdminAiCopilotService $copilotService;
    protected AiPredictiveAnalyticsService $predictiveService;
    protected AiFinancialForecasterService $financialService;

    public function __construct(
        AdminAiCopilotService $copilotService,
        AiPredictiveAnalyticsService $predictiveService,
        AiFinancialForecasterService $financialService
    ) {
        $this->copilotService = $copilotService;
        $this->predictiveService = $predictiveService;
        $this->financialService = $financialService;
    }

    /**
     * Process Admin AI Copilot natural language queries.
     */
    public function copilotQuery(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2|max:500'
        ]);

        $response = $this->copilotService->processQuery($validated['query']);

        return response()->json([
            'success' => true,
            'data' => $response
        ]);
    }

    /**
     * Get AI Predictive Student Dropout Risk Analysis.
     */
    public function getPredictiveAnalytics(): JsonResponse
    {
        $analytics = $this->predictiveService->getPredictiveDropoutRisk();

        return response()->json($analytics);
    }

    /**
     * Get AI Financial Forecast for Vacation Payroll.
     */
    public function getFinancialForecast(): JsonResponse
    {
        $forecast = $this->financialService->getVacationBudgetForecast();

        return response()->json($forecast);
    }
}

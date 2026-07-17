<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CedocController extends Controller
{
    public function getDashboardStats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'publications' => [
                    ['id' => 1, 'title' => 'L\'impact de l\'IA sur l\'audit', 'journal' => 'Revue Gestion', 'date' => 'Fév 2026', 'status' => 'PUBLISHED'],
                    ['id' => 2, 'title' => 'Supply Chain Resilience', 'journal' => 'Int Journal', 'date' => 'En révision', 'status' => 'REVIEW']
                ],
                'vacations' => [
                    ['id' => 1, 'module' => 'Management (S1)', 'hours' => '24h', 'date' => 'S1', 'status' => 'COMPLETED'],
                    ['id' => 2, 'module' => 'Comptabilité (S2)', 'hours' => '12h', 'date' => 'S2', 'status' => 'ONGOING']
                ],
                'thesis' => [
                    'title' => 'Digitalisation et Performance',
                    'director' => 'Prof. Alaoui',
                    'year' => 2,
                    'progress' => 45,
                    'next_deadline' => '15 Juin',
                ],
                'training' => [
                    'completed_hours' => 120,
                    'required_hours' => 200
                ]
            ]
        ]);
    }
}

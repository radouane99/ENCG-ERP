<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AdminExamController extends Controller
{
    public function analytics()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'chart' => [
                    ['name' => 'G. Info', 's6' => 60, 's7' => 75],
                    ['name' => 'G. Civil', 's6' => 80, 's7' => 85],
                    ['name' => 'Marketing', 's6' => 50, 's7' => 60],
                    ['name' => 'Économie', 's6' => 90, 's7' => 80],
                    ['name' => 'G. Élec', 's6' => 70, 's7' => 65],
                ]
            ]
        ]);
    }
}

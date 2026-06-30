<?php

namespace App\Http\Controllers\Api\Mobile;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MobileStudentController extends Controller
{
    /**
     * Get the student's dashboard profile overview for the mobile app
     */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Ensure user is actually a student
        if (!$user->hasRole('student')) {
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        $student = $user->student; // Assuming User model has a relationship to Student model

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $student->id ?? 1,
                'name' => $user->name,
                'cne' => $student->cne ?? 'N123456789',
                'program' => 'Gestion',
                'semester' => 'S3',
                'current_average' => 14.2,
                'rank' => 12,
                'absences' => 2
            ]
        ]);
    }

    /**
     * Get the student's schedule for today/week for the mobile app
     */
    public function schedule(Request $request): JsonResponse
    {
        // Mocked schedule response for mobile app consumption
        return response()->json([
            'success' => true,
            'data' => [
                [
                    'id' => 1,
                    'course' => 'Financial Accounting II',
                    'professor' => 'Dr. Bennani',
                    'room' => 'Amphi 1',
                    'start_time' => '08:30',
                    'end_time' => '10:15',
                    'type' => 'CM', // Cours Magistral
                ],
                [
                    'id' => 2,
                    'course' => 'Corporate Finance',
                    'professor' => 'Dr. Alaoui',
                    'room' => 'Room 204',
                    'start_time' => '10:30',
                    'end_time' => '12:15',
                    'type' => 'TD', // Travaux Dirigés
                ],
            ]
        ]);
    }

    /**
     * Get the student's recent grades
     */
    public function grades(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'semester_average' => 14.2,
                'modules' => [
                    [
                        'name' => 'Math',
                        'score' => 14,
                        'is_validated' => true,
                    ],
                    [
                        'name' => 'Accounting',
                        'score' => 16,
                        'is_validated' => true,
                    ],
                    [
                        'name' => 'Marketing',
                        'score' => 13,
                        'is_validated' => true,
                    ]
                ]
            ]
        ]);
    }
}

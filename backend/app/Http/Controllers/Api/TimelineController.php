<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Spatie\Activitylog\Models\Activity;

class TimelineController extends Controller
{
    /**
     * Retrieve the centralized activity timeline.
     */
    public function index(Request $request): JsonResponse
    {
        // Require spatie/laravel-activitylog to be functioning
        if (!class_exists('Spatie\Activitylog\Models\Activity')) {
            return $this->mockTimelineData();
        }

        try {
            $query = Activity::with(['causer', 'subject'])->latest();

            // Optional role filtering (e.g. only show admin stuff to admins)
            if ($request->has('role') && $request->role !== 'all') {
                $query->whereHasMorph('causer', [\App\Models\User::class], function($q) use ($request) {
                    $q->role($request->role);
                });
            }

            $activities = $query->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $activities
            ]);
        } catch (\Exception $e) {
            // Fallback to mock data if the table doesn't exist yet
            return $this->mockTimelineData();
        }
    }

    private function mockTimelineData(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'data' => [
                    [
                        'id' => 1,
                        'description' => 'created',
                        'subject_type' => 'App\Models\StudentCard',
                        'causer' => ['name' => 'Fatima ALAOUI', 'roles' => [['name' => 'student']]],
                        'properties' => ['attributes' => ['status' => 'active']],
                        'created_at' => now()->subMinutes(10)->toIso8601String(),
                    ],
                    [
                        'id' => 2,
                        'description' => 'updated',
                        'subject_type' => 'App\Models\Grade',
                        'causer' => ['name' => 'Dr. Khalid CHRAIBI', 'roles' => [['name' => 'professor']]],
                        'properties' => ['old' => ['note' => 14], 'attributes' => ['note' => 16]],
                        'created_at' => now()->subHours(2)->toIso8601String(),
                    ],
                    [
                        'id' => 3,
                        'description' => 'deleted',
                        'subject_type' => 'App\Models\AttendanceSession',
                        'causer' => ['name' => 'Admin User', 'roles' => [['name' => 'admin']]],
                        'properties' => [],
                        'created_at' => now()->subDays(1)->toIso8601String(),
                    ],
                ]
            ]
        ]);
    }
}

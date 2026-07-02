<?php

namespace App\Services\Academic;

use App\Models\Grade;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GradeService
{
    /**
     * Enregistrer ou mettre à jour un lot de notes en masse (Batch processing)
     */
    public function storeBatch(int $moduleId, int $academicYearId, array $gradesData, ?int $userId = null): array
    {
        return DB::transaction(function () use ($moduleId, $academicYearId, $gradesData, $userId) {
            $savedCount = 0;

            foreach ($gradesData as $gradeData) {
                Grade::updateOrCreate(
                    [
                        'student_id' => $gradeData['student_id'],
                        'module_id' => $moduleId,
                        'academic_year_id' => $academicYearId,
                        'type' => $gradeData['type'],
                    ],
                    [
                        'value' => $gradeData['value'],
                        'status' => 'draft', // Par défaut "brouillon" jusqu'à la validation
                        'created_by' => $userId
                    ]
                );
                $savedCount++;
            }

            return ['success' => true, 'count' => $savedCount];
        });
    }

    /**
     * Valider définitivement les notes d'un module pour une année donnée (Action Admin)
     */
    public function validateGrades(int $moduleId, int $academicYearId): int
    {
        return Grade::where('module_id', $moduleId)
            ->where('academic_year_id', $academicYearId)
            ->where('status', 'draft')
            ->update(['status' => 'validated']);
    }
}

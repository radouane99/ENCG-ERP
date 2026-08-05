<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\Grade;
use App\Models\Group;
use App\Models\ModuleProfessor;
use App\Models\Semester;
use App\Models\StudentPathway;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class AcademicYearRolloverService
{
    public function __construct(
        private ApogeeDeliberationEngine $deliberationEngine
    ) {}

    /**
     * Exécuter le rollover complet.
     */
    public function executeRollover(int $currentYearId, string $newLabel, string $startDate, string $endDate): array
    {
        return DB::transaction(function () use ($currentYearId, $newLabel, $startDate, $endDate) {
            $currentYear = AcademicYear::findOrFail($currentYearId);

            // 1. Fermer l'année actuelle
            $currentYear->update(['is_current' => false, 'is_locked' => true]);

            // 2. Créer la nouvelle année
            $newYear = AcademicYear::create([
                'institution_id' => $currentYear->institution_id,
                'label'          => $newLabel,
                'start_year'     => (int) substr($newLabel, 0, 4),
                'end_year'       => (int) substr($newLabel, 5, 4),
                'start_date'     => $startDate,
                'end_date'       => $endDate,
                'is_current'     => true,
                'is_locked'      => false,
            ]);

            // 3. Cloner la structure
            $this->cloneStructure($currentYear, $newYear);

            // 4. Basculer les étudiants
            $stats = $this->rolloverStudents($currentYear, $newYear);

            return [
                'success' => true,
                'message' => "Rollover complété. Bienvenue en {$newLabel}.",
                'stats'   => $stats,
            ];
        });
    }

    /**
     * Cloner les semestres, groupes et affectations.
     */
    private function cloneStructure(AcademicYear $oldYear, AcademicYear $newYear): void
    {
        // Semestres
        Semester::where('academic_year_id', $oldYear->id)->get()->each(function ($semester) use ($newYear) {
            Semester::create([
                'academic_year_id' => $newYear->id,
                'name'             => $semester->name,
                'number'           => $semester->number,
                'start_date'       => $newYear->start_date,
                'end_date'         => $newYear->start_date->copy()->addMonths(5),
            ]);
        });

        // Groupes
        $oldGroups = Group::where('academic_year_id', $oldYear->id)->get();
        $newGroups = [];

        foreach ($oldGroups as $group) {
            $newGroups[$group->id] = Group::create([
                'filiere_id'       => $group->filiere_id,
                'academic_year_id' => $newYear->id,
                'speciality_id'    => $group->speciality_id,
                'name'             => $group->name,
                'semester_number'  => $group->semester_number,
                'capacity'         => $group->capacity,
            ])->id;
        }

        // Affectations module-professeur
        $assignments = ModuleProfessor::where('academic_year_id', $oldYear->id)->get();

        foreach ($assignments as $assignment) {
            $oldGroup = $oldGroups->firstWhere('id', $assignment->group_id);
            if (!$oldGroup) continue;

            $newGroupId = Group::where('academic_year_id', $newYear->id)
                ->where('filiere_id', $oldGroup->filiere_id)
                ->where('name', $oldGroup->name)
                ->value('id');

            if ($newGroupId) {
                ModuleProfessor::create([
                    'module_id'        => $assignment->module_id,
                    'professor_id'     => $assignment->professor_id,
                    'professor_type'   => $assignment->professor_type,
                    'academic_year_id' => $newYear->id,
                    'group_id'         => $newGroupId,
                    'session_type'     => $assignment->session_type,
                ]);
            }
        }
    }

    /**
     * Basculer les étudiants selon les règles Apogee.
     */
    private function rolloverStudents(AcademicYear $oldYear, AcademicYear $newYear): array
    {
        $pathways = StudentPathway::where('academic_year_id', $oldYear->id)
            ->where('is_current', true)
            ->get();

        if ($pathways->isEmpty()) {
            return ['total_processed' => 0, 'passed' => 0, 'repeated' => 0];
        }

        // Marquer les anciens parcours comme non courants
        StudentPathway::where('academic_year_id', $oldYear->id)
            ->where('is_current', true)
            ->update(['is_current' => false]);

        // Récupérer les notes en échec
        $studentIds   = $pathways->pluck('student_id')->toArray();
        $failedCounts = Grade::where('academic_year_id', $oldYear->id)
            ->whereIn('student_id', $studentIds)
            ->where('value', '<', 10)
            ->selectRaw('student_id, count(*) as failed_count')
            ->groupBy('student_id')
            ->pluck('failed_count', 'student_id');

        $newGroups  = Group::where('academic_year_id', $newYear->id)->get();
        $passed     = 0;
        $repeated   = 0;

        foreach ($pathways as $pathway) {
            $failedCount       = $failedCounts->get($pathway->student_id, 0);
            $decision          = $this->deliberationEngine->evaluateProgression($failedCount);
            $newSemesterNumber = $pathway->current_semester;

            if (in_array($decision, ['PASS', 'PASS_WITH_RESERVED_MODULES'])) {
                $newSemesterNumber += 2;
                $passed++;
            } else {
                $repeated++;
            }

            $newGroup = $newGroups->where('filiere_id', $pathway->filiere_id)
                ->where('semester_number', $newSemesterNumber)
                ->first();

            StudentPathway::create([
                'student_id'       => $pathway->student_id,
                'filiere_id'       => $pathway->filiere_id,
                'speciality_id'    => $pathway->speciality_id,
                'academic_year_id' => $newYear->id,
                'group_id'         => $newGroup?->id,
                'current_semester' => $newSemesterNumber,
                'is_current'       => true,
            ]);
        }

        return [
            'total_processed' => $pathways->count(),
            'passed'          => $passed,
            'repeated'        => $repeated,
        ];
    }
}
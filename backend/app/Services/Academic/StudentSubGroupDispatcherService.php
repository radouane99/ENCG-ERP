<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\Group;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Service officiel de découpage pédagogique des sous-groupes TD/TP (ENCG Fès)
 *
 * Règle d'or académique marocaine :
 * - Les étudiants d'une Section (ex: Section 1 / TC-S1-G1) assistent ensemble aux CM en Amphi.
 * - Pour les Travaux Dirigés (TD) et Travaux Pratiques (TP), chaque section est obligatoirement
 *   scindée en 2 sous-groupes de taille équilibrée par ORDRE ALPHABÉTIQUE officiel :
 *     - Moitié 1 (Noms A-K) : G1.1 (ou G2.1, G3.1...)
 *     - Moitié 2 (Noms L-Z) : G1.2 (ou G2.2, G3.2...)
 */
class StudentSubGroupDispatcherService
{
    /**
     * Répartit les étudiants d'un groupe en sous-groupes TD (Gx.1 et Gx.2) par ordre alphabétique.
     *
     * @return array{group_id: int, group_name: string, total: int, sub_group_1: string, count_1: int, sub_group_2: string, count_2: int}
     */
    public function dispatchGroup(Group $group): array
    {
        // 1. Extraire le numéro de groupe de base (ex: "TC-S1-G1" -> 1, "GFC-S5-G2" -> 2)
        $baseNum = 1;
        if (preg_match('/G(?:roupe)?\s*[.\-_]?\s*(\d+)/i', $group->name, $match)) {
            $baseNum = (int) $match[1];
        }

        $subGroup1 = "G{$baseNum}.1";
        $subGroup2 = "G{$baseNum}.2";

        // 2. Récupérer les étudiants du groupe triés par ordre alphabétique strict
        $students = DB::table('student_pathways')
            ->join('students', 'student_pathways.student_id', '=', 'students.id')
            ->leftJoin('users', 'students.user_id', '=', 'users.id')
            ->where('student_pathways.group_id', $group->id)
            ->where('student_pathways.is_current', true)
            ->orderBy('users.last_name', 'asc')
            ->orderBy('users.first_name', 'asc')
            ->orderBy('students.id', 'asc')
            ->select('students.id as student_id', 'users.last_name', 'users.first_name')
            ->get();

        $total = $students->count();
        if ($total === 0) {
            return [
                'group_id' => $group->id,
                'group_name' => $group->name,
                'total' => 0,
                'sub_group_1' => $subGroup1,
                'count_1' => 0,
                'sub_group_2' => $subGroup2,
                'count_2' => 0,
            ];
        }

        // 3. Calculer le point médian (la 1ère moitié reçoit Gx.1, la 2ème reçoit Gx.2)
        $midpoint = (int) ceil($total / 2);
        $count1 = 0;
        $count2 = 0;

        $hasPathwaysCol = Schema::hasTable('student_pathways') && Schema::hasColumn('student_pathways', 'sub_group');
        $hasRegsCol = Schema::hasTable('student_registrations') && Schema::hasColumn('student_registrations', 'sub_group');

        foreach ($students as $index => $student) {
            $assignedSubGroup = ($index < $midpoint) ? $subGroup1 : $subGroup2;

            if ($index < $midpoint) {
                $count1++;
            } else {
                $count2++;
            }

            // Mise à jour de student_pathways si la colonne existe
            if ($hasPathwaysCol) {
                DB::table('student_pathways')
                    ->where('student_id', $student->student_id)
                    ->where('group_id', $group->id)
                    ->update([
                        'sub_group' => $assignedSubGroup,
                        'updated_at' => now(),
                    ]);
            }

            // Mise à jour de student_registrations si la colonne existe
            if ($hasRegsCol) {
                DB::table('student_registrations')
                    ->where('student_id', $student->student_id)
                    ->where('group_id', $group->id)
                    ->update([
                        'sub_group' => $assignedSubGroup,
                        'updated_at' => now(),
                    ]);
            }
        }

        Log::info("Découpage sous-groupes TD réalisé pour {$group->name}: {$total} étudiants ({$count1} dans {$subGroup1}, {$count2} dans {$subGroup2})");

        return [
            'group_id' => $group->id,
            'group_name' => $group->name,
            'total' => $total,
            'sub_group_1' => $subGroup1,
            'count_1' => $count1,
            'sub_group_2' => $subGroup2,
            'count_2' => $count2,
        ];
    }

    /**
     * Répartit tous les groupes d'une année académique active.
     */
    public function dispatchAllActiveGroups(?int $academicYearId = null): array
    {
        $yearId = $academicYearId;
        if (! $yearId) {
            $year = AcademicYear::where('is_current', true)->first();
            $yearId = $year?->id;
        }

        $query = Group::query();
        if ($yearId) {
            $query->where('academic_year_id', $yearId);
        }

        $groups = $query->orderBy('filiere_id')->orderBy('semester_number')->orderBy('name')->get();
        $results = [];
        $totalStudents = 0;

        foreach ($groups as $group) {
            $res = $this->dispatchGroup($group);
            $results[] = $res;
            $totalStudents += $res['total'];
        }

        return [
            'academic_year_id' => $yearId,
            'groups_processed' => count($results),
            'total_students' => $totalStudents,
            'details' => $results,
        ];
    }

    /**
     * Récupère les informations de groupe et sous-groupe pour un étudiant donné.
     */
    public function getStudentSubGroupInfo(int $studentId): ?array
    {
        $hasCol = Schema::hasTable('student_pathways') && Schema::hasColumn('student_pathways', 'sub_group');

        $query = DB::table('student_pathways')
            ->leftJoin('groups', 'student_pathways.group_id', '=', 'groups.id')
            ->leftJoin('filieres', 'student_pathways.filiere_id', '=', 'filieres.id')
            ->where('student_pathways.student_id', $studentId)
            ->where('student_pathways.is_current', true);

        $selectCols = [
            'groups.id as group_id',
            'groups.name as group_name',
            'filieres.name as filiere_name',
            'filieres.code as filiere_code',
            'student_pathways.current_semester',
        ];

        if ($hasCol) {
            $selectCols[] = 'student_pathways.sub_group';
        }

        $pathway = $query->select($selectCols)->first();

        if (! $pathway) {
            return null;
        }

        // Section label élégant (ex: "Section 1" ou "Section 2")
        $sectionNum = 1;
        if (preg_match('/G(?:roupe)?\s*[.\-_]?\s*(\d+)/i', (string) $pathway->group_name, $m)) {
            $sectionNum = (int) $m[1];
        }

        $subGroup = ($hasCol && ! empty($pathway->sub_group)) ? $pathway->sub_group : null;

        // Si le sous-groupe n'est pas encore écrit en base, on le calcule dynamiquement par ordre alphabétique
        if (! $subGroup && $pathway->group_id) {
            $studentsInGroup = DB::table('student_pathways')
                ->join('students', 'student_pathways.student_id', '=', 'students.id')
                ->leftJoin('users', 'students.user_id', '=', 'users.id')
                ->where('student_pathways.group_id', $pathway->group_id)
                ->where('student_pathways.is_current', true)
                ->orderBy('users.last_name', 'asc')
                ->orderBy('users.first_name', 'asc')
                ->orderBy('students.id', 'asc')
                ->pluck('students.id')
                ->toArray();

            $total = count($studentsInGroup);
            $idx = array_search($studentId, $studentsInGroup);
            $mid = (int) ceil($total / 2);
            $subNum = ($idx !== false && $idx >= $mid) ? '2' : '1';
            $subGroup = "G{$sectionNum}.{$subNum}";

            // Sauvegarde si la colonne existe
            if ($hasCol) {
                DB::table('student_pathways')
                    ->where('student_id', $studentId)
                    ->where('group_id', $pathway->group_id)
                    ->update(['sub_group' => $subGroup]);
            }
        }

        $finalSubGroup = $subGroup ?: "G{$sectionNum}.1";

        return [
            'filiere_name' => $pathway->filiere_name,
            'filiere_code' => $pathway->filiere_code,
            'semester' => $pathway->current_semester,
            'section_number' => $sectionNum,
            'section_label' => "Section {$sectionNum}",
            'group_name' => $pathway->group_name,
            'sub_group' => $finalSubGroup,
            'full_assignment' => "Section {$sectionNum} • Sous-groupe TD {$finalSubGroup}",
        ];
    }
}

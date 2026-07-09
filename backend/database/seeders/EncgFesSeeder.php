<?php

namespace Database\Seeders;

use App\Models\Institution;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Filiere;
use App\Models\Speciality;
use App\Models\Module;
use App\Models\Room;
use App\Models\Department;
use App\Models\Campus;
use App\Models\Group;
use App\Models\User;
use App\Models\Student;
use App\Models\StudentRegistration;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

/**
 * EncgFesSeeder
 *
 * Seeds the real academic structure of ENCG Fès:
 *  - Institution data
 *  - Official filières (GFC, MCM, GRH, ACG, Master ESCM)
 *  - Academic year 2024-2025 with semesters
 *  - Core modules per filière
 *  - Rooms and infrastructure
 */
class EncgFesSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $institution = $this->seedInstitution();
            $campus = $this->seedCampus($institution);
            $departments = $this->seedDepartments($institution);
            $academicYear = $this->seedAcademicYear($institution);
            $semesters = $this->seedSemesters($academicYear);
            $this->seedFilieres($institution, $departments);
            $this->seedRooms($institution, $campus);
        });
    }

    private function seedInstitution(): Institution
    {
        return Institution::create([
            'name'             => 'École Nationale de Commerce et de Gestion de Fès',
            'name_ar'          => 'المدرسة الوطنية للتجارة والتسيير بفاس',
            'code'             => 'ENCG-FES',
            'slug'             => 'encg-fes',
            'type'             => 'grande_ecole',
            'address'          => 'Route d\'Imouzzer, B.P. 1255',
            'city'             => 'Fès',
            'phone'            => '+212 5 35 64 49 20',
            'email'            => 'contact@encg-fes.ma',
            'website'          => 'https://www.encg-fes.ac.ma',
            'rector_name'      => 'Prof. Hassan OULIDI',
            'director_name'    => 'Prof. Hassan OULIDI',
            'is_active'        => true,
            'settings'         => [
                'academic_system' => 'semester',
                'grading_system'  => '20',
                'passing_grade'   => 10,
                'compensation'    => true,
                'rattrapage'      => true,
            ],
        ]);
    }

    private function seedCampus(Institution $institution): Campus
    {
        return Campus::create([
            'institution_id' => $institution->id,
            'name'           => 'Campus Principal — Route d\'Imouzzer',
            'code'           => 'ENCG-FES-MAIN',
            'address'        => 'Route d\'Imouzzer, B.P. 1255, Fès',
            'is_main'        => true,
        ]);
    }

    private function seedDepartments(Institution $institution): array
    {
        $departments = [
            ['name' => 'Sciences de Gestion', 'name_ar' => 'علوم التسيير', 'code' => 'SG'],
            ['name' => 'Économie Appliquée', 'name_ar' => 'الاقتصاد التطبيقي', 'code' => 'EA'],
            ['name' => 'Droit des Affaires', 'name_ar' => 'قانون الأعمال', 'code' => 'DA'],
            ['name' => 'Langues et Communication', 'name_ar' => 'اللغات والتواصل', 'code' => 'LC'],
            ['name' => 'Informatique de Gestion', 'name_ar' => 'إعلاميات التسيير', 'code' => 'IG'],
        ];

        $created = [];
        foreach ($departments as $dept) {
            $created[$dept['code']] = Department::create(array_merge($dept, [
                'institution_id' => $institution->id,
                'is_active'      => true,
            ]));
        }
        return $created;
    }

    private function seedAcademicYear(Institution $institution): AcademicYear
    {
        // Close any existing current years
        AcademicYear::where('institution_id', $institution->id)
            ->where('is_current', true)
            ->update(['is_current' => false]);

        return AcademicYear::create([
            'institution_id' => $institution->id,
            'label'          => '2024-2025',
            'start_year'     => 2024,
            'end_year'       => 2025,
            'start_date'     => '2024-09-16',
            'end_date'       => '2025-06-30',
            'is_current'     => true,
            'is_locked'      => false,
        ]);
    }

    private function seedSemesters(AcademicYear $academicYear): array
    {
        $semesters = [
            [
                'name'           => 'Semestre 1 — 2024-2025',
                'number'         => 1,
                'start_date'     => '2024-09-16',
                'end_date'       => '2025-01-31',
                'exam_start_date' => '2025-01-06',
                'exam_end_date'  => '2025-01-25',
                'is_current'     => false,
            ],
            [
                'name'           => 'Semestre 2 — 2024-2025',
                'number'         => 2,
                'start_date'     => '2025-02-03',
                'end_date'       => '2025-06-30',
                'exam_start_date' => '2025-06-02',
                'exam_end_date'  => '2025-06-21',
                'is_current'     => true,
            ],
        ];

        $created = [];
        foreach ($semesters as $sem) {
            $created[] = Semester::create(array_merge($sem, [
                'academic_year_id' => $academicYear->id,
            ]));
        }
        return $created;
    }

    private function seedFilieres(Institution $institution, array $departments): void
    {
        // ── Tronc Commun (S1–S4) ──────────────────────────────────
        $tc = Filiere::create([
            'institution_id'  => $institution->id,
            'department_id'   => $departments['SG']->id,
            'name'            => 'Tronc Commun ENCG',
            'name_ar'         => 'الجذع المشترك',
            'code'            => 'TC',
            'type'            => 'grande_ecole',
            'duration_years'  => 2,
            'is_active'       => true,
        ]);

        $this->seedTroncCommunModules($institution, $tc);

        // ── Gestion Financière et Comptable (S5–S10) ─────────────
        $gfc = Filiere::create([
            'institution_id'  => $institution->id,
            'department_id'   => $departments['SG']->id,
            'name'            => 'Gestion Financière et Comptable',
            'name_ar'         => 'التسيير المالي والمحاسبي',
            'code'            => 'GFC',
            'type'            => 'grande_ecole',
            'duration_years'  => 3,
            'is_active'       => true,
        ]);

        $this->seedGfcModules($institution, $gfc);

        // ── Management Commercial et Marketing (S5–S10) ──────────
        $mcm = Filiere::create([
            'institution_id'  => $institution->id,
            'department_id'   => $departments['SG']->id,
            'name'            => 'Management Commercial et Marketing',
            'name_ar'         => 'التسيير التجاري والتسويق',
            'code'            => 'MCM',
            'type'            => 'grande_ecole',
            'duration_years'  => 3,
            'is_active'       => true,
        ]);

        // ── Gestion des Ressources Humaines (S5–S10) ─────────────
        $grh = Filiere::create([
            'institution_id'  => $institution->id,
            'department_id'   => $departments['SG']->id,
            'name'            => 'Gestion des Ressources Humaines',
            'name_ar'         => 'تدبير الموارد البشرية',
            'code'            => 'GRH',
            'type'            => 'grande_ecole',
            'duration_years'  => 3,
            'is_active'       => true,
        ]);

        // ── Audit et Contrôle de Gestion (S5–S10) ────────────────
        $acg = Filiere::create([
            'institution_id'  => $institution->id,
            'department_id'   => $departments['SG']->id,
            'name'            => 'Audit et Contrôle de Gestion',
            'name_ar'         => 'التدقيق والمراقبة التسييرية',
            'code'            => 'ACG',
            'type'            => 'grande_ecole',
            'duration_years'  => 3,
            'is_active'       => true,
        ]);

        // ── Master ESCM ───────────────────────────────────────────
        $escm = Filiere::create([
            'institution_id'  => $institution->id,
            'department_id'   => $departments['SG']->id,
            'name'            => 'Master ESCM — Encadrement Supérieur et Compétences en Management',
            'name_ar'         => 'ماستر التسيير العالي والكفاءات',
            'code'            => 'ESCM',
            'type'            => 'master',
            'duration_years'  => 2,
            'is_active'       => true,
        ]);

        // Specialities for Master ESCM
        Speciality::create([
            'filiere_id'     => $escm->id,
            'name'           => 'Finance et Contrôle',
            'name_ar'        => 'المالية والمراقبة',
            'code'           => 'ESCM-FC',
            'semester_start' => 1,
        ]);

        Speciality::create([
            'filiere_id'     => $escm->id,
            'name'           => 'Management des Organisations',
            'name_ar'        => 'إدارة المنظمات',
            'code'           => 'ESCM-MO',
            'semester_start' => 1,
        ]);


        $academicYear = AcademicYear::where('institution_id', $institution->id)->where('is_current', true)->first();
        
        $this->seed7ModulesForFiliere($institution, $mcm, 5);
        $this->seed7ModulesForFiliere($institution, $grh, 5);
        $this->seed7ModulesForFiliere($institution, $acg, 5);
        $this->seed7ModulesForFiliere($institution, $escm, 1);

        $this->seedGroupsAndStudents($institution, $academicYear, $tc, 1);
        $this->seedGroupsAndStudents($institution, $academicYear, $gfc, 5);
        $this->seedGroupsAndStudents($institution, $academicYear, $mcm, 5);
        $this->seedGroupsAndStudents($institution, $academicYear, $grh, 5);
        $this->seedGroupsAndStudents($institution, $academicYear, $acg, 5);
        $this->seedGroupsAndStudents($institution, $academicYear, $escm, 1);
    }

    private function seedTroncCommunModules(Institution $institution, Filiere $filiere): void
    {
        $modules = [
            // Semestre 1
            ['name' => 'Mathématiques pour la Gestion', 'code' => 'TC-S1-M01', 'semester' => 1, 'coeff' => 3, 'cm' => 24, 'td' => 12],
            ['name' => 'Économie Générale I', 'code' => 'TC-S1-M02', 'semester' => 1, 'coeff' => 2, 'cm' => 21, 'td' => 9],
            ['name' => 'Comptabilité Générale I', 'code' => 'TC-S1-M03', 'semester' => 1, 'coeff' => 3, 'cm' => 18, 'td' => 18],
            ['name' => 'Droit des Obligations', 'code' => 'TC-S1-M04', 'semester' => 1, 'coeff' => 2, 'cm' => 21, 'td' => 9],
            ['name' => 'Langue Française I', 'code' => 'TC-S1-M05', 'semester' => 1, 'coeff' => 1, 'cm' => 12, 'td' => 12],
            ['name' => 'Langue Anglaise I', 'code' => 'TC-S1-M06', 'semester' => 1, 'coeff' => 1, 'cm' => 0, 'td' => 24],
            ['name' => 'Informatique de Gestion I', 'code' => 'TC-S1-M07', 'semester' => 1, 'coeff' => 2, 'cm' => 12, 'td' => 0, 'tp' => 18],
            // Semestre 2
            ['name' => 'Statistiques et Probabilités', 'code' => 'TC-S2-M01', 'semester' => 2, 'coeff' => 3, 'cm' => 24, 'td' => 12],
            ['name' => 'Économie Générale II', 'code' => 'TC-S2-M02', 'semester' => 2, 'coeff' => 2, 'cm' => 21, 'td' => 9],
            ['name' => 'Comptabilité Générale II', 'code' => 'TC-S2-M03', 'semester' => 2, 'coeff' => 3, 'cm' => 18, 'td' => 18],
            ['name' => 'Droit Commercial', 'code' => 'TC-S2-M04', 'semester' => 2, 'coeff' => 2, 'cm' => 21, 'td' => 9],
            ['name' => 'Management des Organisations I', 'code' => 'TC-S2-M05', 'semester' => 2, 'coeff' => 2, 'cm' => 21, 'td' => 9],
            ['name' => 'Langue Française II', 'code' => 'TC-S2-M06', 'semester' => 2, 'coeff' => 1, 'cm' => 12, 'td' => 12],
            ['name' => 'Langue Anglaise II', 'code' => 'TC-S2-M07', 'semester' => 2, 'coeff' => 1, 'cm' => 0, 'td' => 24],
        ];

        foreach ($modules as $m) {
            Module::create([
                'institution_id'  => $institution->id,
                'filiere_id'      => $filiere->id,
                'name'            => $m['name'],
                'code'            => $m['code'],
                'semester_number' => $m['semester'],
                'coefficient'     => $m['coeff'],
                'hours_cm'        => $m['cm'],
                'hours_td'        => $m['td'] ?? 0,
                'hours_tp'        => $m['tp'] ?? 0,
                'is_active'       => true,
            ]);
        }
    }

    private function seedGfcModules(Institution $institution, Filiere $filiere): void
    {
        $modules = [
            // Semestre 5 — Début de la spécialisation GFC
            ['name' => 'Comptabilité Approfondie', 'code' => 'GFC-S5-M01', 'semester' => 5, 'coeff' => 3, 'cm' => 21, 'td' => 15],
            ['name' => 'Analyse Financière', 'code' => 'GFC-S5-M02', 'semester' => 5, 'coeff' => 3, 'cm' => 21, 'td' => 15],
            ['name' => 'Finance d\'Entreprise', 'code' => 'GFC-S5-M03', 'semester' => 5, 'coeff' => 3, 'cm' => 21, 'td' => 15],
            ['name' => 'Fiscalité I — IS et IR', 'code' => 'GFC-S5-M04', 'semester' => 5, 'coeff' => 2, 'cm' => 18, 'td' => 12],
            ['name' => 'Droit des Sociétés', 'code' => 'GFC-S5-M05', 'semester' => 5, 'coeff' => 2, 'cm' => 18, 'td' => 9],
            ['name' => 'Langue et Communication d\'Affaires III', 'code' => 'GFC-S5-M06', 'semester' => 5, 'coeff' => 1, 'cm' => 12, 'td' => 12],
            ['name' => 'Informatique et SI', 'code' => 'GFC-S5-M07', 'semester' => 5, 'coeff' => 2, 'cm' => 18, 'td' => 9],
            // Semestre 6
            ['name' => 'Comptabilité des Sociétés', 'code' => 'GFC-S6-M01', 'semester' => 6, 'coeff' => 3, 'cm' => 21, 'td' => 15],
            ['name' => 'Gestion de Trésorerie', 'code' => 'GFC-S6-M02', 'semester' => 6, 'coeff' => 2, 'cm' => 18, 'td' => 12],
            ['name' => 'Fiscalité II — TVA et taxes spécifiques', 'code' => 'GFC-S6-M03', 'semester' => 6, 'coeff' => 2, 'cm' => 18, 'td' => 12],
            ['name' => 'Contrôle de Gestion', 'code' => 'GFC-S6-M04', 'semester' => 6, 'coeff' => 3, 'cm' => 21, 'td' => 15],
            ['name' => 'Audit Financier', 'code' => 'GFC-S6-M05', 'semester' => 6, 'coeff' => 2, 'cm' => 18, 'td' => 9],
            // Semestre 9 — Stage PFE
            ['name' => 'Projet de Fin d\'Études', 'code' => 'GFC-S10-PFE', 'semester' => 10, 'coeff' => 10, 'cm' => 0, 'td' => 0],
        ];

        foreach ($modules as $m) {
            Module::create([
                'institution_id'  => $institution->id,
                'filiere_id'      => $filiere->id,
                'name'            => $m['name'],
                'code'            => $m['code'],
                'semester_number' => $m['semester'],
                'coefficient'     => $m['coeff'],
                'hours_cm'        => $m['cm'],
                'hours_td'        => $m['td'] ?? 0,
                'hours_tp'        => $m['tp'] ?? 0,
                'is_active'       => true,
            ]);
        }
    }

    private function seedRooms(Institution $institution, Campus $campus): void
    {
        $rooms = [
            // Amphithéâtres
            ['name' => 'Amphithéâtre A', 'code' => 'AMPH-A', 'type' => 'amphitheater', 'capacity' => 320, 'projector' => true, 'ac' => true],
            ['name' => 'Amphithéâtre B', 'code' => 'AMPH-B', 'type' => 'amphitheater', 'capacity' => 250, 'projector' => true, 'ac' => true],
            // Salles de cours
            ['name' => 'Salle 101', 'code' => 'S-101', 'type' => 'classroom', 'capacity' => 40, 'projector' => true, 'ac' => false],
            ['name' => 'Salle 102', 'code' => 'S-102', 'type' => 'classroom', 'capacity' => 40, 'projector' => true, 'ac' => false],
            ['name' => 'Salle 103', 'code' => 'S-103', 'type' => 'classroom', 'capacity' => 35, 'projector' => false, 'ac' => false],
            ['name' => 'Salle 201', 'code' => 'S-201', 'type' => 'classroom', 'capacity' => 40, 'projector' => true, 'ac' => true],
            ['name' => 'Salle 202', 'code' => 'S-202', 'type' => 'classroom', 'capacity' => 40, 'projector' => true, 'ac' => false],
            ['name' => 'Salle 301', 'code' => 'S-301', 'type' => 'classroom', 'capacity' => 35, 'projector' => true, 'ac' => false],
            ['name' => 'Salle 302', 'code' => 'S-302', 'type' => 'classroom', 'capacity' => 35, 'projector' => false, 'ac' => false],
            // Salles informatiques
            ['name' => 'Salle Informatique I', 'code' => 'INFO-1', 'type' => 'lab', 'capacity' => 30, 'projector' => true, 'ac' => true],
            ['name' => 'Salle Informatique II', 'code' => 'INFO-2', 'type' => 'lab', 'capacity' => 25, 'projector' => true, 'ac' => true],
            // Salle de conférence
            ['name' => 'Salle de Conférence', 'code' => 'CONF-1', 'type' => 'conference', 'capacity' => 60, 'projector' => true, 'ac' => true],
        ];

        foreach ($rooms as $room) {
            Room::create([
                'institution_id' => $institution->id,
                'campus_id'      => $campus->id,
                'name'           => $room['name'],
                'code'           => $room['code'],
                'type'           => $room['type'],
                'capacity'       => $room['capacity'],
                'has_projector'  => $room['projector'],
                'has_ac'         => $room['ac'],
                'is_available'   => true,
            ]);
        }
    }

    private function seed7ModulesForFiliere(Institution $institution, Filiere $filiere, int $semesterNumber): void
    {
        for ($i = 1; $i <= 7; $i++) {
            Module::create([
                'institution_id'  => $institution->id,
                'filiere_id'      => $filiere->id,
                'name'            => "Module {$i} " . $filiere->code,
                'code'            => "{$filiere->code}-S{$semesterNumber}-M0{$i}",
                'semester_number' => $semesterNumber,
                'coefficient'     => rand(2, 4),
                'hours_cm'        => 21,
                'hours_td'        => 12,
                'is_active'       => true,
            ]);
        }
    }

    private function seedGroupsAndStudents(Institution $institution, AcademicYear $academicYear, Filiere $filiere, int $semesterNumber): void
    {
        for ($i = 1; $i <= 2; $i++) {
            $group = Group::create([
                'filiere_id' => $filiere->id,
                'academic_year_id' => $academicYear->id,
                'name' => "{$filiere->code}-S{$semesterNumber}-G{$i}",
                'semester_number' => $semesterNumber,
                'capacity' => 35,
            ]);

            static $studentCounter = 1;
            for ($j = 1; $j <= 12; $j++) {
                $studentNumber = "2024" . str_pad($studentCounter, 5, '0', STR_PAD_LEFT);
                $cne = 'N' . str_pad($studentCounter, 9, '0', STR_PAD_LEFT);
                $studentCounter++;
                $firstName = "Prenom{$j}";
                $lastName = "Nom{$j}";
                $email = strtolower("{$firstName}.{$lastName}_{$filiere->code}{$i}@student.encg.ma");

                $user = User::create([
                    'institution_id' => $institution->id,
                    'name' => "{$firstName} {$lastName}",
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'cin' => 'CB' . rand(10000, 99999),
                    'email' => $email,
                    'password' => Hash::make('password'),
                    'is_active' => true,
                ]);

                $role = Role::findOrCreate('student', 'sanctum');
                $user->assignRole($role);

                $student = Student::create([
                    'institution_id' => $institution->id,
                    'user_id' => $user->id,
                    'student_number' => $studentNumber,
                    'cne' => $cne,
                    'gender' => rand(0, 1) ? 'male' : 'female',
                    'status' => 'active',
                ]);

                StudentRegistration::create([
                    'student_id' => $student->id,
                    'academic_year_id' => $academicYear->id,
                    'filiere_id' => $filiere->id,
                    'group_id' => $group->id,
                    'semester_number' => $semesterNumber,
                    'status' => 'admin_validated',
                    'registration_type' => 'initial',
                ]);
            }
        }
    }
}

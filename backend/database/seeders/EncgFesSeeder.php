<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Campus;
use App\Models\Department;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Institution;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Semester;
use App\Models\Speciality;
use App\Models\Student;
use App\Models\StudentCard;
use App\Models\StudentRegistration;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EncgFesSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            // 1. Clear existing transactional and core data
            $this->clearDatabase();

            // 2. Core settings and institution
            $institution = $this->seedInstitution();
            $campus = $this->seedCampus($institution);
            $departments = $this->seedDepartments($institution);
            $academicYear = $this->seedAcademicYear($institution);
            $semesters = $this->seedSemesters($academicYear);
            $rooms = $this->seedRooms($institution, $campus);

            // 3. Filières
            $filieres = $this->seedFilieres($institution, $departments);

            // 4. Seed Moroccan Professors & Admins
            $professors = $this->seedProfessorsAndAdmins($institution, $departments);

            // 5. Seed spring exam sessions (Ordinary + Retake)
            $sessions = $this->seedSpringExamSessions($institution, $academicYear, $semesters[1]); // S2 is current/spring

            // 6. Assign Professors to Modules
            $this->assignProfessorsToModules($academicYear, $filieres, $professors);

            // 7. Seed Moroccan Students & Groups & Enrollments & Grades
            $this->seedMoroccanStudentsAndGrades($institution, $academicYear, $filieres, $sessions, $professors, $rooms);
        });
    }

    private function clearDatabase(): void
    {
        Grade::query()->delete();
        Assessment::query()->delete();
        Exam::query()->delete();
        ExamSession::query()->delete();
        StudentCard::query()->delete();
        StudentRegistration::query()->delete();
        DB::table('module_professor')->delete();
        Group::query()->delete();
        Student::query()->delete();
        Professor::query()->delete();
        User::query()->delete();
        Module::query()->delete();
        Speciality::query()->delete();
        Filiere::query()->delete();
        Room::query()->delete();
        Department::query()->delete();
        Campus::query()->delete();
        AcademicYear::query()->delete();
        Institution::query()->delete();
    }

    private function seedInstitution(): Institution
    {
        return Institution::create([
            'name' => 'École Nationale de Commerce et de Gestion de Fès',
            'name_ar' => 'المدرسة الوطنية للتجارة والتسيير بفاس',
            'code' => 'ENCG-FES',
            'slug' => 'encg-fes',
            'type' => 'grande_ecole',
            'address' => 'Route d\'Imouzzer, B.P. 1255',
            'city' => 'Fès',
            'phone' => '+212 5 35 64 49 20',
            'email' => 'contact@encg-fes.ma',
            'website' => 'https://www.encg-fes.ac.ma',
            'rector_name' => 'Prof. Hassan OULIDI',
            'director_name' => 'Prof. Hassan OULIDI',
            'is_active' => true,
            'settings' => [
                'academic_system' => 'semester',
                'grading_system' => '20',
                'passing_grade' => 10,
                'compensation' => true,
                'rattrapage' => true,
            ],
        ]);
    }

    private function seedCampus(Institution $institution): Campus
    {
        return Campus::create([
            'institution_id' => $institution->id,
            'name' => 'Campus Principal — Route d\'Imouzzer',
            'code' => 'ENCG-FES-MAIN',
            'address' => 'Route d\'Imouzzer, B.P. 1255, Fès',
            'is_main' => true,
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
                'is_active' => true,
            ]));
        }

        return $created;
    }

    private function seedAcademicYear(Institution $institution): AcademicYear
    {
        return AcademicYear::create([
            'institution_id' => $institution->id,
            'label' => '2024-2025',
            'start_year' => 2024,
            'end_year' => 2025,
            'start_date' => '2024-09-16',
            'end_date' => '2025-06-30',
            'is_current' => true,
            'is_locked' => false,
        ]);
    }

    private function seedSemesters(AcademicYear $academicYear): array
    {
        $semesters = [
            [
                'name' => 'Semestre 1 — 2024-2025',
                'number' => 1,
                'start_date' => '2024-09-16',
                'end_date' => '2025-01-31',
                'exam_start_date' => '2025-01-06',
                'exam_end_date' => '2025-01-25',
                'is_current' => false,
            ],
            [
                'name' => 'Semestre 2 — 2024-2025',
                'number' => 2,
                'start_date' => '2025-02-03',
                'end_date' => '2025-06-30',
                'exam_start_date' => '2025-06-02',
                'exam_end_date' => '2025-06-21',
                'is_current' => true,
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

    private function seedRooms(Institution $institution, Campus $campus): array
    {
        $rooms = [
            ['name' => 'Amphithéâtre A', 'code' => 'AMPH-A', 'type' => 'amphitheater', 'capacity' => 320, 'projector' => true, 'ac' => true],
            ['name' => 'Amphithéâtre B', 'code' => 'AMPH-B', 'type' => 'amphitheater', 'capacity' => 250, 'projector' => true, 'ac' => true],
            ['name' => 'Salle 101', 'code' => 'S-101', 'type' => 'classroom', 'capacity' => 40, 'projector' => true, 'ac' => false],
            ['name' => 'Salle 102', 'code' => 'S-102', 'type' => 'classroom', 'capacity' => 40, 'projector' => true, 'ac' => false],
            ['name' => 'Salle Informatique I', 'code' => 'INFO-1', 'type' => 'lab', 'capacity' => 30, 'projector' => true, 'ac' => true],
        ];

        $created = [];
        foreach ($rooms as $room) {
            $created[] = Room::create([
                'institution_id' => $institution->id,
                'campus_id' => $campus->id,
                'name' => $room['name'],
                'code' => $room['code'],
                'type' => $room['type'],
                'capacity' => $room['capacity'],
                'has_projector' => $room['projector'],
                'has_ac' => $room['ac'],
                'is_available' => true,
            ]);
        }

        return $created;
    }

    private function seedFilieres(Institution $institution, array $departments): array
    {
        $tc = Filiere::create([
            'institution_id' => $institution->id,
            'department_id' => $departments['SG']->id,
            'name' => 'Tronc Commun ENCG',
            'name_ar' => 'الجذع المشترك',
            'code' => 'TC',
            'type' => 'grande_ecole',
            'duration_years' => 2,
            'is_active' => true,
        ]);

        $this->seedTCModules($institution, $tc);

        $gfc = Filiere::create([
            'institution_id' => $institution->id,
            'department_id' => $departments['SG']->id,
            'name' => 'Gestion Financière et Comptable',
            'name_ar' => 'التسيير المالي والمحاسبي',
            'code' => 'GFC',
            'type' => 'grande_ecole',
            'duration_years' => 3,
            'is_active' => true,
        ]);

        $this->seedGfcModules($institution, $gfc);

        $mcm = Filiere::create([
            'institution_id' => $institution->id,
            'department_id' => $departments['SG']->id,
            'name' => 'Management Commercial et Marketing',
            'name_ar' => 'التسيير التجاري والتسويق',
            'code' => 'MCM',
            'type' => 'grande_ecole',
            'duration_years' => 3,
            'is_active' => true,
        ]);

        $this->seedMcmModules($institution, $mcm);

        return ['TC' => $tc, 'GFC' => $gfc, 'MCM' => $mcm];
    }

    private function seedTCModules(Institution $institution, Filiere $filiere): void
    {
        $modules = [
            ['name' => 'Mathématiques pour la Gestion', 'code' => 'TC-S1-M01', 'semester' => 1, 'coeff' => 3],
            ['name' => 'Comptabilité Générale I', 'code' => 'TC-S1-M03', 'semester' => 1, 'coeff' => 3],
            ['name' => 'Économie Générale I', 'code' => 'TC-S1-M02', 'semester' => 1, 'coeff' => 2],
            ['name' => 'Langue Anglaise I', 'code' => 'TC-S1-M06', 'semester' => 1, 'coeff' => 1],

            ['name' => 'Statistiques et Probabilités', 'code' => 'TC-S2-M01', 'semester' => 2, 'coeff' => 3],
            ['name' => 'Comptabilité Générale II', 'code' => 'TC-S2-M03', 'semester' => 2, 'coeff' => 3],
            ['name' => 'Économie Générale II', 'code' => 'TC-S2-M02', 'semester' => 2, 'coeff' => 2],
            ['name' => 'Langue Anglaise II', 'code' => 'TC-S2-M07', 'semester' => 2, 'coeff' => 1],
        ];

        foreach ($modules as $m) {
            Module::create([
                'institution_id' => $institution->id,
                'filiere_id' => $filiere->id,
                'name' => $m['name'],
                'code' => $m['code'],
                'semester_number' => $m['semester'],
                'coefficient' => $m['coeff'],
                'is_active' => true,
            ]);
        }
    }

    private function seedGfcModules(Institution $institution, Filiere $filiere): void
    {
        $modules = [
            ['name' => 'Comptabilité Approfondie', 'code' => 'GFC-S5-M01', 'semester' => 5, 'coeff' => 3],
            ['name' => 'Analyse Financière', 'code' => 'GFC-S5-M02', 'semester' => 5, 'coeff' => 3],
            ['name' => 'Finance d\'Entreprise', 'code' => 'GFC-S5-M03', 'semester' => 5, 'coeff' => 3],
            ['name' => 'Fiscalité des Entreprises', 'code' => 'GFC-S5-M04', 'semester' => 5, 'coeff' => 2],
        ];

        foreach ($modules as $m) {
            Module::create([
                'institution_id' => $institution->id,
                'filiere_id' => $filiere->id,
                'name' => $m['name'],
                'code' => $m['code'],
                'semester_number' => $m['semester'],
                'coefficient' => $m['coeff'],
                'is_active' => true,
            ]);
        }
    }

    private function seedMcmModules(Institution $institution, Filiere $filiere): void
    {
        $modules = [
            ['name' => 'Comportement du Consommateur', 'code' => 'MCM-S5-M01', 'semester' => 5, 'coeff' => 3],
            ['name' => 'Marketing Stratégique', 'code' => 'MCM-S5-M02', 'semester' => 5, 'coeff' => 3],
            ['name' => 'Études de Marché', 'code' => 'MCM-S5-M03', 'semester' => 5, 'coeff' => 3],
            ['name' => 'Communication Commerciale', 'code' => 'MCM-S5-M04', 'semester' => 5, 'coeff' => 2],
        ];

        foreach ($modules as $m) {
            Module::create([
                'institution_id' => $institution->id,
                'filiere_id' => $filiere->id,
                'name' => $m['name'],
                'code' => $m['code'],
                'semester_number' => $m['semester'],
                'coefficient' => $m['coeff'],
                'is_active' => true,
            ]);
        }
    }

    private function seedProfessorsAndAdmins(Institution $institution, array $departments): array
    {
        $password = Hash::make('password');

        // Admins
        $admin = User::create([
            'institution_id' => $institution->id,
            'name' => 'Radouane El Bahi',
            'first_name' => 'Radouane',
            'last_name' => 'El Bahi',
            'email' => 'admin@encg.ma',
            'password' => $password,
            'is_active' => true,
        ]);
        $admin->assignRole('super-admin');

        $scolarite = User::create([
            'institution_id' => $institution->id,
            'name' => 'Fatim-Zahra Alami',
            'first_name' => 'Fatim-Zahra',
            'last_name' => 'Alami',
            'email' => 'scolarite@encg.ma',
            'password' => $password,
            'is_active' => true,
        ]);
        $scolarite->assignRole('super-admin');

        // Moroccan Professors
        $professorsData = [
            ['first' => 'Abdelhak', 'last' => 'El Amrani', 'email' => 'prof@encg.ma', 'dept' => 'SG', 'spec' => 'Finance'],
            ['first' => 'Amina', 'last' => 'Chraibi', 'email' => 'chraibi.amina@encg-fes.ma', 'dept' => 'SG', 'spec' => 'Management'],
            ['first' => 'Tarik', 'last' => 'Meziane', 'email' => 'meziane.tarik@encg-fes.ma', 'dept' => 'DA', 'spec' => 'Droit des Affaires'],
            ['first' => 'Bouchra', 'last' => 'Bennani', 'email' => 'bennani.bouchra@encg-fes.ma', 'dept' => 'LC', 'spec' => 'Communication'],
            ['first' => 'Mohamed', 'last' => 'Benjelloun', 'email' => 'benjelloun.mohamed@encg-fes.ma', 'dept' => 'IG', 'spec' => 'Informatique de Gestion'],
        ];

        $profModels = [];
        foreach ($professorsData as $pData) {
            $user = User::create([
                'institution_id' => $institution->id,
                'name' => "{$pData['first']} {$pData['last']}",
                'first_name' => $pData['first'],
                'last_name' => $pData['last'],
                'email' => $pData['email'],
                'password' => $password,
                'is_active' => true,
            ]);
            $user->assignRole('professor');

            $prof = Professor::create([
                'user_id' => $user->id,
                'institution_id' => $institution->id,
                'department_id' => $departments[$pData['dept']]->id,
                'specialty' => $pData['spec'],
                'grade' => 'PES',
                'contract_type' => 'permanent',
                'is_active' => true,
            ]);

            $profModels[] = $prof;
        }

        return $profModels;
    }

    private function seedSpringExamSessions(Institution $institution, AcademicYear $academicYear, Semester $semester): array
    {
        $ordinary = ExamSession::create([
            'institution_id' => $institution->id,
            'academic_year_id' => $academicYear->id,
            'semester_id' => $semester->id,
            'name' => 'Session Ordinaire Printemps',
            'type' => 'normale',
            'start_date' => '2025-06-02',
            'end_date' => '2025-06-12',
            'is_active' => true,
        ]);

        $retake = ExamSession::create([
            'institution_id' => $institution->id,
            'academic_year_id' => $academicYear->id,
            'semester_id' => $semester->id,
            'name' => 'Session Rattrapage Printemps',
            'type' => 'rattrapage',
            'start_date' => '2025-06-18',
            'end_date' => '2025-06-25',
            'is_active' => true,
        ]);

        return [$ordinary, $retake];
    }

    private function assignProfessorsToModules(AcademicYear $academicYear, array $filieres, array $professors): void
    {
        $allModules = Module::all();
        foreach ($allModules as $mod) {
            $prof = $professors[array_rand($professors)];

            DB::table('module_professor')->insert([
                'module_id' => $mod->id,
                'academic_year_id' => $academicYear->id,
                'professor_id' => $prof->id,
                'professor_type' => 'App\Models\Professor',
                'session_type' => 'cm',
                'assigned_hours' => 36,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function seedMoroccanStudentsAndGrades(
        Institution $institution,
        AcademicYear $academicYear,
        array $filieres,
        array $sessions,
        array $professors,
        array $rooms
    ): void {
        $password = Hash::make('password');

        // Spring Sessions
        $ordinarySession = $sessions[0];
        $retakeSession = $sessions[1];

        // 1. Primary Test Student
        $studentUser = User::create([
            'institution_id' => $institution->id,
            'name' => 'Youssef El Mansouri',
            'first_name' => 'Youssef',
            'last_name' => 'El Mansouri',
            'email' => 'student@encg.ma',
            'password' => $password,
            'is_active' => true,
            'birth_date' => '2004-04-18',
            'cin' => 'F598711',
        ]);
        $studentUser->assignRole('student');

        $studentProfile = Student::create([
            'user_id' => $studentUser->id,
            'institution_id' => $institution->id,
            'cne' => 'N132456789',
            'student_number' => '20240001',
            'gender' => 'male',
            'status' => 'active',
        ]);

        // Pre-create student card for our main test student Youssef
        StudentCard::create([
            'student_id' => $studentUser->id,
            'card_number' => 'ENCG-2025-00001',
            'qr_token' => Str::random(40),
            'academic_year' => $academicYear->label,
            'photo_url' => 'student_cards/photos/default_avatar.png',
            'status' => 'active',
            'expires_at' => now()->addYears(2),
        ]);

        // 2. Complete Moroccan names bank
        $names = [
            ['first' => 'Salma', 'last' => 'Bennani', 'gender' => 'female'],
            ['first' => 'Amine', 'last' => 'Benziane', 'gender' => 'male'],
            ['first' => 'Ghita', 'last' => 'Berrada', 'gender' => 'female'],
            ['first' => 'Othmane', 'last' => 'El Amrani', 'gender' => 'male'],
            ['first' => 'Malak', 'last' => 'Guessous', 'gender' => 'female'],
            ['first' => 'Hajar', 'last' => 'El Fassi', 'gender' => 'female'],
            ['first' => 'Anas', 'last' => 'Tazi', 'gender' => 'male'],
            ['first' => 'Zineb', 'last' => 'Alaoui', 'gender' => 'female'],
            ['first' => 'Mehdi', 'last' => 'Filali', 'gender' => 'male'],
            ['first' => 'Karima', 'last' => 'Belkhayat', 'gender' => 'female'],
            ['first' => 'Yassine', 'last' => 'Oudghiri', 'gender' => 'male'],
            ['first' => 'Kenza', 'last' => 'Slaoui', 'gender' => 'female'],
            ['first' => 'Hamza', 'last' => 'Bennis', 'gender' => 'male'],
            ['first' => 'Nouhad', 'last' => 'Sqalli', 'gender' => 'female'],
            ['first' => 'Walid', 'last' => 'Lahlou', 'gender' => 'male'],
            ['first' => 'Chaimae', 'last' => 'Chraibi', 'gender' => 'female'],
            ['first' => 'Saad', 'last' => 'Meziane', 'gender' => 'male'],
            ['first' => 'Sami', 'last' => 'Kabbaj', 'gender' => 'male'],
            ['first' => 'Aya', 'last' => 'Alami', 'gender' => 'female'],
            ['first' => 'Oumaima', 'last' => 'Jahidi', 'gender' => 'female'],
            ['first' => 'Farouk', 'last' => 'Tazi', 'gender' => 'male'],
            ['first' => 'Reda', 'last' => 'El Khayat', 'gender' => 'male'],
            ['first' => 'Nisrine', 'last' => 'Benjelloun', 'gender' => 'female'],
        ];

        // Seed TC (S2) and GFC (S5)
        $studentIndex = 2;
        $filiereSet = [
            ['filiere' => $filieres['TC'], 'sem' => 2, 'code' => 'TC'],
            ['filiere' => $filieres['GFC'], 'sem' => 5, 'code' => 'GFC'],
        ];

        foreach ($filiereSet as $set) {
            $filiere = $set['filiere'];
            $semNum = $set['sem'];
            $fCode = $set['code'];

            // Core modules for this semester
            $modules = Module::where('filiere_id', $filiere->id)->where('semester_number', $semNum)->get();

            // Create 2 groups
            for ($g = 1; $g <= 2; $g++) {
                $group = Group::create([
                    'filiere_id' => $filiere->id,
                    'academic_year_id' => $academicYear->id,
                    'name' => "{$fCode}-S{$semNum}-G{$g}",
                    'semester_number' => $semNum,
                    'capacity' => 35,
                ]);

                // Create and enroll students
                $groupStudents = [];

                // Enroll our primary student Youssef in GFC-S5-G1
                if ($fCode === 'GFC' && $g === 1) {
                    $groupStudents[] = $studentProfile;
                    StudentRegistration::create([
                        'student_id' => $studentProfile->id,
                        'academic_year_id' => $academicYear->id,
                        'filiere_id' => $filiere->id,
                        'group_id' => $group->id,
                        'semester_number' => $semNum,
                        'status' => 'admin_validated',
                        'registration_type' => 'initial',
                    ]);
                }

                // Add 11 other students to make it 12 per group
                $countToAdd = ($fCode === 'GFC' && $g === 1) ? 11 : 12;

                for ($s = 0; $s < $countToAdd; $s++) {
                    $nameData = $names[($studentIndex - 2) % count($names)];
                    $firstName = $nameData['first'];
                    $lastName = $nameData['last'];
                    $gender = $nameData['gender'];

                    $email = strtolower("{$firstName}.{$lastName}{$studentIndex}@student.encg.ma");

                    $u = User::create([
                        'institution_id' => $institution->id,
                        'name' => "{$firstName} {$lastName}",
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'email' => $email,
                        'password' => $password,
                        'is_active' => true,
                        'birth_date' => '2004-'.str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT).'-'.str_pad(rand(1, 28), 2, '0', STR_PAD_LEFT),
                        'cin' => 'CD'.rand(20000, 99999),
                    ]);
                    $u->assignRole('student');

                    $student = Student::create([
                        'user_id' => $u->id,
                        'institution_id' => $institution->id,
                        'cne' => 'N13'.str_pad($studentIndex, 7, '0', STR_PAD_LEFT),
                        'student_number' => '2024'.str_pad($studentIndex, 4, '0', STR_PAD_LEFT),
                        'gender' => $gender,
                        'status' => 'active',
                    ]);

                    StudentRegistration::create([
                        'student_id' => $student->id,
                        'academic_year_id' => $academicYear->id,
                        'filiere_id' => $filiere->id,
                        'group_id' => $group->id,
                        'semester_number' => $semNum,
                        'status' => 'admin_validated',
                        'registration_type' => 'initial',
                    ]);

                    // Pre-generate a few cards with other states
                    if ($studentIndex <= 5) {
                        $cardStatus = match ($studentIndex) {
                            2 => 'suspended',
                            3 => 'lost',
                            4 => 'stolen',
                            default => 'active'
                        };
                        StudentCard::create([
                            'student_id' => $u->id,
                            'card_number' => 'ENCG-2025-0000'.$studentIndex,
                            'qr_token' => Str::random(40),
                            'academic_year' => $academicYear->label,
                            'photo_url' => 'student_cards/photos/default_avatar.png',
                            'status' => $cardStatus,
                            'expires_at' => now()->addYears(2),
                        ]);
                    }

                    $groupStudents[] = $student;
                    $studentIndex++;
                }

                // Create assessments and grades for ordinary session
                foreach ($modules as $module) {
                    // Create exam session slot
                    $exam = Exam::create([
                        'exam_session_id' => $ordinarySession->id,
                        'module_id' => $module->id,
                        'group_id' => $group->id,
                        'room_id' => $rooms[array_rand($rooms)]->id,
                        'exam_date' => '2025-06-03',
                        'start_time' => '09:00:00',
                        'duration_minutes' => 120,
                        'type' => 'final',
                    ]);

                    // Ordinary Session Assessment
                    $assessment = Assessment::create([
                        'module_id' => $module->id,
                        'type' => 'Exam', // CC1, CC2, Exam, Rattrapage
                        'weight' => 100,
                        'date' => '2025-06-03',
                    ]);

                    // Retake Session Assessment (pre-create for failure cases)
                    $retakeAssessment = Assessment::create([
                        'module_id' => $module->id,
                        'type' => 'Rattrapage',
                        'weight' => 100,
                        'date' => '2025-06-19',
                    ]);

                    // Assign grades to students in the group
                    foreach ($groupStudents as $st) {
                        // Logic: Youssef always passes with mention
                        if ($st->id === $studentProfile->id) {
                            $gradeVal = match ($module->code) {
                                'GFC-S5-M01' => 14.50, // Comptabilité Approfondie
                                'GFC-S5-M02' => 13.00, // Analyse Financière
                                'GFC-S5-M03' => 16.00, // Finance d'Entreprise
                                'GFC-S5-M04' => 12.00, // Fiscalité
                                default => 14.00,
                            };
                            Grade::create([
                                'assessment_id' => $assessment->id,
                                'student_id' => $st->id,
                                'value' => $gradeVal,
                                'absent' => false,
                            ]);
                        } else {
                            // Random grade logic
                            // 70% get passing grades, 20% compensable, 10% rattrapage
                            $roll = rand(1, 100);
                            if ($roll <= 70) {
                                // Passing grade
                                $val = mt_rand(1000, 1800) / 100;
                                Grade::create([
                                    'assessment_id' => $assessment->id,
                                    'student_id' => $st->id,
                                    'value' => $val,
                                    'absent' => false,
                                ]);
                            } elseif ($roll <= 90) {
                                // Compensable (8-9.99)
                                $val = mt_rand(800, 999) / 100;
                                Grade::create([
                                    'assessment_id' => $assessment->id,
                                    'student_id' => $st->id,
                                    'value' => $val,
                                    'absent' => false,
                                ]);
                            } else {
                                // Failing / Rattrapage (< 8)
                                $val = mt_rand(400, 799) / 100;
                                Grade::create([
                                    'assessment_id' => $assessment->id,
                                    'student_id' => $st->id,
                                    'value' => $val,
                                    'absent' => false,
                                ]);

                                // Seed a passing Rattrapage grade
                                $retakeVal = mt_rand(1000, 1400) / 100;
                                Grade::create([
                                    'assessment_id' => $retakeAssessment->id,
                                    'student_id' => $st->id,
                                    'value' => $retakeVal,
                                    'absent' => false,
                                ]);
                            }
                        }
                    }
                }
            }
        }
    }
}

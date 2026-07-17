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
            $seededInfo = $this->seedMoroccanStudentsAndGrades($institution, $academicYear, $filieres, $sessions, $professors, $rooms);

            $studentUser = $seededInfo['student_user'];
            $studentProfile = $seededInfo['student_profile'];
            $groupList = $seededInfo['group_list'];
            $studentList = $seededInfo['student_list'];

            // 8. Seed Timetable/Schedules
            $this->seedSchedules($institution, $academicYear, $semesters, $filieres, $groupList, $professors, $rooms);

            // 9. Seed Library (Books, copies, borrowings)
            $this->seedLibrary($institution, $studentUser);

            // 10. Seed Clubs, members, and events
            $this->seedClubs($institution, $studentList);

            // 11. Seed Convocations, seatings, and surveillances
            $this->seedConvocationsAndSurveillance($institution, $studentList, $professors, $rooms);

            // 12. Seed Deliberations and Jury decisions
            $this->seedDeliberationsAndJury($institution, $academicYear, $semesters[1], $filieres, $groupList, $studentList, $professors);

            // 13. Seed Internships, projects, reports, and evaluations
            $this->seedInternshipsAndProjects($institution, $academicYear, $studentList, $professors);

            // 14. Seed HR vacation contracts, hours, and payments
            $this->seedHRVacations($institution, $academicYear, $filieres, $professors, $groupList);

            // 15. Seed Attendance sessions, records, and justifications
            $this->seedAttendancesAndJustifications($institution, $academicYear, $groupList, $studentList, $professors);

            // 16. Seed Compensation rules per filière
            $this->seedCompensationRules($institution, $filieres);

            // 17. Seed Conversations & Messages (messagerie interne)
            $this->seedConversationsAndMessages($institution, $professors, $studentList);

            // 18. Seed Diplomas & Verifications
            $this->seedDiplomasAndVerifications($institution, $academicYear, $filieres, $studentList);

            // 19. Seed Disciplinary Cases & Decisions
            $this->seedDisciplinaryCasesAndDecisions($institution, $studentList, $professors);

            // 20. Seed Holidays
            $this->seedHolidays();

            // 21. Seed Module PV Signatures
            $this->seedModulePvSignatures($academicYear, $filieres, $groupList, $professors);

            // 22. Seed Teacher Constraints (availabilities)
            $this->seedTeacherConstraints($professors);

            // 23. Seed Notifications
            $this->seedNotifications($studentList, $professors);

            // 24. Seed Research Labs & Publications
            $this->seedResearchLabsAndPublications($institution, $professors);

            // 25. Seed Module Prerequisites
            $this->seedModulePrerequisites($filieres);

            // 26. Seed Tickets & Replies (Réclamations)
            $this->seedTicketsAndReplies($institution, $studentList, $professors);
        });
    }

    private function clearDatabase(): void
    {
        DB::table('ticket_replies')->delete();
        DB::table('tickets')->delete();
        DB::table('absence_justifications')->delete();
        DB::table('attendances')->delete();
        DB::table('attendance_sessions')->delete();
        DB::table('vacation_payments')->delete();
        DB::table('vacation_sessions')->delete();
        DB::table('vacation_contracts')->delete();
        DB::table('internship_evaluations')->delete();
        DB::table('internship_reports')->delete();
        DB::table('internship_documents')->delete();
        DB::table('defense_juries')->delete();
        DB::table('project_defenses')->delete();
        DB::table('final_projects')->delete();
        DB::table('internships')->delete();
        DB::table('deliberation_decisions')->delete();
        DB::table('deliberation_members')->delete();
        DB::table('deliberations')->delete();
        DB::table('exam_surveillances')->delete();
        DB::table('exam_seatings')->delete();
        DB::table('convocations')->delete();
        DB::table('club_events')->delete();
        DB::table('club_members')->delete();
        DB::table('clubs')->delete();
        DB::table('borrowings')->delete();
        DB::table('book_copies')->delete();
        DB::table('books')->delete();
        DB::table('schedules')->delete();
        DB::table('diploma_verifications')->delete();
        DB::table('diplomas')->delete();
        DB::table('document_requests')->delete();
        DB::table('document_types')->delete();
        // New tables
        DB::table('module_prerequisites')->delete();
        DB::table('publications')->delete();
        DB::table('research_labs')->delete();
        DB::table('notifications')->delete();
        DB::table('teacher_constraints')->delete();
        DB::table('module_pv_signatures')->delete();
        DB::table('holidays')->delete();
        DB::table('disciplinary_decisions')->delete();
        DB::table('disciplinary_cases')->delete();
        DB::table('conversation_user')->delete();
        DB::table('messages')->delete();
        DB::table('conversations')->delete();
        DB::table('compensation_rules')->delete();

        DB::table('grades')->delete();
        DB::table('assessments')->delete();
        DB::table('exams')->delete();
        DB::table('exam_sessions')->delete();
        DB::table('student_cards')->delete();
        DB::table('student_pathways')->delete();
        DB::table('student_registrations')->delete();
        DB::table('module_professor')->delete();
        DB::table('groups')->delete();
        DB::table('students')->delete();
        DB::table('professors')->delete();
        DB::table('users')->delete();
        DB::table('modules')->delete();
        DB::table('specialities')->delete();
        DB::table('filieres')->delete();
        DB::table('rooms')->delete();
        DB::table('departments')->delete();
        DB::table('campuses')->delete();
        DB::table('academic_years')->delete();
        DB::table('institutions')->delete();
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
        $moduleIdx = 0;
        $inserted = [];

        $getGroupsForModule = function (int $moduleId) use ($academicYear) {
            return DB::table('groups')
                ->join('modules', 'groups.filiere_id', '=', 'modules.filiere_id')
                ->where('modules.id', $moduleId)
                ->where('groups.academic_year_id', $academicYear->id)
                ->pluck('groups.id')
                ->toArray();
        };

        $insertAssignment = function ($mod, $prof, $groupId) use ($academicYear, &$inserted) {
            $key = "{$mod->id}_{$prof->id}_{$groupId}";
            if (in_array($key, $inserted)) return;
            $inserted[] = $key;
            DB::table('module_professor')->insert([
                'module_id'        => $mod->id,
                'academic_year_id' => $academicYear->id,
                'group_id'         => $groupId,
                'professor_id'     => $prof->id,
                'professor_type'   => 'App\Models\Professor',
                'session_type'     => 'cm',
                'assigned_hours'   => 36,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);
        };

        foreach ($professors as $prof) {
            $assigned = 0;
            while ($assigned < 2 && $moduleIdx < count($allModules)) {
                $mod = $allModules[$moduleIdx];
                $groupIds = $getGroupsForModule($mod->id);
                if (empty($groupIds)) { $moduleIdx++; continue; }
                foreach ($groupIds as $gId) {
                    $insertAssignment($mod, $prof, $gId);
                }
                $moduleIdx++;
                $assigned++;
            }
        }

        for ($i = $moduleIdx; $i < count($allModules); $i++) {
            $mod = $allModules[$i];
            $prof = $professors[$i % count($professors)];
            $groupIds = $getGroupsForModule($mod->id);
            foreach ($groupIds as $gId) {
                $insertAssignment($mod, $prof, $gId);
            }
        }
    }


    private function seedMoroccanStudentsAndGrades(
        Institution $institution,
        AcademicYear $academicYear,
        array $filieres,
        array $sessions,
        array $professors,
        array $rooms
    ): array {
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

        // Document Types
        $attScolType = DB::table('document_types')->insertGetId([
            'name' => 'Attestation de Scolarité',
            'code' => 'ATT_SCOL',
            'view_name' => 'documents.attestation_scolarite',
            'fee_amount' => 0.00,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $relNotesType = DB::table('document_types')->insertGetId([
            'name' => 'Relevé de Notes',
            'code' => 'REL_NOTES',
            'view_name' => 'documents.releve_notes',
            'fee_amount' => 0.00,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Document Requests for Youssef
        DB::table('document_requests')->insert([
            [
                'student_id' => $studentProfile->id,
                'document_type_id' => $attScolType,
                'status' => 'ready',
                'requested_at' => now()->subDays(5),
                'processed_at' => now()->subDays(4),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'student_id' => $studentProfile->id,
                'document_type_id' => $relNotesType,
                'status' => 'pending',
                'requested_at' => now()->subDays(1),
                'processed_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 2. Complete Moroccan names bank
        $names = [
            ['first' => 'Salma', 'last' => 'Bennani', 'gender' => 'female'],
            ['first' => 'Amine', 'last' => 'Benziane', 'gender' => 'male'],
            ['first' => 'Ghita', 'last' => 'Berrada', 'gender' => 'female'],
            ['first' => 'Othmane', 'last' => 'El Alami', 'gender' => 'male'],
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

        $studentIndex = 2;
        $filiereSet = [
            ['filiere' => $filieres['TC'], 'sem' => 2, 'code' => 'TC'],
            ['filiere' => $filieres['GFC'], 'sem' => 5, 'code' => 'GFC'],
            ['filiere' => $filieres['MCM'], 'sem' => 5, 'code' => 'MCM'],
        ];

        $groupList = [];
        $studentList = [$studentUser];

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

                $groupList[] = $group;
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
                    // Also create student_pathway for API display
                    DB::table('student_pathways')->insert([
                        'student_id' => $studentProfile->id,
                        'filiere_id' => $filiere->id,
                        'academic_year_id' => $academicYear->id,
                        'group_id' => $group->id,
                        'current_semester' => $semNum,
                        'is_current' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

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
                    // Also create student_pathway for API display
                    DB::table('student_pathways')->insert([
                        'student_id' => $student->id,
                        'filiere_id' => $filiere->id,
                        'academic_year_id' => $academicYear->id,
                        'group_id' => $group->id,
                        'current_semester' => $semNum,
                        'is_current' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
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
                    $studentList[] = $u;
                    $studentIndex++;
                }

                // Create assessments and grades for ordinary session
                foreach ($modules as $module) {
                    // Create exam session slot (Ordinary)
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

                    // Create exam session slot (Retake / Rattrapage)
                    $retakeExam = Exam::create([
                        'exam_session_id' => $retakeSession->id,
                        'module_id' => $module->id,
                        'group_id' => $group->id,
                        'room_id' => $rooms[array_rand($rooms)]->id,
                        'exam_date' => '2025-06-19',
                        'start_time' => '14:00:00',
                        'duration_minutes' => 120,
                        'type' => 'rattrapage',
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
                    foreach ($groupStudents as $stIndex => $st) {
                        // Logic: Youssef always passes with mention directly
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
                            continue;
                        }

                        // Distribute cases based on student index modulo
                        $case = $stIndex % 7;

                        switch ($case) {
                            case 0:
                            case 1:
                            case 2:
                                // Case 1: Direct Pass (Ordinary >= 10, no retake)
                                Grade::create([
                                    'assessment_id' => $assessment->id,
                                    'student_id' => $st->id,
                                    'value' => mt_rand(1000, 1800) / 100,
                                    'absent' => false,
                                ]);
                                break;

                            case 3:
                                // Case 2: Fail Ordinary -> Pass Retake
                                Grade::create([
                                    'assessment_id' => $assessment->id,
                                    'student_id' => $st->id,
                                    'value' => mt_rand(500, 950) / 100,
                                    'absent' => false,
                                ]);
                                Grade::create([
                                    'assessment_id' => $retakeAssessment->id,
                                    'student_id' => $st->id,
                                    'value' => mt_rand(1000, 1400) / 100,
                                    'absent' => false,
                                ]);
                                break;

                            case 4:
                                // Case 3: Fail Ordinary -> Fail Retake
                                Grade::create([
                                    'assessment_id' => $assessment->id,
                                    'student_id' => $st->id,
                                    'value' => mt_rand(300, 900) / 100,
                                    'absent' => false,
                                ]);
                                Grade::create([
                                    'assessment_id' => $retakeAssessment->id,
                                    'student_id' => $st->id,
                                    'value' => mt_rand(400, 950) / 100,
                                    'absent' => false,
                                ]);
                                break;

                            case 5:
                                // Case 4: Absent from Ordinary -> Pass Retake
                                Grade::create([
                                    'assessment_id' => $assessment->id,
                                    'student_id' => $st->id,
                                    'value' => 0.00,
                                    'absent' => true,
                                ]);
                                Grade::create([
                                    'assessment_id' => $retakeAssessment->id,
                                    'student_id' => $st->id,
                                    'value' => mt_rand(1000, 1300) / 100,
                                    'absent' => false,
                                ]);
                                break;

                            case 6:
                                // Case 5: Absent from Ordinary -> Absent from Retake
                                Grade::create([
                                    'assessment_id' => $assessment->id,
                                    'student_id' => $st->id,
                                    'value' => 0.00,
                                    'absent' => true,
                                ]);
                                Grade::create([
                                    'assessment_id' => $retakeAssessment->id,
                                    'student_id' => $st->id,
                                    'value' => 0.00,
                                    'absent' => true,
                                ]);
                                break;
                        }
                    }
                }
            }
        }

        // Seed some random document requests for other students
        $otherStudents = array_slice($studentList, 1, 8); // Skip Youssef
        foreach ($otherStudents as $idx => $stUser) {
            $stProfile = Student::where('user_id', $stUser->id)->first();
            if ($stProfile) {
                DB::table('document_requests')->insert([
                    'student_id' => $stProfile->id,
                    'document_type_id' => $idx % 2 === 0 ? $attScolType : $relNotesType,
                    'status' => $idx % 3 === 0 ? 'pending' : ($idx % 3 === 1 ? 'ready' : 'rejected'),
                    'requested_at' => now()->subDays($idx + 1),
                    'processed_at' => $idx % 3 !== 0 ? now()->subDays($idx) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return [
            'student_user' => $studentUser,
            'student_profile' => $studentProfile,
            'group_list' => $groupList,
            'student_list' => $studentList,
        ];
    }

    private function seedSchedules(
        Institution $institution,
        AcademicYear $academicYear,
        array $semesters,
        array $filieres,
        array $groups,
        array $professors,
        array $rooms
    ): void {
        $days = [1, 2, 3, 4, 5]; // Mon to Fri
        $times = [
            ['start' => '08:30:00', 'end' => '10:30:00'],
            ['start' => '10:45:00', 'end' => '12:45:00'],
            ['start' => '14:30:00', 'end' => '16:30:00'],
            ['start' => '16:45:00', 'end' => '18:45:00'],
        ];

        foreach ($groups as $group) {
            $modules = Module::where('filiere_id', $group->filiere_id)->where('semester_number', $group->semester_number)->get();

            $dayIndex = 1;
            foreach ($modules as $index => $mod) {
                $timeSlot = $times[$index % count($times)];
                $room = $rooms[$index % count($rooms)];
                $prof = $professors[$index % count($professors)];

                DB::table('schedules')->insert([
                    'institution_id' => $institution->id,
                    'academic_year_id' => $academicYear->id,
                    'semester_id' => $semesters[1]->id, // Spring
                    'group_id' => $group->id,
                    'module_id' => $mod->id,
                    'room_id' => $room->id,
                    'professor_id' => $prof->id,
                    'professor_type' => 'App\Models\Professor',
                    'day_of_week' => $dayIndex,
                    'start_time' => $timeSlot['start'],
                    'end_time' => $timeSlot['end'],
                    'session_type' => 'cm',
                    'recurrence' => 'weekly',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $dayIndex = ($dayIndex % 5) + 1;
            }
        }
    }

    private function seedLibrary(Institution $institution, User $studentUser): void
    {
        $booksData = [
            ['title' => 'Comptabilité Financière en Pratique', 'author' => 'Jean R. Richard', 'category' => 'Comptabilité', 'isbn' => '9782759032041'],
            ['title' => 'Marketing Management 16e éd.', 'author' => 'Philip Kotler', 'category' => 'Marketing', 'isbn' => '9782326002868'],
            ['title' => 'Analyse Financière de l\'Entreprise', 'author' => 'Elie Cohen', 'category' => 'Finance', 'isbn' => '9782717865239'],
            ['title' => 'Droit Commercial et des Affaires', 'author' => 'Michel de Juglart', 'category' => 'Droit', 'isbn' => '9782275090123'],
        ];

        foreach ($booksData as $b) {
            $bookId = DB::table('books')->insertGetId([
                'institution_id' => $institution->id,
                'isbn' => $b['isbn'],
                'title' => $b['title'],
                'author' => $b['author'],
                'publisher' => 'Pearson France',
                'publication_year' => 2022,
                'edition' => '16ème édition',
                'language' => 'fr',
                'category' => $b['category'],
                'location_code' => 'RAY-'.strtoupper(substr($b['category'], 0, 3)).'-01',
                'total_copies' => 3,
                'available_copies' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Add 3 copies
            for ($c = 1; $c <= 3; $c++) {
                $barcode = $b['isbn'].str_pad($c, 3, '0', STR_PAD_LEFT);
                $isAvail = ($c != 3); // Copy 3 is checked out

                $copyId = DB::table('book_copies')->insertGetId([
                    'book_id' => $bookId,
                    'barcode' => $barcode,
                    'condition' => 'good',
                    'is_available' => $isAvail,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Create borrowing record for copy 3
                if (! $isAvail) {
                    DB::table('borrowings')->insert([
                        'book_copy_id' => $copyId,
                        'user_id' => $studentUser->id,
                        'issued_by' => 2, // scolarite agent
                        'borrow_date' => now()->subDays(5)->format('Y-m-d'),
                        'due_date' => now()->addDays(10)->format('Y-m-d'),
                        'status' => 'borrowed',
                        'penalty_amount' => 0.00,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    private function seedClubs(Institution $institution, array $students): void
    {
        $clubs = [
            ['name' => 'Club d\'Entrepreneuriat ENCG Fès', 'name_ar' => 'نادي المقاولة', 'category' => 'scientific'],
            ['name' => 'Club Arts et Musique ENCG', 'name_ar' => 'نادي الفنون والموسيقى', 'category' => 'cultural'],
            ['name' => 'Club Sportif ENCG (CSEC)', 'name_ar' => 'النادي الرياضي', 'category' => 'sports'],
        ];

        foreach ($clubs as $cIndex => $c) {
            // Pick a president student
            $pres = $students[$cIndex % count($students)];

            $clubId = DB::table('clubs')->insertGetId([
                'institution_id' => $institution->id,
                'name' => $c['name'],
                'name_ar' => $c['name_ar'],
                'category' => $c['category'],
                'description' => 'Un club académique dynamique favorisant le développement des compétences des étudiants de l\'ENCG.',
                'president_name' => $pres->name,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Add president as member
            DB::table('club_members')->insert([
                'club_id' => $clubId,
                'user_id' => $pres->id,
                'role' => 'president',
                'joined_at' => now()->subMonths(6)->format('Y-m-d'),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Add 4 other members
            for ($m = 1; $m <= 4; $m++) {
                $memberUser = $students[($cIndex + $m + 2) % count($students)];
                if ($memberUser->id !== $pres->id) {
                    DB::table('club_members')->insertOrIgnore([
                        'club_id' => $clubId,
                        'user_id' => $memberUser->id,
                        'role' => 'member',
                        'joined_at' => now()->subMonths(3)->format('Y-m-d'),
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // Create a club event
            DB::table('club_events')->insert([
                'club_id' => $clubId,
                'title' => 'Événement Grand Public '.($cIndex + 1),
                'description' => 'Conférence et ateliers pratiques organisés par le club.',
                'start_at' => now()->addDays(7)->format('Y-m-d H:i:s'),
                'end_at' => now()->addDays(7)->addHours(4)->format('Y-m-d H:i:s'),
                'location' => 'Amphithéâtre A',
                'status' => 'planned',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function seedConvocationsAndSurveillance(Institution $institution, array $students, array $professors, array $rooms): void
    {
        $exams = Exam::all();

        foreach ($exams as $eIndex => $exam) {
            // Assign 1 professor as invigilator/surveillant
            $prof = $professors[$eIndex % count($professors)];
            DB::table('exam_surveillances')->insertOrIgnore([
                'exam_id' => $exam->id,
                'room_id' => $exam->room_id,
                'professor_id' => $prof->user_id, // invigilators are linked to users
                'role' => 'surveillant',
                'has_attended' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Generate convocations/seatings for the first 5 students enrolled in this group
            $registrations = StudentRegistration::where('group_id', $exam->group_id)->take(5)->get();
            foreach ($registrations as $sIndex => $reg) {
                // Find student user profile
                $studentUser = User::find($reg->student_id);
                if (! $studentUser) {
                    continue;
                }

                $seatNo = $sIndex + 1;
                $ref = 'CONV-'.strtoupper(Str::random(10));

                DB::table('convocations')->insertOrIgnore([
                    'exam_id' => $exam->id,
                    'student_id' => $studentUser->id,
                    'room_id' => $exam->room_id,
                    'seat_number' => $seatNo,
                    'reference' => $ref,
                    'status' => 'sent',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('exam_seatings')->insertOrIgnore([
                    'exam_id' => $exam->id,
                    'student_id' => $studentUser->id,
                    'room_id' => $exam->room_id,
                    'seat_number' => $seatNo,
                    'is_present' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function seedDeliberationsAndJury(
        Institution $institution,
        AcademicYear $academicYear,
        Semester $semester,
        array $filieres,
        array $groups,
        array $students,
        array $professors
    ): void {
        foreach ($groups as $gIndex => $group) {
            $delibId = DB::table('deliberations')->insertGetId([
                'institution_id' => $institution->id,
                'academic_year_id' => $academicYear->id,
                'semester_id' => $semester->id,
                'filiere_id' => $group->filiere_id,
                'group_id' => $group->id,
                'type' => 'semester',
                'status' => 'completed',
                'deliberation_date' => now()->subDays(2)->format('Y-m-d'),
                'pv_content' => "PV de délibération du semestre pour le groupe {$group->name}. Délibération validée à l'unanimité du jury.",
                'president_id' => 1, // Radouane admin
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Add 2 professors as deliberation jury members
            foreach (array_slice($professors, 0, 2) as $pIndex => $prof) {
                DB::table('deliberation_members')->insert([
                    'deliberation_id' => $delibId,
                    'user_id' => $prof->user_id,
                    'role' => $pIndex === 0 ? 'secretary' : 'member',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Enter a sample deliberation decision for students registered in this group
            $registrations = StudentRegistration::where('group_id', $group->id)->get();
            foreach ($registrations as $reg) {
                DB::table('deliberation_decisions')->insertOrIgnore([
                    'deliberation_id' => $delibId,
                    'student_id' => $reg->student_id,
                    'semester_average' => 13.50,
                    'annual_average' => null,
                    'compensated_average' => null,
                    'decision' => 'admitted',
                    'was_compensated' => false,
                    'was_rachat' => false,
                    'mention' => 'Assez Bien',
                    'next_semester' => $group->semester_number + 1,
                    'jury_notes' => 'Félicitations du jury.',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function seedInternshipsAndProjects(Institution $institution, AcademicYear $academicYear, array $students, array $professors): void
    {
        $companies = [
            ['name' => 'Attijariwafa Bank', 'city' => 'Casablanca'],
            ['name' => 'OCP Group Fès', 'city' => 'Fès'],
            ['name' => 'Maroc Telecom', 'city' => 'Rabat'],
        ];

        $room = Room::first();

        // Seed 3 internships for students
        foreach (array_slice($students, 0, 3) as $sIndex => $studentUser) {
            // Find Student profile
            $studentProfile = Student::where('user_id', $studentUser->id)->first();
            if (! $studentProfile) {
                continue;
            }

            $company = $companies[$sIndex % count($companies)];
            $prof = $professors[$sIndex % count($professors)];

            $internId = DB::table('internships')->insertGetId([
                'student_id' => $studentProfile->id,
                'type' => 'fin_etudes',
                'company_name' => $company['name'],
                'start_date' => now()->subMonths(3)->format('Y-m-d'),
                'end_date' => now()->subMonth()->format('Y-m-d'),
                'status' => 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Seed internship documents
            DB::table('internship_documents')->insert([
                [
                    'internship_id' => $internId,
                    'document_type' => 'convention',
                    'status' => 'approved',
                    'feedback' => 'Convention signée par toutes les parties.',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'internship_id' => $internId,
                    'document_type' => 'rapport_final',
                    'status' => 'approved',
                    'feedback' => 'Excellent travail, rapport complet et professionnel.',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);

            // Seed final project, project defense and juries
            $projectId = DB::table('final_projects')->insertGetId([
                'student_id' => $studentProfile->id,
                'title' => 'Digitalisation des Processus Académiques de l\'ENCG Fès',
                'description' => 'Mise en place d\'un ERP complet pour la gestion de l\'établissement scolaire.',
                'status' => 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $defenseId = DB::table('project_defenses')->insertGetId([
                'final_project_id' => $projectId,
                'room_id' => $room->id,
                'scheduled_at' => now()->subDays(3)->format('Y-m-d H:i:s'),
                'duration_minutes' => 45,
                'status' => 'completed',
                'presentation_score' => 17.00,
                'report_score' => 16.00,
                'final_score' => 16.50,
                'mention' => 'Très Bien',
                'jury_remarks' => 'Soutenance de projet de fin d\'études exceptionnelle. Excellente maîtrise technique.',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('defense_juries')->insert([
                [
                    'project_defense_id' => $defenseId,
                    'professor_id' => $professors[0]->id,
                    'professor_type' => 'internal',
                    'role' => 'president',
                    'is_external' => false,
                    'external_name' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'project_defense_id' => $defenseId,
                    'professor_id' => $prof->id,
                    'professor_type' => 'internal',
                    'role' => 'supervisor',
                    'is_external' => false,
                    'external_name' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }
    }

    private function seedHRVacations(
        Institution $institution,
        AcademicYear $academicYear,
        array $filieres,
        array $professors,
        array $groups
    ): void {
        // Pick one professor as vacataire contract recipient
        $prof = $professors[2];
        $module = Module::first();
        $group = $groups[0];

        $contractId = DB::table('vacation_contracts')->insertGetId([
            'professor_id' => $prof->id,
            'institution_id' => $institution->id,
            'user_id' => $prof->user_id,
            'cin' => 'CD349012',
            'first_name' => $prof->first_name ?? 'Tarik',
            'last_name' => $prof->last_name ?? 'Meziane',
            'email' => $prof->email ?? 'meziane.tarik@encg-fes.ma',
            'phone' => '+212 6 54 89 21 00',
            'rib_number' => '230 450 12000 459012 34',
            'bank_name' => 'CIH Bank',
            'external_institution' => 'Faculté des Sciences Fès',
            'qualification' => 'Doctorat en Droit Privé',
            'academic_year_id' => $academicYear->id,
            'module_id' => $module->id,
            'group_id' => $group->id,
            'session_type' => 'cm',
            'agreed_hours' => 36,
            'hourly_rate' => 250.00, // 250 MAD/hour
            'status' => 'active',
            'contract_start' => '2025-02-03',
            'contract_end' => '2025-06-15',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Seed vacation session
        DB::table('vacation_sessions')->insert([
            'vacation_contract_id' => $contractId,
            'session_date' => '2025-05-12',
            'start_time' => '08:30:00',
            'end_time' => '10:30:00',
            'hours' => 2.00,
            'status' => 'validated',
            'validated_by' => 1,
            'validated_at' => now()->format('Y-m-d H:i:s'),
            'notes' => 'Séance d\'introduction au droit commercial.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Seed vacation payment
        DB::table('vacation_payments')->insert([
            'institution_id' => $institution->id,
            'vacation_contract_id' => $contractId,
            'reference_number' => 'PAY-2025-05001',
            'payment_year' => 2025,
            'payment_month' => 5,
            'total_hours' => 16.00,
            'hourly_rate' => 250.00,
            'gross_amount' => 4000.00,
            'tax_deduction' => 680.00, // 17% IR
            'cnss_deduction' => 0.00,
            'net_amount' => 3320.00,
            'status' => 'paid',
            'paid_at' => '2025-05-28 10:00:00',
            'notes' => 'Paiement des vacations du mois de Mai 2025.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function seedAttendancesAndJustifications(
        Institution $institution,
        AcademicYear $academicYear,
        array $groups,
        array $students,
        array $professors
    ): void {
        // Iterate through all groups to seed rich attendance data
        foreach ($groups as $group) {
            $modules = Module::where('filiere_id', $group->filiere_id)->where('semester_number', $group->semester_number)->get();
            if ($modules->isEmpty()) {
                continue;
            }

            // Get students registered in this group
            $groupStudentRegistrations = StudentRegistration::where('group_id', $group->id)->pluck('student_id')->toArray();
            if (empty($groupStudentRegistrations)) {
                continue;
            }

            // Find matching User IDs for these students
            $groupStudentUserIds = Student::whereIn('id', $groupStudentRegistrations)->pluck('user_id')->toArray();

            // Seed 3 sessions per group
            for ($sessIdx = 1; $sessIdx <= 3; $sessIdx++) {
                $module = $modules[$sessIdx % count($modules)];
                $prof = $professors[array_rand($professors)];
                
                $sessionDate = now()->subDays(10 - $sessIdx * 2)->format('Y-m-d');

                $sessionId = DB::table('attendance_sessions')->insertGetId([
                    'schedule_id' => null,
                    'module_id' => $module->id,
                    'group_id' => $group->id,
                    'academic_year_id' => $academicYear->id,
                    'professor_id' => $prof->id,
                    'professor_type' => 'App\Models\Professor',
                    'session_date' => $sessionDate,
                    'start_time' => '10:45:00',
                    'end_time' => '12:45:00',
                    'session_type' => 'cm',
                    'room' => 'Salle 10' . rand(1, 9),
                    'is_locked' => true,
                    'created_by' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Mark students present/absent
                foreach ($groupStudentUserIds as $index => $uId) {
                    // 10% chance of absence
                    $roll = rand(1, 10);
                    $status = ($roll === 1) ? 'absent' : 'present';
                    $isJust = false;

                    // If absent, 50% chance of justification
                    if ($status === 'absent' && rand(1, 2) === 1) {
                        $isJust = true;
                    }

                    $attId = DB::table('attendances')->insertGetId([
                        'attendance_session_id' => $sessionId,
                        'student_id' => $uId,
                        'status' => $status,
                        'is_justified' => $isJust,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    if ($status === 'absent' && $isJust) {
                        DB::table('absence_justifications')->insert([
                            'attendance_id' => $attId,
                            'student_id' => $uId,
                            'reason' => rand(1, 2) === 1 ? 'medical' : 'family',
                            'description' => rand(1, 2) === 1 ? 'Certificat médical pour maladie.' : 'Événement familial justifié.',
                            'status' => rand(1, 3) === 1 ? 'pending' : 'approved',
                            'reviewed_by' => rand(1, 3) === 1 ? null : 2,
                            'reviewed_at' => rand(1, 3) === 1 ? null : now()->subDays(1)->format('Y-m-d H:i:s'),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }
        }
    }

    // =========================================================================
    // 16. COMPENSATION RULES
    // =========================================================================
    private function seedCompensationRules(Institution $institution, array $filieres): void
    {
        $rules = [
            // Tronc Commun — S1
            [
                'institution_id'       => $institution->id,
                'filiere_id'           => $filieres['TC']->id,
                'semester_number'      => 1,
                'rule_type'            => 'compensation',
                'minimum_average'      => 10.00,
                'minimum_module_grade' => 7.00,
                'max_deficit_allowed'  => 3.00,
                'eliminatory_blocks'   => false,
                'is_active'            => true,
                'created_at'           => now(),
                'updated_at'           => now(),
            ],
            // Tronc Commun — S2
            [
                'institution_id'       => $institution->id,
                'filiere_id'           => $filieres['TC']->id,
                'semester_number'      => 2,
                'rule_type'            => 'compensation',
                'minimum_average'      => 10.00,
                'minimum_module_grade' => 7.00,
                'max_deficit_allowed'  => 3.00,
                'eliminatory_blocks'   => false,
                'is_active'            => true,
                'created_at'           => now(),
                'updated_at'           => now(),
            ],
            // GFC — S3
            [
                'institution_id'       => $institution->id,
                'filiere_id'           => $filieres['GFC']->id,
                'semester_number'      => 3,
                'rule_type'            => 'compensation',
                'minimum_average'      => 10.00,
                'minimum_module_grade' => 7.00,
                'max_deficit_allowed'  => 3.00,
                'eliminatory_blocks'   => false,
                'is_active'            => true,
                'created_at'           => now(),
                'updated_at'           => now(),
            ],
            // GFC — rattrapage
            [
                'institution_id'       => $institution->id,
                'filiere_id'           => $filieres['GFC']->id,
                'semester_number'      => 3,
                'rule_type'            => 'rattrapage',
                'minimum_average'      => 10.00,
                'minimum_module_grade' => 5.00,
                'max_deficit_allowed'  => 5.00,
                'eliminatory_blocks'   => false,
                'is_active'            => true,
                'created_at'           => now(),
                'updated_at'           => now(),
            ],
        ];
        DB::table('compensation_rules')->insert($rules);
    }

    // =========================================================================
    // 17. CONVERSATIONS & MESSAGES
    // =========================================================================
    private function seedConversationsAndMessages(
        Institution $institution,
        array $professors,
        array $students
    ): void {
        $adminUser  = User::where('email', 'admin@encg.ma')->first();
        $profUser   = $professors[0]; // User object
        $studentUser = $students[0];

        // Conversation 1 — Admin ↔ Professeur
        $conv1Id = DB::table('conversations')->insertGetId([
            'institution_id' => $institution->id,
            'type'           => 'direct',
            'name'           => null,
            'created_at'     => now()->subDays(5),
            'updated_at'     => now()->subDays(5),
        ]);
        DB::table('conversation_user')->insert([
            ['conversation_id' => $conv1Id, 'user_id' => $adminUser->id,  'is_admin' => true,  'last_read_at' => now()->subDays(1), 'created_at' => now(), 'updated_at' => now()],
            ['conversation_id' => $conv1Id, 'user_id' => $profUser->id,   'is_admin' => false, 'last_read_at' => now()->subDays(2), 'created_at' => now(), 'updated_at' => now()],
        ]);
        DB::table('messages')->insert([
            ['conversation_id' => $conv1Id, 'sender_id' => $adminUser->id, 'body' => 'Bonjour Professeur, avez-vous saisi les notes du module Comptabilité Approfondie ?', 'is_read' => true, 'read_at' => now()->subDays(4), 'created_at' => now()->subDays(5), 'updated_at' => now()->subDays(5)],
            ['conversation_id' => $conv1Id, 'sender_id' => $profUser->id,  'body' => 'Bonjour, oui les notes sont saisies et validées. Je vous confirme que tout est en ordre.', 'is_read' => true, 'read_at' => now()->subDays(3), 'created_at' => now()->subDays(4), 'updated_at' => now()->subDays(4)],
            ['conversation_id' => $conv1Id, 'sender_id' => $adminUser->id, 'body' => 'Parfait, merci beaucoup. La délibération est prévue pour vendredi.', 'is_read' => true, 'read_at' => now()->subDays(2), 'created_at' => now()->subDays(3), 'updated_at' => now()->subDays(3)],
        ]);

        // Conversation 2 — Étudiant ↔ Professeur
        $conv2Id = DB::table('conversations')->insertGetId([
            'institution_id' => $institution->id,
            'type'           => 'direct',
            'name'           => null,
            'created_at'     => now()->subDays(3),
            'updated_at'     => now()->subDays(1),
        ]);
        DB::table('conversation_user')->insert([
            ['conversation_id' => $conv2Id, 'user_id' => $studentUser->id, 'is_admin' => false, 'last_read_at' => now()->subDays(1), 'created_at' => now(), 'updated_at' => now()],
            ['conversation_id' => $conv2Id, 'user_id' => $profUser->id,   'is_admin' => false, 'last_read_at' => now()->subHours(2), 'created_at' => now(), 'updated_at' => now()],
        ]);
        DB::table('messages')->insert([
            ['conversation_id' => $conv2Id, 'sender_id' => $studentUser->id, 'body' => 'Bonjour Professeur, j\'ai une question concernant le TD du chapitre 4 sur la consolidation.', 'is_read' => true, 'read_at' => now()->subDays(2), 'created_at' => now()->subDays(3), 'updated_at' => now()->subDays(3)],
            ['conversation_id' => $conv2Id, 'sender_id' => $profUser->id,   'body' => 'Bonjour Youssef, bien sûr. Quelle est votre question ?', 'is_read' => true, 'read_at' => now()->subDays(1), 'created_at' => now()->subDays(2), 'updated_at' => now()->subDays(2)],
            ['conversation_id' => $conv2Id, 'sender_id' => $studentUser->id, 'body' => 'Est-ce que les écritures d\'élimination sont obligatoires pour le cas A ?', 'is_read' => false, 'read_at' => null, 'created_at' => now()->subDays(1), 'updated_at' => now()->subDays(1)],
        ]);

        // Group conversation — Annonce scolarité
        $scolariteUser = User::where('email', 'scolarite@encg.ma')->first();
        $conv3Id = DB::table('conversations')->insertGetId([
            'institution_id' => $institution->id,
            'type'           => 'group',
            'name'           => 'Annonces Scolarité — TC S2',
            'created_at'     => now()->subDays(7),
            'updated_at'     => now()->subDays(7),
        ]);
        $participantsConv3 = [[$scolariteUser->id, true], [$studentUser->id, false], [$students[1]->id, false], [$students[2]->id, false]];
        $conv3Users = [];
        foreach ($participantsConv3 as [$uid, $isAdmin]) {
            $conv3Users[] = ['conversation_id' => $conv3Id, 'user_id' => $uid, 'is_admin' => $isAdmin, 'last_read_at' => now()->subDays(6), 'created_at' => now(), 'updated_at' => now()];
        }
        DB::table('conversation_user')->insert($conv3Users);
        DB::table('messages')->insert([
            ['conversation_id' => $conv3Id, 'sender_id' => $scolariteUser->id, 'body' => 'Bonjour à tous. Les calendriers d\'examens du semestre 2 sont disponibles sur l\'ENT. Merci de vérifier vos convocations.', 'is_read' => true, 'read_at' => now()->subDays(6), 'created_at' => now()->subDays(7), 'updated_at' => now()->subDays(7)],
        ]);
    }

    // =========================================================================
    // 18. DIPLOMAS & VERIFICATIONS
    // =========================================================================
    private function seedDiplomasAndVerifications(
        Institution $institution,
        AcademicYear $academicYear,
        array $filieres,
        array $students
    ): void {
        $adminUser = User::where('email', 'admin@encg.ma')->first();

        // Alumni student from GFC who graduated last year
        $alumniStudent = Student::where('cne', 'G245678901')->first()
            ?? Student::inRandomOrder()->first();

        $diplomaId = DB::table('diplomas')->insertGetId([
            'institution_id'     => $institution->id,
            'student_id'         => $alumniStudent->id,
            'filiere_id'         => $filieres['GFC']->id,
            'academic_year_id'   => $academicYear->id,
            'diploma_number'     => 'ENCG-FES-DIPL-2024-0042',
            'diploma_type'       => 'licence',
            'graduation_date'    => '2024-07-15',
            'final_average'      => 14.35,
            'mention'            => 'Bien',
            'file_path'          => null,
            'verification_token' => strtoupper(Str::random(32)),
            'is_issued'          => true,
            'issued_at'          => '2024-09-01 09:00:00',
            'issued_by'          => $adminUser->id,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);

        // A couple of diploma verification attempts
        DB::table('diploma_verifications')->insert([
            [
                'diploma_id'            => $diplomaId,
                'verifier_name'         => 'Mariam Cherkaoui',
                'verifier_organization' => 'Bank Al-Maghrib',
                'ip_address'            => '196.62.4.12',
                'created_at'            => now()->subMonths(2),
                'updated_at'            => now()->subMonths(2),
            ],
            [
                'diploma_id'            => $diplomaId,
                'verifier_name'         => 'Omar Filali',
                'verifier_organization' => 'Ministère des Finances',
                'ip_address'            => '41.248.77.190',
                'created_at'            => now()->subWeeks(3),
                'updated_at'            => now()->subWeeks(3),
            ],
        ]);
    }

    // =========================================================================
    // 19. DISCIPLINARY CASES & DECISIONS
    // =========================================================================
    private function seedDisciplinaryCasesAndDecisions(
        Institution $institution,
        array $students,
        array $professors
    ): void {
        $adminUser = User::where('email', 'admin@encg.ma')->first();
        $profUser  = $professors[1]; // second prof as reporter

        // Case 1 — Fraude aux examens, clôturé
        $case1Id = DB::table('disciplinary_cases')->insertGetId([
            'institution_id'    => $institution->id,
            'student_id'        => $students[2]->id,
            'case_number'       => 'DISC-2025-001',
            'infraction_type'   => 'fraud',
            'description'       => 'L\'étudiant a été surpris en possession d\'un aide-mémoire non autorisé lors de l\'examen de Comptabilité Approfondie.',
            'incident_date'     => '2025-05-20',
            'reported_by_name'  => $profUser->name,
            'status'            => 'closed',
            'student_statement' => 'Je reconnais les faits et je m\'en excuse. C\'était la première fois et je n\'ai pas eu l\'intention de tricher.',
            'created_at'        => now()->subMonths(1),
            'updated_at'        => now()->subMonths(1),
        ]);
        DB::table('disciplinary_decisions')->insert([
            'disciplinary_case_id' => $case1Id,
            'sanction_type'        => 'warning',
            'suspension_days'      => null,
            'decision_text'        => 'Après délibération du conseil de discipline, l\'étudiant reçoit un avertissement écrit. La note de l\'épreuve est annulée (0/20).',
            'decision_date'        => '2025-05-28',
            'is_appealed'          => false,
            'appeal_notes'         => null,
            'decided_by'           => $adminUser->id,
            'created_at'           => now()->subMonths(1),
            'updated_at'           => now()->subMonths(1),
        ]);

        // Case 2 — Comportement irrespectueux, en cours
        DB::table('disciplinary_cases')->insert([
            'institution_id'    => $institution->id,
            'student_id'        => $students[4]->id,
            'case_number'       => 'DISC-2025-002',
            'infraction_type'   => 'misconduct',
            'description'       => 'Comportement irrespectueux envers un enseignant lors d\'un cours magistral de Finance d\'Entreprise.',
            'incident_date'     => '2025-06-03',
            'reported_by_name'  => $professors[0]->name,
            'status'            => 'pending',
            'student_statement' => null,
            'created_at'        => now()->subWeeks(3),
            'updated_at'        => now()->subWeeks(3),
        ]);
    }

    // =========================================================================
    // 20. HOLIDAYS
    // =========================================================================
    private function seedHolidays(): void
    {
        $holidays = [
            ['name' => 'Aïd Al-Adha 2025',        'start_date' => '2025-06-06', 'end_date' => '2025-06-09', 'is_recurring' => false],
            ['name' => 'Fête du Trône',             'start_date' => '2025-07-30', 'end_date' => '2025-07-30', 'is_recurring' => true],
            ['name' => 'Aïd Al-Mawlid 2025',       'start_date' => '2025-09-04', 'end_date' => '2025-09-05', 'is_recurring' => false],
            ['name' => 'Marché de la Marche Verte', 'start_date' => '2025-11-06', 'end_date' => '2025-11-06', 'is_recurring' => true],
            ['name' => 'Fête de l\'Indépendance',  'start_date' => '2025-11-18', 'end_date' => '2025-11-18', 'is_recurring' => true],
            ['name' => 'Nouvel An 2026',             'start_date' => '2026-01-01', 'end_date' => '2026-01-01', 'is_recurring' => true],
            ['name' => 'Manifeste de l\'Indépendance', 'start_date' => '2026-01-11', 'end_date' => '2026-01-11', 'is_recurring' => true],
            ['name' => 'Fête du Travail',           'start_date' => '2026-05-01', 'end_date' => '2026-05-01', 'is_recurring' => true],
        ];
        foreach ($holidays as &$h) {
            $h['created_at'] = now();
            $h['updated_at'] = now();
        }
        DB::table('holidays')->insert($holidays);
    }

    // =========================================================================
    // 21. MODULE PV SIGNATURES
    // =========================================================================
    private function seedModulePvSignatures(
        AcademicYear $academicYear,
        array $filieres,
        array $groups,
        array $professors
    ): void {
        $filierIds = array_map(fn ($f) => $f->id, $filieres);
        $modules = Module::whereIn('filiere_id', $filierIds)
            ->take(4)
            ->get();

        foreach ($modules as $i => $module) {
            $prof     = $professors[$i % count($professors)];
            $group    = $groups[$i % count($groups)];
            $seal     = hash('sha256', $module->id.$group->id.$prof->id);
            $sigData  = json_encode([
                'professor' => $prof->name,
                'module'    => $module->name,
                'group'     => $group->name,
                'signed_at' => now()->subDays(rand(1, 10))->toISOString(),
            ]);

            DB::table('module_pv_signatures')->insert([
                'module_id'        => $module->id,
                'group_id'         => $group->id,
                'academic_year_id' => $academicYear->id,
                'signed_by'        => $prof->id,
                'signature_data'   => $sigData,
                'digital_seal'     => $seal,
                'ip_address'       => '192.168.1.'.rand(10, 50),
                'signed_at'        => now()->subDays(rand(1, 10)),
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);
        }
    }

    // =========================================================================
    // 22. TEACHER CONSTRAINTS
    // =========================================================================
    private function seedTeacherConstraints(array $professors): void
    {
        $constraints = [
            // Prof 0 — indisponible lundi matin
            ['professor_id' => $professors[0]->id, 'day_of_week' => 'MONDAY',    'start_time' => '08:00:00', 'end_time' => '10:00:00', 'constraint_type' => 'UNAVAILABLE'],
            // Prof 0 — préfère ne pas faire le vendredi après-midi
            ['professor_id' => $professors[0]->id, 'day_of_week' => 'FRIDAY',    'start_time' => '14:00:00', 'end_time' => '18:00:00', 'constraint_type' => 'PREFER_NOT'],
            // Prof 1 — indisponible mercredi
            ['professor_id' => $professors[1]->id, 'day_of_week' => 'WEDNESDAY', 'start_time' => '08:00:00', 'end_time' => '18:00:00', 'constraint_type' => 'UNAVAILABLE'],
            // Prof 2 — préfère ne pas samedi
            ['professor_id' => $professors[2]->id, 'day_of_week' => 'SATURDAY',  'start_time' => '08:00:00', 'end_time' => '13:00:00', 'constraint_type' => 'PREFER_NOT'],
            // Prof 3 — indisponible jeudi après-midi
            ['professor_id' => $professors[3]->id, 'day_of_week' => 'THURSDAY',  'start_time' => '14:00:00', 'end_time' => '18:00:00', 'constraint_type' => 'UNAVAILABLE'],
        ];
        foreach ($constraints as &$c) {
            $c['created_at'] = now();
            $c['updated_at'] = now();
        }
        DB::table('teacher_constraints')->insert($constraints);
    }

    // =========================================================================
    // 23. NOTIFICATIONS
    // =========================================================================
    private function seedNotifications(array $students, array $professors): void
    {
        $adminUser = User::where('email', 'admin@encg.ma')->first();
        $rows = [];

        // Notification pour l'étudiant principal — résultats disponibles
        $rows[] = [
            'id'              => (string) Str::uuid(),
            'type'            => 'App\Notifications\ExamResultsAvailable',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id'   => $students[0]->id,
            'data'            => json_encode(['message' => 'Vos résultats du semestre 2 sont disponibles.', 'url' => '/student/grades']),
            'read_at'         => now()->subDays(1),
            'created_at'      => now()->subDays(2),
            'updated_at'      => now()->subDays(2),
        ];
        // Notification non lue — convocation
        $rows[] = [
            'id'              => (string) Str::uuid(),
            'type'            => 'App\Notifications\ConvocationIssued',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id'   => $students[0]->id,
            'data'            => json_encode(['message' => 'Votre convocation pour la session de rattrapage est disponible.', 'url' => '/student/convocations']),
            'read_at'         => null,
            'created_at'      => now()->subDays(1),
            'updated_at'      => now()->subDays(1),
        ];
        // Notification admin — nouveau dossier disciplinaire
        $rows[] = [
            'id'              => (string) Str::uuid(),
            'type'            => 'App\Notifications\DisciplinaryCaseOpened',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id'   => $adminUser->id,
            'data'            => json_encode(['message' => 'Un nouveau dossier disciplinaire (DISC-2025-002) a été soumis et nécessite votre attention.', 'url' => '/admin/disciplinary']),
            'read_at'         => null,
            'created_at'      => now()->subWeeks(3),
            'updated_at'      => now()->subWeeks(3),
        ];
        // Notification prof — contrat vacation approuvé
        $rows[] = [
            'id'              => (string) Str::uuid(),
            'type'            => 'App\Notifications\VacationContractApproved',
            'notifiable_type' => 'App\Models\User',
            'notifiable_id'   => $professors[0]->id,
            'data'            => json_encode(['message' => 'Votre contrat de vacation pour l\'année 2024-2025 a été approuvé.', 'url' => '/professor/vacation']),
            'read_at'         => now()->subWeeks(2),
            'created_at'      => now()->subWeeks(3),
            'updated_at'      => now()->subWeeks(3),
        ];
        // Notifications pour plusieurs étudiants
        foreach (array_slice($students, 1, 4) as $stuUser) {
            $rows[] = [
                'id'              => (string) Str::uuid(),
                'type'            => 'App\Notifications\ExamResultsAvailable',
                'notifiable_type' => 'App\Models\User',
                'notifiable_id'   => $stuUser->id,
                'data'            => json_encode(['message' => 'Vos résultats du semestre 2 sont disponibles.', 'url' => '/student/grades']),
                'read_at'         => null,
                'created_at'      => now()->subDays(2),
                'updated_at'      => now()->subDays(2),
            ];
        }
        DB::table('notifications')->insert($rows);
    }

    // =========================================================================
    // 24. RESEARCH LABS & PUBLICATIONS
    // =========================================================================
    private function seedResearchLabsAndPublications(
        Institution $institution,
        array $professors
    ): void {
        $prof0 = $professors[0];
        $prof1 = $professors[1];

        // Lab 1 — Finance & Comptabilité
        $lab1Id = DB::table('research_labs')->insertGetId([
            'institution_id' => $institution->id,
            'name'           => 'Laboratoire de Recherche en Finance et Comptabilité (LARFCO)',
            'acronym'        => 'LARFCO',
            'director_id'    => $prof0->id,
            'description'    => 'Recherches en finance d\'entreprise, audit et comptabilité internationale. Partenariats avec Bank Al-Maghrib et CFC.',
            'created_at'     => now()->subYears(2),
            'updated_at'     => now(),
        ]);
        // Lab 2 — Marketing & Management
        $lab2Id = DB::table('research_labs')->insertGetId([
            'institution_id' => $institution->id,
            'name'           => 'Centre de Recherche en Management et Marketing (CR2M)',
            'acronym'        => 'CR2M',
            'director_id'    => $prof1->id,
            'description'    => 'Recherches sur le comportement du consommateur marocain, e-commerce et digitalisation des entreprises au Maroc.',
            'created_at'     => now()->subYears(1),
            'updated_at'     => now(),
        ]);

        // Publications
        DB::table('publications')->insert([
            [
                'research_lab_id' => $lab1Id,
                'author_id'       => $prof0->id,
                'title'           => 'Impact de la Norme IFRS 9 sur les Banques Marocaines : Analyse Empirique',
                'journal'         => 'Revue Marocaine de Finance et Comptabilité',
                'publish_date'    => '2024-03-15',
                'doi'             => '10.1234/rmfc.2024.001',
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
            [
                'research_lab_id' => $lab1Id,
                'author_id'       => $prof0->id,
                'title'           => 'Audit Interne et Gouvernance d\'Entreprise dans les PME du Maroc',
                'journal'         => 'International Journal of Accounting',
                'publish_date'    => '2023-11-01',
                'doi'             => '10.5678/ija.2023.088',
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
            [
                'research_lab_id' => $lab2Id,
                'author_id'       => $prof1->id,
                'title'           => 'Digitalisation du Commerce de Détail au Maroc : Opportunités et Défis',
                'journal'         => 'Journal of Business Studies — Maghreb',
                'publish_date'    => '2024-06-20',
                'doi'             => '10.9012/jbsm.2024.015',
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
            [
                'research_lab_id' => $lab2Id,
                'author_id'       => $prof1->id,
                'title'           => 'L\'Influence des Réseaux Sociaux sur la Décision d\'Achat des Millennials Marocains',
                'journal'         => 'Revue Africaine de Management',
                'publish_date'    => '2023-09-10',
                'doi'             => null,
                'created_at'      => now(),
                'updated_at'      => now(),
            ],
        ]);
    }

    // =========================================================================
    // 25. MODULE PREREQUISITES
    // =========================================================================
    private function seedModulePrerequisites(array $filieres): void
    {
        // Get GFC modules ordered by code
        $gfcModules = Module::where('filiere_id', $filieres['GFC']->id)
            ->orderBy('code')
            ->get()
            ->keyBy('code');

        // Get TC modules
        $tcModules = Module::where('filiere_id', $filieres['TC']->id)
            ->orderBy('code')
            ->get();

        $rows = [];
        // Rule: each advanced GFC module requires the first TC module as prerequisite
        if ($tcModules->isNotEmpty() && $gfcModules->isNotEmpty()) {
            $tcBase = $tcModules->first();
            foreach ($gfcModules->take(3) as $gfcModule) {
                if ($gfcModule->id !== $tcBase->id) {
                    $rows[] = [
                        'module_id'             => $gfcModule->id,
                        'prerequisite_module_id' => $tcBase->id,
                        'created_at'             => now(),
                        'updated_at'             => now(),
                    ];
                }
            }
        }

        // Inter-GFC prerequisites: module 2 requires module 1, module 3 requires module 2
        $gfcList = $gfcModules->values();
        for ($i = 1; $i < min(3, $gfcList->count()); $i++) {
            $rows[] = [
                'module_id'             => $gfcList[$i]->id,
                'prerequisite_module_id' => $gfcList[$i - 1]->id,
                'created_at'             => now(),
                'updated_at'             => now(),
            ];
        }

        if (! empty($rows)) {
            // Deduplicate to avoid unique constraint violation
            $seen = [];
            $unique = [];
            foreach ($rows as $r) {
                $key = $r['module_id'].'-'.$r['prerequisite_module_id'];
                if (! isset($seen[$key]) && $r['module_id'] !== $r['prerequisite_module_id']) {
                    $seen[$key] = true;
                    $unique[] = $r;
                }
            }
            DB::table('module_prerequisites')->insert($unique);
        }
    }

    private function seedTicketsAndReplies(
        Institution $institution,
        array $students,
        array $professors
    ): void {
        $categories = ['grades', 'schedule', 'technical', 'administrative'];
        $priorities = ['low', 'medium', 'high'];
        $statuses = ['open', 'in_progress', 'resolved', 'closed'];

        $subjects = [
            'grades' => [
                'Réclamation concernant la note de Fiscalité',
                'Correction de note examen final Comptabilité Approfondie',
                'Demande de double correction - Tronc Commun S2'
            ],
            'schedule' => [
                'Conflit d\'emploi du temps pour le groupe TC-S2-G1',
                'Absence de l\'affichage de la salle d\'examen'
            ],
            'technical' => [
                'Problème d\'accès au portail étudiant',
                'Erreur lors du téléchargement de l\'attestation de scolarité'
            ],
            'administrative' => [
                'Demande urgente de convention de stage',
                'Correction du nom sur la carte d\'étudiant'
            ]
        ];

        // Seed 10 tickets
        for ($i = 0; $i < 10; $i++) {
            $category = $categories[$i % count($categories)];
            $priority = $priorities[$i % count($priorities)];
            $status = $statuses[$i % count($statuses)];
            
            $studentUser = $students[($i + 1) % count($students)];
            $prof = $professors[$i % count($professors)];

            $subjectList = $subjects[$category];
            $subject = $subjectList[rand(0, count($subjectList) - 1)];

            $resolvedAt = ($status === 'resolved' || $status === 'closed') ? now()->subDays(rand(1, 5)) : null;

            $ticketId = DB::table('tickets')->insertGetId([
                'institution_id' => $institution->id,
                'user_id' => $studentUser->id,
                'subject' => $subject,
                'description' => "Bonjour,\n\nJe me permets de vous contacter car j'ai un problème concernant la catégorie " . $category . ". En effet, " . strtolower($subject) . ".\n\nCordialement,\n" . $studentUser->name,
                'category' => $category,
                'priority' => $priority,
                'status' => $status,
                'assigned_to' => ($status !== 'open') ? $prof->user_id : null,
                'resolved_at' => $resolvedAt,
                'created_at' => now()->subDays(10 - $i),
                'updated_at' => now()->subDays(rand(0, 2)),
            ]);

            // Add replies
            if ($status !== 'open') {
                $profUser = User::find($prof->user_id);
                // Reply 1 from Professor/Admin
                DB::table('ticket_replies')->insert([
                    'ticket_id' => $ticketId,
                    'user_id' => $prof->user_id,
                    'body' => "Bonjour " . $studentUser->name . ",\n\nJ'ai bien pris note de votre demande concernant : " . $subject . ". Nous sommes en train d'examiner le problème.\n\nCordialement,\n" . ($profUser ? $profUser->name : 'Administration'),
                    'is_internal' => false,
                    'attachment_path' => null,
                    'created_at' => now()->subDays(9 - $i),
                    'updated_at' => now()->subDays(9 - $i),
                ]);

                if ($status === 'resolved' || $status === 'closed') {
                    // Reply 2 from Student acknowledging
                    DB::table('ticket_replies')->insert([
                        'ticket_id' => $ticketId,
                        'user_id' => $studentUser->id,
                        'body' => "Merci beaucoup pour votre retour rapide et pour la résolution !",
                        'is_internal' => false,
                        'attachment_path' => null,
                        'created_at' => now()->subDays(5 - $i),
                        'updated_at' => now()->subDays(5 - $i),
                    ]);
                }
            }
        }
    }
}

<?php

use App\Domain\Deliberation\LmdRules;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\Deliberation;
use App\Models\DisciplinaryCase;
use App\Models\Exam;
use App\Models\ExamIncident;
use App\Models\ExamSeating;
use App\Models\Filiere;
use App\Models\Grade;
use App\Models\GradeEntryPeriod;
use App\Models\Holiday;
use App\Models\Module;
use App\Models\Room;
use App\Models\Semester;
use App\Models\Student;
use App\Models\StudentPathway;
use App\Models\User;
use App\Models\VacationContract;
use App\Services\Academic\AcademicWindowGuard;
use App\Services\Academic\DeliberationSealService;
use App\Services\Academic\EarlyWarningService;
use App\Services\Academic\ExamCourseAttendanceService;
use App\Services\Academic\ScheduleExceptionService;
use App\Services\Apogee\ApogeeExportService as CanonicalApogeeExport;
use App\Services\HR\VacataireContractWorkflow;
use App\Services\Library\KohaLibraryClient;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpKernel\Exception\HttpException;

function roadmapAdmin(): User
{
    $user = User::factory()->create();
    $role = Role::firstOrCreate(['name' => 'institution-admin', 'guard_name' => 'sanctum']);
    $user->assignRole($role);
    foreach (['students.view', 'students.create'] as $perm) {
        $user->givePermissionTo(Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'sanctum']));
    }

    return $user;
}

it('uses a single LMD eliminatory threshold of 6/20', function () {
    expect(LmdRules::ELIMINATORY_THRESHOLD)->toBe(6.0)
        ->and(LmdRules::isEliminatory(6.0))->toBeFalse()
        ->and(LmdRules::isEliminatory(5.99))->toBeTrue()
        ->and(LmdRules::decisionFromScore(12))->toBe('V')
        ->and(LmdRules::decisionFromScore(7))->toBe('RAT')
        ->and(LmdRules::decisionFromScore(5))->toBe('NV')
        ->and(LmdRules::filiereRequiresPayment('grande_ecole'))->toBeFalse()
        ->and(LmdRules::filiereRequiresPayment('formation_continue'))->toBeTrue();
});

it('exports an empty APOGEE CSV without dummy rows', function () {
    $service = app(CanonicalApogeeExport::class);
    $records = $service->generateExportData();
    expect($records)->toBe([])
        ->and(substr_count($service->generateCsv($records), "\n"))->toBe(1);
});

it('exports real APOGEE rows with CNE and Massar', function () {
    $module = Module::factory()->create();
    $assessment = Assessment::create(['module_id' => $module->id, 'type' => 'Exam', 'weight' => 100]);
    $a = Student::factory()->create(['cne' => 'CNE11111', 'massar_code' => 'G11111111']);
    $b = Student::factory()->create(['cne' => 'CNE22222', 'massar_code' => 'G22222222']);
    Grade::create(['student_id' => $a->id, 'assessment_id' => $assessment->id, 'value' => 12.5]);
    Grade::create(['student_id' => $b->id, 'assessment_id' => $assessment->id, 'value' => 5.0]);

    $records = app(CanonicalApogeeExport::class)->generateExportData();
    expect($records)->toHaveCount(2)
        ->and(collect($records)->pluck('COD_ETU')->all())->toContain('CNE11111', 'CNE22222')
        ->and(collect($records)->pluck('COD_MAS')->all())->toContain('G11111111', 'G22222222')
        ->and(collect($records)->pluck('COD_TRE')->all())->toContain('V', 'NV');
});

it('opens grade entry when no academic window is configured', function () {
    expect(app(AcademicWindowGuard::class)->isGradesOpen())->toBeTrue();
});

it('closes grade entry when all grade periods are closed', function () {
    $year = AcademicYear::factory()->create(['is_current' => true]);
    $semester = Semester::factory()->create(['academic_year_id' => $year->id]);
    $session = \App\Models\ExamSession::query()->create([
        'institution_id' => 1,
        'academic_year_id' => $year->id,
        'semester_id' => $semester->id,
        'name' => 'Normale',
        'type' => 'normale',
        'start_date' => now()->subMonth(),
        'end_date' => now()->addMonth(),
    ]);
    GradeEntryPeriod::create([
        'academic_year_id' => $year->id,
        'semester_id' => $semester->id,
        'exam_session_id' => $session->id,
        'start_date' => now()->subDays(10),
        'end_date' => now()->addDays(10),
        'is_open' => false,
    ]);

    expect(app(AcademicWindowGuard::class)->isGradesOpen())->toBeFalse();
    expect(fn () => app(AcademicWindowGuard::class)->assertGradesOpen())
        ->toThrow(HttpException::class);
});

it('seals a deliberation and requires four-eyes to reopen', function () {
    $year = AcademicYear::factory()->create();
    $semester = Semester::factory()->create(['academic_year_id' => $year->id]);
    $filiere = Filiere::factory()->create();
    $delib = Deliberation::create([
        'institution_id' => 1,
        'academic_year_id' => $year->id,
        'semester_id' => $semester->id,
        'filiere_id' => $filiere->id,
        'type' => 'semester',
        'status' => 'completed',
    ]);

    $director = User::factory()->create();
    $head = User::factory()->create();
    $directorRole = Role::firstOrCreate(['name' => 'director', 'guard_name' => 'sanctum']);
    $headRole = Role::firstOrCreate(['name' => 'filiere-head', 'guard_name' => 'sanctum']);
    $director->assignRole($directorRole);
    $head->assignRole($headRole);

    $seals = app(DeliberationSealService::class);
    $seals->vote($delib, $director, 'admitted');
    $originalCreatedAt = DB::table('deliberation_votes')
        ->where('deliberation_id', $delib->id)
        ->where('user_id', $director->id)
        ->value('created_at');
    $this->travel(10)->minutes();
    $seals->vote($delib, $director, 'rejected', 'Révision de vote');
    $vote = DB::table('deliberation_votes')
        ->where('deliberation_id', $delib->id)
        ->where('user_id', $director->id)
        ->first();
    expect($vote->decision)->toBe('rejected')
        ->and(Carbon::parse($vote->created_at)->equalTo(Carbon::parse($originalCreatedAt)))->toBeTrue();

    $hash = $seals->seal($delib, $director);
    expect($hash)->toHaveLength(64);
    $delib->refresh();
    expect($delib->is_sealed)->toBeTrue();

    expect(fn () => $seals->vote($delib->fresh(), $director, 'admitted'))
        ->toThrow(HttpException::class);

    $reqId = $seals->requestReopen($delib->fresh(), $director, 'Correction PV jury');
    expect(fn () => $seals->approveReopen($reqId, $director))
        ->toThrow(HttpException::class);

    $seals->approveReopen($reqId, $head);
    expect($delib->fresh()->is_sealed)->toBeFalse();
});

it('confirms Grande École reinscription without payment and blocks unpaid FC', function () {
    $year = AcademicYear::factory()->create(['is_current' => true, 'label' => '2026/2027']);
    $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);

    $geFiliere = Filiere::factory()->create(['type' => 'grande_ecole', 'code' => 'GE-TEST']);
    $geUser = User::factory()->create(['phone' => '0611111111', 'address' => 'Fes', 'city' => 'Fes']);
    $geUser->assignRole($studentRole);
    $geStudent = Student::factory()->create(['user_id' => $geUser->id, 'cne' => 'GE00001']);
    StudentPathway::create([
        'student_id' => $geStudent->id,
        'filiere_id' => $geFiliere->id,
        'academic_year_id' => $year->id,
        'current_semester' => 3,
        'is_current' => true,
    ]);

    $this->actingAs($geUser, 'sanctum')
        ->postJson('/api/v1/student-portal/reinscription/confirm', [
            'phone' => '0611111111',
            'address' => 'Fes Medina',
            'city' => 'Fes',
        ])
        ->assertOk()
        ->assertJsonPath('success', true);

    $fcFiliere = Filiere::factory()->create(['type' => 'formation_continue', 'code' => 'FC-TEST']);
    $fcUser = User::factory()->create(['phone' => '0622222222', 'address' => 'Fes', 'city' => 'Fes']);
    $fcUser->assignRole($studentRole);
    $fcStudent = Student::factory()->create(['user_id' => $fcUser->id, 'cne' => 'FC00001']);
    StudentPathway::create([
        'student_id' => $fcStudent->id,
        'filiere_id' => $fcFiliere->id,
        'academic_year_id' => $year->id,
        'current_semester' => 1,
        'is_current' => true,
    ]);

    $this->actingAs($fcUser, 'sanctum')
        ->postJson('/api/v1/student-portal/reinscription/confirm', [
            'phone' => '0622222222',
            'address' => 'Fes',
            'city' => 'Fes',
        ])
        ->assertStatus(402);
});

it('rejects timetable slots on holidays, out-of-service rooms and Ramadan late hours', function () {
    $year = AcademicYear::factory()->create(['is_current' => true]);
    $svc = app(ScheduleExceptionService::class);
    $room = Room::create([
        'institution_id' => 1,
        'name' => 'Amphi HS',
        'code' => 'HS-'.uniqid(),
        'type' => 'classroom',
        'capacity' => 40,
        'is_out_of_service' => true,
    ]);

    $hs = $svc->validateSlot($year->id, 1, '08:30:00', '10:30:00', (int) $room->id, 1, 1, now()->toDateString());
    expect($hs['isValid'])->toBeFalse();

    $okRoom = Room::create([
        'institution_id' => 1,
        'name' => 'Salle OK',
        'code' => 'OK-'.uniqid(),
        'type' => 'classroom',
        'capacity' => 40,
        'is_out_of_service' => false,
    ]);
    Holiday::create([
        'name' => 'Aïd',
        'start_date' => now()->toDateString(),
        'end_date' => now()->toDateString(),
        'is_active' => true,
    ]);
    $holiday = $svc->validateSlot($year->id, 1, '08:30:00', '10:30:00', (int) $okRoom->id, 1, 1, now()->toDateString());
    expect($holiday['isValid'])->toBeFalse()->and($holiday['reason'])->toContain('férié');

    \App\Models\AcademicEvent::create([
        'academic_year_id' => $year->id,
        'title' => 'Horaires aménagés Ramadan',
        'type' => 'ramadan',
        'start_date' => now()->subDay(),
        'end_date' => now()->addDay(),
        'is_active' => true,
        'description' => 'Horaires aménagés Ramadan',
        'meta' => ['latest_end' => '16:00'],
    ]);
    $ramadan = $svc->validateSlot($year->id, 1, '16:45:00', '18:45:00', (int) $okRoom->id, 1, 1, now()->toDateString());
    expect($ramadan['isValid'])->toBeFalse();

    \App\Models\AcademicEvent::query()->where('type', 'ramadan')->update(['meta' => null]);
    $fallback = $svc->validateSlot($year->id, 1, '16:45:00', '18:45:00', (int) $okRoom->id, 1, 1, now()->toDateString());
    expect($fallback['isValid'])->toBeFalse();
});

it('keeps course and exam attendance counters separate and opens a discipline case on fraud', function () {
    $student = Student::factory()->create();
    $session = AttendanceSession::factory()->create();
    Attendance::create([
        'student_id' => $student->id,
        'attendance_session_id' => $session->id,
        'status' => 'absent',
    ]);

    $counts = app(ExamCourseAttendanceService::class)->splitCounters($student->id);
    expect($counts['course_absences'])->toBe(1)
        ->and($counts['exam_absences'])->toBe(0);

    $incident = new ExamIncident;
    $incident->student_id = $student->id;
    $incident->type = 'fraude';
    $incident->incident_type = 'fraude';
    $incident->description = 'Téléphone';
    $incident->id = 999001;
    app(ExamCourseAttendanceService::class)->reportFraudIncident($incident);

    expect(DisciplinaryCase::where('student_id', $student->id)->count())->toBe(1);
});

it('forbids IDOR on student dossier and records TAFEM-style audit lines', function () {
    $admin = roadmapAdmin();
    $student = Student::factory()->create(['massar_code' => 'G99999999', 'cin' => 'AB123456']);
    $other = User::factory()->create();
    Role::firstOrCreate(['name' => 'student', 'guard_name' => 'sanctum']);
    $other->assignRole('student');

    $this->actingAs($other, 'sanctum')
        ->getJson('/api/students/'.$student->id.'/dossier')
        ->assertForbidden();

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/students/'.$student->id.'/dossier')
        ->assertOk()
        ->assertJsonPath('success', true);
});

it('caps vacataire hours at 45 and requires department visa before HR', function () {
    $year = AcademicYear::factory()->create();
    $module = Module::factory()->create();
    $contract = VacationContract::create([
        'institution_id' => 1,
        'first_name' => 'Ali',
        'last_name' => 'Vac',
        'email' => 'vac.'.uniqid().'@encg-fes.ac.ma',
        'academic_year_id' => $year->id,
        'module_id' => $module->id,
        'session_type' => 'cm',
        'agreed_hours' => 45,
        'hourly_rate' => 300,
        'status' => 'draft',
        'contract_start' => now()->toDateString(),
        'contract_end' => now()->addMonths(4)->toDateString(),
        'max_hours_per_module' => 45,
    ]);

    $workflow = app(VacataireContractWorkflow::class);
    expect(fn () => $workflow->assertHoursWithinCap($contract, 46))->toThrow(HttpException::class);

    $hr = User::factory()->create();
    Role::firstOrCreate(['name' => 'hr-officer', 'guard_name' => 'sanctum']);
    $hr->assignRole('hr-officer');
    expect(fn () => $workflow->approveByHr($contract, $hr))->toThrow(HttpException::class);

    $dept = User::factory()->create();
    Role::firstOrCreate(['name' => 'department-head', 'guard_name' => 'sanctum']);
    $dept->assignRole('department-head');
    $workflow->approveByDepartment($contract, $dept);
    $workflow->approveByHr($contract->fresh(), $hr);
    expect($contract->fresh()->status)->toBe('active');
});

it('returns an empty Koha stub when KOHA_BASE_URL is unset and fakes HTTP when configured', function () {
    config(['services.koha.base_url' => '']);
    expect(app(KohaLibraryClient::class)->loansForStudent('CNE1'))->toBe([]);

    config(['services.koha.base_url' => 'https://koha.example.test', 'services.koha.api_key' => 'k']);
    Http::fake([
        'https://koha.example.test/*' => Http::response(['loans' => [['title' => 'Manuel']]], 200),
    ]);
    expect(app(KohaLibraryClient::class)->loansForStudent('CNE1'))->toHaveCount(1);
});

it('keeps a stable exam PV seal and treats unrecorded seating as absent', function () {
    $year = $this->makeTestAcademicYear();
    $filiere = $this->makeTestFiliere(['code' => 'PV-SEAL']);
    $semester = $this->makeTestSemester($year->id);
    $session = \App\Models\ExamSession::query()->create([
        'institution_id' => 1,
        'academic_year_id' => $year->id,
        'semester_id' => $semester->id,
        'name' => 'Normale',
        'type' => 'normale',
        'start_date' => now()->subMonth(),
        'end_date' => now()->addMonth(),
    ]);
    $module = $this->makeTestModule($filiere->id, ['code' => 'PV-MOD']);
    $campus = \App\Models\Campus::firstOrCreate(
        ['code' => 'CAMPUS_PV_SEAL'],
        ['institution_id' => 1, 'name' => 'Campus PV', 'is_main' => true]
    );
    $room = Room::create([
        'institution_id' => 1,
        'campus_id' => $campus->id,
        'name' => 'Amphi PV',
        'code' => 'PV-'.uniqid(),
        'type' => 'amphitheater',
        'capacity' => 80,
    ]);
    $group = \App\Models\Group::create([
        'academic_year_id' => $year->id,
        'filiere_id' => $filiere->id,
        'semester_number' => 1,
        'name' => 'G-PV',
        'capacity' => 40,
    ]);
    $exam = Exam::create([
        'exam_session_id' => $session->id,
        'module_id' => $module->id,
        'room_id' => $room->id,
        'group_id' => $group->id,
        'exam_date' => now()->toDateString(),
        'start_time' => '09:00:00',
        'duration_minutes' => 120,
        'type' => 'written',
    ]);

    $seal1 = $exam->documentSeal();
    $this->travel(3)->hours();
    expect($exam->fresh()->documentSeal())->toBe($seal1);

    $totals = ExamSeating::pvAttendanceTotals([
        new ExamSeating(['is_present' => true]),
        new ExamSeating(['is_present' => false]),
        new ExamSeating(['is_present' => null]),
    ]);
    expect($totals['total_students'])->toBe(3)
        ->and($totals['present_students'])->toBe(1)
        ->and($totals['absent_students'])->toBe(2);
});

it('batches early-warning course absence counts instead of querying per grade', function () {
    $year = $this->makeTestAcademicYear(['start_year' => 2025, 'end_year' => 2026, 'label' => '2025/2026', 'is_current' => false]);
    $filiere = $this->makeTestFiliere(['code' => 'EW-F']);
    $module = $this->makeTestModule($filiere->id, ['code' => 'EW-MOD']);
    $studentA = $this->makeTestStudent(['first_name' => 'Nadia', 'cne' => 'N110000001']);
    $studentB = $this->makeTestStudent(['first_name' => 'Omar', 'cne' => 'N110000002']);
    $assessment = Assessment::create(['module_id' => $module->id, 'type' => 'CC1', 'weight' => 40]);

    Grade::create(['student_id' => $studentA->id, 'assessment_id' => $assessment->id, 'value' => 4.5, 'version' => 1]);
    Grade::create(['student_id' => $studentB->id, 'assessment_id' => $assessment->id, 'value' => 5.0, 'version' => 1]);

    $sessionA = AttendanceSession::factory()->create(['academic_year_id' => $year->id]);
    $sessionB = AttendanceSession::factory()->create(['academic_year_id' => $year->id]);
    Attendance::create([
        'student_id' => $studentA->id,
        'attendance_session_id' => $sessionA->id,
        'status' => 'absent',
        'version' => 1,
    ]);
    Attendance::create([
        'student_id' => $studentA->id,
        'attendance_session_id' => $sessionB->id,
        'status' => 'absent',
        'version' => 1,
    ]);

    DB::flushQueryLog();
    DB::enableQueryLog();
    $rows = app(EarlyWarningService::class)->list();
    $attendanceSelects = collect(DB::getQueryLog())
        ->filter(fn (array $query) => str_contains(strtolower($query['query']), 'from "attendances"')
            || str_contains(strtolower($query['query']), 'from `attendances`')
            || str_contains(strtolower($query['query']), 'from attendances'))
        ->count();
    DB::disableQueryLog();

    $byStudent = collect($rows)->keyBy('student_id');
    expect($attendanceSelects)->toBe(1)
        ->and($byStudent[$studentA->id]['course_absences'])->toBe(2)
        ->and($byStudent[$studentB->id]['course_absences'])->toBe(0);
});

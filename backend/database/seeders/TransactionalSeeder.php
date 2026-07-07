<?php

namespace Database\Seeders;

use App\Models\AcademicProject;
use App\Models\AcademicYear;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\DocumentRequest;
use App\Models\DocumentType;
use App\Models\Exam;
use App\Models\ExamSession;
use App\Models\Grade;
use App\Models\Institution;
use App\Models\Professor;
use App\Models\Schedule;
use App\Models\Semester;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Faker\Factory as Faker;

class TransactionalSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create('fr_FR');
        $institution = Institution::first();
        $academicYear = AcademicYear::where('is_current', true)->first();
        $semester = Semester::where('is_current', true)->first();
        $students = Student::all();
        $professors = Professor::all();
        $schedules = Schedule::all();

        if (!$institution || !$academicYear || $students->isEmpty() || $schedules->isEmpty()) {
            return;
        }

        // 1. Document Types & Requests
        $docTypes = [
            ['name' => 'Attestation de Scolarité', 'code' => 'ATT_SCOL', 'view_name' => 'documents.attestation_scolarite', 'fee_amount' => 0, 'is_active' => true],
            ['name' => 'Relevé de Notes', 'code' => 'REL_NOTES', 'view_name' => 'documents.releve_notes', 'fee_amount' => 0, 'is_active' => true],
            ['name' => 'Convention de Stage', 'code' => 'CONV_STAGE', 'view_name' => 'documents.convention_stage', 'fee_amount' => 0, 'is_active' => true],
        ];
        
        $createdDocTypes = [];
        foreach ($docTypes as $dt) {
            $createdDocTypes[] = DocumentType::create($dt);
        }

        for ($i = 0; $i < 50; $i++) {
            DocumentRequest::create([
                'student_id' => $students->random()->id,
                'document_type_id' => $createdDocTypes[array_rand($createdDocTypes)]->id,
                'status' => $faker->randomElement(['pending', 'ready', 'rejected']),
                'requested_at' => now()->subDays(rand(1, 30)),
            ]);
        }

        // 2. Attendances
        for ($i = 0; $i < 40; $i++) {
            $schedule = $schedules->random();
            $sessionDate = now()->subDays(rand(1, 30));

            $session = AttendanceSession::create([
                'schedule_id' => $schedule->id,
                'module_id' => $schedule->module_id,
                'group_id' => $schedule->group_id,
                'academic_year_id' => $schedule->academic_year_id,
                'professor_id' => $schedule->professor_id,
                'professor_type' => 'App\Models\Professor',
                'session_date' => $sessionDate->format('Y-m-d'),
                'start_time' => $schedule->start_time,
                'end_time' => $schedule->end_time,
                'session_type' => 'cm',
                'is_locked' => false,
                'status' => 'completed',
            ]);

            // Get students from the group attached to the schedule
            $groupStudents = $schedule->group->students ?? collect();
            
            foreach ($groupStudents as $student) {
                $status = $faker->randomElement(['present', 'present', 'present', 'absent', 'late']);
                AttendanceRecord::create([
                    'attendance_session_id' => $session->id,
                    'student_id' => $student->id,
                    'status' => $status,
                    'is_justified' => ($status === 'absent' && rand(0, 1) === 1),
                ]);
            }
        }

        // 3. Exams & Grades
        $examSession = ExamSession::create([
            'institution_id' => $institution->id,
            'academic_year_id' => $academicYear->id,
            'semester_id' => $semester->id,
            'name' => 'Session Normale Automne',
            'type' => 'normale',
            'start_date' => now()->subDays(10),
            'end_date' => now()->addDays(5),
            'status' => 'active',
        ]);

        $randomSchedules = $schedules->random(min(5, $schedules->count()));
        foreach ($randomSchedules as $schedule) {
            $exam = Exam::create([
                'exam_session_id' => $examSession->id,
                'module_id' => $schedule->module_id,
                'date' => now()->subDays(rand(1, 5)),
                'start_time' => '09:00:00',
                'end_time' => '11:00:00',
                'type' => 'final',
                'status' => 'completed',
                'max_score' => 20,
            ]);

            $groupStudents = $schedule->group->students ?? collect();
            foreach ($groupStudents as $student) {
                Grade::create([
                    'exam_id' => $exam->id,
                    'student_id' => $student->id,
                    'score' => $faker->randomFloat(2, 5, 20),
                    'is_absent' => false,
                    'is_validated' => true,
                ]);
            }
        }

        // 4. Academic Projects (PFE/Stage)
        for ($i = 0; $i < 30; $i++) {
            AcademicProject::create([
                'institution_id' => $institution->id,
                'academic_year_id' => $academicYear->id,
                'student_id' => $students->random()->id,
                'type' => $faker->randomElement(['internship', 'pfe']),
                'title' => $faker->sentence(4),
                'company_name' => $faker->company,
                'company_city' => $faker->city,
                'supervisor_name' => $faker->name,
                'status' => $faker->randomElement(['pending', 'approved', 'completed']),
                'professor_supervisor_id' => $professors->random()->id,
                'start_date' => now()->addDays(rand(1, 30)),
                'end_date' => now()->addMonths(2),
            ]);
        }
    }
}

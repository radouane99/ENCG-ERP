<?php

namespace Database\Seeders;

use App\Models\AcademicProject;
use App\Models\AcademicYear;
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
use Illuminate\Support\Facades\Schema;
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
        $createdDocTypes = [
            DocumentType::firstOrCreate(['code' => 'ATT_SCOL'], ['name' => 'Attestation de Scolarité', 'view_name' => 'documents.attestation_scolarite', 'fee_amount' => 0, 'is_active' => true]),
            DocumentType::firstOrCreate(['code' => 'REL_NOTES'], ['name' => 'Relevé de Notes', 'view_name' => 'documents.releve_notes', 'fee_amount' => 0, 'is_active' => true]),
            DocumentType::firstOrCreate(['code' => 'CONV_STAGE'], ['name' => 'Convention de Stage', 'view_name' => 'documents.convention_stage', 'fee_amount' => 0, 'is_active' => true]),
        ];

        for ($i = 0; $i < 50; $i++) {
            DocumentRequest::create([
                'student_id' => $students->random()->id,
                'document_type_id' => $createdDocTypes[array_rand($createdDocTypes)]->id,
                'status' => $faker->randomElement(['pending', 'ready', 'rejected']),
                'requested_at' => now()->subDays(rand(1, 30)),
            ]);
        }

        // 2. Attendance Sessions (no attendance_records table exists)
        for ($i = 0; $i < 40; $i++) {
            $schedule = $schedules->random();
            $sessionDate = now()->subDays(rand(1, 30));

            AttendanceSession::create([
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
                'created_by' => 1,
            ]);
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
            'is_active' => true,
        ]);

        $randomSchedules = $schedules->random(min(5, $schedules->count()));
        foreach ($randomSchedules as $schedule) {
            $exam = Exam::create([
                'exam_session_id' => $examSession->id,
                'module_id' => $schedule->module_id,
                'group_id' => $schedule->group_id,
                'room_id' => $schedule->room_id,
                'exam_date' => now()->subDays(rand(1, 5))->format('Y-m-d'),
                'start_time' => '09:00:00',
                'duration_minutes' => 120,
                'type' => 'final',
            ]);

            // Use assessments table
            $assessment = \App\Models\Assessment::create([
                'module_id' => $schedule->module_id,
                'type' => 'Exam',
                'weight' => 100,
                'date' => now()->subDays(rand(1, 5))->format('Y-m-d'),
            ]);

            // Get students via StudentRegistration
            $registrations = \App\Models\StudentRegistration::where('group_id', $schedule->group_id)->get();
            foreach ($registrations as $reg) {
                Grade::create([
                    'assessment_id' => $assessment->id,
                    'student_id' => $reg->student_id,
                    'value' => $faker->randomFloat(2, 5, 20),
                    'absent' => false,
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

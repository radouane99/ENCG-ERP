<?php
namespace Tests\Feature;
use App\Models\{Exam, ExamSession, ExamSurveillance, ExamSeating, Room};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
class SurveillanceBoundaryRegressionTest extends TestCase
{
    use RefreshDatabase;
    public function test_only_assigned_user_can_confirm_read_room_and_visa_immutable_attendance(): void
    {
        $year = $this->makeTestAcademicYear(); $f = $this->makeTestFiliere(); $module = $this->makeTestModule($f->id);
        $semester = $this->makeTestSemester($year->id);
        $session = ExamSession::create(['institution_id' => 1, 'academic_year_id' => $year->id, 'semester_id' => $semester->id, 'name' => 'Synthetic surveillance', 'type' => 'normale', 'start_date' => now()->subDay(), 'end_date' => now()->addDay()]);
        $room = Room::create(['institution_id' => 1, 'name' => 'Synthetic room', 'code' => 'SYN-ROOM', 'type' => 'classroom', 'capacity' => 20]);
        $group = \App\Models\Group::create(['academic_year_id' => $year->id, 'filiere_id' => $f->id, 'semester_number' => 1, 'name' => 'Synthetic G1', 'capacity' => 20]);
        $exam = Exam::create(['group_id' => $group->id, 'exam_session_id' => $session->id, 'module_id' => $module->id, 'room_id' => $room->id, 'exam_date' => now()->subDay()->toDateString(), 'start_time' => '09:00', 'duration_minutes' => 120, 'type' => 'written']);
        $teacher = $this->makeTestProfessor(); $other = $this->makeTestProfessor();
        foreach ([$teacher, $other] as $p) $p->user->assignRole(Role::findOrCreate('professor', 'sanctum'));
        $row = ExamSurveillance::create(['exam_id' => $exam->id, 'room_id' => $room->id, 'professor_id' => $teacher->user_id, 'role' => 'primary']);
        $student = $this->makeTestStudent();
        ExamSeating::create(['exam_id' => $exam->id, 'student_id' => $student->id, 'room_id' => $room->id, 'seat_number' => 1, 'qr_token' => 'synthetic-seat-token', 'is_present' => false]);
        Sanctum::actingAs($other->user);
        $this->getJson('/api/professor/my-surveillances')->assertOk()->assertJsonCount(0, 'data');
        $this->postJson('/api/professor/surveillances/'.$row->id.'/confirm')->assertNotFound();
        $this->getJson('/api/professor/attendance/students?exam_id='.$exam->id.'&room_id='.$room->id)->assertForbidden();
        $payload = ['signature_type' => 'digital', 'records' => [['student_id' => $student->id, 'status' => 'present']]];
        $this->postJson('/api/professor/surveillances/'.$row->id.'/sign-pv', $payload)->assertNotFound();
        Sanctum::actingAs($teacher->user);
        $this->postJson('/api/professor/surveillances/'.$row->id.'/confirm')->assertOk();
        $this->getJson('/api/professor/attendance/students?exam_id='.$exam->id.'&room_id='.$room->id)->assertOk()->assertJsonPath('data.0.status', 'absent');
        $hash = $this->postJson('/api/professor/surveillances/'.$row->id.'/sign-pv', $payload)->assertOk()->json('signature_hash');
        $this->assertNotEmpty($hash);
        $this->postJson('/api/professor/surveillances/'.$row->id.'/sign-pv', $payload)->assertOk()->assertJsonPath('signature_hash', $hash);
        $payload['records'][0]['status'] = 'absent';
        $this->postJson('/api/professor/surveillances/'.$row->id.'/sign-pv', $payload)->assertConflict();
        $this->assertDatabaseHas('exam_seatings', ['exam_id' => $exam->id, 'student_id' => $student->id, 'is_present' => true]);
    }
}

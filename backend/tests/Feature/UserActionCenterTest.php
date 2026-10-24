<?php

namespace Tests\Feature;

use App\Models\{Application, AdmissionCampaign, Grade, Group, ModuleProfessor, StudentRegistration, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserActionCenterTest extends TestCase
{
    use RefreshDatabase;
    private function login(User $user, string $role): void { $user->assignRole(Role::findOrCreate($role, 'sanctum')); Sanctum::actingAs($user); }
    public function test_student_sees_only_owned_admission_without_fabricated_financial_tasks(): void
    {
        $year = $this->makeTestAcademicYear(); $f = $this->makeTestFiliere(); $user = User::factory()->create(['institution_id' => 1]); $other = User::factory()->create(['institution_id' => 1]);
        $campaign = AdmissionCampaign::create(['institution_id' => 1, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'name' => 'TAFEM test', 'status' => 'open', 'open_date' => now()->subDay(), 'close_date' => now()->addDay(), 'target_capacity' => 20]);
        Application::create(['owner_user_id' => $other->id, 'admission_campaign_id' => $campaign->id, 'reference_number' => 'OTHER', 'cne' => 'N999999999', 'cin' => 'ZZ999999', 'first_name' => 'Other', 'last_name' => 'Student', 'status' => 'pending', 'dossier_status' => 'draft', 'eligibility' => 'main']);
        $this->login($user, 'student'); $this->getJson('/api/student-portal/actions')->assertOk()->assertJsonCount(0, 'items')->assertJsonPath('has_student', false);
        Application::create(['owner_user_id' => $user->id, 'admission_campaign_id' => $campaign->id, 'reference_number' => 'OWN', 'cne' => 'N123456789', 'cin' => 'AB123456', 'first_name' => 'Sara', 'last_name' => 'Synthetic', 'status' => 'pending', 'dossier_status' => 'draft', 'eligibility' => 'main']);
        $r = $this->getJson('/api/student-portal/actions')->assertOk()->assertJsonCount(1, 'items')->assertJsonPath('items.0.id', 'admission');
        $this->assertStringContainsString('4 pièce(s)', $r->json('items.0.description'));
        $this->assertStringNotContainsString('paiement', strtolower($r->getContent()));
        $this->getJson('/api/professor-portal/actions')->assertForbidden();
    }
    public function test_old_student_has_real_annual_status_and_graduate_has_no_renewal_action(): void
    {
        $year = $this->makeTestAcademicYear(); $this->openTestRenewalCampaign($year); $f = $this->makeTestFiliere(); $s = $this->makeTestStudent();
        StudentRegistration::create(['student_id' => $s->id, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'semester_number' => 3, 'status' => 'pending', 'registration_type' => 're_enrollment']);
        $this->login($s->user, 'student');
        $this->getJson('/api/student-portal/actions')->assertOk()->assertJsonPath('items.0.title', 'Suivre ma validation annuelle');
        $s->registrations()->update(['status' => 'academic_validated']);
        $this->getJson('/api/student-portal/actions')->assertOk()->assertJsonPath('items.0.title', 'Confirmer ma réinscription');
        $s->update(['status' => 'graduated']);
        $this->getJson('/api/student-portal/actions')->assertOk()->assertJsonCount(1, 'items')->assertJsonPath('items.0.id', 'graduate');
    }
    public function test_professor_actions_are_scoped_by_assignment_group_year_and_real_missing_marks(): void
    {
        $year = $this->makeTestAcademicYear(); $f = $this->makeTestFiliere(); $m = $this->makeTestModule($f->id); $prof = $this->makeTestProfessor();
        $group = Group::create(['filiere_id' => $f->id, 'academic_year_id' => $year->id, 'semester_number' => 1, 'name' => 'Assigned']);
        $otherGroup = Group::create(['filiere_id' => $f->id, 'academic_year_id' => $year->id, 'semester_number' => 1, 'name' => 'Other']);
        ModuleProfessor::create(['module_id' => $m->id, 'professor_id' => $prof->id, 'professor_type' => get_class($prof), 'academic_year_id' => $year->id, 'group_id' => $group->id, 'session_type' => 'cm']);
        $s = $this->makeTestStudent();
        StudentRegistration::create(['student_id' => $s->id, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'group_id' => $group->id, 'semester_number' => 1, 'status' => 'admin_validated', 'registration_type' => 'initial_enrollment']);
        $assessment = $this->createTestAssessment(['module_id' => $m->id, 'academic_year_id' => $year->id, 'type' => 'Exam', 'weight' => 100]);
        $this->login($prof->user, 'professor');
        $r = $this->getJson('/api/professor-portal/actions')->assertOk()->assertJsonCount(1, 'items')->assertJsonPath('items.0.title', '1 note(s) à compléter');
        $this->assertStringContainsString('group_id='.$group->id, $r->json('items.0.href'));
        $this->getJson('/api/professor-portal/actions?group_id='.$otherGroup->id)->assertOk()->assertJsonCount(0, 'items');
        Grade::create(['assessment_id' => $assessment->id, 'student_id' => $s->id, 'value' => 0, 'absent' => false]);
        $this->getJson('/api/professor-portal/actions')->assertOk()->assertJsonPath('items.0.title', 'PV à vérifier');
        $unassigned = $this->makeTestProfessor(); $this->login($unassigned->user, 'vacataire');
        $this->getJson('/api/professor-portal/actions')->assertOk()->assertJsonCount(0, 'items');
    }
    public function test_only_assigned_jury_sees_a_due_defense_evaluation(): void
    {
        $this->makeTestAcademicYear(); $student = $this->makeTestStudent(); $jury = $this->makeTestProfessor(); $supervisor = $this->makeTestProfessor();
        $stage = \App\Models\Internship::create(['student_id' => $student->id, 'supervisor_id' => $supervisor->id, 'type' => 'fin_etudes', 'company_name' => 'Synthetic company', 'start_date' => now()->subMonth()->toDateString(), 'end_date' => now()->addMonth()->toDateString(), 'status' => 'active']);
        \App\Models\Soutenance::create(['internship_id' => $stage->id, 'examiner_id' => $jury->id, 'supervisor_id' => $supervisor->id, 'date_time' => now()->subDay(), 'status' => 'scheduled']);
        $this->login($jury->user, 'professor');
        $this->getJson('/api/professor-portal/actions')->assertOk()->assertJsonCount(1, 'items')->assertJsonPath('items.0.title', 'Soutenance à évaluer')->assertJsonPath('items.0.href', '/professor/internships?internship_id='.$stage->id);
        $other = $this->makeTestProfessor(); $this->login($other->user, 'professor');
        $this->getJson('/api/professor-portal/actions')->assertOk()->assertJsonCount(0, 'items');
    }
}

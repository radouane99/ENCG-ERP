<?php

namespace Tests\Feature;

use App\Actions\Academic\VerifyAnnualRenewalAction;
use App\Domain\Admission\AdmissionEntryRules;
use App\Mail\RenewalReminderMail;
use App\Models\AdmissionCampaign;
use App\Models\Application;
use App\Models\Group;
use App\Models\StudentDocument;
use App\Models\StudentPathway;
use App\Models\StudentRegistration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UnifiedAdmissionRegistrationTest extends TestCase
{
    use RefreshDatabase;

    private const BASE = '/api/admissions/workflow';

    private function staff(): User
    {
        $u = User::factory()->create(['institution_id' => 1]);
        $u->assignRole(Role::findOrCreate('scolarite', 'sanctum'));
        Sanctum::actingAs($u);

        return $u;
    }

    private function campaign(string $route = 'cnaem', int $semester = 5): AdmissionCampaign
    {
        $year = $this->makeTestAcademicYear();
        $f = $this->makeTestFiliere();

        return AdmissionCampaign::create(['institution_id' => 1, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'name' => 'Synthetic '.$route, 'status' => 'open', 'open_date' => now()->subMonth(), 'close_date' => now()->addMonth(), 'target_capacity' => 5, 'entry_route' => $route, 'entry_semester' => $semester]);
    }

    private function dossier(AdmissionCampaign $c, string $cne = 'N123456789'): Application
    {
        $u = User::factory()->create(['institution_id' => 1, 'cin' => 'AB'.random_int(100000, 999999)]);
        $a = Application::create(['admission_campaign_id' => $c->id, 'reference_number' => 'SYN-'.$cne, 'cne' => $cne, 'cin' => $u->cin, 'owner_user_id' => $u->id, 'first_name' => 'Synthetic', 'last_name' => 'Candidate', 'email' => $u->email, 'status' => 'submitted', 'dossier_status' => 'submitted', 'eligibility' => 'main', 'profile' => ['gender' => 'female']]);
        foreach (AdmissionEntryRules::documents($c->entry_route) as $type) {
            StudentDocument::create(['application_id' => $a->id, 'cne' => $a->cne, 'type' => $type, 'file_path' => 'synthetic/'.$type.'.pdf', 'status' => 'verified']);
        }

        return $a->refresh();
    }

    private function approve(Application $a): array
    {
        return ['application_id' => $a->id, 'version' => $a->version, 'decision' => 'approved', 'official_number' => 'SYN-APO-'.$a->id, 'physical_checklist' => array_fill_keys(array_keys(AdmissionEntryRules::physicalChecklist($a->campaign->entry_route)), true)];
    }

    public static function entries(): array
    {
        return [['tafem', 1], ['cnaem', 5], ['cnaem', 7]];
    }

    #[DataProvider('entries')]
    public function test_entry_level_physical_evidence_and_retry_are_preserved(string $route, int $semester): void
    {
        Queue::fake();
        $c = $this->campaign($route, $semester);
        $a = $this->dossier($c);
        $actor = $this->staff();
        $data = $this->approve($a);
        $bad = $data;
        unset($bad['physical_checklist']['bac_original']);
        $this->postJson(self::BASE.'/decide', $bad)->assertUnprocessable();
        $r = $this->postJson(self::BASE.'/decide', $data)->assertOk();
        $student = Application::find($a->id)->student_id;
        $this->assertDatabaseHas('student_registrations', ['student_id' => $student, 'semester_number' => $semester, 'registration_type' => 'initial', 'status' => 'admin_validated', 'payment_status' => 'not_applicable']);
        $this->postJson(self::BASE.'/decide', $data)->assertOk();
        $this->assertDatabaseCount('student_registrations', 1);
        $this->assertDatabaseCount('students', 1);
        $this->assertDatabaseHas('admission_reviews', ['application_id' => $a->id, 'reviewer_id' => $actor->id, 'decision' => 'approved']);
        $this->getJson(self::BASE.'/dossier?application_id='.$a->id)->assertOk()->assertJsonPath('candidate.reviews.0.physical_checklist.bac_original', true)->assertJsonPath('candidate.campaign.entry_semester', $semester);
    }

    public function test_cnaem_cannot_be_approved_without_prior_study_evidence(): void
    {
        Queue::fake();
        $c = $this->campaign();
        $a = $this->dossier($c);
        StudentDocument::where('application_id', $a->id)->where('type', 'releve_parcours')->delete();
        $this->staff();
        $this->postJson(self::BASE.'/decide', $this->approve($a))->assertUnprocessable();
        $this->assertDatabaseCount('students', 0);
    }

    public function test_existing_year_at_another_level_is_not_overwritten(): void
    {
        Queue::fake();
        $c = $this->campaign();
        $a = $this->dossier($c);
        $student = $this->makeTestStudent(['user_id' => $a->owner_user_id, 'cne' => $a->cne]);
        StudentRegistration::create(['student_id' => $student->id, 'academic_year_id' => $c->academic_year_id, 'filiere_id' => $c->filiere_id, 'semester_number' => 3, 'registration_type' => 're_enrollment', 'status' => 'academic_validated']);
        $this->staff();
        $this->postJson(self::BASE.'/decide', $this->approve($a))->assertConflict();
        $this->assertDatabaseCount('students', 1);
        $this->assertDatabaseHas('student_registrations', ['student_id' => $student->id, 'semester_number' => 3]);
    }

    public function test_dispatch_only_assigns_campaign_students_and_retry_does_not_move_them(): void
    {
        Queue::fake();
        $c = $this->campaign();
        $a = $this->dossier($c);
        $this->staff();
        $this->postJson(self::BASE.'/decide', $this->approve($a))->assertOk();
        $g = Group::create(['academic_year_id' => $c->academic_year_id, 'filiere_id' => $c->filiere_id, 'semester_number' => 5, 'name' => 'S5-G1', 'capacity' => 1]);
        $other = $this->makeTestStudent();
        StudentPathway::create(['student_id' => $other->id, 'academic_year_id' => $c->academic_year_id, 'filiere_id' => $c->filiere_id, 'current_semester' => 5, 'is_current' => true]);
        $this->postJson(self::BASE.'/enrollments/dispatch', ['campaign_id' => $c->id])->assertOk()->assertJsonPath('dispatched_count', 1);
        $this->postJson(self::BASE.'/enrollments/dispatch', ['campaign_id' => $c->id])->assertOk()->assertJsonPath('dispatched_count', 0);
        $this->assertDatabaseHas('student_pathways', ['student_id' => $other->id, 'group_id' => null]);
        $this->getJson(self::BASE.'/enrollments?campaign_id='.$c->id)->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.group', $g->name);
    }

    public function test_campaign_route_level_validation_and_cnaem_import(): void
    {
        $c = $this->campaign();
        $this->staff();
        $data = ['name' => 'Synthetic', 'academic_year_id' => $c->academic_year_id, 'filiere_id' => $c->filiere_id, 'open_date' => now()->subDay()->toDateString(), 'close_date' => now()->addMonth()->toDateString(), 'status' => 'open', 'target_capacity' => 10, 'entry_route' => 'cnaem', 'entry_semester' => 1];
        $this->postJson(self::BASE.'/campaigns', $data)->assertUnprocessable();
        $csv = "cne,cin,first_name,last_name,admission_score,list_type,rank\nN123456789,AB123456,Synthetic,Candidate,15.2,liste_principale,1\n";
        $r = $this->post(self::BASE.'/imports/preview', ['campaign_id' => $c->id, 'file' => UploadedFile::fake()->createWithContent('cnaem.csv', $csv)], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('can_commit', true);
        $this->postJson(self::BASE.'/imports/'.$r->json('id').'/commit')->assertOk();
        $this->assertDatabaseHas('applications', ['admission_campaign_id' => $c->id, 'selection_score' => 15.2]);
    }

    public function test_renewal_paper_review_is_distinct_and_reminders_are_filtered_and_deduplicated(): void
    {
        Mail::fake();
        Notification::fake();
        $year = $this->makeTestAcademicYear();
        $this->openTestRenewalCampaign($year);
        $f = $this->makeTestFiliere();
        $student = $this->makeTestStudent();
        StudentRegistration::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'semester_number' => 3, 'registration_type' => 're_enrollment', 'status' => 'academic_validated']);
        $this->staff();
        $this->postJson('/api/admin/reinscriptions/send-reminders', ['level' => '3A'])->assertOk()->assertJsonPath('sent_count', 0);
        $this->postJson('/api/admin/reinscriptions/send-reminders', ['level' => '2A'])->assertOk()->assertJsonPath('sent_count', 1);
        $this->postJson('/api/admin/reinscriptions/send-reminders', ['level' => '2A'])->assertOk()->assertJsonPath('sent_count', 0);
        Mail::assertQueued(RenewalReminderMail::class, 1);
        $this->postJson('/api/admin/reinscriptions/'.$student->id.'/physical-review', ['checklist' => array_fill_keys(array_keys(VerifyAnnualRenewalAction::CHECKLIST), true)])->assertUnprocessable();
        $id = DB::table('student_renewals')->insertGetId(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'target_semester' => 3, 'receipt_reference' => 'SYN-REC', 'confirmed_at' => now(), 'created_at' => now(), 'updated_at' => now()]);
        $this->getJson('/api/admin/reinscriptions/stats')->assertOk()->assertJsonPath('data.students.0.status', 'physical_pending');
        $body = ['checklist' => array_fill_keys(array_keys(VerifyAnnualRenewalAction::CHECKLIST), true), 'observation' => 'Pièces originales synthétiques contrôlées.'];
        $this->postJson('/api/admin/reinscriptions/'.$student->id.'/physical-review', $body)->assertOk();
        $this->postJson('/api/admin/reinscriptions/'.$student->id.'/physical-review', $body)->assertOk();
        $this->getJson('/api/admin/reinscriptions/stats')->assertOk()->assertJsonPath('data.students.0.status', 'verified');
        $this->assertDatabaseCount('student_renewals', 1);
    }
}

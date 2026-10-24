<?php
namespace Tests\Feature;

use App\Models\{StudentPathway, StudentRegistration, User};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\{DB, Notification};
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InitialEducationTuitionTest extends TestCase
{
    use RefreshDatabase;
    public static function initialAdmissions(): array { return ['TAFEM S1' => ['grande_ecole', 1], 'CNAEM S5' => ['grande_ecole', 5], 'CNAEM S7' => ['formation_initiale', 7]]; }
    public static function paidCourses(): array { return ['Master temps aménagé' => ['master_temps_amenage'], 'Licence université' => ['licence_universite'], 'Master université' => ['master_universite']]; }
    private function context(string $type, int $semester = 1): array
    {
        Notification::fake();
        $year = $this->makeTestAcademicYear(); $f = $this->makeTestFiliere(['type' => $type]); $student = $this->makeTestStudent();
        $this->openTestRenewalCampaign($year);
        $student->user->assignRole(Role::findOrCreate('student', 'sanctum'));
        StudentPathway::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'current_semester' => $semester, 'is_current' => true]);
        StudentRegistration::create(['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'semester_number' => $semester, 'registration_type' => 're_enrollment', 'status' => 'academic_validated']);
        $admin = User::factory()->create(['institution_id' => 1]); $admin->assignRole(Role::findOrCreate('admin', 'sanctum'));
        return [$year, $f, $student, $admin];
    }
    private function receipt(): array { return ['reference' => 'SYN-RECEIPT-0001', 'amount' => 1000, 'provider' => 'bank', 'verification_note' => 'Reçu synthétique vérifié pour le test.', 'receipt_verified' => true]; }
    private function contact(): array { return ['phone' => '0612345678', 'address' => 'Adresse synthétique', 'city' => 'Fès']; }

    #[DataProvider('initialAdmissions')]
    public function test_initial_education_cannot_be_billed_reminded_or_financially_blocked(string $type, int $semester): void
    {
        [$year, $f, $student, $admin] = $this->context($type, $semester); Sanctum::actingAs($admin);
        $invoice = ['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'amount' => 1000, 'due_on' => now()->addDay()->toDateString()];
        $this->postJson('/api/admin/finance/invoices', $invoice)->assertUnprocessable();
        $this->assertDatabaseCount('tuition_invoices', 0);
        // A historical erroneous invoice is retained as evidence, but never used as an obligation.
        $id = DB::table('tuition_invoices')->insertGetId($invoice + ['reference' => 'SYN-ERRONEOUS-INITIAL', 'created_by' => $admin->id, 'created_at' => now(), 'updated_at' => now()]);
        $this->postJson('/api/admin/finance/payments/'.$id.'/validate', $this->receipt())->assertUnprocessable();
        $this->getJson('/api/finance/stats')->assertOk()->assertJsonPath('data.unpaid_count', 0)->assertJsonCount(0, 'data.payments');
        $this->getJson('/api/admin/finance/options')->assertOk()->assertJsonCount(0, 'students')->assertJsonCount(0, 'filieres');
        $this->postJson('/api/admin/finance/reminders')->assertOk()->assertJsonPath('sent_count', 0);
        Notification::assertNothingSent();
        Sanctum::actingAs($student->user);
        $this->getJson('/api/student-portal/reinscription/status')->assertOk()->assertJsonPath('data.payment_required', false)->assertJsonPath('data.payment_status', 'not_applicable')->assertJsonPath('data.invoice_reference', null)->assertJsonPath('data.invoice_remaining', null)->assertJsonPath('data.can_confirm', true);
        $this->postJson('/api/student-portal/reinscription/simulate-pay')->assertForbidden();
        $this->postJson('/api/student-portal/reinscription/confirm', $this->contact())->assertOk();
        $this->assertDatabaseHas('student_registrations', ['student_id' => $student->id, 'payment_status' => 'not_applicable', 'status' => 'admin_validated']);
        $this->assertDatabaseCount('tuition_payments', 0);
        $this->assertDatabaseHas('tuition_invoices', ['id' => $id, 'paid_amount' => 0]);
    }

    #[DataProvider('paidCourses')]
    public function test_paid_university_courses_still_require_verified_payment(string $type): void
    {
        [$year, $f, $student, $admin] = $this->context($type); Sanctum::actingAs($student->user);
        $this->getJson('/api/student-portal/reinscription/status')->assertOk()->assertJsonPath('data.payment_required', true)->assertJsonPath('data.can_confirm', false);
        $this->postJson('/api/student-portal/reinscription/confirm', $this->contact() + ['payment_status' => 'paid', 'payment_required' => false])->assertStatus(402);
        Sanctum::actingAs($admin);
        $this->getJson('/api/admin/finance/options')->assertOk()->assertJsonCount(1, 'students')->assertJsonCount(1, 'filieres');
        $id = $this->postJson('/api/admin/finance/invoices', ['student_id' => $student->id, 'academic_year_id' => $year->id, 'filiere_id' => $f->id, 'amount' => 1000, 'due_on' => now()->addDay()->toDateString()])->assertCreated()->json('invoice.id');
        $this->postJson('/api/admin/finance/payments/'.$id.'/validate', $this->receipt())->assertOk();
        Sanctum::actingAs($student->user);
        $this->postJson('/api/student-portal/reinscription/confirm', $this->contact())->assertOk();
        $this->assertDatabaseHas('student_registrations', ['student_id' => $student->id, 'payment_status' => 'paid']);
    }

    public function test_only_authorized_administration_can_change_course_tuition_classification(): void
    {
        [$year, $f, $student, $admin] = $this->context('grande_ecole');
        $professor = $this->makeTestProfessor(); $professor->user->assignRole(Role::findOrCreate('professor', 'sanctum'));
        Sanctum::actingAs($professor->user);
        $this->putJson('/api/filieres/'.$f->id, ['type' => 'master_universite'])->assertForbidden();
        $this->assertSame('grande_ecole', $f->fresh()->type);
        Sanctum::actingAs($admin);
        $this->getJson('/api/filieres/'.$f->id)->assertOk()->assertJsonPath('data.payment_required', false);
        $this->postJson('/api/filieres', ['code' => 'SYN-MASTER-DU', 'name' => 'Master université synthétique', 'type' => 'master_universite', 'duration_years' => 2])->assertCreated()->assertJsonPath('data.payment_required', true);
    }
}

<?php

namespace Tests\Feature;

use App\Models\AdmissionCampaign;
use App\Models\Application;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TafemAdmissionAndEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    private AdmissionCampaign $campaign;

    protected function setUp(): void
    {
        parent::setUp();

        $academicYear = $this->makeTestAcademicYear();
        $filiere = $this->makeTestFiliere(['name' => 'Tronc Commun', 'code' => 'TC']);

        $this->campaign = AdmissionCampaign::create([
            'institution_id' => 1,
            'academic_year_id' => $academicYear->id,
            'filiere_id' => $filiere->id,
            'name' => 'Concours TAFEM 2026',
            'open_date' => '2026-07-01',
            'close_date' => '2026-07-31',
            'target_capacity' => 400,
            'status' => 'open',
        ]);
    }

    /**
     * Test d'importation et validation d'un candidat admis au concours national TAFEM.
     */
    public function test_can_import_and_process_tafem_candidate(): void
    {
        $application = Application::create([
            'admission_campaign_id' => $this->campaign->id,
            'reference_number' => 'TAFEM-2026-000045',
            'cne' => 'N145098765',
            'cin' => 'CD554433',
            'first_name' => 'Ayoub',
            'last_name' => 'EL MANSOURI',
            'email' => 'ayoub.tafem@gmail.com',
            'phone' => '0677889900',
            'bac_series' => 'Sciences Économiques',
            'bac_average' => 16.85,
            'ranking' => 45,
            'status' => 'accepted',
        ]);

        $this->assertDatabaseHas('applications', [
            'cne' => 'N145098765',
            'status' => 'accepted',
        ]);
    }

    /**
     * Test d'inscription définitive et passage au statut enrolled.
     */
    public function test_can_complete_online_preinscription(): void
    {
        $application = Application::create([
            'admission_campaign_id' => $this->campaign->id,
            'reference_number' => 'TAFEM-2026-000046',
            'cne' => 'N145098766',
            'cin' => 'CD554434',
            'first_name' => 'Sara',
            'last_name' => 'EL MANSOURI',
            'status' => 'accepted',
        ]);

        $application->update([
            'status' => 'enrolled',
        ]);

        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'status' => 'enrolled',
        ]);
    }
}

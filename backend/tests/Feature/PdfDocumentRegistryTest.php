<?php

namespace Tests\Feature;

use App\Models\{PdfDocumentRecord, User};
use App\Services\Documents\RegisteredPdf;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PdfDocumentRegistryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('private');
        $user = User::factory()->create(['institution_id' => 1]);
        $user->assignRole(Role::findOrCreate('admin', 'sanctum'));
        $this->actingAs($user, 'sanctum');
    }

    public function test_every_facade_entry_produces_a_registered_archive_with_a_stable_numeric_id(): void
    {
        $html = '<html><head><title>Attestation de test</title></head><body><h1>Attestation</h1><p>Élève synthétique - aucune donnée réelle.</p></body></html>';
        $pdf = Pdf::loadHTML($html);
        $this->assertInstanceOf(RegisteredPdf::class, $pdf);
        $bytes = $pdf->output();
        $record = PdfDocumentRecord::firstOrFail();
        $this->assertMatchesRegularExpression('/^[0-9]{18}$/', $record->digital_identifier);
        $this->assertSame('issued', $record->status);
        $this->assertSame(hash('sha256', $bytes), $record->file_sha256);
        $this->assertSame($bytes, Storage::disk('private')->get($record->file_path));
        $this->assertSame($bytes, Pdf::loadHTML($html)->output());
        $this->assertDatabaseCount('pdf_document_records', 1);
        $this->assertStringStartsWith('%PDF-', $bytes);
        $this->getJson('/api/documents/registry?identifier='.$record->digital_identifier)->assertOk()->assertJsonPath('total', 1)->assertJsonPath('data.0.digital_identifier', $record->digital_identifier);
        $this->get('/api/documents/registry/'.$record->id.'/download')->assertOk()->assertContent($bytes);
    }

    public function test_modified_content_and_paper_have_distinct_identifiers(): void
    {
        Pdf::loadHTML('<h1>Version une</h1>')->output();
        Pdf::loadHTML('<h1>Version deux</h1>')->output();
        Pdf::loadHTML('<h1>Version deux</h1>')->setPaper('a4', 'landscape')->output();
        $this->assertSame(3, PdfDocumentRecord::distinct()->count('digital_identifier'));
    }

    public function test_explicit_a3_landscape_overrides_legacy_a4_css(): void
    {
        $pdf = Pdf::loadHTML('<html><head><style>@page {size:A4 portrait;}</style></head><body>Contrôle A3</body></html>')->setPaper('a3', 'landscape');
        $pdf->output();
        $this->assertEqualsWithDelta(1190.55, $pdf->getDomPDF()->getCanvas()->get_width(), 0.1);
        $this->assertEqualsWithDelta(841.89, $pdf->getDomPDF()->getCanvas()->get_height(), 0.1);
    }

    public function test_public_reference_contains_no_personal_information_and_revocation_is_effective(): void
    {
        Pdf::loadHTML('<title>SECRET-NOM-CIN</title><p>SECRET-NOM-CIN</p>')->output();
        $record = PdfDocumentRecord::firstOrFail();
        $url = '/api/verify/document/'.$record->verification_token;
        $this->getJson($url)->assertOk()->assertJsonPath('is_valid', true)->assertDontSee('SECRET-NOM-CIN')->assertJsonMissingPath('data.file_path');
        $this->postJson('/api/documents/registry/'.$record->id.'/revoke', ['reason' => 'Exemplaire retiré après contrôle administratif.'])->assertOk();
        $this->getJson($url)->assertOk()->assertJsonPath('is_valid', false)->assertJsonPath('data.status', 'revoked');
        $this->getJson('/api/documents/registry/'.$record->id.'/download')->assertStatus(409);
        $this->assertTrue(Storage::disk('private')->exists($record->file_path));
    }

    public function test_student_cannot_list_or_revoke_the_administrative_registry(): void
    {
        $student = $this->makeTestStudent();
        $student->user->assignRole(Role::findOrCreate('student', 'sanctum'));
        $this->actingAs($student->user, 'sanctum')->getJson('/api/documents/registry')->assertForbidden();
    }

    public function test_a_changed_archive_is_not_downloaded_as_if_it_were_valid(): void
    {
        Pdf::loadHTML('<h1>Exemplaire de contrôle</h1>')->output();
        $record = PdfDocumentRecord::firstOrFail();
        Storage::disk('private')->put($record->file_path, '%PDF-corrupted');
        $this->getJson('/api/documents/registry/'.$record->id.'/download')->assertStatus(409);
    }

    public function test_diploma_registry_extract_uses_the_registered_pdf_and_rejects_other_institutions(): void
    {
        $student = $this->makeTestStudent();
        $cert = \App\Models\BlockchainCertificate::create(['student_id' => $student->id, 'diploma_name' => 'Diplôme synthétique', 'hash' => '0x'.str_repeat('a', 64), 'transaction_id' => 'TEST-TRANSACTION', 'certified_at' => now(), 'network_status' => 'UNVERIFIED']);
        $response = $this->get('/api/admin/blockchain/certificates/'.$cert->id.'/pdf')->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF-', $response->getContent());
        $this->assertDatabaseHas('pdf_document_records', ['source_view' => 'pdf.workflow_record', 'status' => 'issued']);
        $otherInstitution = \App\Models\Institution::create(['name' => 'Établissement synthétique', 'code' => 'PDF-OTHER', 'slug' => 'pdf-other']);
        $student->update(['institution_id' => $otherInstitution->id]);
        $this->getJson('/api/admin/blockchain/certificates/'.$cert->id.'/pdf')->assertNotFound();
    }

    public function test_real_templates_render_portrait_landscape_and_multi_page_samples(): void
    {
        $this->renderSamples();
    }

    public function test_background_generation_keeps_the_institution_and_original_actor(): void
    {
        $actor = auth()->user();
        Storage::fake('local');
        $job = new \App\Jobs\GenerateOfficialPdfJob('pdf.workflow_record', ['title' => 'Document de test', 'facts' => [], 'headers' => [], 'rows' => [], 'notice' => 'Recette'], 'audit/job.pdf');
        app('auth')->forgetGuards();
        $this->assertNull(auth()->id());
        $job->handle(app(\App\Services\Documents\OfficialPdfFactory::class));
        $record = PdfDocumentRecord::firstOrFail();
        $this->assertEquals($actor->institution_id, $record->institution_id);
        $this->assertEquals($actor->id, $record->created_by);
        $this->assertTrue(Storage::disk('local')->exists('audit/job.pdf'));
    }

    public function test_compact_card_keeps_cr80_dimensions_and_its_numeric_reference(): void
    {
        $pdf = app(\App\Services\Documents\OfficialPdfFactory::class)->make('pdf.carte_etudiant_cr80', ['studentName' => 'ÉTUDIANTE SYNTHÉTIQUE', 'cne' => 'SYNTH-001', 'studentNumber' => 'TEST-2026-001', 'filiereName' => 'Tronc commun', 'academicYear' => '2026-2027']);
        $bytes = $pdf->output();
        file_put_contents(storage_path('app/audits/pdf-design/carte-cr80.pdf'), $bytes);
        $this->assertSame(1, PdfDocumentRecord::firstOrFail()->page_count);
        $this->assertEqualsWithDelta(242.64, $pdf->getDomPDF()->getCanvas()->get_width(), 0.1);
        $this->assertEqualsWithDelta(153.01, $pdf->getDomPDF()->getCanvas()->get_height(), 0.1);
    }

    private function renderSamples(): void
    {
        $directory = storage_path('app/audits/pdf-design');
        \Illuminate\Support\Facades\File::ensureDirectoryExists($directory);
        $student = $this->makeTestStudent();
        $days = [1 => 'Lundi', 2 => 'Mardi', 3 => 'Mercredi', 4 => 'Jeudi', 5 => 'Vendredi'];
        $catalog = function (int $count) use ($days) {
            return ['academic_year' => '2026-2027', 'days' => $days, 'sections' => [[
                'title' => 'Emploi du temps - démonstration', 'filiere_code' => 'SYN', 'filiere_name' => 'Formation synthétique', 'semester_label' => 'S1', 'academic_year' => '2026-2027',
                'rows' => array_map(fn ($i) => ['show_module' => true, 'module_rowspan' => 1, 'module_label' => 'Module '.$i, 'element_name' => 'Élément pédagogique '.$i, 'professor_name' => 'Pr. Synthétique '.$i, 'color' => '#1a3673', 'days' => [($i % 5) + 1 => ['08:30 - 10:30']], 'room_label' => 'SYN-'.$i], range(1, $count)), 'footer' => ['school' => 'ENCG Fès', 'cours' => '12/09/2026', 'td_tp' => '19/09/2026'],
            ]]];
        };
        $application = (object) ['campaign' => (object) ['institution' => (object) ['name' => 'ENCG Fès'], 'filiere' => (object) ['name' => 'Formation initiale'], 'name' => 'Campagne synthétique', 'entry_route' => 'TAFEM', 'entry_semester' => 1], 'profile' => ['last_name' => 'SYNTHÉTIQUE', 'first_name' => 'Étudiante', 'birth_date' => '2007-03-12'], 'reference_number' => 'EXEMPLE-001', 'cne' => 'SYNTH-001', 'cin' => 'TEST-001', 'submitted_at' => now()];
        $samples = [
            'attestation-scolarite' => ['pdf.attestation_scolarite', ['student' => $student, 'studentName' => 'ÉTUDIANTE SYNTHÉTIQUE', 'year' => '2026-2027', 'birthDate' => '12/03/2007', 'birthCity' => 'Fès', 'cne' => 'SYNTH-001', 'cin' => 'TEST-001', 'filiere' => 'Tronc commun', 'semester' => 'S1'], 'portrait'],
            'convocation' => ['pdf.convocation', ['person_name' => 'Étudiante Synthétique', 'person_id' => 'SYNTH-001', 'person_cin' => 'TEST-001', 'filiere_name' => 'Tronc commun', 'exams' => [['date' => '12/01/2027', 'time' => '08:30 - 10:30', 'module' => 'Gestion et organisation', 'room' => 'Salle de test', 'seat' => 12]]], 'portrait'],
            'planning-examens' => ['pdf.timetable', ['academic_year' => '2026-2027', 'exams' => [['date' => '12/01/2027', 'time' => '08:30 - 10:30', 'module' => 'Gestion', 'professor' => 'Enseignant synthétique', 'rooms' => 'Salle de test']]], 'landscape'],
            'rapport-multipage' => ['pdf.workflow_record', ['title' => 'Rapport de suivi synthétique', 'facts' => ['Campagne' => 'Recette PDF', 'Établissement' => 'ENCG Fès'], 'headers' => ['Référence', 'Observation'], 'rows' => array_map(fn ($i) => ['TEST-'.$i, 'Contrôle documentaire synthétique avec accents français : é è à ç.'], range(1, 90)), 'notice' => 'Données de démonstration.'], 'portrait'],
            'emploi-du-temps' => ['pdf.emploi_du_temps_officiel', ['catalog' => $catalog(8)], 'landscape'],
            'emploi-du-temps-dense' => ['pdf.emploi_du_temps_officiel', ['catalog' => $catalog(24)], 'landscape'],
            'preinscription' => ['pdf.admission-preregistration', ['app' => $application, 'photoData' => null, 'qrData' => 'data:image/svg+xml;base64,'.base64_encode((string) \SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->generate('DOSSIER-DE-DEMONSTRATION'))], 'portrait'],
            'attestation-travail' => ['pdf.attestation_travail', ['professor' => (object) ['first_name' => 'Enseignant', 'last_name' => 'SYNTHÉTIQUE', 'cin' => 'TEST-PR001', 'specialty' => 'Gestion', 'department' => (object) ['name' => 'Département de test']], 'year' => '2026-2027', 'trackingCode' => 'EXEMPLE-SANS-VALEUR'], 'portrait'],
        ];
        foreach ($samples as $name => [$view, $data, $orientation]) {
            $bytes = Pdf::loadView($view, $data)->setPaper('a4', $orientation)->output();
            file_put_contents($directory.'/'.$name.'.pdf', $bytes);
            $this->assertStringStartsWith('%PDF-', $bytes);
            if (str_starts_with($name, 'emploi-du-temps')) { $this->assertSame(1, PdfDocumentRecord::latest('id')->first()->page_count, $name); }
            if (in_array($name, ['preinscription', 'attestation-travail', 'attestation-scolarite', 'convocation'], true)) { $this->assertSame(1, PdfDocumentRecord::latest('id')->first()->page_count, $name); }
        }
        $this->assertGreaterThan(1, PdfDocumentRecord::where('source_view', 'pdf.workflow_record')->firstOrFail()->page_count);
    }
}

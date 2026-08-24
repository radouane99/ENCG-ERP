<?php

namespace Tests\Unit;

use App\Models\AcademicEvent;
use App\Models\AcademicYear;
use App\Models\Institution;
use App\Services\AcademicCalendarService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicCalendarServiceTest extends TestCase
{
    use RefreshDatabase;

    protected AcademicCalendarService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new AcademicCalendarService;
    }

    private function createAcademicYear()
    {
        $institution = Institution::first() ?? Institution::create([
            'name' => 'ENCG Test',
            'code' => 'ENCG-T',
            'slug' => 'encg-test-'.uniqid(),
            'type' => 'grande_ecole',
        ]);

        return AcademicYear::where('is_current', true)->first() ?? AcademicYear::create([
            'institution_id' => $institution->id,
            'label' => '2026/2027',
            'start_year' => 2026,
            'end_year' => 2027,
            'start_date' => now()->subMonths(1)->toDateString(),
            'end_date' => now()->addMonths(11)->toDateString(),
            'is_current' => true,
        ]);
    }

    public function test_it_returns_true_when_event_is_active()
    {
        $year = $this->createAcademicYear();

        AcademicEvent::create([
            'academic_year_id' => $year->id,
            'title' => 'Test Period',
            'type' => 'depot_justificatifs',
            'start_date' => now()->subDay(),
            'end_date' => now()->addDay(),
            'is_active' => true,
        ]);

        $this->assertTrue($this->service->isDocumentSubmissionOpen());
    }

    public function test_it_returns_false_when_event_is_past()
    {
        $year = $this->createAcademicYear();

        AcademicEvent::create([
            'academic_year_id' => $year->id,
            'title' => 'Test Period',
            'type' => 'depot_justificatifs',
            'start_date' => now()->subDays(5),
            'end_date' => now()->subDays(1),
            'is_active' => true,
        ]);

        $this->assertFalse($this->service->isDocumentSubmissionOpen());
    }

    public function test_it_returns_false_when_event_is_inactive()
    {
        $year = $this->createAcademicYear();

        AcademicEvent::create([
            'academic_year_id' => $year->id,
            'title' => 'Test Period',
            'type' => 'depot_justificatifs',
            'start_date' => now()->subDay(),
            'end_date' => now()->addDay(),
            'is_active' => false, // explicitly inactive
        ]);

        $this->assertFalse($this->service->isDocumentSubmissionOpen());
    }
}

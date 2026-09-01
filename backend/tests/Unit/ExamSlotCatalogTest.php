<?php

namespace Tests\Unit;

use App\Services\Academic\ExamSlotCatalog;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class ExamSlotCatalogTest extends TestCase
{
    #[Test]
    public function it_resolves_standard_morning_slots_with_fifteen_minute_break(): void
    {
        $first = ExamSlotCatalog::resolve('08:30:00');
        $second = ExamSlotCatalog::resolve('10:45');

        $this->assertSame('08:30', $first['start']);
        $this->assertSame('10:30', $first['end']);
        $this->assertSame(120, $first['duration']);

        $this->assertSame('10:45', $second['start']);
        $this->assertSame('12:15', $second['end']);
        $this->assertSame(90, $second['duration']);
    }

    #[Test]
    public function it_formats_convocation_time_from_official_slot(): void
    {
        $this->assertSame('14:30 - 16:30', ExamSlotCatalog::formattedRange('14:30:00'));
    }

    #[Test]
    public function it_maps_legacy_afternoon_start_without_break_to_official_slot(): void
    {
        $this->assertSame('16:45 - 18:15', ExamSlotCatalog::formattedRange('16:30:00'));
        $this->assertSame('10:45 - 12:15', ExamSlotCatalog::formattedRange('10:30:00'));
    }

    #[Test]
    public function it_maps_end_of_previous_slot_to_next_slot_with_break(): void
    {
        $this->assertSame('10:45 - 12:15', ExamSlotCatalog::formattedRange('10:30'));
        $this->assertSame('16:45 - 18:15', ExamSlotCatalog::formattedRange('16:30'));
    }

    #[Test]
    public function it_falls_back_to_two_hours_for_unknown_start_time(): void
    {
        $slot = ExamSlotCatalog::resolve('09:00');

        $this->assertSame('09:00', $slot['start']);
        $this->assertSame('11:00', $slot['end']);
        $this->assertSame(120, $slot['duration']);
    }
}

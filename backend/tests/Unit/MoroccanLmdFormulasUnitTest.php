<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Pure Unit Tests for Moroccan Higher Education LMD Formulas & Academic Rules.
 * Reference: Normes Pédagogiques Nationales (NPN) — ENCG / MESRSFC.
 */
class MoroccanLmdFormulasUnitTest extends TestCase
{
    /**
     * Test Continuous Assessment (40%) and Final Exam (60%) Module Calculation.
     */
    public function test_module_weighted_average_calculation(): void
    {
        $ccMark = 16.0;
        $examMark = 13.5;
        $ccWeight = 0.40;
        $examWeight = 0.60;

        $moduleScore = ($ccMark * $ccWeight) + ($examMark * $examWeight);

        $this->assertEquals(14.50, round($moduleScore, 2));
    }

    /**
     * Test Rattrapage Maximum Formula: Final Mark = max(Normal, Rattrapage).
     */
    public function test_rattrapage_formula_takes_maximum_grade(): void
    {
        $normalGrade = 8.5;
        $rattrapageGrade = 12.0;

        $finalGrade = max($normalGrade, $rattrapageGrade);

        $this->assertEquals(12.0, $finalGrade);
        $this->assertGreaterThanOrEqual(10.0, $finalGrade);
    }

    /**
     * Test Rattrapage does not decrease grade if rattrapage score was lower.
     */
    public function test_rattrapage_does_not_penalize_if_lower_than_normal(): void
    {
        $normalGrade = 9.0;
        $rattrapageGrade = 7.5;

        $finalGrade = max($normalGrade, $rattrapageGrade);

        $this->assertEquals(9.0, $finalGrade);
    }

    /**
     * Test Eliminatory Threshold: Grade < 7.0/20 requires retake regardless of average.
     */
    public function test_eliminatory_grade_detection(): void
    {
        $moduleGrades = [15.0, 16.0, 14.0, 6.5]; // 6.5 < 7.0 is eliminatory
        $eliminatoryThreshold = 7.0;

        $hasEliminatory = false;
        foreach ($moduleGrades as $grade) {
            if ($grade < $eliminatoryThreshold) {
                $hasEliminatory = true;
                break;
            }
        }

        $this->assertTrue($hasEliminatory);
    }

    /**
     * Test Moroccan Academic Mention (Honor) Assignment.
     */
    public function test_moroccan_academic_honors_mentions(): void
    {
        $getMention = function (float $average): string {
            return match (true) {
                $average >= 16.0 => 'Très Bien',
                $average >= 14.0 => 'Bien',
                $average >= 12.0 => 'Assez Bien',
                $average >= 10.0 => 'Passable',
                default          => 'Ajourné',
            };
        };

        $this->assertEquals('Très Bien', $getMention(16.75));
        $this->assertEquals('Bien', $getMention(14.50));
        $this->assertEquals('Assez Bien', $getMention(13.20));
        $this->assertEquals('Passable', $getMention(10.80));
        $this->assertEquals('Ajourné', $getMention(8.50));
    }

    /**
     * Test ECTS Credit Calculation (30 ECTS allocated per semester).
     */
    public function test_semester_ects_credits_allocation(): void
    {
        $modules = [
            ['name' => 'M1', 'credits' => 5, 'passed' => true],
            ['name' => 'M2', 'credits' => 5, 'passed' => true],
            ['name' => 'M3', 'credits' => 5, 'passed' => true],
            ['name' => 'M4', 'credits' => 5, 'passed' => true],
            ['name' => 'M5', 'credits' => 5, 'passed' => true],
            ['name' => 'M6', 'credits' => 5, 'passed' => true],
        ];

        $totalEarnedCredits = 0;
        foreach ($modules as $mod) {
            if ($mod['passed']) {
                $totalEarnedCredits += $mod['credits'];
            }
        }

        $this->assertEquals(30, $totalEarnedCredits);
    }
}

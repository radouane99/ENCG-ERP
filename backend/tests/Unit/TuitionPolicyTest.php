<?php

namespace Tests\Unit;

use App\Domain\Deliberation\LmdRules;
use PHPUnit\Framework\TestCase;

class TuitionPolicyTest extends TestCase
{
    public function test_only_explicit_paid_course_types_require_tuition(): void
    {
        foreach (['grande_ecole', 'formation_initiale', 'licence_initiale', 'master_initial', 'doctorat', null] as $type) {
            $this->assertFalse(LmdRules::filiereRequiresPayment($type));
        }
        foreach (LmdRules::PAID_FILIERE_TYPES as $type) {
            $this->assertTrue(LmdRules::filiereRequiresPayment(' '.strtoupper($type).' '));
        }
    }
}

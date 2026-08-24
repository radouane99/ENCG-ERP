<?php

declare(strict_types=1);

namespace App\Domain\Exam\Services;

use App\Services\Academic\DeliberationEngine as CanonicalDeliberationEngine;

/**
 * Alias du moteur académique canonique — évite une 3e copie des règles LMD.
 */
class DeliberationEngine extends CanonicalDeliberationEngine
{
}

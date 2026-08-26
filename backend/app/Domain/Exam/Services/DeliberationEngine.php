<?php

declare(strict_types=1);

namespace App\Domain\Exam\Services;

use App\Services\Academic\DeliberationEngine as CanonicalDeliberationEngine;

/**
 * Alias — le moteur LMD canonique est App\Domain\Deliberation\Services\DeliberationEngine
 * (qui étend le calculateur Academic). Ne pas ajouter une 4e copie.
 */
class DeliberationEngine extends CanonicalDeliberationEngine {}

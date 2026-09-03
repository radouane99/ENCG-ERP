<?php

namespace App\Services\Academic;

class ProctorAssignmentService
{
    /**
     * Algorithme de Charge de Surveillance :
     * Affecte les surveillants de manière équitable en priorisant ceux qui ont le moins d'heures.
     * Assigne un Surveillant Principal, un Assistant et un Réserviste.
     */
    public function autoAssignProctors(int $sessionId): array
    {
        return app(\App\Services\ProctorAssignmentService::class)->autoAssignProctors($sessionId);
    }
}

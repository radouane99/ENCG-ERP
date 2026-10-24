<?php

namespace App\Domain\Admission;

final class AdmissionEntryRules
{
    public const DOCUMENTS = ['bac', 'cnie', 'releve_notes', 'photo'];

    public static function validEntry(string $route, int $semester): bool
    {
        return ($route === 'tafem' && $semester === 1) || ($route === 'cnaem' && in_array($semester, [5, 7], true));
    }

    public static function documents(string $route): array
    {
        return $route === 'cnaem' ? [...self::DOCUMENTS, 'attestation_admission', 'releve_parcours'] : self::DOCUMENTS;
    }

    public static function physicalChecklist(string $route): array
    {
        return ['bac_original' => 'Baccalauréat original contrôlé', 'releve_notes' => 'Relevé de notes contrôlé', 'cin_copy' => 'Identité CNIE rapprochée', 'photos' => 'Photos reçues'] + ($route === 'cnaem' ? ['attestation_admission' => 'Attestation officielle d’admission CNAEM contrôlée', 'releve_parcours' => 'Relevés du parcours antérieur contrôlés'] : []);
    }
}

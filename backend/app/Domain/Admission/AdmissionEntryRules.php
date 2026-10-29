<?php

namespace App\Domain\Admission;

final class AdmissionEntryRules
{
    public const DOCUMENTS = ['bac', 'cnie', 'releve_notes', 'photo'];

    public static function validEntry(string $route, int $semester): bool
    {
        return match ($route) {
            'tafem' => $semester === 1,
            'cnaem' => in_array($semester, [5, 7], true),
            'passerelle_concours' => in_array($semester, [5, 7], true),
            'temps_amenage_master' => in_array($semester, [1, 7], true),
            'temps_amenage_licence' => $semester === 5,
            'temps_amenage_du' => in_array($semester, [1, 3, 5], true),
            default => false,
        };
    }

    public static function documents(string $route): array
    {
        return match ($route) {
            'cnaem' => [...self::DOCUMENTS, 'attestation_admission', 'releve_parcours'],
            'passerelle_concours' => [...self::DOCUMENTS, 'diplome_bac2', 'releve_parcours'],
            'temps_amenage_master' => ['cnie', 'photo', 'licence', 'releve_notes', 'cv', 'attestation_travail'],
            'temps_amenage_licence' => ['cnie', 'photo', 'diplome_bac2', 'releve_notes', 'cv', 'attestation_travail'],
            'temps_amenage_du' => ['cnie', 'photo', 'bac', 'cv', 'attestation_travail'],
            default => self::DOCUMENTS,
        };
    }

    public static function physicalChecklist(string $route): array
    {
        $base = [
            'cin_copy' => 'Identité CNIE rapprochée',
            'photos' => 'Photos d’identité reçues',
        ];

        return match ($route) {
            'cnaem' => $base + [
                'bac_original' => 'Baccalauréat original contrôlé',
                'releve_notes' => 'Relevé de notes contrôlé',
                'attestation_admission' => 'Attestation officielle d’admission CNAEM contrôlée',
                'releve_parcours' => 'Relevés du parcours antérieur contrôlés',
            ],
            'passerelle_concours' => $base + [
                'bac_original' => 'Baccalauréat original contrôlé',
                'diplome_bac2' => 'Diplôme Bac+2 original contrôlé',
                'releve_parcours' => 'Relevés du parcours antérieur contrôlés',
            ],
            'temps_amenage_master' => $base + [
                'licence' => 'Diplôme de Licence / Bac+3 original contrôlé',
                'attestation_travail' => 'Attestation de travail / justificatif professionnel contrôlé',
                'releve_notes' => 'Relevés de notes universitaires contrôlés',
            ],
            'temps_amenage_licence' => $base + [
                'diplome_bac2' => 'Diplôme Bac+2 original contrôlé',
                'attestation_travail' => 'Attestation de travail / justificatif professionnel contrôlé',
                'releve_notes' => 'Relevés de notes contrôlés',
            ],
            'temps_amenage_du' => $base + [
                'bac_original' => 'Diplôme de base contrôlé',
                'attestation_travail' => 'Attestation de travail / justificatif professionnel contrôlé',
            ],
            default => $base + [
                'bac_original' => 'Baccalauréat original contrôlé',
                'releve_notes' => 'Relevé de notes contrôlé',
            ],
        };
    }

    public static function uploadTypes(): array
    {
        return [...self::DOCUMENTS, 'attestation_admission', 'attestation_admissibilite', 'releve_parcours', 'diplome_bac2', 'diplome', 'licence', 'engagement_legalise', 'assurance_etudiant', 'cv', 'attestation_travail'];
    }
}

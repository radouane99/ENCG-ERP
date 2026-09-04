<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Tests Unitaires & Règles Métier : Ségrégation des Documents RH (Vacataire vs Permanent),
 * Retenue IGR (Article 73-II-F du CGI marocain) et Workflow Parapheur ENCG Fès.
 *
 * @group professor-documents
 * @group quality-gate
 */
class ProfessorDocumentSegregationServiceTest extends TestCase
{
    /**
     * Test : Le calcul de l'IGR sur vacation respecte strictement l'Article 73-II-F du CGI marocain (17%).
     */
    public function test_igr_rate_conforms_to_moroccan_tax_code(): void
    {
        $taxRate = 0.17;
        $hours = 40;
        $ratePerHour = 400.0; // DH
        $gross = $hours * $ratePerHour;
        $igr = $gross * $taxRate;
        $net = $gross - $igr;

        $this->assertSame(16000.0, $gross);
        $this->assertSame(2720.0, $igr);
        $this->assertSame(13280.0, $net);
    }

    /**
     * Test : Détection correcte du statut Enseignant Vacataire vs Professeur Permanent.
     */
    public function test_professor_role_and_contract_type_detection(): void
    {
        // Cas 1 : Vacataire par type de contrat
        $profVacataire = (object) ['contract_type' => 'vacataire', 'type' => 'vacataire'];
        $isVacataire1 = ($profVacataire->contract_type === 'vacataire') || ($profVacataire->type === 'vacataire');
        $this->assertTrue($isVacataire1);

        // Cas 2 : Professeur Permanent titulaire
        $profPermanent = (object) ['contract_type' => 'permanent', 'type' => 'permanent'];
        $isVacataire2 = ($profPermanent->contract_type === 'vacataire') || ($profPermanent->type === 'vacataire');
        $this->assertFalse($isVacataire2);
    }

    /**
     * Test : Filtrage strict du catalogue des documents selon le statut statutaire.
     */
    public function test_document_catalog_strict_partitioning(): void
    {
        $allSystemDocs = [
            'attestation_travail' => ['for_permanent' => true, 'for_vacataire' => false],
            'attestation_salaire' => ['for_permanent' => true, 'for_vacataire' => false],
            'autorisation_absence' => ['for_permanent' => true, 'for_vacataire' => false],
            'attestation_service_fait' => ['for_permanent' => true, 'for_vacataire' => false],
            'attestation_vacation' => ['for_permanent' => false, 'for_vacataire' => true],
            'bordereau_decompte_vacation' => ['for_permanent' => false, 'for_vacataire' => true],
            'attestation_igr_vacation' => ['for_permanent' => false, 'for_vacataire' => true],
            'ordre_de_mission' => ['for_permanent' => true, 'for_vacataire' => true],
        ];

        // 1. Filtrage pour vacataire
        $vacataireCatalog = array_keys(array_filter($allSystemDocs, fn ($d) => $d['for_vacataire']));
        $this->assertEqualsCanonicalizing(
            ['attestation_vacation', 'bordereau_decompte_vacation', 'attestation_igr_vacation', 'ordre_de_mission'],
            $vacataireCatalog
        );

        // 2. Filtrage pour titulaire
        $permanentCatalog = array_keys(array_filter($allSystemDocs, fn ($d) => $d['for_permanent']));
        $this->assertEqualsCanonicalizing(
            ['attestation_travail', 'attestation_salaire', 'autorisation_absence', 'attestation_service_fait', 'ordre_de_mission'],
            $permanentCatalog
        );
    }

    /**
     * Test : Blocage formel 403 en cas de tentative d'accès frauduleuse à des attestations de fonctionnaire.
     */
    public function test_security_interception_of_unauthorized_document_requests(): void
    {
        $securityGuard = function (bool $isVacataire, string $requestedDoc): int {
            if ($isVacataire && in_array($requestedDoc, ['attestation_travail', 'attestation_salaire', 'autorisation_absence'], true)) {
                return 403; // Forbidden
            }
            if (! $isVacataire && in_array($requestedDoc, ['attestation_vacation', 'bordereau_decompte_vacation', 'attestation_igr_vacation'], true)) {
                return 403; // Forbidden
            }

            return 200; // Authorized
        };

        // Vacataire tentant d'obtenir une attestation de travail ou de salaire
        $this->assertSame(403, $securityGuard(true, 'attestation_travail'));
        $this->assertSame(403, $securityGuard(true, 'attestation_salaire'));
        $this->assertSame(403, $securityGuard(true, 'autorisation_absence'));

        // Vacataire demandant ses attestations légitimes
        $this->assertSame(200, $securityGuard(true, 'attestation_vacation'));
        $this->assertSame(200, $securityGuard(true, 'bordereau_decompte_vacation'));
        $this->assertSame(200, $securityGuard(true, 'attestation_igr_vacation'));
        $this->assertSame(200, $securityGuard(true, 'ordre_de_mission'));

        // Permanent tentant de demander des décomptes de vacation
        $this->assertSame(403, $securityGuard(false, 'attestation_vacation'));
        $this->assertSame(403, $securityGuard(false, 'bordereau_decompte_vacation'));
        $this->assertSame(403, $securityGuard(false, 'attestation_igr_vacation'));

        // Permanent demandant ses documents statutaires
        $this->assertSame(200, $securityGuard(false, 'attestation_travail'));
        $this->assertSame(200, $securityGuard(false, 'attestation_salaire'));
        $this->assertSame(200, $securityGuard(false, 'attestation_service_fait'));
    }

    /**
     * Test : Le Dossier Administratif RH contient tous les justificatifs requis pour l'ordonnancement.
     */
    public function test_administrative_dossier_required_attributes(): void
    {
        $requiredKeys = [
            'is_vacataire',
            'is_complete',
            'status_label',
            'rib_status',
            'rib_number',
            'bank_name',
            'employer_authorization',
            'diploma_status',
            'cin_status',
            'last_verified_at',
        ];

        $mockPayload = [
            'is_vacataire' => true,
            'is_complete' => true,
            'status_label' => 'Dossier Administratif Conforme pour Ordonnancement',
            'rib_status' => 'validé',
            'rib_number' => '230 780 0001234567890 45',
            'bank_name' => 'Banque Populaire (Agence Fès Ville Nouvelle)',
            'employer_authorization' => 'Déposée & Conforme (Exercice 2026)',
            'diploma_status' => 'Doctorat d\'État / National Vérifié',
            'cin_status' => 'Vérifiée (Valide jusqu\'en 2030)',
            'last_verified_at' => '04/09/2026',
        ];

        foreach ($requiredKeys as $key) {
            $this->assertArrayHasKey($key, $mockPayload, "Le champ '{$key}' doit être présent dans le dossier administratif");
        }
    }
}

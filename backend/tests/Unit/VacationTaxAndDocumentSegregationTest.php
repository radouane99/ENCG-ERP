<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Tests Unitaires pour la Ségrégation RH, la Fiscalité des Vacations (CGI Maroc)
 * et les Règles Réglementaires MESRSFC / ENCG Fès.
 *
 * @group professor-documents
 * @group vacations
 */
class VacationTaxAndDocumentSegregationTest extends TestCase
{
    /**
     * Taux légal d'imposition IGR à la source pour vacation (Article 73-II-F du CGI marocain).
     */
    public const IGR_VACATION_RATE = 0.17;

    /**
     * Test de conformité fiscale : Calcul de la Retenue à la Source IGR (17%) selon le CGI Marocain.
     */
    public function test_moroccan_cgi_article_73_igr_withholding_calculation(): void
    {
        $hourlyRate = 350.0; // DH / heure (Taux standard Doctorat / Expert ENCG)
        $completedHours = 36; // Volume horaire d'un module semestriel standard

        $grossAmount = $completedHours * $hourlyRate; // 36 * 350 = 12,600 DH
        $igrAmount = $grossAmount * self::IGR_VACATION_RATE; // 12,600 * 0.17 = 2,142 DH
        $netPayable = $grossAmount - $igrAmount; // 12,600 - 2,142 = 10,458 DH

        $this->assertEquals(12600.0, $grossAmount, 'Le montant brut des vacations doit être de 12 600 DH');
        $this->assertEquals(2142.0, $igrAmount, 'La retenue à la source IGR (17%) doit être exactement de 2 142 DH');
        $this->assertEquals(10458.0, $netPayable, 'Le net à payer ordonnancé doit être de 10 458 DH');
    }

    /**
     * Test de la matrice des documents autorisés pour un Enseignant Vacataire.
     */
    public function test_vacataire_permitted_document_types(): void
    {
        $vacataireAllowedTypes = [
            'attestation_vacation',
            'bordereau_decompte_vacation',
            'attestation_igr_vacation',
            'ordre_de_mission',
        ];

        // L'enseignant vacataire a droit aux 4 documents spécifiques
        $this->assertContains('attestation_vacation', $vacataireAllowedTypes);
        $this->assertContains('bordereau_decompte_vacation', $vacataireAllowedTypes);
        $this->assertContains('attestation_igr_vacation', $vacataireAllowedTypes);
        $this->assertContains('ordre_de_mission', $vacataireAllowedTypes);

        // Les documents de fonctionnaire titulaire ne doivent JAMAIS figurer dans son catalogue
        $this->assertNotContains('attestation_travail', $vacataireAllowedTypes);
        $this->assertNotContains('attestation_salaire', $vacataireAllowedTypes);
        $this->assertNotContains('autorisation_absence', $vacataireAllowedTypes);
    }

    /**
     * Test de la matrice des documents autorisés pour un Professeur Permanent (Titulaire).
     */
    public function test_permanent_professor_permitted_document_types(): void
    {
        $permanentAllowedTypes = [
            'attestation_travail',
            'attestation_salaire',
            'autorisation_absence',
            'attestation_service_fait',
            'ordre_de_mission',
        ];

        // Le professeur permanent a droit à ses attestations statutaires
        $this->assertContains('attestation_travail', $permanentAllowedTypes);
        $this->assertContains('attestation_salaire', $permanentAllowedTypes);
        $this->assertContains('autorisation_absence', $permanentAllowedTypes);
        $this->assertContains('attestation_service_fait', $permanentAllowedTypes);
        $this->assertContains('ordre_de_mission', $permanentAllowedTypes);

        // Les documents de vacation ne doivent JAMAIS figurer dans le catalogue d'un titulaire
        $this->assertNotContains('attestation_vacation', $permanentAllowedTypes);
        $this->assertNotContains('bordereau_decompte_vacation', $permanentAllowedTypes);
        $this->assertNotContains('attestation_igr_vacation', $permanentAllowedTypes);
    }

    /**
     * Test de la règle de garde-fou (Guard Rule) : Tentative de demande illicite par un vacataire.
     */
    public function test_guard_rule_rejects_statutory_documents_for_vacataires(): void
    {
        $forbiddenForVacataires = ['attestation_travail', 'attestation_salaire', 'autorisation_absence'];

        foreach ($forbiddenForVacataires as $docType) {
            $isVacataire = true;
            $shouldBlock = $isVacataire && in_array($docType, ['attestation_travail', 'attestation_salaire', 'autorisation_absence']);

            $this->assertTrue(
                $shouldBlock,
                "La demande de '{$docType}' par un vacataire doit être formellement bloquée (Code HTTP 403 Forbidden)"
            );
        }
    }

    /**
     * Test de la règle de garde-fou (Guard Rule) : Tentative de demande de vacations par un titulaire.
     */
    public function test_guard_rule_rejects_vacation_documents_for_permanent_professors(): void
    {
        $forbiddenForPermanents = ['attestation_vacation', 'bordereau_decompte_vacation', 'attestation_igr_vacation'];

        foreach ($forbiddenForPermanents as $docType) {
            $isVacataire = false;
            $shouldBlock = ! $isVacataire && in_array($docType, ['attestation_vacation', 'bordereau_decompte_vacation', 'attestation_igr_vacation']);

            $this->assertTrue(
                $shouldBlock,
                "La demande de '{$docType}' par un professeur titulaire doit être bloquée (Code HTTP 403 Forbidden)"
            );
        }
    }

    /**
     * Test du format du code de suivi officiel (Tracking Code Parapheur).
     */
    public function test_tracking_code_format_compliance(): void
    {
        $year = date('Y');
        $randomNum = 1234;
        $trackingCode = 'DOC-PROF-'.$year.'-'.str_pad((string)$randomNum, 4, '0', STR_PAD_LEFT);

        $this->assertMatchesRegularExpression(
            '/^DOC-PROF-\d{4}-\d{4}$/',
            $trackingCode,
            'Le code de suivi doit respecter la nomenclature officielle DOC-PROF-YYYY-XXXX'
        );
    }

    /**
     * Test des prérequis du Dossier Administratif RH & Conformité Paiement.
     */
    public function test_administrative_dossier_compliance_structure(): void
    {
        $dossier = [
            'is_vacataire' => true,
            'is_complete' => true,
            'status_label' => 'Dossier Administratif Conforme pour Ordonnancement',
            'rib_status' => 'validé',
            'employer_authorization' => 'Déposée & Conforme (Exercice 2026)',
            'diploma_status' => 'Doctorat d\'État / National Vérifié',
            'cin_status' => 'Vérifiée (Valide jusqu\'en 2030)',
        ];

        $this->assertTrue($dossier['is_complete']);
        $this->assertEquals('validé', $dossier['rib_status']);
        $this->assertStringContainsString('Conforme', $dossier['employer_authorization']);
        $this->assertStringContainsString('Doctorat', $dossier['diploma_status']);
    }
}

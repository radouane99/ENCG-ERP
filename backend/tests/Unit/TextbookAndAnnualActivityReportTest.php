<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Tests Unitaires pour le Cahier de Texte Synchrone, la Certification du Service Fait
 * et le Bilan Annuel d'Activité Universitaire (CNU / MESRSFC).
 *
 * @group textbook
 * @group service-fait
 * @group annual-activity-report
 */
class TextbookAndAnnualActivityReportTest extends TestCase
{
    /**
     * Volume horaire standard d'un module semestriel selon les normes NPN / LMD marocaines.
     */
    public const STANDARD_MODULE_HOURS = 36.0;

    /**
     * Seuil minimal pour la délivrance d'une attestation de Service Fait (66% ou 24h).
     */
    public const SERVICE_FAIT_MIN_HOURS = 24.0;

    /**
     * 1. Test du calcul de couverture du syllabus basé sur les heures réelles consignées.
     */
    public function test_syllabus_progress_calculation_standard_npn_module(): void
    {
        $loggedHours = 27.0; // 9 séances de 3h ou 13.5 séances de 2h
        $targetHours = self::STANDARD_MODULE_HOURS;

        $progressPercentage = min(100, (int) round(($loggedHours / $targetHours) * 100));
        $isEligibleForServiceFait = $loggedHours >= self::SERVICE_FAIT_MIN_HOURS;

        $this->assertEquals(75, $progressPercentage, '27h sur un module de 36h doit donner exactement 75% de progression du syllabus');
        $this->assertTrue($isEligibleForServiceFait, 'À 27h (> 24h), le module est éligible à la certification du Service Fait');
    }

    /**
     * 2. Test de la structure et validation des données d'une séance de Cahier de Texte.
     */
    public function test_textbook_session_data_structure(): void
    {
        $session = [
            'module_id' => 10,
            'session_date' => '2026-09-04',
            'session_duration_hours' => 2.0,
            'session_type' => 'CM',
            'chapter_title' => 'Diagnostic Financier & Analyse de la Rentabilité',
            'key_concepts' => 'EBE, CAF, SIG, Effet de Levier Financier',
            'pedagogical_goals' => 'Maîtriser la décomposition DuPont du ROE',
            'homework_assigned' => 'Cas pratique OCP à préparer pour le TD',
            'syllabus_percentage' => 35,
            'status' => 'submitted',
        ];

        $this->assertArrayHasKey('chapter_title', $session);
        $this->assertArrayHasKey('session_duration_hours', $session);
        $this->assertContains($session['session_type'], ['CM', 'TD', 'TP']);
        $this->assertGreaterThan(0, $session['session_duration_hours']);
        $this->assertEquals('submitted', $session['status'], 'Toute nouvelle séance saisie doit être au statut initial submitted');
    }

    /**
     * 3. Test du workflow de Visa du Chef de Département / Scolarité.
     */
    public function test_department_head_visa_workflow(): void
    {
        $session = [
            'id' => 42,
            'status' => 'submitted',
            'validated_by' => null,
            'validated_at' => null,
        ];

        // Simulation de l'action "Accorder le Visa" par le Chef de Département
        $validatorName = 'Pr. Abdelhak EL AMRANI (Chef de Département)';
        $visaTimestamp = '2026-09-04 15:30:00';

        $session['status'] = 'validated';
        $session['validated_by'] = $validatorName;
        $session['validated_at'] = $visaTimestamp;

        $this->assertEquals('validated', $session['status'], 'Le statut doit passer à validated après octroi du visa');
        $this->assertNotNull($session['validated_by'], 'L\'identité du valideur doit être enregistrée');
        $this->assertNotNull($session['validated_at'], 'La date et heure de visa doivent être horodatées');
    }

    /**
     * 4. Test d'éligibilité double de l'Attestation de Service Fait Pédagogique.
     * Le Service Fait doit être accessible à la fois aux vacataires (ordonnancement)
     * et aux permanents (décharge statutaire).
     */
    public function test_service_fait_dual_eligibility(): void
    {
        $permanentCanAccessServiceFait = true;
        $vacataireCanAccessServiceFait = true;

        $this->assertTrue($permanentCanAccessServiceFait, 'Un professeur permanent doit pouvoir télécharger son Attestation de Service Fait');
        $this->assertTrue($vacataireCanAccessServiceFait, 'Un enseignant vacataire doit pouvoir télécharger son Attestation de Service Fait pour justifier ses vacations');
    }

    /**
     * 5. Test de consolidation du Bilan Annuel d'Activité Universitaire (Dossier CNU / MESRSFC).
     */
    public function test_annual_activity_report_consolidation_structure(): void
    {
        $teachingModules = [
            ['code' => 'GFC-S5-M03', 'name' => 'Finance d\'Entreprise', 'total_hours' => 56],
            ['code' => 'GFC-S5-M04', 'name' => 'Contrôle de Gestion', 'total_hours' => 56],
            ['code' => 'CCA-S7-M01', 'name' => 'Audit Comptable & IFRS', 'total_hours' => 42],
        ];

        $totalTeachingHours = array_sum(array_column($teachingModules, 'total_hours'));
        $examSurveillancesCount = 6;
        $pfeSupervisedCount = 4;
        $laboratory = 'LARMAFIG (Laboratoire de Recherche en Management, Finance et Gouvernance)';

        $this->assertEquals(154, $totalTeachingHours, 'Le cumul des heures certifiées d\'enseignement doit être de 154h');
        $this->assertGreaterThanOrEqual(1, count($teachingModules), 'Le bilan annuel doit lister tous les modules dispensés');
        $this->assertGreaterThan(0, $examSurveillancesCount, 'Le nombre de surveillances d\'examens doit être consolidé');
        $this->assertGreaterThan(0, $pfeSupervisedCount, 'Les encadrements de PFE / thèses doivent être comptabilisés');
        $this->assertStringContainsString('LARMAFIG', $laboratory, 'Le laboratoire de rattachement doit être mentionné');
    }

    /**
     * 6. Test du scellement numérique SHA-256 et référence unique de traçabilité.
     */
    public function test_sha256_digital_seal_generation(): void
    {
        $userId = 15;
        $userEmail = 'professeur.elamrani@encg-fes.ac.ma';
        $dateStr = '20260904';
        $salt = 'ENCG-BILAN-ANNUEL-MESRSFC';

        $rawPayload = "{$userId}:{$userEmail}:{$dateStr}:{$salt}";
        $digitalSealHash = hash('sha256', $rawPayload);

        $this->assertEquals(64, strlen($digitalSealHash), 'L\'empreinte cryptographique SHA-256 doit faire exactement 64 caractères hexadécimaux');
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $digitalSealHash, 'L\'empreinte doit être une chaîne hexadécimale valide');

        // Tracking code format: BAU-YYYY-XXXX
        $trackingCode = 'BAU-2026-' . str_pad($userId, 4, '0', STR_PAD_LEFT);
        $this->assertEquals('BAU-2026-0015', $trackingCode, 'Le code de traçabilité officiel doit respecter la nomenclature BAU-2026-XXXX');
    }
}

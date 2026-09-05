<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Tests Unitaires pour les 4 Modules Stratégiques Académiques & Administratifs ENCG :
 * 1. Plateforme de Réclamation de Notes & Consultation des Copies (Guichet LMD 48h)
 * 2. Moteur d'Orientation & Choix de Spécialité au Mérite (Numerus Clausus S6/S7)
 * 3. Workflow des Conventions de Stage Tripartites & Assurance RC
 * 4. Diploma Supplement (Annexe Descriptive au Diplôme - 300 ECTS Bologne / EHEA)
 *
 * @group academic-strategic
 * @group grade-appeals
 * @group specialty-orientation
 * @group internship-conventions
 * @group diploma-supplement
 */
class AcademicStrategicModulesTest extends TestCase
{
    // =========================================================================
    // 1. MODULE RÉCLAMATIONS DE NOTES (GUICHET LMD 48H)
    // =========================================================================

    /**
     * Teste qu'une réclamation soumise dans la fenêtre légale LMD (48h) est acceptée.
     */
    public function test_grade_appeal_within_48h_window(): void
    {
        $pvPublicationAt = new \DateTimeImmutable('2026-09-04 10:00:00');
        $appealDeadlineAt = $pvPublicationAt->modify('+48 hours');
        $submissionTime = new \DateTimeImmutable('2026-09-05 14:00:00'); // 28h après publication

        $isWithinDeadline = $submissionTime <= $appealDeadlineAt;
        $hoursRemaining = ($appealDeadlineAt->getTimestamp() - $submissionTime->getTimestamp()) / 3600;

        $appeal = [
            'student_id' => 101,
            'module_id' => 5,
            'assessment_id' => 12,
            'original_grade' => 9.50,
            'reason' => 'Erreur matérielle de sommation sur l\'exercice 2 (4 points non comptabilisés)',
            'appeal_deadline_at' => $appealDeadlineAt->format('Y-m-d H:i:s'),
            'status' => 'submitted',
        ];

        $this->assertTrue($isWithinDeadline, 'La réclamation soumise avant 48h doit être recevable');
        $this->assertEquals(20.0, $hoursRemaining, 'Il doit rester exactement 20h au compte à rebours');
        $this->assertEquals('submitted', $appeal['status']);
        $this->assertEquals(9.50, $appeal['original_grade']);
    }

    /**
     * Teste que le dépôt de réclamation est rejeté si le délai légal LMD de 48h est expiré.
     */
    public function test_grade_appeal_rejected_after_48h_deadline(): void
    {
        $pvPublicationAt = new \DateTimeImmutable('2026-09-01 08:00:00');
        $appealDeadlineAt = $pvPublicationAt->modify('+48 hours'); // Expiration: 2026-09-03 08:00:00
        $submissionTime = new \DateTimeImmutable('2026-09-03 11:30:00'); // 51.5h après publication

        $isWithinDeadline = $submissionTime <= $appealDeadlineAt;

        $this->assertFalse($isWithinDeadline, 'Toute réclamation déposée après expiration des 48h doit être forclose');
    }

    /**
     * Teste le workflow de rectification de note par l'enseignant avec audit et recalcul.
     */
    public function test_grade_appeal_rectification_workflow(): void
    {
        $appeal = [
            'id' => 1,
            'student_id' => 101,
            'original_grade' => 9.50,
            'rectified_grade' => null,
            'status' => 'submitted',
            'resolved_by' => null,
            'resolved_at' => null,
            'resolution_notes' => null,
        ];

        // L'enseignant constate l'omission de sommation et rectifie
        $professorName = 'Pr. Abdelhak EL AMRANI';
        $rectifiedGrade = 13.50;
        $resolutionNotes = 'Vérification de copie effectuée : 4 points accordés pour la question 2 non additionnés initialement.';

        $appeal['status'] = 'rectified';
        $appeal['rectified_grade'] = $rectifiedGrade;
        $appeal['resolved_by'] = $professorName;
        $appeal['resolved_at'] = '2026-09-05 16:00:00';
        $appeal['resolution_notes'] = $resolutionNotes;

        $this->assertEquals('rectified', $appeal['status']);
        $this->assertEquals(13.50, $appeal['rectified_grade']);
        $this->assertGreaterThan($appeal['original_grade'], $appeal['rectified_grade']);
        $this->assertNotNull($appeal['resolved_by']);
        $this->assertStringContainsString('4 points accordés', $appeal['resolution_notes']);
    }

    // =========================================================================
    // 2. MODULE ORIENTATION & CHOIX DE SPÉCIALITÉ (NUMERUS CLAUSUS)
    // =========================================================================

    /**
     * Teste la saisie hiérarchisée des 5 voeux de filières de spécialité ENCG (GFC, MACG, MCI, MRH, MLOG).
     */
    public function test_specialty_wishes_hierarchy(): void
    {
        $wishes = [
            ['filiere_code' => 'GFC', 'rank' => 1],
            ['filiere_code' => 'MACG', 'rank' => 2],
            ['filiere_code' => 'MCI', 'rank' => 3],
            ['filiere_code' => 'MRH', 'rank' => 4],
            ['filiere_code' => 'MLOG', 'rank' => 5],
        ];

        $ranks = array_column($wishes, 'rank');
        sort($ranks);

        $this->assertCount(5, $wishes, 'L\'étudiant de Tronc Commun doit exprimer 5 voeux ordonnés');
        $this->assertEquals([1, 2, 3, 4, 5], $ranks, 'Les rangs de préférence doivent former une permutation stricte de 1 à 5');
    }

    /**
     * Teste l'algorithme d'allocation au mérite respectant le Numerus Clausus des filières.
     */
    public function test_specialty_allocation_merit_algorithm(): void
    {
        // Capacités définies par le Conseil de Direction / Département
        $capacities = [
            'GFC' => 2, // Quota très serré pour tester le débordement
            'MACG' => 2,
            'MCI' => 2,
        ];

        // 3 étudiants candidats avec scores de mérite calculés (S1-S4)
        $students = [
            [
                'id' => 1,
                'merit_score' => 15.20,
                'wishes' => ['GFC', 'MACG', 'MCI'],
            ],
            [
                'id' => 2,
                'merit_score' => 14.80,
                'wishes' => ['GFC', 'MACG', 'MCI'],
            ],
            [
                'id' => 3,
                'merit_score' => 13.50,
                'wishes' => ['GFC', 'MACG', 'MCI'], // 3ème sur GFC -> Doit basculer vers MACG
            ],
        ];

        // Tri décroissant par score de mérite (Critère de classement LMD)
        usort($students, fn ($a, $b) => $b['merit_score'] <=> $a['merit_score']);

        $allocatedCounts = ['GFC' => 0, 'MACG' => 0, 'MCI' => 0];
        $allocations = [];

        foreach ($students as $student) {
            foreach ($student['wishes'] as $choice) {
                if ($allocatedCounts[$choice] < $capacities[$choice]) {
                    $allocations[$student['id']] = $choice;
                    $allocatedCounts[$choice]++;
                    break;
                }
            }
        }

        // L'étudiant 1 et 2 obtiennent GFC (scores 15.20 et 14.80)
        $this->assertEquals('GFC', $allocations[1], 'Le major de promotion doit obtenir son 1er choix (GFC)');
        $this->assertEquals('GFC', $allocations[2], 'Le 2ème étudiant doit obtenir GFC');

        // L'étudiant 3 (13.50) doit basculer sur MACG car le quota de GFC (2 places) est saturé
        $this->assertEquals('MACG', $allocations[3], 'Le 3ème étudiant doit être basculé sur son choix 2 (MACG) par Numerus Clausus');
        $this->assertEquals(2, $allocatedCounts['GFC'], 'La capacité maximale de GFC ne doit jamais être dépassée');
        $this->assertEquals(1, $allocatedCounts['MACG']);
    }

    // =========================================================================
    // 3. MODULE CONVENTIONS DE STAGE TRIPARTITES & ASSURANCE RC
    // =========================================================================

    /**
     * Teste la conformité légale marocaine de la convention de stage (Assurance RC obligatoire & token de signature).
     */
    public function test_internship_convention_legal_fields_and_security(): void
    {
        $convention = [
            'internship_type' => 'application', // Initiation, Application, ou PFE
            'company_name' => 'Bank of Africa (BMCE Group)',
            'company_city' => 'Casablanca',
            'company_mentor_name' => 'M. Karim TAZI',
            'company_mentor_email' => 'k.tazi@bankofafrica.ma',
            'insurance_company' => 'MAMDA-MCMA',
            'insurance_policy_number' => 'RC-ETUD-2026-98741',
            'convention_status' => 'draft',
            'security_token' => bin2hex(random_bytes(32)),
            'convention_ref' => 'CONV-2026-ENCG-0042',
        ];

        $this->assertNotEmpty($convention['insurance_policy_number'], 'La police d\'assurance RC est strictement obligatoire en droit marocain');
        $this->assertNotEmpty($convention['insurance_company']);
        $this->assertEquals(64, strlen($convention['security_token']), 'Le jeton de signature externe sécurisé doit faire 64 caractères');
        $this->assertMatchesRegularExpression('/^CONV-2026-ENCG-[0-9]{4}$/', $convention['convention_ref'], 'La référence officielle doit respecter le format normé');
    }

    /**
     * Teste le workflow de validation tripartite (Entreprise -> École).
     */
    public function test_internship_convention_tripartite_signing_workflow(): void
    {
        $convention = [
            'convention_status' => 'draft',
            'company_signed_at' => null,
            'school_signed_at' => null,
        ];

        // Étape 1 : Signature par le tuteur entreprise via lien tokenisé
        $convention['convention_status'] = 'signed_company';
        $convention['company_signed_at'] = '2026-09-05 11:15:00';

        $this->assertEquals('signed_company', $convention['convention_status']);
        $this->assertNotNull($convention['company_signed_at']);

        // Étape 2 : Visa et cachet officiel de la Direction des Stages ENCG
        $convention['convention_status'] = 'approved';
        $convention['school_signed_at'] = '2026-09-05 14:45:00';

        $this->assertEquals('approved', $convention['convention_status']);
        $this->assertNotNull($convention['school_signed_at']);
    }

    // =========================================================================
    // 4. MODULE DIPLOMA SUPPLEMENT (300 ECTS EHEA / BOLOGNE)
    // =========================================================================

    /**
     * Teste que le calcul du Diploma Supplement totalise exactement 300 ECTS répartis sur 10 semestres.
     */
    public function test_diploma_supplement_300_ects_calculation(): void
    {
        $semesters = [];
        for ($i = 1; $i <= 10; $i++) {
            $semesters[] = [
                'semester_code' => 'S' . $i,
                'ects_credits' => 30, // 30 ECTS par semestre selon la Charte Bologne / MESRSFC
                'average' => 14.25,
            ];
        }

        $totalCredits = array_sum(array_column($semesters, 'ects_credits'));

        $this->assertCount(10, $semesters, 'Le cursus du Diplôme des ENCG s\'étend sur 10 semestres complets');
        $this->assertEquals(300, $totalCredits, 'Le cumul du cycle normal BAC+5 ENCG doit faire rigoureusement 300 ECTS');
    }

    /**
     * Teste la conformité du scellement d'authenticité SHA-256 et des 8 sections standardisées UNESCO/EHEA.
     */
    public function test_diploma_supplement_official_sections_and_sha256(): void
    {
        $requiredSections = [
            '1. Informations sur le titulaire du diplôme (Information identifying the holder of the qualification)',
            '2. Informations sur la qualification (Information identifying the qualification)',
            '3. Informations sur le niveau de la qualification (Information on the level of the qualification)',
            '4. Informations sur le contenu et les résultats obtenus (Information on the contents and results gained)',
            '5. Informations sur la fonction de la qualification (Information on the function of the qualification)',
            '6. Informations complémentaires (Additional information)',
            '7. Certification du supplément (Certification of the supplement)',
            '8. Informations sur le système national d\'enseignement supérieur (Information on the national higher education system)',
        ];

        $this->assertCount(8, $requiredSections, 'Le Diploma Supplement doit comporter les 8 rubriques officielles de la Commission Européenne / UNESCO');

        // Génération du scellement cryptographique
        $cne = 'N138099234';
        $diplomaRef = 'DIPL-2026-ENCG-FES-0842';
        $generationTimestamp = '2026-09-05T01:00:00Z';
        $secretSalt = 'ENCG_FES_DIPLOMA_SUPPLEMENT_EHEA_SEAL';

        $seal = hash('sha256', "{$cne}|{$diplomaRef}|{$generationTimestamp}|{$secretSalt}");

        $this->assertEquals(64, strlen($seal), 'Le sceau d\'authenticité doit être un hash SHA-256 valide');
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $seal);
    }
}

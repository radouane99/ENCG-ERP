<?php

namespace Database\Seeders;

use App\Models\Filiere;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PfeAndSoutenanceSeeder extends Seeder
{
    public function run(): void
    {
        $students = Student::with('user')->take(20)->get();
        $professors = Professor::with('user')->take(10)->get();
        $rooms = Room::take(6)->get();

        if ($students->isEmpty() || $professors->isEmpty()) {
            $this->command->warn('No students or professors found. Skipping PFE seeding.');
            return;
        }

        $pfeTopics = [
            ['title' => 'Optimisation de la Performance Financière par l\'Intelligence Artificielle', 'desc' => 'Étude empirique sur l\'intégration du machine learning dans l\'analyse prédictive des flux de trésorerie.', 'status' => 'submitted'],
            ['title' => 'Audit Légal et Résilience Financière des Banques Participatives Marocaines', 'desc' => 'Analyse de la conformité Sharia et modélisation du risque de crédit post-normes Bank Al-Maghrib.', 'status' => 'under_review'],
            ['title' => 'Impact du Marketing Digital Omnicanal sur la Fidélisation B2B au Maroc', 'desc' => 'Stratégies de lead generation et CRM prédictif appliquées aux filiales industrielles de Fès-Meknès.', 'status' => 'under_review'],
            ['title' => 'Transformation Digitale des Processus RH & Marque Employeur dans le Secteur Bancaire', 'desc' => 'Évaluation de l\'engagement des collaborateurs face aux outils d\'onboarding virtuel et IA RH.', 'status' => 'validated'],
            ['title' => 'Management de la Supply Chain Circulaire dans l\'Industrie Textile et Cuir de Fès', 'desc' => 'Modélisation logistique verte et réduction de l\'empreinte carbone conformément aux normes RSE.', 'status' => 'validated'],
            ['title' => 'Contrôle de Gestion Stratégique et Tableaux de Bord Prospectifs (Balanced Scorecard)', 'desc' => 'Déploiement opérationnel dans les établissements d\'enseignement supérieur et universités marocaines.', 'status' => 'assigned'],
            ['title' => 'Gouvernance d\'Entreprise et Rémunération des Dirigeants des Sociétés Cotées à la BVC', 'desc' => 'Étude économétrique sur les performances boursières des entreprises du MASI.', 'status' => 'assigned'],
            ['title' => 'Digitalisation des Processus Académiques et ERP Centralisé de l\'ENCG de Fès', 'desc' => 'Mise en place d\'un système modulaire sécurisé pour la scolarité, les examens et délibérations.', 'status' => 'completed'],
            ['title' => 'Stratégies d\'Internationalisation des PME Exportatrices de la Région Fès-Meknès', 'desc' => 'Analyse comparative des marchés subsahariens et de l\'Union Européenne face aux accords ZLECAF.', 'status' => 'completed'],
            ['title' => 'Évaluation des Risques ESG et Notation Extra-Financière dans le Financement Bancaire', 'desc' => 'Intégration des critères environnementaux dans les décisions de crédit octroyées aux entreprises.', 'status' => 'completed'],
            ['title' => 'Fiscalité des Multinationales et Réformes Fiscales Marocaines (Article 73 du CGI)', 'desc' => 'Impact des conventions de double imposition et des prix de transfert sur les flux d\'IDE au Maroc.', 'status' => 'submitted'],
            ['title' => 'Intelligence Économique et Veille Stratégique dans le Secteur Pharmaceutique', 'desc' => 'Outils de collecte, analyse concurrentielle et protection du patrimoine informationnel.', 'status' => 'validated'],
            ['title' => 'Finance Verte et Émission d\'Obligations Durables (Green Bonds) au Maroc', 'desc' => 'Perspectives de financement de la transition énergétique sous le contrôle de l\'AMMC.', 'status' => 'assigned'],
        ];

        // Clean existing final_projects and soutenances
        DB::table('soutenances')->delete();
        DB::table('final_projects')->delete();

        $createdProjects = [];
        foreach ($pfeTopics as $i => $topic) {
            $student = $students[$i % $students->count()];
            $prof = $professors[$i % $professors->count()];
            $room = $rooms->isNotEmpty() ? $rooms[$i % $rooms->count()] : null;

            $soutenanceDate = null;
            if ($topic['status'] === 'completed' || $topic['status'] === 'assigned') {
                $soutenanceDate = now()->addDays($i - 4)->setTime(9 + ($i % 4) * 2, 30, 0);
            }

            $fpId = DB::table('final_projects')->insertGetId([
                'student_id' => $student->id,
                'supervisor_id' => ($topic['status'] !== 'submitted' && $topic['status'] !== 'under_review') ? ($prof->user_id ?? $prof->id) : null,
                'title' => $topic['title'],
                'description' => $topic['desc'],
                'status' => $topic['status'],
                'soutenance_date' => $soutenanceDate,
                'defense_date' => $soutenanceDate,
                'room_id' => $room?->id,
                'version' => 1,
                'created_at' => now()->subDays(15 - $i),
                'updated_at' => now(),
            ]);

            $createdProjects[] = [
                'id' => $fpId,
                'student' => $student,
                'status' => $topic['status'],
                'title' => $topic['title'],
                'soutenanceDate' => $soutenanceDate,
                'room' => $room,
                'supervisor' => $prof,
            ];
        }

        $soutenanceStatuses = ['scheduled', 'scheduled', 'scheduled', 'conflict', 'completed', 'completed'];
        $sCount = 0;

        foreach ($createdProjects as $idx => $p) {
            if (!$p['soutenanceDate']) continue;

            $president = $professors[($idx + 1) % $professors->count()];
            $examiner = $professors[($idx + 2) % $professors->count()];
            $room = $p['room'];
            $status = $soutenanceStatuses[$sCount % count($soutenanceStatuses)];

            $internship = DB::table('internships')->where('student_id', $p['student']->id)->first();

            $grade = null;
            $mention = null;
            if ($status === 'completed') {
                $grade = 16.50 + ($idx % 3);
                $mention = $grade >= 18 ? 'Très Honorable avec Félicitations' : 'Très Honorable';
            }

            DB::table('soutenances')->insert([
                'final_project_id' => $p['id'],
                'internship_id' => $internship?->id ?? null,
                'date_time' => $p['soutenanceDate'],
                'scheduled_at' => $p['soutenanceDate'],
                'room_id' => $room?->id,
                'president_id' => $president->id,
                'examiner_id' => $examiner->id,
                'supervisor_id' => $p['supervisor']->id,
                'grade' => $grade,
                'status' => $status,
                'mention' => $mention,
                'remarks' => 'Soutenance officielle du projet de fin d\'études devant la commission académique.',
                'version' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $sCount++;
        }

        $this->command->info("Seeded " . count($createdProjects) . " final projects and $sCount soutenances successfully.");
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use App\Notifications\SystemNotification;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        // Find main target users
        $studentUser = User::where('email', 'student@encg-fes.ma')->first()
            ?: User::where('name', 'like', '%Yassine Bennani%')->first()
            ?: User::role('student')->first();

        $profUser = User::where('email', 'prof@encg.ma')->first()
            ?: User::role('professor')->first();

        $adminUsers = User::role(['super-admin', 'admin', 'institution-admin', 'pedagogy_officer'])->get();

        $rows = [];
        $now = Carbon::now();

        // ─────────────────────────────────────────────────────────────
        // 1. NOTIFICATIONS ÉTUDIANT (Yassine Bennani)
        // ─────────────────────────────────────────────────────────────
        if ($studentUser) {
            $studentNotifs = [
                [
                    'title' => 'Nouvelle note disponible : Contrôle Continu 1',
                    'message' => "Pr. Alami a publié les notes de CC1 pour le module 'Comptabilité Approfondie'. Votre note est de 16.50/20.",
                    'type' => 'academic',
                    'action_url' => '/student/grades',
                    'read' => false,
                    'created_at' => $now->copy()->subMinutes(12),
                ],
                [
                    'title' => 'Attestation de scolarité prête',
                    'message' => "Votre attestation officielle pour l'année universitaire 2026-2027 a été validée par la direction et est prête au téléchargement avec QR Code sécurisé.",
                    'type' => 'document_approved',
                    'action_url' => '/student/documents',
                    'read' => false,
                    'created_at' => $now->copy()->subHours(2),
                ],
                [
                    'title' => 'Bibliothèque : Échéance d\'emprunt proche (J-1)',
                    'message' => "L'ouvrage 'Comptabilité Approfondie - DCG 10' doit être retourné avant demain. Vous pouvez prolonger votre prêt de 7 jours depuis votre portail.",
                    'type' => 'financial',
                    'action_url' => '/student/library',
                    'read' => false,
                    'created_at' => $now->copy()->subHours(5),
                ],
                [
                    'title' => 'Emploi du temps : Amphi 2',
                    'message' => 'La séance de cours magistral de demain matin en Marketing Stratégique aura lieu en Amphi 2 à 10h30.',
                    'type' => 'system',
                    'action_url' => '/student/schedule',
                    'read' => true,
                    'created_at' => $now->copy()->subDays(1),
                ],
                [
                    'title' => 'Justificatif d\'absence validé',
                    'message' => 'Votre certificat médical déposé le 08/09/2026 a été validé par le service de scolarité. Votre assiduité est régularisée.',
                    'type' => 'academic',
                    'action_url' => '/student/absences',
                    'read' => true,
                    'created_at' => $now->copy()->subDays(2),
                ],
                [
                    'title' => 'Convention de stage PFE validée',
                    'message' => 'Votre convention de stage tripartite a été signée numériquement par la Direction des Relations Entreprises.',
                    'type' => 'document_approved',
                    'action_url' => '/student/internships',
                    'read' => true,
                    'created_at' => $now->copy()->subDays(4),
                ],
            ];

            foreach ($studentNotifs as $n) {
                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'type' => SystemNotification::class,
                    'notifiable_type' => User::class,
                    'notifiable_id' => $studentUser->id,
                    'data' => json_encode([
                        'title' => $n['title'],
                        'message' => $n['message'],
                        'type' => $n['type'],
                        'action_url' => $n['action_url'],
                    ], JSON_UNESCAPED_UNICODE),
                    'read_at' => $n['read'] ? $n['created_at']->copy()->addHour() : null,
                    'created_at' => $n['created_at'],
                    'updated_at' => $n['created_at'],
                ];
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 2. NOTIFICATIONS PROFESSEUR
        // ─────────────────────────────────────────────────────────────
        if ($profUser) {
            $profNotifs = [
                [
                    'title' => 'Nouveau justificatif d\'absence déposé',
                    'message' => "L'étudiant Yassine Bennani (Sous-groupe G1.1) a déposé un justificatif pour la séance de TD du 08/09.",
                    'type' => 'academic',
                    'action_url' => '/professor/grades',
                    'read' => false,
                    'created_at' => $now->copy()->subMinutes(25),
                ],
                [
                    'title' => 'Rappel : Clôture saisie des notes CC2',
                    'message' => 'La date limite pour finaliser la saisie des notes du Contrôle Continu 2 (S5) est fixée au 18/09/2026 à 23h59.',
                    'type' => 'system',
                    'action_url' => '/professor/grades',
                    'read' => false,
                    'created_at' => $now->copy()->subHours(3),
                ],
                [
                    'title' => 'Attestation d\'heures de vacation validée',
                    'message' => "Votre relevé certifié d'heures de vacation pour le semestre écoulé a été visé par le Secrétariat Général.",
                    'type' => 'document_approved',
                    'action_url' => '/professor/vacation',
                    'read' => true,
                    'created_at' => $now->copy()->subDays(1),
                ],
            ];

            foreach ($profNotifs as $n) {
                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'type' => SystemNotification::class,
                    'notifiable_type' => User::class,
                    'notifiable_id' => $profUser->id,
                    'data' => json_encode([
                        'title' => $n['title'],
                        'message' => $n['message'],
                        'type' => $n['type'],
                        'action_url' => $n['action_url'],
                    ], JSON_UNESCAPED_UNICODE),
                    'read_at' => $n['read'] ? $n['created_at']->copy()->addHour() : null,
                    'created_at' => $n['created_at'],
                    'updated_at' => $n['created_at'],
                ];
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 3. NOTIFICATIONS ADMINISTRATION
        // ─────────────────────────────────────────────────────────────
        $adminNotifs = [
            [
                'title' => 'Nouvelle demande : Attestation de Scolarité',
                'message' => "L'étudiant Yassine Bennani (CNE: N130094821 - S5 GFC) a soumis une demande d'attestation de scolarité.",
                'type' => 'document_pending',
                'action_url' => '/admin/document-requests',
                'read' => false,
                'created_at' => $now->copy()->subMinutes(15),
            ],
            [
                'title' => 'PV de notes soumis pour délibération',
                'message' => "Pr. Alami a clôturé et signé numériquement les notes du module 'Comptabilité Approfondie' pour délibération officielle.",
                'type' => 'academic',
                'action_url' => '/admin/grades',
                'read' => false,
                'created_at' => $now->copy()->subHours(1),
            ],
            [
                'title' => 'Réservation Bibliothèque en attente',
                'message' => "Nouvelle réservation physique pour l'ouvrage 'Comptabilité Approfondie - DCG 10' (Cote: RAYON-CPT-01).",
                'type' => 'financial',
                'action_url' => '/admin/library',
                'read' => false,
                'created_at' => $now->copy()->subHours(4),
            ],
        ];

        foreach ($adminUsers as $adminUser) {
            foreach ($adminNotifs as $n) {
                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'type' => SystemNotification::class,
                    'notifiable_type' => User::class,
                    'notifiable_id' => $adminUser->id,
                    'data' => json_encode([
                        'title' => $n['title'],
                        'message' => $n['message'],
                        'type' => $n['type'],
                        'action_url' => $n['action_url'],
                    ], JSON_UNESCAPED_UNICODE),
                    'read_at' => $n['read'] ? $n['created_at']->copy()->addHour() : null,
                    'created_at' => $n['created_at'],
                    'updated_at' => $n['created_at'],
                ];
            }
        }

        if (! empty($rows)) {
            DB::table('notifications')->insert($rows);
        }

        $this->command->info('Notifications réalistes insérées avec succès pour Étudiants, Professeurs et Administrateurs.');
    }
}

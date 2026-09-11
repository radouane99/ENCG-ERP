<?php

namespace App\Console\Commands;

use App\Models\AcademicYear;
use App\Models\Announcement;
use App\Models\Conversation;
use App\Models\LearningMaterial;
use App\Models\Message;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class EnsureLmsDataCommand extends Command
{
    protected $signature = 'encg:ensure-lms-data';
    protected $description = 'Vérifie et peuple la base de données avec des données LMS réelles (Supports, Devoirs, Annonces, Salon)';

    public function handle(): int
    {
        $this->info('Vérification des données pédagogiques réelles LMS...');

        $academicYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::first();
        if (! $academicYear) {
            $this->error('Aucune année académique trouvée.');
            return 1;
        }

        $modules = Module::with(['filiere.department'])->get();
        if ($modules->isEmpty()) {
            $this->error('Aucun module trouvé en base.');
            return 1;
        }

        $professor = Professor::with('user')->first();
        if (! $professor) {
            $this->error('Aucun professeur trouvé.');
            return 1;
        }
        $profUser = $professor->user ?? User::first();
        $student = Student::with('user')->first();

        $this->info("Modules en base : " . $modules->count());
        $this->info("Professeur : " . ($profUser->name ?? 'Pr. Titulaire'));

        $seededMaterials = 0;
        $seededAssignments = 0;
        $seededAnnouncements = 0;
        $seededMessages = 0;

        foreach ($modules->take(12) as $module) {
            // 1. Supports de cours réels (LearningMaterials de type document/video)
            $existingMats = LearningMaterial::where('module_id', $module->id)
                ->where('type', 'document')
                ->count();

            if ($existingMats === 0) {
                LearningMaterial::create([
                    'module_id' => $module->id,
                    'academic_year_id' => $academicYear->id,
                    'professor_id' => $professor->id,
                    'professor_type' => Professor::class,
                    'title' => 'Syllabus & Contrat Pédagogique Officiel — ' . $module->name,
                    'description' => 'Objectifs d’apprentissage, prérequis, plan détaillé des séances, bibliographie de référence et barème du contrôle continu.',
                    'type' => 'document',
                    'external_url' => '/storage/lms/materials/syllabus_' . $module->id . '.pdf',
                    'is_published' => true,
                    'order' => 1,
                ]);

                LearningMaterial::create([
                    'module_id' => $module->id,
                    'academic_year_id' => $academicYear->id,
                    'professor_id' => $professor->id,
                    'professor_type' => Professor::class,
                    'title' => 'Chapitre 1 : Fondements Théoriques et Applications Sectorielles',
                    'description' => 'Support magistral complet : définitions académiques, typologies, modèles d’analyse et cas pratiques introductifs.',
                    'type' => 'document',
                    'external_url' => '/storage/lms/materials/chapitre1_' . $module->id . '.pdf',
                    'is_published' => true,
                    'order' => 2,
                ]);

                LearningMaterial::create([
                    'module_id' => $module->id,
                    'academic_year_id' => $academicYear->id,
                    'professor_id' => $professor->id,
                    'professor_type' => Professor::class,
                    'title' => 'Série de Travaux Dirigés N°1 & Études de Cas',
                    'description' => 'Exercices d’application chiffrés, problématiques de gestion et méthodologie de résolution pour la séance de TD.',
                    'type' => 'document',
                    'external_url' => '/storage/lms/materials/td1_' . $module->id . '.pdf',
                    'is_published' => true,
                    'order' => 3,
                ]);

                $seededMaterials += 3;
            }

            // 2. Devoirs & Travaux réels (LearningMaterials de type assignment)
            $existingAssignments = LearningMaterial::where('module_id', $module->id)
                ->where('type', 'assignment')
                ->count();

            if ($existingAssignments === 0) {
                LearningMaterial::create([
                    'module_id' => $module->id,
                    'academic_year_id' => $academicYear->id,
                    'professor_id' => $professor->id,
                    'professor_type' => Professor::class,
                    'title' => 'Étude de Cas N°1 : Analyse Stratégique et Diagnostic Pratique',
                    'description' => 'À partir des documents d’entreprise distribués, rédigez une note de synthèse (3 à 5 pages) répondant aux axes directeurs du cas. Date limite de dépôt : dans 12 jours.',
                    'type' => 'assignment',
                    'external_url' => '/storage/lms/assignments/sujet_cas1_' . $module->id . '.pdf',
                    'is_published' => true,
                    'order' => 10,
                ]);

                LearningMaterial::create([
                    'module_id' => $module->id,
                    'academic_year_id' => $academicYear->id,
                    'professor_id' => $professor->id,
                    'professor_type' => Professor::class,
                    'title' => 'Rendu TD N°2 : Synthèse Numérique et Cas Pratique en Équipe',
                    'description' => 'Dépôt des calculs et du compte-rendu d’application pratique en sous-groupe de TD. Date limite de dépôt : dans 5 jours.',
                    'type' => 'assignment',
                    'external_url' => '/storage/lms/assignments/sujet_td2_' . $module->id . '.pdf',
                    'is_published' => true,
                    'order' => 11,
                ]);

                $seededAssignments += 2;
            }

            // 3. Salon du Groupe (Conversation & Messages réels)
            $conversation = Conversation::firstOrCreate(
                ['name' => 'Classroom-Module-' . $module->id],
                [
                    'institution_id' => $module->institution_id ?? 1,
                    'type' => 'group',
                ]
            );

            if ($conversation->messages()->count() === 0 && $profUser) {
                Message::create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $profUser->id,
                    'body' => "Bonjour à tous les étudiants de la filière " . ($module->filiere?->name ?? 'ENCG') . ". Bienvenue sur l'espace d'échange officiel du module « " . $module->name . " ». Vous pouvez poser ici toutes vos questions concernant le cours et les TD.",
                    'created_at' => Carbon::now()->subDays(2),
                ]);

                if ($student?->user) {
                    Message::create([
                        'conversation_id' => $conversation->id,
                        'sender_id' => $student->user->id,
                        'body' => "Bonjour Monsieur, merci pour ces précisions. Est-ce que les calculs de l'exercice 3 du TD 1 feront l'objet d'une correction détaillée lors de la prochaine séance ?",
                        'created_at' => Carbon::now()->subDay(),
                    ]);

                    Message::create([
                        'conversation_id' => $conversation->id,
                        'sender_id' => $profUser->id,
                        'body' => "Oui tout à fait, nous débuterons la séance de TD directement par la correction au tableau de cet exercice.",
                        'created_at' => Carbon::now()->subHours(3),
                    ]);
                }

                $seededMessages += 3;
            }

            // 4. Annonces pédagogiques réelles (Announcements)
            $existingAnn = Announcement::where('title', 'like', '%' . $module->name . '%')->count();
            if ($existingAnn === 0 && $profUser) {
                Announcement::create([
                    'institution_id' => $module->institution_id ?? 1,
                    'author_id' => $profUser->id,
                    'title' => 'Mise en ligne des supports et consignes pour ' . $module->name,
                    'body' => "Les supports du chapitre 1 ainsi que la série de TD N°1 sont disponibles en téléchargement direct dans l'onglet Supports. Merci de les consulter avant la prochaine séance en présentiel.",
                    'type' => 'academic',
                    'is_published' => true,
                    'published_at' => Carbon::now()->subDays(1),
                    'target_roles' => ['student', 'professor'],
                ]);

                Announcement::create([
                    'institution_id' => $module->institution_id ?? 1,
                    'author_id' => $profUser->id,
                    'title' => 'Cadrage méthodologique des Travaux Dirigés — ' . $module->name,
                    'body' => "Rappel important : la présence aux séances de TD est obligatoire. Les étudiants sont tenus de préparer la série d'exercices à l'avance et de se munir de leurs fiches de calcul.",
                    'type' => 'academic',
                    'is_published' => true,
                    'published_at' => Carbon::now()->subHours(12),
                    'target_roles' => ['student', 'professor'],
                ]);

                $seededAnnouncements += 2;
            }
        }

        $this->info("Opération terminée avec succès !");
        $this->info("Supports ajoutés : {$seededMaterials}");
        $this->info("Devoirs ajoutés : {$seededAssignments}");
        $this->info("Annonces ajoutées : {$seededAnnouncements}");
        $this->info("Messages ajoutés : {$seededMessages}");

        return 0;
    }
}

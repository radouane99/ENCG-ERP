<?php

namespace App\Console\Commands;

use App\Models\AcademicYear;
use App\Models\Announcement;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Conversation;
use App\Models\LearningMaterial;
use App\Models\Message;
use App\Models\Module;
use App\Models\ModuleProfessor;
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
        $profUser = $professor?->user ?? User::whereHas('roles', fn ($q) => $q->where('name', 'professor'))->first() ?? User::first();
        $student = Student::with('user')->first();

        $this->info("Modules en base : " . $modules->count());
        $this->info("Professeur référent : " . ($profUser?->name ?? 'Pr. ENCG'));

        $seededMaterials = 0;
        $seededAssignments = 0;
        $seededAnnouncements = 0;
        $seededMessages = 0;

        foreach ($modules->take(10) as $module) {
            // 1. Supports de cours (LearningMaterials)
            $existingMats = LearningMaterial::where('module_id', $module->id)->count();
            if ($existingMats === 0) {
                LearningMaterial::create([
                    'module_id' => $module->id,
                    'academic_year_id' => $academicYear->id,
                    'professor_id' => $profUser->id,
                    'professor_type' => User::class,
                    'title' => 'Syllabus & Contrat Pédagogique Officiel — ' . $module->name,
                    'description' => 'Objectifs d’apprentissage, prérequis, plan détaillé des séances, bibliographie de référence et pondération du contrôle continu.',
                    'type' => 'document',
                    'file_path' => 'lms/materials/syllabus_' . $module->id . '.pdf',
                    'is_published' => true,
                    'order' => 1,
                ]);

                LearningMaterial::create([
                    'module_id' => $module->id,
                    'academic_year_id' => $academicYear->id,
                    'professor_id' => $profUser->id,
                    'professor_type' => User::class,
                    'title' => 'Chapitre 1 : Cadre Conceptuel et Fondements Théoriques',
                    'description' => 'Support magistral complet : définitions académiques, typologies, modèles d’analyse et illustrations empiriques.',
                    'type' => 'document',
                    'file_path' => 'lms/materials/chapitre1_' . $module->id . '.pdf',
                    'is_published' => true,
                    'order' => 2,
                ]);

                LearningMaterial::create([
                    'module_id' => $module->id,
                    'academic_year_id' => $academicYear->id,
                    'professor_id' => $profUser->id,
                    'professor_type' => User::class,
                    'title' => 'Fiche de Travaux Dirigés N°1 & Applications Pratiques',
                    'description' => 'Études de cas, exercices d’application chiffrés et questions de réflexion pour la préparation de la séance de TD.',
                    'type' => 'document',
                    'file_path' => 'lms/materials/td1_' . $module->id . '.pdf',
                    'is_published' => true,
                    'order' => 3,
                ]);

                $seededMaterials += 3;
            }

            // 2. Devoirs & Travaux (Assignments)
            $existingAssignments = Assignment::where('module_id', $module->id)->count();
            if ($existingAssignments === 0) {
                $assignment1 = Assignment::create([
                    'module_id' => $module->id,
                    'academic_year_id' => $academicYear->id,
                    'title' => 'Étude de Cas N°1 : Diagnostic Opérationnel & Analyse Stratégique',
                    'description' => 'Rédigez un rapport d’analyse synthétique (3 à 5 pages) répondant aux 4 problématiques du cas d’entreprise distribué en séance.',
                    'type' => 'individual',
                    'file_path' => 'lms/assignments/sujet_cas1_' . $module->id . '.pdf',
                    'due_date' => Carbon::now()->addDays(14)->setTime(23, 59),
                    'max_score' => 20.00,
                    'coefficient' => 1.50,
                    'allow_late_submission' => true,
                    'is_published' => true,
                ]);

                $assignment2 = Assignment::create([
                    'module_id' => $module->id,
                    'academic_year_id' => $academicYear->id,
                    'title' => 'Rendu TD N°2 : Synthèse Numérique & Résolution de Problème',
                    'description' => 'Dépôt des feuilles de calcul et du compte-rendu d’application pratique en groupe de TD.',
                    'type' => 'group',
                    'file_path' => 'lms/assignments/sujet_td2_' . $module->id . '.pdf',
                    'due_date' => Carbon::now()->addDays(7)->setTime(18, 00),
                    'max_score' => 20.00,
                    'coefficient' => 1.00,
                    'allow_late_submission' => false,
                    'is_published' => true,
                ]);

                $seededAssignments += 2;

                // Soumission test pour l'étudiant s'il existe
                if ($student) {
                    AssignmentSubmission::firstOrCreate(
                        ['assignment_id' => $assignment2->id, 'student_id' => $student->id],
                        [
                            'submission_text' => 'Devoir rendu conformément aux consignes données par le professeur lors du dernier TD.',
                            'submitted_at' => Carbon::now()->subDay(),
                            'is_late' => false,
                            'score' => 17.50,
                            'feedback' => 'Très bonne rigueur méthodologique et clarté de la synthèse. Félicitations.',
                            'graded_by' => $profUser?->id,
                            'graded_at' => Carbon::now(),
                        ]
                    );
                }
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
                    'body' => "Bonjour à tous les étudiants de la filière " . ($module->filiere?->name ?? '') . ". Bienvenue sur le salon d'échange officiel du module « " . $module->name . " ». Vous pouvez poser ici vos questions concernant le cours et les TD.",
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
                        'created_at' => Carbon::now()->subHours(4),
                    ]);
                }

                $seededMessages += 3;
            }

            // 4. Annonces pédagogiques officielles
            $existingAnn = Announcement::where('title', 'like', '%' . $module->name . '%')->count();
            if ($existingAnn === 0 && $profUser) {
                Announcement::create([
                    'institution_id' => $module->institution_id ?? 1,
                    'author_id' => $profUser->id,
                    'title' => 'Mise en ligne des supports et consignes pour ' . $module->name,
                    'body' => "Les supports du chapitre 1 ainsi que la série de TD N°1 sont disponibles en téléchargement direct dans l'onglet Supports. Merci de les consulter avant la prochaine séance.",
                    'type' => 'academic',
                    'is_published' => true,
                    'published_at' => Carbon::now()->subDays(1),
                    'target_roles' => ['student', 'professor'],
                ]);
                $seededAnnouncements += 1;
            }
        }

        $this->info("LMS Data synchrone terminé avec succès !");
        $this->info("Nouveaux supports : {$seededMaterials}");
        $this->info("Nouveaux devoirs : {$seededAssignments}");
        $this->info("Nouvelles annonces : {$seededAnnouncements}");
        $this->info("Nouveaux messages salon : {$seededMessages}");

        return 0;
    }
}

<?php

namespace App\Console\Commands;

use App\Services\Academic\ExamPlanningEngine;
use Illuminate\Console\Command;

class RegenerateExamScheduleCommand extends Command
{
    protected $signature = 'exams:regenerate-schedule {filiere_id=1} {session_id=3} {--start_date=2026-09-07} {--modules_per_day=2} {--test-door-sign} {--seed-proctor-types} {--test-auto-assign}';
    protected $description = 'Régénère le planning des examens et affectations de surveillance avec vérification stricte anti-chevauchement.';

    public function handle(ExamPlanningEngine $engine): int
    {
        if ($this->option('seed-proctor-types')) {
            $vacRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'vacataire', 'guard_name' => 'sanctum']);
            $vacUser = \App\Models\User::firstOrCreate(
                ['email' => 'elmansouri.youssef@encg-fes.ma'],
                [
                    'first_name' => 'Youssef',
                    'last_name' => 'El Mansouri',
                    'name' => 'Youssef El Mansouri',
                    'password' => bcrypt('password'),
                ]
            );
            $vacUser->forceFill(['is_active' => true])->save();
            $vacUser->assignRole($vacRole);
            \App\Models\Professor::firstOrCreate(
                ['user_id' => $vacUser->id],
                [
                    'institution_id' => 1,
                    'department_id' => 1,
                    'contract_type' => 'vacataire',
                    'grade' => 'Vacataire',
                    'specialty' => 'Comptabilité & Audit',
                    'is_active' => true,
                    'hire_date' => now(),
                ]
            );

            $docRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'doctorant', 'guard_name' => 'sanctum']);
            $docUser = \App\Models\User::firstOrCreate(
                ['email' => 'bennouna.omar@cedoc.encg-fes.ma'],
                [
                    'first_name' => 'Omar',
                    'last_name' => 'Bennouna',
                    'name' => 'Omar Bennouna',
                    'password' => bcrypt('password'),
                ]
            );
            $docUser->forceFill(['is_active' => true])->save();
            $docUser->assignRole($docRole);
            \App\Models\Professor::firstOrCreate(
                ['user_id' => $docUser->id],
                [
                    'institution_id' => 1,
                    'department_id' => 1,
                    'contract_type' => 'doctorant',
                    'grade' => 'Doctorant',
                    'specialty' => 'Management Stratégique',
                    'is_active' => true,
                    'hire_date' => now(),
                ]
            );

            $this->info('Enseignants vacataires et doctorants surveillants initialisés avec succès.');

            return Command::SUCCESS;
        }

        if ($this->option('test-door-sign')) {
            $exam = \App\Models\Exam::with('module')->first();
            if (! $exam) {
                $this->error("Aucun examen trouvé pour tester l'affiche de porte.");

                return Command::FAILURE;
            }
            $user = \App\Models\User::first();
            \Illuminate\Support\Facades\Auth::login($user);
            $req = \Illuminate\Http\Request::create("/api/v1/admin/exams/{$exam->id}/door-sign-pdf", 'GET');
            $req->setUserResolver(fn () => $user);

            try {
                $ctrl = app(\App\Http\Controllers\Api\PdfExportController::class);
                $response = $ctrl->downloadDoorSignPdf($req, $exam);
                $bytes = strlen($response->getContent());
                $this->info("Test Affiche de Porte pour Examen #{$exam->id} ({$exam->module?->name}) : SUCCÈS ! Taille du PDF généré : {$bytes} octets.");

                return Command::SUCCESS;
            } catch (\Throwable $e) {
                $this->error("Erreur PDF : " . $e->getMessage());
                $this->error("Fichier : " . $e->getFile() . ":" . $e->getLine());
                return Command::FAILURE;
            }
        }

        if ($this->option('test-auto-assign')) {
            $sessionId = (int) $this->argument('session_id');
            $this->info("Test ProctorAssignmentService::autoAssignProctors pour Session {$sessionId}...");
            $service = app(\App\Services\ProctorAssignmentService::class);
            $res = $service->autoAssignProctors($sessionId);
            $this->info("Résultat : " . json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return Command::SUCCESS;
        }

        $filiereId = (int) $this->argument('filiere_id');
        $sessionId = (int) $this->argument('session_id');
        $startDate = (string) $this->option('start_date');
        $modulesPerDay = (int) $this->option('modules_per_day');

        $this->info("Génération du planning : Filière {$filiereId}, Session {$sessionId}, Début {$startDate}, {$modulesPerDay} modules/jour...");

        try {
            $result = $engine->autoGenerateIntelligentBatch(
                filiereId: $filiereId,
                sessionId: $sessionId,
                semesterNumber: null,
                modulesPerDay: $modulesPerDay,
                daySlotMode: 'matin',
                customModuleIds: null,
                customStartDate: $startDate
            );

            $this->info("Succès : " . ($result['message'] ?? 'OK'));

            // Afficher le récapitulatif détaillé de la charge par surveillant
            $survs = \App\Models\ExamSurveillance::with(['professor', 'exam'])->get();
            $tableData = [];
            foreach ($survs->groupBy('professor_id') as $pid => $list) {
                $user = \App\Models\User::with('roles', 'professor')->find($pid);
                $isPerm = $user->hasAnyRole(['professor', 'department-head', 'enseignant'])
                    || ($user->professor && $user->professor->contract_type === 'permanent');
                $isVac = $user->hasRole('vacataire') || ($user->professor && $user->professor->contract_type === 'vacataire');
                $isDoc = $user->hasRole('doctorant') || ($user->professor && $user->professor->contract_type === 'doctorant');
                $typeLabel = $isPerm ? 'Permanent' : ($isVac ? 'Vacataire' : ($isDoc ? 'Doctorant' : 'Autre'));

                $roles = $list->pluck('role')->unique()->map(fn ($r) => $r === 'president_salle' ? 'Président' : 'Surveillant')->join('/');
                $slots = $list->map(function ($s) {
                    $dt = \Carbon\Carbon::parse($s->exam->exam_date)->format('d/m');
                    $time = substr($s->exam->start_time, 0, 5);
                    return "{$dt} ({$time})";
                })->join(', ');

                $dates = $list->map(fn ($s) => $s->exam->exam_date)->unique();
                $blocInfo = ($dates->count() === 1 && $list->count() === 2) ? ' (Bloc 1 jour)' : " ({$dates->count()} jours)";

                $tableData[] = [
                    'Nom' => $user->name,
                    'Statut' => $typeLabel,
                    'Rôle' => $roles,
                    'Séances' => $list->count(),
                    'Créneaux & Jours' => $slots . $blocInfo,
                ];
            }

            $this->table(['Enseignant / Surveillant', 'Statut', 'Rôle', 'Nb Séances', 'Détail Créneaux & Présence'], $tableData);

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error("Erreur : " . $e->getMessage());
            $this->error($e->getTraceAsString());
            return Command::FAILURE;
        }
    }
}

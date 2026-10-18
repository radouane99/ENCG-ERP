<?php

namespace App\Console\Commands;

use App\Models\AcademicYear;
use App\Models\Group;
use App\Models\Module;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReassignProfessorModulesByDisciplineCommand extends Command
{
    protected $signature = 'encg:reassign-prof-modules';

    protected $description = 'Reassign modules to professors according to their academic department and specialty';

    public function handle(): int
    {
        $this->info('=== Réaffectation Pédagogique des Modules par Spécialité ===');

        $academicYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::first();
        if (! $academicYear) {
            $this->error('Aucune année académique trouvée.');

            return 1;
        }

        // 1. Récupération des professeurs principaux
        $profManagement = User::where('email', 'chraibi.amina@encg-fes.ma')->first()?->professor; // Management, Marketing
        $profFinance = User::where('email', 'prof@encg.ma')->first()?->professor;             // Finance, Comptabilité, Maths
        $profDroit = User::where('email', 'meziane.tarik@encg-fes.ma')->first()?->professor;  // Droit
        $profLangues = User::where('email', 'bennani.bouchra@encg-fes.ma')->first()?->professor; // Langues, Com, Soft Skills
        $profInfo = User::where('email', 'benjelloun.mohamed@encg-fes.ma')->first()?->professor; // Info, SI

        if (! $profManagement || ! $profFinance || ! $profDroit || ! $profLangues || ! $profInfo) {
            $this->error("Un des professeurs clés n'a pas été trouvé.");

            return 1;
        }

        $allModules = Module::all();
        $this->info('Nombre total de modules à affecter : '.$allModules->count());

        DB::transaction(function () use ($allModules, $academicYear, $profManagement, $profFinance, $profDroit, $profLangues, $profInfo) {
            // Nettoyer les affectations existantes
            DB::table('module_professor')->truncate();

            $stats = [
                'Management (Amina Chraibi)' => 0,
                'Finance (Pr. Karim Alami)' => 0,
                'Droit (Tarik Meziane)' => 0,
                'Langues & Com (Bouchra Bennani)' => 0,
                'Informatique (Mohamed Benjelloun)' => 0,
            ];

            foreach ($allModules as $mod) {
                $name = mb_strtolower($mod->name);
                $code = mb_strtolower($mod->code);

                // Détermination du professeur selon la discipline
                if (
                    str_contains($name, 'droit') || str_contains($name, 'juridique') ||
                    str_contains($name, 'législation') || str_contains($name, 'contrat')
                ) {
                    $selectedProf = $profDroit;
                    $statKey = 'Droit (Tarik Meziane)';
                } elseif (
                    str_contains($name, 'informatique') || str_contains($name, 'système') ||
                    str_contains($name, 'systèmes') || str_contains($name, 'bureautique') ||
                    str_contains($name, 'numérique') || str_contains($name, 'technologie') ||
                    str_contains($name, 'algorith') || str_contains($name, 'données')
                ) {
                    $selectedProf = $profInfo;
                    $statKey = 'Informatique (Mohamed Benjelloun)';
                } elseif (
                    str_contains($name, 'anglais') || str_contains($name, 'français') ||
                    str_contains($name, 'langue') || str_contains($name, 'communication') ||
                    str_contains($name, 'expression') || str_contains($name, 'soft skills') ||
                    str_contains($name, 'culture') || str_contains($name, 'espagnol')
                ) {
                    $selectedProf = $profLangues;
                    $statKey = 'Langues & Com (Bouchra Bennani)';
                } elseif (
                    str_contains($name, 'comptab') || str_contains($name, 'finance') ||
                    str_contains($name, 'financ') || str_contains($name, 'math') ||
                    str_contains($name, 'fiscal') || str_contains($name, 'budget') ||
                    str_contains($name, 'audit') || str_contains($name, 'contrôle de gestion') ||
                    str_contains($name, 'trésorerie') || str_contains($name, 'statistique')
                ) {
                    $selectedProf = $profFinance;
                    $statKey = 'Finance (Pr. Karim Alami)';
                } else {
                    // Par défaut pour gestion/management (Marketing, Management, Stratégie, GRH, etc.)
                    $selectedProf = $profManagement;
                    $statKey = 'Management (Amina Chraibi)';
                }

                // Récupérer les groupes pour la filière et le semestre
                $groups = Group::where('filiere_id', $mod->filiere_id)
                    ->when($mod->semester_number, fn ($q, $sem) => $q->where('semester_number', $sem))
                    ->get();

                if ($groups->isEmpty()) {
                    // Fallback sur n'importe quel groupe de la filière
                    $groups = Group::where('filiere_id', $mod->filiere_id)->get();
                }

                $firstGroup = $groups->first();

                DB::table('module_professor')->insert([
                    'module_id' => $mod->id,
                    'academic_year_id' => $academicYear->id,
                    'group_id' => $firstGroup?->id,
                    'professor_id' => $selectedProf->id,
                    'professor_type' => 'App\Models\Professor',
                    'session_type' => 'cm',
                    'assigned_hours' => 36,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $stats[$statKey]++;
            }

            foreach ($stats as $k => $v) {
                $this->line("  ✓ {$k} : {$v} modules assignés");
            }
        });

        $this->info('✅ Réaffectation terminée avec succès ! Chaque professeur a désormais strictement ses propres modules.');

        return 0;
    }
}

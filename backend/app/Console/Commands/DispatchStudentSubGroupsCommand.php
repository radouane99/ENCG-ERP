<?php

namespace App\Console\Commands;

use App\Services\Academic\StudentSubGroupDispatcherService;
use Illuminate\Console\Command;

class DispatchStudentSubGroupsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'encg:dispatch-subgroups {--year= : ID de l\'année académique (optionnel)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Répartit automatiquement les étudiants des sections en sous-groupes TD (G1.1, G1.2) par ordre alphabétique';

    /**
     * Execute the console command.
     */
    public function handle(StudentSubGroupDispatcherService $service): int
    {
        $this->info('================================================================');
        $this->info('  ENCG Fès — Répartition Officielle des Sous-Groupes TD/TP');
        $this->info('================================================================');

        $yearId = $this->option('year') ? (int) $this->option('year') : null;
        $result = $service->dispatchAllActiveGroups($yearId);

        $this->info("Groupes traités : {$result['groups_processed']}");
        $this->info("Étudiants affectés aux sous-groupes : {$result['total_students']}");
        $this->newLine();

        $rows = [];
        foreach ($result['details'] as $detail) {
            $rows[] = [
                $detail['group_name'],
                $detail['total'],
                $detail['sub_group_1'] . " ({$detail['count_1']} ét.)",
                $detail['sub_group_2'] . " ({$detail['count_2']} ét.)",
            ];
        }

        $this->table(
            ['Groupe / Section', 'Total Étudiants', 'Sous-Groupe 1 (Ordre Alpha)', 'Sous-Groupe 2 (Ordre Alpha)'],
            $rows
        );

        $this->info('Répartition terminée avec succès conforme aux normes ENCG Fès.');

        return Command::SUCCESS;
    }
}

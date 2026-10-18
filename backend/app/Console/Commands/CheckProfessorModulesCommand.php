<?php

namespace App\Console\Commands;

use App\Models\ModuleProfessor;
use App\Models\User;
use Illuminate\Console\Command;

class CheckProfessorModulesCommand extends Command
{
    protected $signature = 'encg:check-prof-modules';

    protected $description = 'Check professor module assignments';

    public function handle(): int
    {
        $this->info('=== Professor Module Assignment Diagnostic ===');

        $amina = User::where('email', 'chraibi.amina@encg-fes.ma')->first();
        if ($amina && $amina->professor) {
            $this->info("Amina Chraibi [Prof ID: {$amina->professor->id}]:");
            $assignedMp = ModuleProfessor::where('professor_id', $amina->professor->id)->with('module', 'group')->get();
            foreach ($assignedMp as $row) {
                $grpName = $row->group?->name ?? 'No group';
                $modName = $row->module?->name ?? 'Unknown';
                $modCode = $row->module?->code ?? '';
                $this->line("  - [Module {$row->module_id}] {$modCode}: {$modName} (Group: {$grpName})");
            }
        }

        return 0;
    }
}

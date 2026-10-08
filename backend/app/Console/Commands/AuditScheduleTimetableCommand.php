<?php

namespace App\Console\Commands;

use App\Models\Filiere;
use App\Models\Group;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AuditScheduleTimetableCommand extends Command
{
    protected $signature = 'encg:audit-schedule';
    protected $description = 'Audit complete de l\'Emploi du Temps (schedules) pour détecter conflits, incohérences prof/module, et anomalies.';

    public function handle(): int
    {
        $this->info('================================================================');
        $this->info('🔍 AUDIT COMPLET DE L\'EMPLOI DU TEMPS (TIMETABLE / SCHEDULES)');
        $this->info('================================================================');

        $totalSchedules = Schedule::count();
        $this->line("Nombre total de créneaux (schedules) : {$totalSchedules}");

        if ($totalSchedules === 0) {
            $this->warn('⚠️ Aucun créneau trouvé dans la table schedules !');
            return Command::SUCCESS;
        }

        $activeSchedules = Schedule::where('is_active', true)->count();
        $this->line("Créneaux actifs : {$activeSchedules} / {$totalSchedules}");

        $issuesFound = 0;

        // 1. Check Orphan Foreign Keys
        $this->newLine();
        $this->info('--- 1. Vérification des Clés Étrangères Orphelines ---');
        $orphanedModules = Schedule::whereDoesntHave('module')->count();
        $orphanedGroups = Schedule::whereDoesntHave('group')->count();
        $orphanedRooms = Schedule::whereNotNull('room_id')->whereDoesntHave('room')->count();
        $orphanedYears = Schedule::whereDoesntHave('academicYear')->count();
        $orphanedSemesters = Schedule::whereDoesntHave('semester')->count();

        if ($orphanedModules > 0) {
            $this->error("❌ {$orphanedModules} créneaux avec module_id invalide !");
            $issuesFound++;
        } else {
            $this->info('✅ Tous les modules existent.');
        }

        if ($orphanedGroups > 0) {
            $this->error("❌ {$orphanedGroups} créneaux avec group_id invalide !");
            $issuesFound++;
        } else {
            $this->info('✅ Tous les groupes existent.');
        }

        if ($orphanedRooms > 0) {
            $this->error("❌ {$orphanedRooms} créneaux avec room_id invalide !");
            $issuesFound++;
        } else {
            $this->info('✅ Toutes les salles existent.');
        }

        // 2. Check Professor Polymorphic Integrity
        $this->newLine();
        $this->info('--- 2. Vérification des Professeurs Assignés (Polymorphic) ---');
        $allSchedules = Schedule::with(['module', 'group.filiere', 'room', 'professor.user'])->get();

        $invalidProfCount = 0;
        $profTypeBreakdown = [];
        foreach ($allSchedules as $s) {
            $type = $s->professor_type;
            $profTypeBreakdown[$type] = ($profTypeBreakdown[$type] ?? 0) + 1;

            if ($type === Professor::class || $type === 'App\Models\Professor') {
                $prof = Professor::find($s->professor_id);
                if (!$prof) {
                    $invalidProfCount++;
                }
            } elseif ($type === User::class || $type === 'App\Models\User') {
                $user = User::find($s->professor_id);
                if (!$user) {
                    $invalidProfCount++;
                }
            } else {
                $invalidProfCount++;
            }
        }

        $this->line('Répartition professor_type : ' . json_encode($profTypeBreakdown));
        if ($invalidProfCount > 0) {
            $this->error("❌ {$invalidProfCount} créneaux avec professeur introuvable !");
            $issuesFound++;
        } else {
            $this->info('✅ Tous les professeurs existent bien en base.');
        }

        $allProfs = Professor::with(['user', 'department'])->get();
        $this->line("Liste des professeurs ({$allProfs->count()}) :");
        foreach ($allProfs as $p) {
            $modCount = DB::table('module_professor')->where('professor_id', $p->id)->count();
            $dept = $p->department?->code ?? 'N/A';
            $uName = $p->user?->name ?? 'N/A';
            $uEmail = $p->user?->email ?? 'N/A';
            $this->line("   - ID:{$p->id} | {$uName} ({$uEmail}) | Dept: {$dept} | Spéc: {$p->specialty} | Modules assignés: {$modCount}");
        }

        // 3. Module <-> Filiere & Semester Consistency
        $this->newLine();
        $this->info('--- 3. Cohérence Pédagogique (Module vs Filière & Semestre du Groupe) ---');
        $moduleMismatches = 0;
        foreach ($allSchedules as $s) {
            if ($s->group && $s->module) {
                // Check if module belongs to group's filiere
                if ($s->module->filiere_id !== $s->group->filiere_id) {
                    $this->warn("⚠️ Mismatch Filière: Créneau #{$s->id} - Module '{$s->module->code}' ({$s->module->filiere_id}) assigné au Groupe '{$s->group->name}' de la Filière ({$s->group->filiere_id})");
                    $moduleMismatches++;
                }
            }
        }
        if ($moduleMismatches > 0) {
            $this->error("❌ {$moduleMismatches} créneaux ont un module qui n'appartient pas à la filière du groupe !");
            $issuesFound++;
        } else {
            $this->info('✅ Tous les modules correspondent à la filière de leur groupe.');
        }

        // 4. Professor Discipline Alignment (Does the professor actually teach this module?)
        $this->newLine();
        $this->info('--- 4. Alignement Pédagogique Enseignant / Spécialité & ModuleProfessor ---');
        $profDisciplineMismatches = 0;
        $notAssignedInModuleProfessor = 0;

        foreach ($allSchedules as $s) {
            $prof = null;
            if ($s->professor_type === Professor::class || $s->professor_type === 'App\Models\Professor') {
                $prof = Professor::with('user', 'department')->find($s->professor_id);
            } elseif ($s->professor_type === User::class || $s->professor_type === 'App\Models\User') {
                $prof = Professor::with('user', 'department')->where('user_id', $s->professor_id)->first();
            }

            if ($prof && $s->module) {
                // Check if this professor is in module_professor table for this module
                $isAssigned = ModuleProfessor::where('module_id', $s->module_id)
                    ->where(function ($q) use ($prof) {
                        $q->where('professor_id', $prof->id)
                          ->orWhere('professor_id', $prof->user_id);
                    })->exists();

                if (!$isAssigned) {
                    $notAssignedInModuleProfessor++;
                    $profName = $prof->user ? "{$prof->user->first_name} {$prof->user->last_name}" : "ID:{$prof->id}";
                    $this->warn("⚠️ Non affecté: {$profName} enseigne '{$s->module->name}' (#{$s->module_id}) mais n'est pas dans module_professor !");
                }
            }
        }

        if ($notAssignedInModuleProfessor > 0) {
            $this->error("❌ {$notAssignedInModuleProfessor} créneaux avec des profs qui ne sont pas affectés officiellement au module !");
            $issuesFound++;
        } else {
            $this->info('✅ Tous les profs dans l\'emploi du temps sont bien affectés au module dans module_professor.');
        }

        // 5. Detection of Conflicts (Overlap)
        $this->newLine();
        $this->info('--- 5. Détection des Conflits Horaires (Chevauchements) ---');

        // Helper function for overlapping times
        // Sessions overlap if: day_of_week matches, and NOT (end_time <= other.start_time OR start_time >= other.end_time)
        $profConflicts = 0;
        $roomConflicts = 0;
        $groupConflicts = 0;

        $count = count($allSchedules);
        for ($i = 0; $i < $count; $i++) {
            $s1 = $allSchedules[$i];
            if (!$s1->is_active) continue;

            $s1Start = strtotime($s1->start_time);
            $s1End = strtotime($s1->end_time);

            if ($s1Start >= $s1End) {
                $this->error("❌ Créneau #{$s1->id} invalide: start_time ({$s1->start_time}) >= end_time ({$s1->end_time}) !");
                $issuesFound++;
            }

            for ($j = $i + 1; $j < $count; $j++) {
                $s2 = $allSchedules[$j];
                if (!$s2->is_active) continue;

                if ($s1->day_of_week !== $s2->day_of_week) continue;

                $s2Start = strtotime($s2->start_time);
                $s2End = strtotime($s2->end_time);

                // Overlap condition
                $overlaps = ($s1Start < $s2End && $s2Start < $s1End);
                if (!$overlaps) continue;

                // Professor conflict
                $sameProf = false;
                if ($s1->professor_type === $s2->professor_type && $s1->professor_id === $s2->professor_id) {
                    $sameProf = true;
                }
                if ($sameProf) {
                    $profConflicts++;
                    $profName = $s1->professor?->user?->name ?? "Prof #{$s1->professor_id}";
                    $this->error("❌ CONFLIT PROF: {$profName} a deux séances en même temps ! Jour {$s1->day_of_week}: Créneau #{$s1->id} ({$s1->start_time}-{$s1->end_time}) et Créneau #{$s2->id} ({$s2->start_time}-{$s2->end_time})");
                }

                // Room conflict
                if ($s1->room_id && $s2->room_id && $s1->room_id === $s2->room_id) {
                    $roomConflicts++;
                    $roomName = $s1->room?->name ?? "Salle #{$s1->room_id}";
                    $this->error("❌ CONFLIT SALLE: {$roomName} réservée 2 fois au même moment ! Jour {$s1->day_of_week}: Créneau #{$s1->id} ({$s1->start_time}-{$s1->end_time}) et Créneau #{$s2->id} ({$s2->start_time}-{$s2->end_time})");
                }

                // Group conflict
                if ($s1->group_id && $s2->group_id && $s1->group_id === $s2->group_id) {
                    $groupConflicts++;
                    $grpName = $s1->group?->name ?? "Groupe #{$s1->group_id}";
                    $this->error("❌ CONFLIT GROUPE: Le groupe {$grpName} a deux cours simultanés ! Jour {$s1->day_of_week}: Créneau #{$s1->id} ({$s1->start_time}-{$s1->end_time}) et Créneau #{$s2->id} ({$s2->start_time}-{$s2->end_time})");
                }
            }
        }

        if ($profConflicts === 0) {
            $this->info('✅ 0 conflit d\'enseignant (aucun prof en double réservation).');
        } else {
            $issuesFound += $profConflicts;
        }

        if ($roomConflicts === 0) {
            $this->info('✅ 0 conflit de salle (aucune salle en double réservation).');
        } else {
            $issuesFound += $roomConflicts;
        }

        if ($groupConflicts === 0) {
            $this->info('✅ 0 conflit de groupe (aucun groupe avec 2 cours en même temps).');
        } else {
            $issuesFound += $groupConflicts;
        }

        // 6. Test Specific Case: Amina Chraibi Schedule
        $this->newLine();
        $this->info('--- 6. Test Spécifique : Emploi du Temps de Pr. Amina Chraibi ---');
        $aminaUser = User::where('email', 'chraibi.amina@encg-fes.ma')->first();
        if ($aminaUser) {
            $aminaProf = Professor::where('user_id', $aminaUser->id)->first();
            $aminaSchedules = Schedule::with(['module', 'group', 'room'])
                ->where(function ($q) use ($aminaProf, $aminaUser) {
                    if ($aminaProf) $q->where('professor_id', $aminaProf->id);
                    $q->orWhere('professor_id', $aminaUser->id);
                })
                ->where('is_active', true)
                ->orderBy('day_of_week')
                ->orderBy('start_time')
                ->get();

            $this->line("Pr. Amina Chraibi a {$aminaSchedules->count()} séances programmées :");
            foreach ($aminaSchedules as $as) {
                $dayNames = [1 => 'Lundi', 2 => 'Mardi', 3 => 'Mercredi', 4 => 'Jeudi', 5 => 'Vendredi'];
                $day = $dayNames[$as->day_of_week] ?? "Jour {$as->day_of_week}";
                $this->line("   - [{$day} {$as->start_time}-{$as->end_time}] {$as->module?->name} ({$as->module?->code}) | Groupe: {$as->group?->name} | Salle: {$as->room?->name} | Type: {$as->session_type}");
            }
        }

        // 7. Check Timetable Matrix Consistency (AGENTS.md Rule 7)
        $this->newLine();
        $this->info('--- 7. Vérification Format Officiel ENCG (Rule 7 AGENTS.md) ---');
        $cmSessions = Schedule::where('session_type', 'cm')->count();
        $tdSessions = Schedule::where('session_type', 'td')->count();
        $tpSessions = Schedule::where('session_type', 'tp')->count();
        $otherSessions = Schedule::whereNotIn('session_type', ['cm', 'td', 'tp'])->count();

        $this->line("Répartition par type: CM = {$cmSessions}, TD = {$tdSessions}, TP = {$tpSessions}, Autres = {$otherSessions}");
        if ($otherSessions > 0) {
            $this->warn("⚠️ Il y a {$otherSessions} séances avec un session_type non standard.");
        }

        $this->newLine();
        $this->info("================================================================");
        if ($issuesFound === 0) {
            $this->info("🎉 TOUS LES TESTS SONT AU VERT ! 0 ANOMALIE DÉTECTÉE.");
            return Command::SUCCESS;
        } else {
            $this->error("⚠️ {$issuesFound} ANOMALIES OU CONFLITS DÉTECTÉS !");
            return Command::FAILURE;
        }
    }
}

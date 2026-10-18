<?php

namespace App\Console\Commands;

use App\Models\AcademicYear;
use App\Models\Group;
use App\Models\Institution;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\Semester;
use App\Services\Academic\AiTimetableSchedulerService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixTimetableSchedulesCommand extends Command
{
    protected $signature = 'encg:fix-timetable {--dry-run : Exécuter sans modifier la base}';

    protected $description = 'Génère un emploi du temps officiel ENCG Fès sans aucun conflit, conforme aux disciplines et règles pédagogiques';

    public function handle(): int
    {
        $this->info('================================================================');
        $this->info('🚀 RÉGÉNÉRATION OFFICIELLE DE L\'EMPLOI DU TEMPS ENCG FÈS');
        $this->info('================================================================');

        $isDryRun = $this->option('dry-run');
        if ($isDryRun) {
            $this->warn('ℹ️ Mode DRY-RUN activé : aucune modification ne sera enregistrée.');
        }

        $institution = Institution::first();
        $institutionId = $institution?->id ?? 1;

        $academicYear = AcademicYear::where('is_current', true)->first() ?? AcademicYear::first();
        if (! $academicYear) {
            $this->error('❌ Aucune année académique trouvée.');

            return Command::FAILURE;
        }

        $this->line("Année Académique : {$academicYear->label} (ID: {$academicYear->id})");
        $this->line("Établissement   : {$institution?->name} (ID: {$institutionId})");

        // 1. Détecter les semestres et groupes actifs
        $groups = Group::with('filiere')
            ->where('academic_year_id', $academicYear->id)
            ->get();

        if ($groups->isEmpty()) {
            $groups = Group::with('filiere')->get();
        }

        $this->line("Nombre de groupes trouvés : {$groups->count()}");
        foreach ($groups as $g) {
            $this->line("  - Groupe: {$g->name} (Filière: {$g->filiere?->code}, S{$g->semester_number})");
        }

        // 2. Détecter les salles
        $rooms = Room::all();
        $this->line("Nombre de salles disponibles : {$rooms->count()}");
        $amphis = $rooms->filter(fn ($r) => str_contains(mb_strtolower($r->type ?? ''), 'amphi') || str_contains(mb_strtolower($r->name), 'amphi'));
        $labos = $rooms->filter(fn ($r) => str_contains(mb_strtolower($r->type ?? ''), 'lab') || str_contains(mb_strtolower($r->name), 'informatique'));
        $salles = $rooms->reject(fn ($r) => $amphis->contains('id', $r->id) || $labos->contains('id', $r->id));

        $this->line("  - Amphithéâtres : {$amphis->count()} ({$amphis->pluck('name')->implode(', ')})");
        $this->line("  - Labos Info    : {$labos->count()} ({$labos->pluck('name')->implode(', ')})");
        $this->line("  - Salles TD     : {$salles->count()} ({$salles->pluck('name')->implode(', ')})");

        // 3. Détecter les professeurs principaux
        $professors = Professor::with('user', 'department')->get();
        $this->line("Nombre de professeurs : {$professors->count()}");

        // Utiliser AiTimetableSchedulerService pour générer la grille complète
        $schedulerService = app(AiTimetableSchedulerService::class);

        // Déterminer les semestres cibles : semestres pairs et impairs des groupes existants
        $semesterNumbers = $groups->pluck('semester_number')->filter()->unique()->values()->all();
        if (empty($semesterNumbers)) {
            $semesterNumbers = [1, 2, 5];
        }
        $this->line('Semestres ciblés : '.implode(', ', $semesterNumbers));

        // Options de génération
        $options = [
            'avoid_saturday_afternoon' => true,
            'prefer_morning_lectures' => true,
            'ignore_existing' => true,
        ];

        $this->newLine();
        $this->info('--- Génération Globale Coordonnée pour Tous les Groupes & Semestres ---');
        $genResult = $schedulerService->generateSchedule($academicYear->id, 'all', $options);
        $this->line("Séances générées : {$genResult['total_scheduled_sessions']}");
        $this->line("Conflits détectés : {$genResult['conflicts_count']}");

        if ($genResult['conflicts_count'] > 0) {
            foreach ($genResult['conflicts_details'] as $c) {
                $this->warn("  ⚠️ Conflit: {$c['module']} ({$c['group']}) - {$c['reason']}");
            }
        }

        $allGeneratedSessions = $genResult['scheduled_items'];

        $this->newLine();
        $this->info('Total séances générées sans conflit : '.count($allGeneratedSessions));

        if (count($allGeneratedSessions) === 0) {
            $this->error('❌ Aucune séance générée ! Vérifier les groupes et modules.');

            return Command::FAILURE;
        }

        // 4. Si ce n'est pas un dry-run, insérer dans la table schedules
        if (! $isDryRun) {
            DB::transaction(function () use ($allGeneratedSessions, $institutionId, $academicYear) {
                // Vider les anciennes sessions corrompues
                $deletedCount = Schedule::count();
                Schedule::query()->delete();
                $this->warn("🗑️ Anciennes séances supprimées : {$deletedCount}");

                $fallbackSemester = Semester::where('academic_year_id', $academicYear->id)->where('is_current', true)->first()
                    ?? Semester::where('is_current', true)->first()
                    ?? Semester::first();

                $inserted = 0;
                foreach ($allGeneratedSessions as $item) {
                    $groupSemesterNum = null;
                    if (! empty($item['group_id'])) {
                        $groupSemesterNum = DB::table('groups')->where('id', $item['group_id'])->value('semester_number');
                    }

                    $semesterId = $fallbackSemester?->id ?? 1;
                    if ($groupSemesterNum) {
                        $periodNum = ($groupSemesterNum % 2 === 1) ? 1 : 2;
                        $semesterId = DB::table('semesters')
                            ->where(function ($q) use ($academicYear) {
                                $q->where('academic_year_id', $academicYear->id)->orWhereNull('academic_year_id');
                            })
                            ->where('number', $periodNum)
                            ->value('id')
                            ?? DB::table('semesters')->where('number', $periodNum)->value('id')
                            ?? $fallbackSemester?->id ?? 1;
                    }

                    $sessionType = $item['session_format'] ?? 'cm';

                    Schedule::create([
                        'institution_id' => $institutionId,
                        'academic_year_id' => $academicYear->id,
                        'semester_id' => $semesterId,
                        'module_id' => $item['module_id'] ?? null,
                        'professor_id' => $item['professor_id'] ?? null,
                        'professor_type' => Professor::class,
                        'group_id' => $item['group_id'] ?? null,
                        'room_id' => $item['room_id'] ?? null,
                        'day_of_week' => $item['day_of_week'] ?? 1,
                        'start_time' => $item['start_time'] ?? '08:30:00',
                        'end_time' => $item['end_time'] ?? '10:15:00',
                        'session_type' => $sessionType,
                        'recurrence' => 'weekly',
                        'is_active' => true,
                        'version' => 1,
                    ]);
                    $inserted++;
                }

                $this->info("✅ {$inserted} séances officielles enregistrées avec succès en base de données !");
            });

            // Re-lancer l'audit pour vérifier la santé de la table
            $this->newLine();
            $this->call('encg:audit-schedule');
        }

        return Command::SUCCESS;
    }
}

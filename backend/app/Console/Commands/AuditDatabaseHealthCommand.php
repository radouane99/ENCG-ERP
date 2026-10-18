<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AuditDatabaseHealthCommand extends Command
{
    protected $signature = 'encg:audit-db';

    protected $description = 'Comprehensive audit of database integrity, foreign keys, academic consistency, and indexes';

    private array $issues = [];

    private array $warnings = [];

    private array $passes = [];

    public function handle(): int
    {
        $this->info('==================================================================');
        $this->info('       🔍 AUDIT COMPLET DE LA BASE DE DONNÉES ENCG ERP           ');
        $this->info('==================================================================');

        $this->checkOrphanedForeignKeys();
        $this->checkAcademicDataIntegrity();
        $this->checkUserAndRbacIntegrity();
        $this->checkSubGroupsAndDispatches();
        $this->checkMissingFkIndexes();
        $this->checkOptimisticLockingVersions();

        $this->printSummary();

        return empty($this->issues) ? 0 : 1;
    }

    private function checkOrphanedForeignKeys(): void
    {
        $this->info("\n--- 1. Vérification des Clés Étrangères & Enregistrements Orphelins ---");

        $checks = [
            ['students', 'user_id', 'users', 'id'],
            ['professors', 'user_id', 'users', 'id'],
            ['professors', 'department_id', 'departments', 'id'],
            ['filieres', 'department_id', 'departments', 'id'],
            ['modules', 'filiere_id', 'filieres', 'id'],
            ['groups', 'filiere_id', 'filieres', 'id'],
            ['student_registrations', 'student_id', 'students', 'id'],
            ['student_registrations', 'module_id', 'modules', 'id'],
            ['student_pathways', 'student_id', 'students', 'id'],
            ['student_pathways', 'filiere_id', 'filieres', 'id'],
            ['grades', 'student_id', 'students', 'id'],
            ['grades', 'assessment_id', 'assessments', 'id'],
            ['schedules', 'professor_id', 'professors', 'id'],
            ['schedules', 'room_id', 'rooms', 'id'],
            ['schedules', 'group_id', 'groups', 'id'],
            ['exam_seatings', 'student_id', 'students', 'id'],
            ['convocations', 'student_id', 'users', 'id'],
            ['vacation_contracts', 'professor_id', 'professors', 'id'],
        ];

        foreach ($checks as [$childTable, $childCol, $parentTable, $parentCol]) {
            if (! Schema::hasTable($childTable) || ! Schema::hasTable($parentTable)) {
                continue;
            }
            if (! Schema::hasColumn($childTable, $childCol) || ! Schema::hasColumn($parentTable, $parentCol)) {
                continue;
            }

            $orphans = DB::table($childTable)
                ->whereNotNull($childCol)
                ->whereNotExists(function ($q) use ($childTable, $childCol, $parentTable, $parentCol) {
                    $q->select(DB::raw(1))
                        ->from($parentTable)
                        ->whereColumn("{$childTable}.{$childCol}", '=', "{$parentTable}.{$parentCol}");
                })
                ->count();

            if ($orphans > 0) {
                $msg = "{$childTable}.{$childCol} a {$orphans} enregistrements orphelins pointant vers {$parentTable}.{$parentCol} inexistant!";
                $this->error(" ❌ [Orphelin] {$msg}");
                $this->issues[] = $msg;
            } else {
                $this->passes[] = "{$childTable}.{$childCol} -> {$parentTable} intact (0 orphelin)";
            }
        }
        $this->line('  ↳ Total relations FK testées : '.count($checks));
    }

    private function checkAcademicDataIntegrity(): void
    {
        $this->info("\n--- 2. Intégrité Académique & Notes (LMD / Barème 0-20) ---");

        // 1. Notes hors barème (< 0 ou > 20)
        if (Schema::hasTable('grades') && Schema::hasColumn('grades', 'grade')) {
            $invalidGrades = DB::table('grades')
                ->whereNotNull('grade')
                ->where(function ($q) {
                    $q->where('grade', '<', 0)->orWhere('grade', '>', 20);
                })
                ->count();

            if ($invalidGrades > 0) {
                $msg = "grades.grade a {$invalidGrades} notes hors barème (<0 ou >20)!";
                $this->error(" ❌ [Barème] {$msg}");
                $this->issues[] = $msg;
            } else {
                $this->passes[] = 'Toutes les notes sont dans le barème légal [0, 20]';
            }
        }

        // 2. Doublons d'inscriptions annuelles (student_pathways is_current duplicates)
        if (Schema::hasTable('student_pathways') && Schema::hasColumn('student_pathways', 'is_current')) {
            $multiCurrent = DB::table('student_pathways')
                ->where('is_current', true)
                ->select('student_id', DB::raw('count(*) as c'))
                ->groupBy('student_id')
                ->havingRaw('count(*) > 1')
                ->get();

            if ($multiCurrent->isNotEmpty()) {
                $count = $multiCurrent->count();
                $msg = "student_pathways: {$count} étudiants ont plusieurs inscriptions marquées comme actives (is_current=true)!";
                $this->warn(" ⚠️ [Inscriptions multiples] {$msg}");
                $this->warnings[] = $msg;
            } else {
                $this->passes[] = 'Chaque étudiant a au plus 1 parcours actif (is_current=true)';
            }
        }

        // 3. Étudiants sans aucun groupe assigné
        if (Schema::hasTable('student_pathways') && Schema::hasColumn('student_pathways', 'group_id')) {
            $noGroup = DB::table('student_pathways')
                ->where('is_current', true)
                ->whereNull('group_id')
                ->count();

            if ($noGroup > 0) {
                $msg = "student_pathways: {$noGroup} étudiants actifs n'ont aucun group_id assigné!";
                $this->warn(" ⚠️ [Groupe manquant] {$msg}");
                $this->warnings[] = $msg;
            } else {
                $this->passes[] = 'Tous les étudiants actifs ont un groupe officiel';
            }
        }
    }

    private function checkUserAndRbacIntegrity(): void
    {
        $this->info("\n--- 3. Intégrité des Utilisateurs & Rôles (RBAC) ---");

        // 1. Users sans rôles Spatie
        if (Schema::hasTable('users') && Schema::hasTable('model_has_roles')) {
            $usersWithoutRoles = DB::table('users')
                ->whereNotExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('model_has_roles')
                        ->whereColumn('model_has_roles.model_id', '=', 'users.id')
                        ->where('model_has_roles.model_type', '=', 'App\Models\User');
                })
                ->count();

            if ($usersWithoutRoles > 0) {
                $msg = "users: {$usersWithoutRoles} utilisateurs n'ont aucun rôle Spatie attribué!";
                $this->warn(" ⚠️ [Rôle manquant] {$msg}");
                $this->warnings[] = $msg;
            } else {
                $this->passes[] = 'Tous les utilisateurs ont au moins un rôle Spatie';
            }
        }

        // 2. Doublons d'emails dans users
        $dupEmails = DB::table('users')
            ->select('email', DB::raw('count(*) as c'))
            ->groupBy('email')
            ->havingRaw('count(*) > 1')
            ->get();

        if ($dupEmails->isNotEmpty()) {
            $count = $dupEmails->count();
            $msg = "users: {$count} adresses email sont en doublon!";
            $this->error(" ❌ [Email doublon] {$msg}");
            $this->issues[] = $msg;
        } else {
            $this->passes[] = 'Toutes les adresses emails sont uniques';
        }

        // 3. Étudiants orphelins sans CNE ou CIN
        if (Schema::hasTable('students')) {
            $missingIds = DB::table('students')
                ->where(function ($q) {
                    $q->whereNull('cne')->orWhere('cne', '')
                        ->orWhereNull('cin')->orWhere('cin', '');
                })
                ->count();

            if ($missingIds > 0) {
                $msg = "students: {$missingIds} étudiants ont CNE ou CIN vide!";
                $this->warn(" ⚠️ [Identité académique] {$msg}");
                $this->warnings[] = $msg;
            } else {
                $this->passes[] = 'Tous les étudiants ont un CNE et CIN renseignés';
            }
        }
    }

    private function checkSubGroupsAndDispatches(): void
    {
        $this->info("\n--- 4. Architecture Pédagogique ENCG Fès (Sous-groupes TD G1.1 / G1.2) ---");

        if (Schema::hasTable('student_pathways') && Schema::hasColumn('student_pathways', 'sub_group')) {
            $noSubGroup = DB::table('student_pathways')
                ->where('is_current', true)
                ->whereNull('sub_group')
                ->count();

            if ($noSubGroup > 0) {
                $msg = "student_pathways: {$noSubGroup} étudiants actifs n'ont pas de sous-groupe TD (ex: G1.1 / G1.2)!";
                $this->warn(" ⚠️ [Sous-groupes TD] {$msg} (Utiliser encg:dispatch-subgroups)");
                $this->warnings[] = $msg;
            } else {
                $this->passes[] = 'Tous les étudiants actifs sont bien répartis en sous-groupes TD';
            }
        }
    }

    private function checkMissingFkIndexes(): void
    {
        $this->info("\n--- 5. Indexation des Clés Étrangères (Performance PostgreSQL) ---");

        $driver = DB::getDriverName();
        if ($driver !== 'pgsql') {
            return;
        }

        // Requête PostgreSQL pour trouver les colonnes FK qui manquent d'index
        $missingIndexes = DB::select("
            SELECT
                c.conrelid::regclass AS table_name,
                a.attname AS column_name
            FROM pg_constraint c
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
            WHERE c.contype = 'f'
              AND c.connamespace = 'public'::regnamespace
              AND NOT EXISTS (
                  SELECT 1
                  FROM pg_index i
                  WHERE i.indrelid = c.conrelid
                    AND a.attnum = ANY(i.indkey)
              )
            ORDER BY table_name, column_name
        ");

        if (! empty($missingIndexes)) {
            $count = count($missingIndexes);
            $this->line("  ℹ️ {$count} colonnes FK sans index dédié (normal pour petites tables, ou à optimiser si tables volumineuses)");
            // On l'enregistre en notice informative
        } else {
            $this->passes[] = 'Toutes les clés étrangères sont indexées';
        }
    }

    private function checkOptimisticLockingVersions(): void
    {
        $this->info("\n--- 6. Conformité Optimistic Locking (Règle ERP: colonne 'version') ---");

        $modelsWithOptimistic = ['grades', 'attendances', 'schedules', 'student_registrations'];
        foreach ($modelsWithOptimistic as $table) {
            if (Schema::hasTable($table)) {
                if (! Schema::hasColumn($table, 'version')) {
                    $msg = "Table '{$table}' utilise OptimisticLocking mais manque la colonne 'version'!";
                    $this->error(" ❌ [OptimisticLocking] {$msg}");
                    $this->issues[] = $msg;
                } else {
                    $this->passes[] = "Table '{$table}' possède bien sa colonne 'version'";
                }
            }
        }
    }

    private function printSummary(): void
    {
        $this->info("\n==================================================================");
        $this->info('                       RÉSUMÉ DU DIAGNOSTIC                       ');
        $this->info('==================================================================');

        $this->info('✅ Points conformes / Valides : '.count($this->passes));
        foreach (array_slice($this->passes, 0, 8) as $p) {
            $this->line("   ✓ {$p}");
        }
        if (count($this->passes) > 8) {
            $this->line('   ... et '.(count($this->passes) - 8).' autres points vérifiés avec succès.');
        }

        if (! empty($this->warnings)) {
            $this->warn("\n⚠️ Avertissements / Points d'attention : ".count($this->warnings));
            foreach ($this->warnings as $w) {
                $this->line("   ! {$w}");
            }
        } else {
            $this->info("\n⚠️ Avertissements : 0");
        }

        if (! empty($this->issues)) {
            $this->error("\n❌ Erreurs bloquantes à corriger : ".count($this->issues));
            foreach ($this->issues as $err) {
                $this->line("   ✗ {$err}");
            }
        } else {
            $this->info("\n❌ Erreurs critiques d'intégrité : 0 (Base saine)");
        }
    }
}

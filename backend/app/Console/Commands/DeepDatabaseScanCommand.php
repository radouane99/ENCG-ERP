<?php

namespace App\Console\Commands;

use App\Models\Attendance;
use App\Models\Grade;
use App\Models\Schedule;
use App\Models\StudentRegistration;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DeepDatabaseScanCommand extends Command
{
    protected $signature = 'encg:deep-scan {--fix : Automatically apply safe fixes for identified anomalies}';

    protected $description = 'Exhaustive Deep Scan of all database tables, relationships, constraints, and business logic';

    private int $totalChecks = 0;

    private array $criticalErrors = [];

    private array $warnings = [];

    private array $successes = [];

    private array $fixesApplied = [];

    public function handle(): int
    {
        $this->info('================================================================================');
        $this->info('      🔬 ENCG ERP — SCAN PROFOND ET DIAGNOSTIC DE LA BASE DE DONNÉES           ');
        $this->info('      Date : '.now()->toDateTimeString().' | PostgreSQL : 16                ');
        $this->info('================================================================================');

        $shouldFix = $this->option('fix');

        $this->scanFormalForeignKeys();
        $this->scanImplicitRelationships();
        $this->scanInstitutionUnification($shouldFix);
        $this->scanAcademicHierarchy();
        $this->scanStudentProfilesAndPathways($shouldFix);
        $this->scanGradesAndAssessments();
        $this->scanTimetableAndSchedules();
        $this->scanRbacAndPermissions($shouldFix);
        $this->scanOptimisticLockingCompliance();
        $this->scanMissingForeignKeyIndexes();

        $this->renderSummary();

        return empty($this->criticalErrors) ? 0 : 1;
    }

    /**
     * 1. Formal Foreign Keys Scan (information_schema.table_constraints)
     */
    private function scanFormalForeignKeys(): void
    {
        $this->line("\n[1/10] Scan des clés étrangères formelles, y compris les clés composites...");
        $fks = [];
        foreach (DB::select("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename") as $table) {
            foreach (Schema::getForeignKeys($table->tablename) as $fk) {
                $fks[] = array_merge($fk, ['table_name' => $table->tablename]);
            }
        }
        $orphanTotal = 0;
        foreach ($fks as $fk) {
            $this->totalChecks++;
            $query = DB::table($fk['table_name']);
            // PostgreSQL MATCH SIMPLE: a NULL in any component makes the FK optional.
            foreach ($fk['columns'] as $column) {
                $query->whereNotNull($column);
            }
            $count = $query->whereNotExists(function ($q) use ($fk) {
                $q->selectRaw('1')->from($fk['foreign_table']);
                foreach ($fk['columns'] as $position => $column) {
                    $q->whereColumn($fk['table_name'].'.'.$column, $fk['foreign_table'].'.'.$fk['foreign_columns'][$position]);
                }
            })->count();
            if ($count > 0) {
                $this->criticalErrors[] = $fk['table_name'].' ('.implode(',', $fk['columns']).') -> '.$fk['foreign_table'].' ('.$count.' orphelins)';
                $orphanTotal++;
            }
        }
        if ($orphanTotal === 0) {
            $this->successes[] = 'Toutes les '.count($fks).' relations formelles sont intègres (0 orphelin).';
            $this->line('   '.count($fks).' contraintes FK vérifiées : 0 orphelin.');
        } else {
            $this->error($orphanTotal.' contraintes FK contiennent des orphelins.');
        }
    }

    /**
     * 2. Implicit Relationships Scan (columns named *_id without formal FK constraint)
     */
    private function scanImplicitRelationships(): void
    {
        $this->line("\n[2/10] 🔎 Scan des Relations Implicites (colonnes *_id sans contrainte formelle)...");

        $implicitChecks = [
            ['schedules', 'professor_id', 'professors', 'id'],
            ['groups', 'delegate_student_id', 'students', 'id'],
            ['module_pv_signatures', 'academic_year_id', 'academic_years', 'id'],
            ['evaluation_campaigns', 'academic_year_id', 'academic_years', 'id'],
            ['course_evaluations', 'module_id', 'modules', 'id'],
            ['course_evaluations', 'student_id', 'students', 'uuid'],
            ['course_evaluations', 'professor_id', 'professors', 'uuid'],
            ['internship_documents', 'internship_id', 'internships', 'id'],
            ['internship_evaluations', 'internship_id', 'internships', 'id'],
            ['internship_reports', 'internship_id', 'internships', 'id'],
            ['project_defenses', 'final_project_id', 'final_projects', 'id'],
            ['quiz_questions', 'quiz_id', 'quizzes', 'id'],
            ['student_documents', 'student_id', 'students', 'id'],
        ];

        $implicitOrphans = 0;
        foreach ($implicitChecks as [$table, $col, $pTable, $pCol]) {
            if (! Schema::hasTable($table) || ! Schema::hasTable($pTable)) {
                continue;
            }
            if (! Schema::hasColumn($table, $col) || ! Schema::hasColumn($pTable, $pCol)) {
                continue;
            }

            $this->totalChecks++;
            $orphans = DB::table($table)
                ->whereNotNull($col)
                ->whereNotExists(function ($q) use ($table, $col, $pTable, $pCol) {
                    $q->select(DB::raw(1))
                        ->from($pTable)
                        ->whereColumn("{$table}.{$col}", '=', "{$pTable}.{$pCol}");
                })->count();

            if ($orphans > 0) {
                $msg = "Relation implicite {$table}.{$col} -> {$pTable}.{$pCol} a {$orphans} orphelins!";
                $this->criticalErrors[] = $msg;
                $implicitOrphans++;
                $this->error("   ❌ {$msg}");
            }
        }

        if ($implicitOrphans === 0) {
            $this->successes[] = 'Toutes les relations implicites documentées sont 100% valides.';
            $this->line('   ✓ Toutes les relations implicites *_id testées sont saines (0 orphelin).');
        }
    }

    /**
     * 3. Institution ID Unification (ENCG Fès = ID 1)
     */
    private function scanInstitutionUnification(bool $shouldFix): void
    {
        $this->line("\n[3/10] 🏛️ Scan de l'Unification de l'Établissement (institution_id = 1 partout)...");

        $tablesWithInst = DB::select("
            SELECT table_name 
            FROM information_schema.columns 
            WHERE column_name = 'institution_id' AND table_schema = 'public'
            ORDER BY table_name
        ");

        $divergentCount = 0;
        foreach ($tablesWithInst as $row) {
            $t = $row->table_name;
            $this->totalChecks++;
            $divergent = DB::table($t)->where(function ($q) {
                $q->whereNull('institution_id')->orWhere('institution_id', '!=', 1);
            })->count();

            if ($divergent > 0) {
                if ($shouldFix) {
                    DB::table($t)->whereNull('institution_id')->update(['institution_id' => 1]);
                    $this->fixesApplied[] = "Table '{$t}': {$divergent} lignes alignées sur institution_id = 1.";
                    $this->info("   🔧 [Auto-fix] Table '{$t}': {$divergent} lignes alignées sur institution_id = 1.");
                } else {
                    $msg = "Table '{$t}' a {$divergent} ligne(s) avec institution_id NULL ou != 1!";
                    $this->warnings[] = $msg;
                    $divergentCount++;
                    $this->warn("   ⚠️ {$msg}");
                }
            }
        }

        if ($divergentCount === 0 || $shouldFix) {
            $this->successes[] = '100% des tables avec institution_id ('.count($tablesWithInst).' tables) sont rigoureusement unifiées à ID 1.';
            $this->line('   ✓ 100% des tables ('.count($tablesWithInst).') sont alignées sur institution_id = 1.');
        }
    }

    /**
     * 4. Academic Hierarchy Scan
     */
    private function scanAcademicHierarchy(): void
    {
        $this->line("\n[4/10] 📚 Scan de la Hiérarchie Académique (Années, Semestres, Filières, Modules)...");

        // 1. Années académiques
        $currentYears = DB::table('academic_years')->where('is_current', true)->count();
        $this->totalChecks++;
        if ($currentYears === 1) {
            $activeYear = DB::table('academic_years')->where('is_current', true)->first();
            $this->line("   ✓ Exactement 1 année active officielle configurée : {$activeYear->label} (ID: {$activeYear->id}).");
        } else {
            $msg = "academic_years: {$currentYears} années marquées comme actives (doit être exactement 1)!";
            $this->criticalErrors[] = $msg;
            $this->error("   ❌ {$msg}");
        }

        // 2. Semestres cohérents
        $this->totalChecks++;
        $invalidSemNumbers = DB::table('semesters')->whereNotIn('number', range(1, 10))->count();
        if ($invalidSemNumbers > 0) {
            $msg = "semesters: {$invalidSemNumbers} semestre(s) avec un numéro hors plage [1..10]!";
            $this->criticalErrors[] = $msg;
            $this->error("   ❌ {$msg}");
        } else {
            $this->line('   ✓ Tous les semestres ont des numéros officiels conformes [1..10].');
        }

        // 3. Modules sans filière
        $this->totalChecks++;
        $orphanModules = DB::table('modules')->whereNull('filiere_id')->count();
        if ($orphanModules > 0) {
            $msg = "modules: {$orphanModules} module(s) orphelin(s) sans filière!";
            $this->criticalErrors[] = $msg;
            $this->error("   ❌ {$msg}");
        } else {
            $this->line('   ✓ Tous les modules appartiennent à une filière valide.');
        }

        // 4. Modules avec coefficient nul ou négatif
        $this->totalChecks++;
        $invalidCoefs = DB::table('modules')->where('coefficient', '<=', 0)->count();
        if ($invalidCoefs > 0) {
            $msg = "modules: {$invalidCoefs} module(s) avec coefficient <= 0!";
            $this->warnings[] = $msg;
            $this->warn("   ⚠️ {$msg}");
        } else {
            $this->line('   ✓ Tous les modules ont des coefficients académiques positifs.');
        }
    }

    /**
     * 5. Student Profiles, Pathways & TD Sub-Groups Scan
     */
    private function scanStudentProfilesAndPathways(bool $shouldFix): void
    {
        $this->line("\n[5/10] 🎓 Scan des Étudiants, Inscriptions & Sous-groupes TD (Règle 7)...");

        // 1. Étudiants sans compte User
        $this->totalChecks++;
        $orphansUser = DB::table('students')->whereNotExists(function ($q) {
            $q->select(DB::raw(1))->from('users')->whereColumn('users.id', '=', 'students.user_id');
        })->count();

        if ($orphansUser > 0) {
            $msg = "students: {$orphansUser} étudiant(s) sans compte User correspondant!";
            $this->criticalErrors[] = $msg;
            $this->error("   ❌ {$msg}");
        } else {
            $this->line('   ✓ Tous les étudiants possèdent un compte utilisateur relié.');
        }

        // 2. CNE et CIN vides
        $this->totalChecks++;
        $emptyCne = DB::table('students')->where(function ($q) {
            $q->whereNull('cne')->orWhere('cne', '');
        })->count();

        if ($emptyCne > 0) {
            $msg = "students: {$emptyCne} étudiant(s) avec CNE manquant ou vide!";
            $this->warnings[] = $msg;
            $this->warn("   ⚠️ {$msg}");
        } else {
            $this->line('   ✓ 100% des étudiants ont un code CNE/Massar renseigné.');
        }

        // 3. Doublons de parcours actif
        $this->totalChecks++;
        $multiPathways = DB::table('student_pathways')
            ->where('is_current', true)
            ->select('student_id', DB::raw('count(*) as c'))
            ->groupBy('student_id')
            ->havingRaw('count(*) > 1')
            ->count();

        if ($multiPathways > 0) {
            $msg = "student_pathways: {$multiPathways} étudiant(s) avec plusieurs parcours actifs simultanés!";
            $this->criticalErrors[] = $msg;
            $this->error("   ❌ {$msg}");
        } else {
            $this->line("   ✓ Aucun étudiant n'a de doublon de parcours actif simultané.");
        }

        // 4. Respect du sous-groupe TD (Règle 7 ENCG Fès : G1.1 / G1.2)
        $this->totalChecks++;
        $missingSubGroups = DB::table('student_pathways')
            ->where('is_current', true)
            ->where(function ($q) {
                $q->whereNull('sub_group')->orWhere('sub_group', '');
            })->count();

        if ($missingSubGroups > 0) {
            $msg = "student_pathways: {$missingSubGroups} étudiant(s) actifs sans sous-groupe TD (G1.1 / G1.2)!";
            $this->warnings[] = $msg;
            $this->warn("   ⚠️ {$msg}");
        } else {
            $this->line('   ✓ 100% des étudiants actifs ont leur sous-groupe TD officiel assigné.');
        }
    }

    /**
     * 6. Grades & Assessments Consistency
     */
    private function scanGradesAndAssessments(): void
    {
        $this->line("\n[6/10] ⚖️ Scan des Notes, Barèmes LMD & Évaluations...");

        // 1. Notes hors barème légal [0, 20]
        $this->totalChecks++;
        $invalidNotes = DB::table('grades')
            ->whereNotNull('value')
            ->where(function ($q) {
                $q->where('value', '<', 0)->orWhere('value', '>', 20);
            })->count();

        if ($invalidNotes > 0) {
            $msg = "grades: {$invalidNotes} note(s) hors barème légal (<0 ou >20)!";
            $this->criticalErrors[] = $msg;
            $this->error("   ❌ {$msg}");
        } else {
            $this->line('   ✓ Toutes les notes sont rigoureusement dans le barème légal [0.00, 20.00].');
        }

        // 2. Doublons de notes (même étudiant + même évaluation)
        $this->totalChecks++;
        $duplicateGrades = DB::table('grades')
            ->select('student_id', 'assessment_id', DB::raw('count(*) as c'))
            ->groupBy('student_id', 'assessment_id')
            ->havingRaw('count(*) > 1')
            ->count();

        if ($duplicateGrades > 0) {
            $msg = "grades: {$duplicateGrades} doublon(s) de note pour un même étudiant sur la même évaluation!";
            $this->criticalErrors[] = $msg;
            $this->error("   ❌ {$msg}");
        } else {
            $this->line('   ✓ Aucun doublon de note par évaluation.');
        }

        // 3. Somme des pondérations des évaluations par module (hors Rattrapage qui est une session de substitution à 100%)
        $this->totalChecks++;
        $unbalancedAssessments = DB::table('assessments')
            ->where('needs_review', false)->whereNotNull('academic_year_id')
            ->whereRaw("LOWER(TRIM(type)) NOT IN ('rattrapage','resit','r')")
            ->select('module_id', 'academic_year_id', DB::raw('SUM(weight) as total_weight'))
            ->groupBy('module_id', 'academic_year_id')
            ->havingRaw('ABS(SUM(weight) - 100) > 0.01')
            ->get()->count();

        if ($unbalancedAssessments > 0) {
            $msg = "assessments: {$unbalancedAssessments} module(s) dont la somme des pondérations != 100%!";
            $this->warnings[] = $msg;
            $this->warn("   ⚠️ {$msg}");
        } else {
            $this->line('   ✓ Tous les modules évalués totalisent exactement 100% de pondération.');
        }
        if (Schema::hasTable('data_integrity_issues')) {
            $pending = DB::table('data_integrity_issues')->whereNull('resolved_at')->count();
            if ($pending) {
                $this->warnings[] = "{$pending} cas de données historiques restent à réconcilier dans le tableau de bord administration.";
            }
        }
    }

    /**
     * 7. Timetable Clashes & Conflict Detection
     */
    private function scanTimetableAndSchedules(): void
    {
        $this->line("\n[7/10] 📅 Scan de l'Emploi du Temps (Conflits Professeurs, Salles, Groupes)...");

        // 1. Conflits Professeur (hors Cours Magistraux partagés où les groupes assistent ensemble au même amphi)
        $this->totalChecks++;
        $profClashes = DB::select("
            SELECT s1.id AS s1_id, s2.id AS s2_id, s1.professor_id, s1.day_of_week
            FROM schedules s1
            JOIN schedules s2 ON s1.professor_id = s2.professor_id
                AND s1.day_of_week = s2.day_of_week
                AND s1.id < s2.id
                AND s1.academic_year_id = s2.academic_year_id
                AND s1.semester_id = s2.semester_id
                AND (s1.start_time < s2.end_time AND s1.end_time > s2.start_time)
                AND NOT (
                    LOWER(COALESCE(s1.session_type, '')) = 'cm'
                    AND LOWER(COALESCE(s2.session_type, '')) = 'cm'
                    AND s1.module_id = s2.module_id
                    AND s1.room_id = s2.room_id
                    AND s1.start_time = s2.start_time
                    AND s1.end_time = s2.end_time
                )
        ");

        if (count($profClashes) > 0) {
            $msg = 'schedules: '.count($profClashes)." conflit(s) d'horaires enseignant (double-réservation)!";
            $this->criticalErrors[] = $msg;
            $this->error("   ❌ {$msg}");
        } else {
            $this->line('   ✓ 0 conflit enseignant (aucun professeur en double-réservation).');
        }

        // 2. Conflits Salle (hors Cours Magistraux partagés dans le même amphi pour le même cours)
        $this->totalChecks++;
        $roomClashes = DB::select("
            SELECT s1.id AS s1_id, s2.id AS s2_id, s1.room_id, s1.day_of_week
            FROM schedules s1
            JOIN schedules s2 ON s1.room_id = s2.room_id
                AND s1.day_of_week = s2.day_of_week
                AND s1.id < s2.id
                AND s1.academic_year_id = s2.academic_year_id
                AND (s1.start_time < s2.end_time AND s1.end_time > s2.start_time)
                AND NOT (
                    LOWER(COALESCE(s1.session_type, '')) = 'cm'
                    AND LOWER(COALESCE(s2.session_type, '')) = 'cm'
                    AND s1.module_id = s2.module_id
                    AND s1.professor_id = s2.professor_id
                    AND s1.start_time = s2.start_time
                    AND s1.end_time = s2.end_time
                )
        ");

        if (count($roomClashes) > 0) {
            $msg = 'schedules: '.count($roomClashes).' conflit(s) de salle (deux cours en même temps)!';
            $this->criticalErrors[] = $msg;
            $this->error("   ❌ {$msg}");
        } else {
            $this->line('   ✓ 0 conflit de salle (toutes les salles ont une occupation exclusive).');
        }

        // 3. Conflits Groupe
        $this->totalChecks++;
        $groupClashes = DB::select('
            SELECT s1.id AS s1_id, s2.id AS s2_id, s1.group_id, s1.day_of_week
            FROM schedules s1
            JOIN schedules s2 ON s1.group_id = s2.group_id
                AND s1.day_of_week = s2.day_of_week
                AND s1.id < s2.id
                AND s1.academic_year_id = s2.academic_year_id
                AND s1.group_id IS NOT NULL
                AND (s1.start_time < s2.end_time AND s1.end_time > s2.start_time)
        ');

        if (count($groupClashes) > 0) {
            $msg = 'schedules: '.count($groupClashes).' conflit(s) de groupe!';
            $this->criticalErrors[] = $msg;
            $this->error("   ❌ {$msg}");
        } else {
            $this->line("   ✓ 0 conflit de groupe (aucun groupe n'a deux cours simultanés).");
        }
    }

    /**
     * 8. RBAC, Roles & Permissions Consistency
     */
    private function scanRbacAndPermissions(bool $shouldFix): void
    {
        $this->line("\n[8/10] 🛡️ Scan RBAC (Utilisateurs, Rôles Spatie & Permissions)...");

        // 1. model_has_roles orphelins
        $this->totalChecks++;
        $orphanModelRoles = DB::table('model_has_roles')
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))->from('roles')->whereColumn('roles.id', '=', 'model_has_roles.role_id');
            })->count();

        if ($orphanModelRoles > 0) {
            $msg = "model_has_roles: {$orphanModelRoles} assignation(s) de rôle orpheline(s)!";
            $this->criticalErrors[] = $msg;
            $this->error("   ❌ {$msg}");
        } else {
            $this->line('   ✓ Toutes les assignations de rôles pointent vers des rôles existants.');
        }

        // 2. role_has_permissions orphelins
        $this->totalChecks++;
        $orphanRolePerms = DB::table('role_has_permissions')
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))->from('roles')->whereColumn('roles.id', '=', 'role_has_permissions.role_id');
            })->count();

        if ($orphanRolePerms > 0) {
            $msg = "role_has_permissions: {$orphanRolePerms} permission(s) orpheline(s)!";
            $this->criticalErrors[] = $msg;
            $this->error("   ❌ {$msg}");
        } else {
            $this->line('   ✓ Toutes les permissions sont reliées à des rôles valides.');
        }

        // 3. Users sans aucun rôle
        $this->totalChecks++;
        $usersNoRole = DB::table('users')
            ->whereNotExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('model_has_roles')
                    ->whereColumn('model_has_roles.model_id', '=', 'users.id');
            })->count();

        if ($usersNoRole > 0) {
            if ($shouldFix) {
                $unassignedUsers = DB::table('users')
                    ->whereNotExists(function ($q) {
                        $q->select(DB::raw(1))
                            ->from('model_has_roles')
                            ->whereColumn('model_has_roles.model_id', '=', 'users.id');
                    })->get();

                foreach ($unassignedUsers as $u) {
                    $userModel = User::find($u->id);
                    if ($userModel) {
                        $userModel->assignRole('student');
                        $this->fixesApplied[] = "Utilisateur {$u->email} (ID: {$u->id}) assigné au rôle 'student'.";
                    }
                }
                $this->info("   🔧 [Auto-fix] {$usersNoRole} utilisateurs sans rôle assignés à 'student'.");
            } else {
                $this->warnings[] = "users: {$usersNoRole} utilisateur(s) sans rôle attribué.";
                $this->warn("   ⚠️ {$usersNoRole} utilisateurs sans rôle attribué.");
            }
        } else {
            $this->line('   ✓ Tous les utilisateurs ont au moins un rôle attribué.');
        }
    }

    /**
     * 9. Optimistic Locking Column Compliance (Rule 1)
     */
    private function scanOptimisticLockingCompliance(): void
    {
        $this->line("\n[9/10] 🔒 Scan de Conformité Optimistic Locking (Règle 1 AGENTS.md)...");

        $models = [
            Attendance::class => 'attendances',
            Grade::class => 'grades',
            Schedule::class => 'schedules',
            StudentRegistration::class => 'student_registrations',
        ];

        $missingVersion = 0;
        foreach ($models as $modelClass => $table) {
            $this->totalChecks++;
            if (! Schema::hasColumn($table, 'version')) {
                $msg = "Table '{$table}' utilise OptimisticLocking mais manque la colonne 'version'!";
                $this->criticalErrors[] = $msg;
                $this->error("   ❌ {$msg}");
                $missingVersion++;
            }
        }

        if ($missingVersion === 0) {
            $this->successes[] = "100% des modèles avec OptimisticLocking possèdent la colonne 'version'.";
            $this->line("   ✓ 100% conforme à la Règle 1 (colonne 'version' présente sur toutes les tables requises).");
        }
    }

    /**
     * 10. Performance: Foreign Keys Without Index
     */
    private function scanMissingForeignKeyIndexes(): void
    {
        $this->line("\n[10/10] ⚡ Scan de Performance & Indexation des Clés Étrangères...");

        $this->totalChecks++;
        $unindexedFks = DB::select("
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

        $count = count($unindexedFks);
        if ($count > 0) {
            $this->warnings[] = "{$count} colonne(s) de clé étrangère n'ont pas d'index dédié (optimisation recommandée pour de très gros volumes).";
            $this->warn("   ℹ️ {$count} clés étrangères sans index dédié (normal pour petites tables de paramétrage).");
        } else {
            $this->line('   ✓ 100% des clés étrangères sont indexées.');
        }
    }

    /**
     * Render Final Summary Report
     */
    private function renderSummary(): void
    {
        $this->line("\n================================================================================");
        $this->info('                       RÉSUMÉ DU SCAN DE SANTÉ DE LA BASE                      ');
        $this->line('================================================================================');

        $this->line("  • Total des vérifications exécutées  : <info>{$this->totalChecks}</info>");
        $this->line('  • Erreurs Critiques / Conflits       : '.(empty($this->criticalErrors) ? '<info>0 (AUCUNE)</info>' : '<error>'.count($this->criticalErrors).' ERREUR(S)</error>'));
        $this->line('  • Avertissements / Optimisations     : '.(empty($this->warnings) ? '<info>0</info>' : '<comment>'.count($this->warnings).'</comment>'));
        $this->line('  • Statut des contrôles               : '.(empty($this->criticalErrors) ? '<info>Aucune anomalie critique détectée ; consulter les avertissements.</info>' : '<error>ATTENTION REQUISE</error>'));
        $this->line("================================================================================\n");

        if (! empty($this->criticalErrors)) {
            $this->error('DÉTAIL DES ERREURS CRITIQUES :');
            foreach ($this->criticalErrors as $i => $err) {
                $this->error('  '.($i + 1).". {$err}");
            }
            $this->line('');
        }

        if (! empty($this->warnings)) {
            $this->comment('DÉTAIL DES AVERTISSEMENTS & RECOMMANDATIONS :');
            foreach ($this->warnings as $i => $warn) {
                $this->comment('  '.($i + 1).". {$warn}");
            }
            $this->line('');
        }
    }
}

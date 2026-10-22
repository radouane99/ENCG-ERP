<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Correctif critique détecté par le deep-scan du 2026-10-22 :
 *
 * 1. grade_appeals : la table en production a été créée par la migration 2026_06_24
 *    (ancienne version). Les migrations suivantes (2026_07_23, 2026_09_05) ont été
 *    skippées par le guard `if (! Schema::hasTable(...))`. Résultat : 9 colonnes
 *    attendues par le contrôleur et le modèle sont absentes → feature entièrement cassée.
 *    Ce correctif ajoute les colonnes manquantes de façon idempotente (hasColumn guard).
 *
 * 2. Performance : ajout d'index sur les FK les plus sollicitées (grades, appeals,
 *    module assignments, timetable slots, professors) pour les tables à fort volume.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ─────────────────────────────────────────────────────────────────────────
        // FIX 1 : Colonnes manquantes dans grade_appeals
        // ─────────────────────────────────────────────────────────────────────────
        if (Schema::hasTable('grade_appeals')) {
            Schema::table('grade_appeals', function (Blueprint $table) {

                // Colonne module_id (FK vers modules)
                if (! Schema::hasColumn('grade_appeals', 'module_id')) {
                    $table->foreignId('module_id')
                          ->nullable()
                          ->after('assessment_id')
                          ->constrained('modules')
                          ->nullOnDelete();
                }

                // Colonne professor_id (FK vers professors)
                if (! Schema::hasColumn('grade_appeals', 'professor_id')) {
                    $table->foreignId('professor_id')
                          ->nullable()
                          ->after('module_id')
                          ->constrained('professors')
                          ->nullOnDelete();
                }

                // original_grade — note au moment du dépôt du recours
                if (! Schema::hasColumn('grade_appeals', 'original_grade')) {
                    $table->decimal('original_grade', 5, 2)
                          ->nullable()
                          ->after('professor_id');
                }

                // claimed_grade — note revendiquée par l'étudiant
                if (! Schema::hasColumn('grade_appeals', 'claimed_grade')) {
                    $table->decimal('claimed_grade', 5, 2)
                          ->nullable()
                          ->after('original_grade');
                }

                // reason_category — catégorie normalisée du motif
                if (! Schema::hasColumn('grade_appeals', 'reason_category')) {
                    $table->string('reason_category')
                          ->default('erreur_materielle')
                          ->after('claimed_grade');
                    // Valeurs: erreur_materielle | oubli_cc | non_report | autre
                }

                // student_justification — texte long du justificatif
                if (! Schema::hasColumn('grade_appeals', 'student_justification')) {
                    $table->text('student_justification')
                          ->nullable()
                          ->after('reason_category');
                }

                // professor_comment — commentaire/décision de l'enseignant
                if (! Schema::hasColumn('grade_appeals', 'professor_comment')) {
                    $table->text('professor_comment')
                          ->nullable()
                          ->after('student_justification');
                }

                // rectified_grade — note corrigée après recours accepté
                if (! Schema::hasColumn('grade_appeals', 'rectified_grade')) {
                    $table->decimal('rectified_grade', 5, 2)
                          ->nullable()
                          ->after('professor_comment');
                }

                // resolved_by — FK vers users (admin ou professeur qui a tranché)
                if (! Schema::hasColumn('grade_appeals', 'resolved_by')) {
                    $table->foreignId('resolved_by')
                          ->nullable()
                          ->after('rectified_grade')
                          ->constrained('users')
                          ->nullOnDelete();
                }

                // appeal_deadline_at — horodatage limite du recours LMD 48h
                if (! Schema::hasColumn('grade_appeals', 'appeal_deadline_at')) {
                    $table->timestamp('appeal_deadline_at')
                          ->nullable()
                          ->after('resolved_by');
                }
            });

            // Index composite pour les requêtes fréquentes sur grade_appeals
            $this->safeAddIndex('grade_appeals', ['student_id', 'status'], 'grade_appeals_student_status_idx');
            $this->safeAddIndex('grade_appeals', ['module_id', 'status'],  'grade_appeals_module_status_idx');
        }

        // ─────────────────────────────────────────────────────────────────────────
        // FIX 2 : Index de performance sur les FK les plus sollicitées
        // ─────────────────────────────────────────────────────────────────────────

        // grades (table centrale des notes)
        if (Schema::hasTable('grades')) {
            $this->safeAddIndex('grades', ['student_id', 'assessment_id'], 'grades_student_assessment_idx');
            $this->safeAddIndex('grades', ['assessment_id'],               'grades_assessment_id_idx');
        }

        // assessments (évaluations par module)
        if (Schema::hasTable('assessments')) {
            $this->safeAddIndex('assessments', ['module_id'], 'assessments_module_id_idx');
        }

        // timetable_slots (emploi du temps)
        if (Schema::hasTable('timetable_slots')) {
            $this->safeAddIndex('timetable_slots', ['professor_id'], 'timetable_slots_professor_id_idx');
            $this->safeAddIndex('timetable_slots', ['group_id'],     'timetable_slots_group_id_idx');
            $this->safeAddIndex('timetable_slots', ['room_id'],      'timetable_slots_room_id_idx');
        }

        // module_professor (affectations enseignants-modules)
        if (Schema::hasTable('module_professor')) {
            $this->safeAddIndex('module_professor', ['professor_id'], 'module_professor_professor_id_idx');
            $this->safeAddIndex('module_professor', ['module_id'],    'module_professor_module_id_idx');
        }

        // professor_document_requests (guichet RH)
        if (Schema::hasTable('professor_document_requests')) {
            $this->safeAddIndex('professor_document_requests', ['professor_id', 'status'], 'prof_doc_req_prof_status_idx');
        }

        // notifications (consultées en permanence)
        if (Schema::hasTable('notifications')) {
            $this->safeAddIndex('notifications', ['notifiable_id', 'notifiable_type', 'read_at'],
                                'notifications_notifiable_read_idx');
        }

        // audit_logs
        if (Schema::hasTable('audit_logs')) {
            $this->safeAddIndex('audit_logs', ['user_id'],      'audit_logs_user_id_idx');
            $this->safeAddIndex('audit_logs', ['created_at'],   'audit_logs_created_at_idx');
        }

        // attendances
        if (Schema::hasTable('attendance_records')) {
            $this->safeAddIndex('attendance_records', ['student_id'], 'attendance_records_student_id_idx');
        }
    }

    public function down(): void
    {
        // Suppression des colonnes ajoutées à grade_appeals
        if (Schema::hasTable('grade_appeals')) {
            Schema::table('grade_appeals', function (Blueprint $table) {
                // Supprimer les FK d'abord
                if (DB::getDriverName() === 'pgsql') {
                    DB::statement('ALTER TABLE grade_appeals DROP CONSTRAINT IF EXISTS grade_appeals_module_id_foreign');
                    DB::statement('ALTER TABLE grade_appeals DROP CONSTRAINT IF EXISTS grade_appeals_professor_id_foreign');
                    DB::statement('ALTER TABLE grade_appeals DROP CONSTRAINT IF EXISTS grade_appeals_resolved_by_foreign');
                } else {
                    $table->dropForeign(['module_id']);
                    $table->dropForeign(['professor_id']);
                    $table->dropForeign(['resolved_by']);
                }

                $cols = ['module_id','professor_id','original_grade','claimed_grade',
                         'reason_category','student_justification','professor_comment',
                         'rectified_grade','resolved_by','appeal_deadline_at'];

                foreach ($cols as $col) {
                    if (Schema::hasColumn('grade_appeals', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        // Suppression des index de performance
        $indexMap = [
            'grade_appeals'                => ['grade_appeals_student_status_idx', 'grade_appeals_module_status_idx'],
            'grades'                       => ['grades_student_assessment_idx', 'grades_assessment_id_idx'],
            'assessments'                  => ['assessments_module_id_idx'],
            'timetable_slots'              => ['timetable_slots_professor_id_idx', 'timetable_slots_group_id_idx', 'timetable_slots_room_id_idx'],
            'module_professor'             => ['module_professor_professor_id_idx', 'module_professor_module_id_idx'],
            'professor_document_requests'  => ['prof_doc_req_prof_status_idx'],
            'notifications'                => ['notifications_notifiable_read_idx'],
            'audit_logs'                   => ['audit_logs_user_id_idx', 'audit_logs_created_at_idx'],
            'attendance_records'           => ['attendance_records_student_id_idx'],
        ];

        foreach ($indexMap as $tbl => $indexes) {
            if (Schema::hasTable($tbl)) {
                Schema::table($tbl, function (Blueprint $table) use ($indexes) {
                    foreach ($indexes as $idx) {
                        $table->dropIndexIfExists($idx);
                    }
                });
            }
        }
    }

    /**
     * Ajoute un index uniquement s'il n'existe pas déjà (idempotent).
     */
    private function safeAddIndex(string $table, array $columns, string $name): void
    {
        $existing = collect(Schema::getIndexes($table))->pluck('name')->toArray();
        if (! in_array($name, $existing, true)) {
            Schema::table($table, function (Blueprint $tbl) use ($columns, $name) {
                $tbl->index($columns, $name);
            });
        }
    }
};

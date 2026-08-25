<?php

namespace Database\Seeders;

use App\Models\AcademicEvent;
use App\Models\AcademicYear;
use App\Models\Semester;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fenêtres NPN / calendrier (migrations 2026_07_21 + 2026_08_24 description/meta).
 */
class AcademicCalendarSeeder extends Seeder
{
    public function run(): void
    {
        $year = AcademicYear::query()->where('is_current', true)->first()
            ?? AcademicYear::query()->latest('id')->first();

        if (! $year) {
            return;
        }

        $start = now()->subMonth()->startOfDay();
        $end = now()->addMonths(8)->endOfDay();

        $windows = [
            [
                'type' => 'depot_justificatifs',
                'title' => 'Dépôt des justificatifs & documents scolarité',
                'description' => 'Guichet électronique : attestations, relevés, justificatifs d’absence (Loi 09-08).',
            ],
            [
                'type' => 'document_submission',
                'title' => 'Document submission window',
                'description' => 'Alias anglais (migration academic_events.type).',
            ],
            [
                'type' => 'saisie_notes',
                'title' => 'Saisie des notes CC / examen',
                'description' => 'Période de saisie pédagogique (seuil éliminatoire 6/20, validation 10/20).',
            ],
            [
                'type' => 'grades_entry',
                'title' => 'Grade entry window',
                'description' => 'Alias anglais saisie_notes.',
            ],
            [
                'type' => 'inscriptions',
                'title' => 'Inscriptions & réinscriptions',
                'description' => 'Tunnel de réinscription annuelle ENCG Fès.',
            ],
        ];

        foreach ($windows as $window) {
            AcademicEvent::query()->updateOrCreate(
                [
                    'academic_year_id' => $year->id,
                    'type' => $window['type'],
                ],
                [
                    'title' => $window['title'],
                    'description' => $window['description'],
                    'meta' => [
                        'source' => 'academic-calendar-seeder',
                        'institution' => 'ENCG-FES',
                    ],
                    'start_date' => $start,
                    'end_date' => $end,
                    'is_active' => true,
                ]
            );
        }

        $this->publishCurrentSemesterSchedules($year);
    }

    /**
     * Migration 2026_07_09 : EDT visible uniquement si version PUBLISHED (ou version nulle).
     */
    private function publishCurrentSemesterSchedules(AcademicYear $year): void
    {
        if (! Schema::hasTable('schedule_versions') || ! Schema::hasColumn('schedules', 'schedule_version_id')) {
            return;
        }

        $semesterIds = DB::table('schedules')
            ->where('academic_year_id', $year->id)
            ->where('is_active', true)
            ->whereNotNull('semester_id')
            ->distinct()
            ->pluck('semester_id');

        if ($semesterIds->isEmpty()) {
            $current = Semester::query()
                ->where('academic_year_id', $year->id)
                ->where('is_current', true)
                ->first();
            if ($current) {
                $semesterIds = collect([$current->id]);
            }
        }

        foreach ($semesterIds as $semesterId) {
            $versionId = DB::table('schedule_versions')
                ->where('academic_year_id', $year->id)
                ->where('semester_id', $semesterId)
                ->where('status', 'PUBLISHED')
                ->value('id');

            if (! $versionId) {
                $versionId = DB::table('schedule_versions')->insertGetId([
                    'academic_year_id' => $year->id,
                    'semester_id' => $semesterId,
                    'version_name' => 'Publié '.$year->label,
                    'status' => 'PUBLISHED',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('schedules')
                ->where('academic_year_id', $year->id)
                ->where('semester_id', $semesterId)
                ->whereNull('schedule_version_id')
                ->update(['schedule_version_id' => $versionId]);
        }
    }
}

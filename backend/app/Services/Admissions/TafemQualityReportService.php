<?php

namespace App\Services\Admissions;

use App\Domain\Student\Models\StudentDossierAuditLog;
use App\Models\Student;
use Illuminate\Support\Facades\Schema;

class TafemQualityReportService
{
    /**
     * @return array{duplicates_cne: int, missing_cin: int, missing_photo: int, massar_mismatch: int}
     */
    public function build(bool $audit = true): array
    {
        if (! Schema::hasTable('students')) {
            return [
                'duplicates_cne' => 0,
                'missing_cin' => 0,
                'missing_photo' => 0,
                'massar_mismatch' => 0,
            ];
        }

        $select = ['id', 'cne', 'cin', 'massar_code'];
        if (Schema::hasColumn('students', 'photo_path')) {
            $select[] = 'photo_path';
        }

        $students = Student::query()->get($select);
        $cneCounts = $students->groupBy(fn ($s) => strtoupper(trim((string) $s->cne)))->filter(fn ($g, $cne) => $cne !== '' && $g->count() > 1);
        $duplicates = $cneCounts->sum(fn ($g) => $g->count());

        $missingCin = $students->filter(fn ($s) => trim((string) $s->cin) === '')->count();
        $missingPhoto = Schema::hasColumn('students', 'photo_path')
            ? $students->filter(fn ($s) => trim((string) ($s->photo_path ?? '')) === '')->count()
            : 0;
        $massarMismatch = $students->filter(function ($s) {
            $cne = strtoupper(trim((string) $s->cne));
            $massar = strtoupper(trim((string) ($s->massar_code ?? '')));

            return $massar === '' || ($cne !== '' && $massar === $cne);
        })->count();

        $report = [
            'duplicates_cne' => (int) $duplicates,
            'missing_cin' => (int) $missingCin,
            'missing_photo' => (int) $missingPhoto,
            'massar_mismatch' => (int) $massarMismatch,
        ];

        if ($audit) {
            $this->auditGaps($students);
        }

        return $report;
    }

    private function auditGaps($students): void
    {
        if (! class_exists(StudentDossierAuditLog::class) || ! Schema::hasTable('student_dossier_audit_logs')) {
            return;
        }

        foreach ($students->filter(fn ($s) => trim((string) $s->cin) === '')->take(15) as $s) {
            StudentDossierAuditLog::log(
                (int) $s->id,
                StudentDossierAuditLog::ACTION_DATA_EDITED,
                'tafem_quality',
                null,
                ['gap' => 'missing_cin'],
                'Écart TAFEM : CIN manquant'
            );
        }
    }
}

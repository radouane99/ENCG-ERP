<?php

namespace App\Services\Apogee;

use App\Domain\Deliberation\LmdRules;
use App\Models\AcademicYear;
use App\Models\Grade;

class ApogeeExportService
{
    public const ESTABLISHMENT_CODE = '040';

    /**
     * @return list<array<string, mixed>>
     */
    public function generateExportData(
        ?int $filiereId = null,
        ?int $semesterId = null,
        ?int $academicYearId = null,
        ?int $groupId = null,
        ?string $session = null
    ): array {
        $year = $academicYearId
            ? AcademicYear::find($academicYearId)
            : AcademicYear::where('is_current', true)->first();

        $yearLabel = $year ? ($year->label ?? $year->name ?? '2025/2026') : '2025/2026';

        $gradesQuery = Grade::with(['student.user', 'assessment.module.filiere']);

        if ($filiereId) {
            $gradesQuery->whereHas('assessment.module', fn ($q) => $q->where('filiere_id', $filiereId));
        }

        if ($semesterId) {
            $gradesQuery->whereHas('assessment.module', function ($q) use ($semesterId) {
                $q->where('semester_id', $semesterId)
                    ->orWhere('semester_number', $semesterId);
            });
        }

        if ($groupId) {
            $gradesQuery->whereHas('student.registrations', fn ($q) => $q->where('group_id', $groupId));
        }

        if ($session) {
            $isResit = in_array(strtolower($session), ['r', 'rattrapage', 'resit'], true);
            $gradesQuery->whereHas('assessment', function ($q) use ($isResit) {
                if ($isResit) {
                    $q->whereRaw('LOWER(type) in (?, ?, ?, ?)', ['rattrapage', 'r', 'resit', 'rat']);
                } else {
                    $q->whereRaw('LOWER(type) not in (?, ?, ?, ?)', ['rattrapage', 'r', 'resit', 'rat']);
                }
            });
        }

        $records = [];
        foreach ($gradesQuery->get() as $g) {
            $student = $g->student;
            $module = $g->assessment?->module;
            $val = (float) ($g->value ?? 0);
            $type = strtolower((string) $g->assessment?->type);
            $sessionCode = in_array($type, ['rattrapage', 'r', 'resit', 'rat'], true) ? 'R' : 'N';

            $records[] = [
                'COD_ETB' => self::ESTABLISHMENT_CODE,
                'COD_ANU' => $yearLabel,
                'COD_IND' => $student?->student_number ?? '',
                'COD_ETU' => $student?->cne ?? '',
                'COD_MAS' => $student?->massar_code ?? '',
                'COD_CIN' => $student?->cin ?? $student?->user?->cin ?? '',
                'NOM_ETU' => strtoupper((string) ($student?->user?->last_name ?? $student?->last_name ?? '')),
                'PRE_ETU' => ucfirst(strtolower((string) ($student?->user?->first_name ?? $student?->first_name ?? ''))),
                'COD_FIL' => $module?->filiere?->code ?? '',
                'COD_ELP' => $module?->code ?? '',
                'LIB_ELP' => $module?->name ?? '',
                'COD_SES' => $sessionCode,
                'NOT_ELP' => number_format($val, 2, '.', ''),
                'COD_BAR' => '20.00',
                'COD_TRE' => LmdRules::decisionFromScore($val),
                'DAT_CRE' => now()->format('Y-m-d H:i:s'),
            ];
        }

        return $records;
    }

    public function generateCsv(array $records): string
    {
        $headers = ['COD_ETB', 'COD_ANU', 'COD_IND', 'COD_ETU', 'COD_MAS', 'COD_CIN', 'NOM_ETU', 'PRE_ETU', 'COD_FIL', 'COD_ELP', 'LIB_ELP', 'COD_SES', 'NOT_ELP', 'COD_BAR', 'COD_TRE', 'DAT_CRE'];
        $output = fopen('php://temp', 'r+');
        fwrite($output, "\xEF\xBB\xBF");
        fputcsv($output, $headers, ';');

        foreach ($records as $r) {
            fputcsv($output, array_map(fn ($h) => $r[$h] ?? '', $headers), ';');
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        return $csvContent;
    }
}

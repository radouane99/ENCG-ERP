<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\Filiere;
use App\Models\Schedule;
use App\Models\Semester;
use Illuminate\Support\Collection;

/**
 * Matrice type PDF ENCG Fès : module → élément → intervenant × lundi–vendredi, cellule « G1: 14h30-16h30 ».
 */
class OfficialTimetableMatrixService
{
    public const DAYS = [
        1 => 'Lundi',
        2 => 'Mardi',
        3 => 'Mercredi',
        4 => 'Jeudi',
        5 => 'Vendredi',
    ];

    public function catalog(Collection $schedules, array $meta = []): array
    {
        $year = $meta['academic_year'] ?? AcademicYear::query()->where('is_current', true)->first();
        $grouped = $schedules->groupBy(function ($session) {
            $filiereId = (int) ($session->group?->filiere_id ?? 0);
            $semesterNumber = $this->sessionSemesterNumber($session);

            return $filiereId.'|'.$semesterNumber;
        });

        $sections = [];
        foreach ($grouped as $chunk) {
            $first = $chunk->first();
            $filiere = $first?->group?->filiere ?? $meta['filiere'] ?? null;
            $sections[] = $this->fromSchedules($chunk, array_merge($meta, [
                'filiere' => $filiere,
                'semester_number' => $this->sessionSemesterNumber($first),
                'academic_year' => $year,
            ]));
        }

        usort($sections, function (array $a, array $b) {
            return [$a['filiere_code'] ?? '', $a['semester_number'] ?? 0] <=> [$b['filiere_code'] ?? '', $b['semester_number'] ?? 0];
        });

        return [
            'days' => self::DAYS,
            'academic_year' => $year?->label ?? (($year?->start_year ?? now()->year).'-'.($year?->end_year ?? now()->year + 1)),
            'sections' => $sections,
            'section_count' => count($sections),
        ];
    }

    public function fromSchedules(Collection $schedules, array $meta = []): array
    {
        $filiere = $meta['filiere'] ?? $schedules->first()?->group?->filiere;
        $year = $meta['academic_year'] ?? AcademicYear::query()->where('is_current', true)->first();
        $semesterNumber = (int) ($meta['semester_number'] ?? $this->sessionSemesterNumber($schedules->first()) ?: ($meta['semester']?->number ?? 1));
        if ($semesterNumber < 1) {
            $semesterNumber = 1;
        }

        $palette = ['#1e3a8a', '#b45309', '#047857', '#7c3aed', '#be123c', '#0f766e', '#1d4ed8'];
        $moduleOrder = [];
        $rowsByKey = [];

        foreach ($schedules as $session) {
            if ((int) $session->day_of_week < 1 || (int) $session->day_of_week > 5) {
                continue;
            }

            $module = $session->module;
            $moduleName = $module?->name ?? 'Module';
            $elementName = $module?->name ?? 'Élément';
            $professorId = (int) $session->professor_id;
            $sessionType = strtolower((string) $session->session_type);
            $key = $module?->id.'|'.$professorId.'|'.$sessionType;

            if (! isset($moduleOrder[$module?->id ?? 0])) {
                $moduleOrder[$module?->id ?? 0] = count($moduleOrder) + 1;
            }

            if (! isset($rowsByKey[$key])) {
                $profName = trim(($session->professor?->user?->first_name ?? '').' '.($session->professor?->user?->last_name ?? ''));
                if ($profName === '') {
                    $profName = 'Intervenant';
                }
                if ($sessionType === 'td') {
                    $profName .= ' (TD)';
                } elseif ($sessionType === 'tp') {
                    $profName .= ' (TP)';
                }

                $rowsByKey[$key] = [
                    'module_index' => $moduleOrder[$module?->id ?? 0],
                    'module_name' => $moduleName,
                    'element_name' => $elementName,
                    'professor_id' => $professorId,
                    'professor_name' => $profName,
                    'color' => $palette[$professorId % count($palette)],
                    'session_type' => $sessionType,
                    'days' => [1 => [], 2 => [], 3 => [], 4 => [], 5 => []],
                    'rooms' => [],
                ];
            }

            $day = (int) $session->day_of_week;
            $groupLabel = $this->groupShort($session->group?->name);
            $slot = $groupLabel.': '.$this->frenchRange($session->start_time, $session->end_time);
            if (! in_array($slot, $rowsByKey[$key]['days'][$day], true)) {
                $rowsByKey[$key]['days'][$day][] = $slot;
            }
            $room = $session->room?->name ?? $session->room?->code;
            if ($room && ! in_array($room, $rowsByKey[$key]['rooms'], true)) {
                $rowsByKey[$key]['rooms'][] = $room;
            }
        }

        $rows = array_values($rowsByKey);
        usort($rows, function (array $a, array $b) {
            return [$a['module_index'], $a['professor_name']] <=> [$b['module_index'], $b['professor_name']];
        });

        $rowspan = [];
        foreach ($rows as $index => $row) {
            $code = $row['module_index'].'-'.$row['module_name'];
            $rowspan[$code] = ($rowspan[$code] ?? 0) + 1;
            $rows[$index]['module_label'] = $row['module_index'].'-'.$row['module_name'];
            $rows[$index]['room_label'] = implode(' / ', $row['rooms']);
            $rows[$index]['show_module'] = false;
        }
        $seen = [];
        foreach ($rows as $index => $row) {
            $code = $row['module_label'];
            if (! isset($seen[$code])) {
                $rows[$index]['show_module'] = true;
                $rows[$index]['module_rowspan'] = $rowspan[$code];
                $seen[$code] = true;
            } else {
                $rows[$index]['module_rowspan'] = 0;
            }
        }

        $track = $this->trackLabel($filiere, $semesterNumber);
        $semester = $meta['semester'] ?? null;

        return [
            'title' => 'EMPLOI DU TEMPS S'.$semesterNumber,
            'academic_year' => $year?->label ?? (($year?->start_year ?? now()->year).'-'.($year?->end_year ?? now()->year + 1)),
            'filiere_name' => $filiere?->name ?? '',
            'filiere_code' => $filiere?->code ?? '',
            'filiere_id' => $filiere?->id,
            'semester_number' => $semesterNumber,
            'semester_label' => $track,
            'days' => self::DAYS,
            'rows' => $rows,
            'footer' => [
                'cours' => $semester?->start_date?->format('d/m/Y'),
                'td_tp' => $semester?->start_date?->copy()->addWeeks(3)->format('d/m/Y'),
                'school' => 'ENCG-FES',
            ],
        ];
    }

    private function sessionSemesterNumber(?object $session): int
    {
        if (! $session) {
            return 0;
        }

        return (int) ($session->group?->semester_number
            ?? $session->module?->semester_number
            ?? $session->semester?->number
            ?? 0);
    }

    public function groupShort(?string $name): string
    {
        if ($name && preg_match('/G(?:roupe)?\s*[.\-_]?\s*(\d+(?:\.\d+)?)/i', $name, $match)) {
            return 'G'.$match[1];
        }

        return $name ? trim($name) : 'G?';
    }

    public function frenchRange(mixed $start, mixed $end): string
    {
        return $this->frenchTime($start).'-'.$this->frenchTime($end);
    }

    private function frenchTime(mixed $time): string
    {
        $raw = is_string($time) ? $time : (string) $time;
        $hh = substr($raw, 0, 2);
        $mm = substr($raw, 3, 2);

        return $hh.'h'.$mm;
    }

    private function trackLabel(?Filiere $filiere, int $semesterNumber): string
    {
        $code = strtoupper((string) ($filiere?->code ?? ''));
        $name = strtoupper((string) ($filiere?->name ?? ''));
        $isPrep = str_contains($code, 'TC')
            || str_contains($code, 'TRONC')
            || str_contains($name, 'TRONC COMMUN');

        if ($isPrep) {
            return 'S'.$semesterNumber.' AP';
        }

        return 'S'.$semesterNumber.($code !== '' ? ' '.$code : '');
    }
}

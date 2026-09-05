<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\Filiere;
use Illuminate\Support\Collection;

/**
 * Matrice type PDF officiel ENCG Fès :
 *   module → élément → intervenant × lundi–vendredi
 *   Cellule : « G1: 08h30-12h30 » (CM) ou « G1.1: 14h30-16h00 » (TD)
 *
 * Règles pédagogiques alignées sur le format ENCG USMBA :
 *  - CM  : session longue (3h30-4h), en AMPHI, 1 prof/groupe, label groupe affiché
 *  - TD  : session courte (1h30-2h), en salle, split en sous-groupes (G1.1, G1.2…)
 *  - TP  : idem TD
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

    // -------------------------------------------------------------------------
    // Catalog (multi-filière / multi-semestre)
    // -------------------------------------------------------------------------

    public function catalog(Collection $schedules, array $meta = []): array
    {
        $year = $meta['academic_year'] ?? AcademicYear::query()->where('is_current', true)->first();

        $grouped = $schedules->groupBy(function ($session) {
            $filiereId      = (int) ($session->group?->filiere_id ?? 0);
            $semesterNumber = $this->sessionSemesterNumber($session);

            return $filiereId . '|' . $semesterNumber;
        });

        $sections = [];
        foreach ($grouped as $chunk) {
            $first   = $chunk->first();
            $filiere = $first?->group?->filiere ?? $meta['filiere'] ?? null;
            $sections[] = $this->fromSchedules($chunk, array_merge($meta, [
                'filiere'         => $filiere,
                'semester_number' => $this->sessionSemesterNumber($first),
                'academic_year'   => $year,
            ]));
        }

        usort($sections, fn (array $a, array $b) =>
            [$a['filiere_code'] ?? '', $a['semester_number'] ?? 0]
            <=>
            [$b['filiere_code'] ?? '', $b['semester_number'] ?? 0]
        );

        $firstSection = $sections[0] ?? null;
        $coursStart   = $meta['cours_start'] ?? ($firstSection['footer']['cours_start'] ?? '16/09/2024');
        $tdTpStart    = $meta['td_tp_start'] ?? ($firstSection['footer']['td_tp_start'] ?? '07/10/2024');

        return [
            'days'          => self::DAYS,
            'academic_year' => $year?->label ?? (($year?->start_year ?? now()->year) . '-' . ($year?->end_year ?? now()->year + 1)),
            'cours_start'   => $coursStart,
            'td_tp_start'   => $tdTpStart,
            'sections'      => $sections,
            'section_count' => count($sections),
        ];
    }

    // -------------------------------------------------------------------------
    // Build one section (one filière × one semester)
    // -------------------------------------------------------------------------

    public function fromSchedules(Collection $schedules, array $meta = []): array
    {
        $filiere        = $meta['filiere'] ?? $schedules->first()?->group?->filiere;
        $year           = $meta['academic_year'] ?? AcademicYear::query()->where('is_current', true)->first();
        $semesterNumber = (int) ($meta['semester_number'] ?? $this->sessionSemesterNumber($schedules->first()) ?: ($meta['semester']?->number ?? 1));
        if ($semesterNumber < 1) {
            $semesterNumber = 1;
        }

        $palette         = ['#1e3a8a', '#b45309', '#047857', '#7c3aed', '#be123c', '#0f766e', '#1d4ed8'];
        $moduleOrder     = [];
        $rowsByKey       = [];
        $groupSubCounter = [];

        foreach ($schedules as $session) {
            if ((int) $session->day_of_week < 1 || (int) $session->day_of_week > 5) {
                continue;
            }

            $module      = $session->module;
            $sessionType = strtolower((string) $session->session_type);
            $moduleName  = $module?->name ?? 'Module';
            $elementName = $this->elementLabel($moduleName, $sessionType);
            $professorId = (int) $session->professor_id;

            /*
             * Format officiel ENCG :
             *  - CM  : 1 ligne par (module × professeur) — chaque prof a son groupe en CM
             *  - TD  : 1 ligne par (module × professeur) — TD en sous-groupes (G1.1, G1.2, G2.1, G2.2)
             *  - TP  : idem TD
             * La clé inclut TOUJOURS le professor_id pour séparer les intervenants.
             */
            $key = ($module?->id ?? 0) . '|' . $professorId . '|' . $sessionType;

            if (! isset($moduleOrder[$module?->id ?? 0])) {
                $moduleOrder[$module?->id ?? 0] = count($moduleOrder) + 1;
            }

            if (! isset($rowsByKey[$key])) {
                $profName = trim(
                    ($session->professor?->user?->first_name ?? '') . ' ' .
                    ($session->professor?->user?->last_name  ?? '')
                );
                if ($profName === '') {
                    $profName = 'Intervenant';
                }

                // Suffixe (TD) / (TP) uniquement pour TD et TP
                if ($sessionType === 'td') {
                    $profName .= ' (TD)';
                } elseif ($sessionType === 'tp') {
                    $profName .= ' (TP)';
                }

                $rowsByKey[$key] = [
                    'module_index'   => $moduleOrder[$module?->id ?? 0],
                    'module_name'    => $moduleName,
                    'element_name'   => $elementName,
                    'professor_id'   => $professorId,
                    'professor_name' => $profName,
                    'color'          => $palette[$professorId % count($palette)],
                    'session_type'   => $sessionType,
                    'days'           => [1 => [], 2 => [], 3 => [], 4 => [], 5 => []],
                    'rooms'          => [],
                ];
            }

            // ---- Créneau horaire ----
            // CM : Affichage au niveau Section (ex: « G1: 08h30-10h15 »)
            // TD / TP : Affichage obligatoire au niveau Sous-Groupe ENCG (ex: « G1.1: 08h30-10h15 » ou « G1.2 », « G2.1 », « G2.2 »)
            $day        = (int) $session->day_of_week;
            $groupLabel = $this->formatSessionGroupLabel($session, $sessionType, $groupSubCounter);
            $slot       = $groupLabel . ': ' . $this->frenchRange($session->start_time, $session->end_time);

            if (! in_array($slot, $rowsByKey[$key]['days'][$day], true)) {
                $rowsByKey[$key]['days'][$day][] = $slot;
            }

            // ---- Salle ----
            // CM : une seule salle (AMPHI) — on garde uniquement la première rencontrée
            // TD/TP : on accumule (plusieurs sous-groupes peuvent être dans des salles différentes)
            $room = $session->room?->name ?? $session->room?->code;
            if ($room) {
                if ($sessionType === 'cm') {
                    if (empty($rowsByKey[$key]['rooms'])) {
                        $rowsByKey[$key]['rooms'][] = $room;
                    }
                } else {
                    if (! in_array($room, $rowsByKey[$key]['rooms'], true)) {
                        $rowsByKey[$key]['rooms'][] = $room;
                    }
                }
            }
        }

        // ---- Tri des lignes ----
        $rows = array_values($rowsByKey);
        usort($rows, fn (array $a, array $b) =>
            [$a['module_index'], $a['session_type'] === 'cm' ? 0 : 1, $a['professor_name']]
            <=>
            [$b['module_index'], $b['session_type'] === 'cm' ? 0 : 1, $b['professor_name']]
        );

        // ---- Rowspan du module ----
        $rowspan = [];
        foreach ($rows as $index => $row) {
            $code              = $row['module_index'] . '-' . $row['module_name'];
            $rowspan[$code]    = ($rowspan[$code] ?? 0) + 1;
            $rows[$index]['module_label'] = $code;
            $rows[$index]['room_label']   = implode(' / ', $row['rooms']);
            $rows[$index]['show_module']  = false;
        }
        $seen = [];
        foreach ($rows as $index => $row) {
            $code = $row['module_label'];
            if (! isset($seen[$code])) {
                $rows[$index]['show_module']     = true;
                $rows[$index]['module_rowspan']  = $rowspan[$code];
                $seen[$code]                     = true;
            } else {
                $rows[$index]['module_rowspan'] = 0;
            }
        }

        $track    = $this->trackLabel($filiere, $semesterNumber);
        $semester = $meta['semester']
            ?? ($schedules->first()?->relationLoaded('semester') ? $schedules->first()->semester : null)
            ?? ($year ? \App\Models\Semester::where('academic_year_id', $year->id)->where('is_current', true)->first() : null);

        // Dates officielles configurables (format ENCG Fès)
        $coursStart  = $meta['cours_start']
            ?? $semester?->start_date?->format('d/m/Y')
            ?? '16/09/2024';

        $tdStartDate = $meta['td_tp_start']
            ?? ($semester?->start_date ? $semester->start_date->copy()->addWeeks(3)->format('d/m/Y') : '07/10/2024');

        return [
            'title'           => 'EMPLOI DU TEMPS S' . $semesterNumber,
            'academic_year'   => $year?->label ?? (($year?->start_year ?? now()->year) . '-' . ($year?->end_year ?? now()->year + 1)),
            'filiere_name'    => $filiere?->name ?? '',
            'filiere_code'    => $filiere?->code ?? '',
            'filiere_id'      => $filiere?->id,
            'semester_number' => $semesterNumber,
            'semester_label'  => $track,
            'days'            => self::DAYS,
            'rows'            => $rows,
            'footer'          => [
                'cours_start'  => $coursStart,           // Démarrage des cours
                'td_tp_start'  => $tdStartDate,          // Démarrage des TD/TP
                'cours'        => $coursStart,
                'td_tp'        => $tdStartDate,
                'school'       => 'ENCG-FES',
            ],
        ];
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function sessionSemesterNumber(?object $session): int
    {
        if (! $session) {
            return 0;
        }

        return (int) (
            $session->group?->semester_number
            ?? $session->module?->semester_number
            ?? $session->semester?->number
            ?? 0
        );
    }

    /**
     * Colonne « Éléments de modules » : type (CM / TD / TP) + intitulé du module.
     */
    private function elementLabel(string $moduleName, string $sessionType): string
    {
        $type = match ($sessionType) {
            'cm'    => 'CM',
            'td'    => 'TD',
            'tp'    => 'TP',
            default => $sessionType !== '' ? strtoupper($sessionType) : null,
        };

        return $type ? ($type . ' ' . $moduleName) : ($moduleName === 'Module' ? 'Élément' : $moduleName);
    }

    /**
     * Raccourcit et formate le label du groupe ou sous-groupe selon le type de séance :
     *  - CM : G1, G2 (section entière)
     *  - TD / TP : G1.1, G1.2, G2.1, G2.2 (sous-groupes obligatoires conformes à la norme ENCG)
     */
    public function formatSessionGroupLabel($session, string $sessionType, array &$groupSubCounter = []): string
    {
        $rawName = is_string($session) ? $session : ($session->group?->name ?? '');

        // 1. Attribut explicite sub_group sur le schedule s'il existe
        $explicitSub = is_object($session) ? ($session->sub_group ?? $session->subgroup ?? null) : null;
        if ($explicitSub) {
            $cleaned = trim((string) $explicitSub);
            if (preg_match('/G?(\d+(?:\.\d+)?)/i', $cleaned, $m)) {
                return 'G' . $m[1];
            }

            return $cleaned;
        }

        // 2. Extraire le numéro de groupe de base et sous-groupe éventuel
        // Formats reconnus : "G1.1", "TC-S1-G1.2", "G1-1", "G1_2", "G1A", "G1-B", "Groupe 2.1"
        $baseGroupNum = null;
        $subNum = null;

        if (preg_match('/G(?:roupe)?\s*[.\-_]?\s*(\d+)(?:[.\-_](\d+)|([A-Za-z]))?/i', $rawName, $m)) {
            $baseGroupNum = $m[1];
            if (! empty($m[2])) {
                $subNum = $m[2];
            } elseif (! empty($m[3])) {
                $letter = strtoupper($m[3]);
                $subNum = in_array($letter, ['B', '2']) ? '2' : '1';
            }
        }

        if (! $baseGroupNum) {
            return $this->groupShort($rawName);
        }

        // Séance CM : Niveau Section (G1, G2)
        if ($sessionType === 'cm') {
            return 'G' . $baseGroupNum;
        }

        // Séance TD / TP : Niveau Sous-Groupe obligatoire (G1.1, G1.2, G2.1, G2.2)
        if ($sessionType === 'td' || $sessionType === 'tp') {
            if ($subNum !== null) {
                return 'G' . $baseGroupNum . '.' . $subNum;
            }

            // Si le groupe est seulement G1 ou G2 en base :
            // Alterner automatiquement G1.1 et G1.2 pour chaque séance TD du module
            $modId = is_object($session) ? ($session->module_id ?? 0) : 0;
            $counterKey = $modId . '|' . $baseGroupNum;
            if (! isset($groupSubCounter[$counterKey])) {
                $groupSubCounter[$counterKey] = 1;
            } else {
                $groupSubCounter[$counterKey]++;
            }

            $assignedSub = ($groupSubCounter[$counterKey] % 2 === 1) ? '1' : '2';

            return 'G' . $baseGroupNum . '.' . $assignedSub;
        }

        return 'G' . $baseGroupNum;
    }

    /**
     * Raccourcit le nom du groupe/sous-groupe pour l'affichage dans les cellules.
     * Exemples : "GFC-S5-G1" → "G1", "Groupe 1.2" → "G1.2", "MCM-S5-G2.1" → "G2.1"
     */
    public function groupShort(?string $name): string
    {
        if ($name && preg_match('/G(?:roupe)?\s*[.\-_]?\s*(\d+(?:[.\-_]\d+)?)/i', $name, $match)) {
            $cleaned = str_replace(['-', '_'], '.', $match[1]);

            return 'G' . $cleaned;
        }

        return $name ? trim($name) : 'G?';
    }

    public function frenchRange(mixed $start, mixed $end): string
    {
        return $this->frenchTime($start) . '-' . $this->frenchTime($end);
    }

    private function frenchTime(mixed $time): string
    {
        $raw = is_string($time) ? $time : (string) $time;
        $hh  = substr($raw, 0, 2);
        $mm  = substr($raw, 3, 2);

        return $hh . 'h' . $mm;
    }

    private function trackLabel(?Filiere $filiere, int $semesterNumber): string
    {
        $code   = strtoupper((string) ($filiere?->code ?? ''));
        $name   = strtoupper((string) ($filiere?->name ?? ''));
        $isPrep = str_contains($code, 'TC')
            || str_contains($code, 'TRONC')
            || str_contains($name, 'TRONC COMMUN');

        return 'S' . $semesterNumber . ($isPrep ? ' AP' : ($code !== '' ? ' ' . $code : ''));
    }
}

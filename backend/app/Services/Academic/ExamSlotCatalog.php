<?php

namespace App\Services\Academic;

use Carbon\Carbon;

/**
 * Créneaux officiels des épreuves ENCG Fès :
 * 2h pour le 1er créneau de chaque demi-journée, 1h30 pour le 2e,
 * avec 15 min de pause entre deux épreuves consécutives.
 *
 * Matin      : 08:30–10:30  |  pause 15 min  |  10:45–12:15
 * Après-midi : 14:30–16:30  |  pause 15 min  |  16:45–18:15
 */
class ExamSlotCatalog
{
    public const BREAK_MINUTES = 15;

    public const DEFAULT_DURATION = 120;

    /** @var array<string, int> Anciens débuts sans pause → index dans SLOTS */
    private const LEGACY_START_ALIASES = [
        '10:30' => 1,
        '16:30' => 3,
    ];

    /** @var array<int, array{start: string, end: string, duration: int, label: string}> */
    public const SLOTS = [
        ['start' => '08:30', 'end' => '10:30', 'duration' => 120, 'label' => 'Matin 1'],
        ['start' => '10:45', 'end' => '12:15', 'duration' => 90, 'label' => 'Matin 2'],
        ['start' => '14:30', 'end' => '16:30', 'duration' => 120, 'label' => 'Après-midi 1'],
        ['start' => '16:45', 'end' => '18:15', 'duration' => 90, 'label' => 'Après-midi 2'],
    ];

    /**
     * @return array{start: string, end: string, duration: int, label: string}
     */
    public static function resolve(?string $startTime): array
    {
        $normalized = self::normalize($startTime);

        foreach (self::SLOTS as $slot) {
            if ($slot['start'] === $normalized) {
                return $slot;
            }
        }

        // Ancien planning : 2e épreuve collée à la fin de la 1re (sans pause 15 min)
        if (isset(self::LEGACY_START_ALIASES[$normalized])) {
            return self::SLOTS[self::LEGACY_START_ALIASES[$normalized]];
        }

        // Si l'heure = fin d'un créneau → créneau suivant (avec pause)
        foreach (self::SLOTS as $index => $slot) {
            if ($slot['end'] === $normalized && isset(self::SLOTS[$index + 1])) {
                return self::SLOTS[$index + 1];
            }
        }

        $start = $normalized ?: '08:30';

        return [
            'start' => $start,
            'end' => Carbon::parse($start)->addMinutes(self::DEFAULT_DURATION)->format('H:i'),
            'duration' => self::DEFAULT_DURATION,
            'label' => 'Personnalisé',
        ];
    }

    /** Heure de début officielle (avec pause respectée). */
    public static function canonicalStartTime(?string $startTime): string
    {
        return self::resolve($startTime)['start'];
    }

    /** Normalise start_time + duration pour persistance en base. */
    public static function normalizeForStorage(?string $startTime): array
    {
        $slot = self::resolve($startTime);

        return [
            'start_time' => $slot['start'].':00',
            'duration_minutes' => $slot['duration'],
        ];
    }

    public static function formattedRange(?string $startTime): string
    {
        $slot = self::resolve($startTime);

        return "{$slot['start']} - {$slot['end']}";
    }

    public static function durationMinutes(?string $startTime): int
    {
        return self::resolve($startTime)['duration'];
    }

    public static function endTime(?string $startTime): string
    {
        return self::resolve($startTime)['end'];
    }

    /** Début du 2e créneau matin (après pause de 15 min). */
    public static function morningSecondStart(): string
    {
        return self::SLOTS[1]['start'];
    }

    /** Début du 2e créneau après-midi (après pause de 15 min). */
    public static function afternoonSecondStart(): string
    {
        return self::SLOTS[3]['start'];
    }

    private static function normalize(?string $time): string
    {
        $raw = trim((string) $time);
        if ($raw === '') {
            return '';
        }

        return substr($raw, 0, 5);
    }
}

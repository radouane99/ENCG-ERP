<?php
namespace App\Services\Academic;
use App\Models\{Professor, ProfessorAvailability};

final class ProfessorAvailabilityService
{
    public static function map(?int $year = null): array
    {
        $users = Professor::pluck('id', 'user_id'); $map = [];
        $rows = ProfessorAvailability::where('academic_year_id', $year ?? AcademicContext::yearId())->get();
        foreach ($rows as $row) {
            $id = $users[$row->professor_id] ?? null; if (! $id) continue;
            if ($row->day_of_week !== null && $row->start_time && $row->end_time) {
                $map[$id][] = ['day' => (int) $row->day_of_week, 'start' => $row->start_time->format('H:i:s'), 'end' => $row->end_time->format('H:i:s'), 'available' => (bool) $row->is_available];
            }
            foreach ($row->availability_data ?? [] as $day => $slots) {
                $number = array_search($day, ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'], true);
                if ($number === false) continue;
                foreach (['matin' => ['00:00:00', '13:00:00'], 'apresMidi' => ['13:00:00', '23:59:59']] as $half => $hours) {
                    if (array_key_exists($half, $slots) && ! $slots[$half]) $map[$id][] = ['day' => $number + 1, 'start' => $hours[0], 'end' => $hours[1], 'available' => false];
                }
            }
        }
        return $map;
    }
    public static function allows(array $map, int $profile, int $day, string $start, string $end): bool
    {
        $positive = false; $inside = false;
        foreach ($map[$profile] ?? [] as $r) {
            if ($r['day'] !== $day) continue;
            if (! $r['available'] && $start < $r['end'] && $end > $r['start']) return false;
            if ($r['available']) { $positive = true; $inside = $inside || ($start >= $r['start'] && $end <= $r['end']); }
        }
        return ! $positive || $inside;
    }
}

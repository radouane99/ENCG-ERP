<?php

namespace App\Services;

use App\Models\Student;
use App\Models\Schedule;
use App\Models\ScheduleChange;
use App\Models\ExamSeating;
use App\Models\ExamSurveillance;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CalendarService
{
    /**
     * Get a unified list of events for a student.
     */
    public function getStudentEvents(int $studentId, Carbon $startDate, Carbon $endDate): array
    {
        $events = [];
        $student = Student::with(['registrations' => function($query) {
            $query->where('status', 'admin_validated')->latest();
        }])->findOrFail($studentId);

        $registration = $student->registrations->first();
        if (!$registration || !$registration->group_id) {
            return $events; // No active group
        }

        $groupId = $registration->group_id;

        // 1. Fetch recurring schedules
        $schedules = Schedule::with(['module', 'room'])
            ->where('group_id', $groupId)
            ->where('is_active', true)
            ->get();

        // 2. Fetch schedule changes (cancellations/makeups) for these schedules
        $scheduleIds = $schedules->pluck('id')->toArray();
        $changes = ScheduleChange::whereIn('schedule_id', $scheduleIds)
            ->whereBetween('original_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get()
            ->groupBy('schedule_id');

        // Loop through days in the requested window
        $currentDate = $startDate->copy();
        while ($currentDate->lte($endDate)) {
            $dayOfWeek = $currentDate->dayOfWeekIso; // 1=Mon, 7=Sun

            foreach ($schedules as $schedule) {
                if ($schedule->day_of_week === $dayOfWeek) {
                    $dateStr = $currentDate->toDateString();
                    
                    // Check for changes (cancellation)
                    $isCancelled = false;
                    if ($changes->has($schedule->id)) {
                        $dayChanges = $changes->get($schedule->id)->where('original_date', $dateStr);
                        foreach ($dayChanges as $change) {
                            if (in_array($change->type, ['cancellation', 'rescheduled'])) {
                                $isCancelled = true;
                                break;
                            }
                        }
                    }

                    if (!$isCancelled) {
                        $events[] = [
                            'id' => 'schedule_' . $schedule->id . '_' . $dateStr,
                            'title' => $schedule->module->name ?? 'Class',
                            'start' => $dateStr . 'T' . $schedule->start_time,
                            'end' => $dateStr . 'T' . $schedule->end_time,
                            'extendedProps' => [
                                'type' => 'class',
                                'session_type' => $schedule->session_type,
                                'room' => $schedule->room->name ?? 'TBA',
                                'professor_id' => $schedule->professor_id,
                            ],
                            'backgroundColor' => $this->getColorForSessionType($schedule->session_type),
                        ];
                    }
                }
            }
            $currentDate->addDay();
        }

        // 3. Add Makeup classes (where new_date is in range)
        $makeupChanges = ScheduleChange::whereIn('schedule_id', $scheduleIds)
            ->where('type', 'makeup')
            ->whereBetween('new_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->with('schedule.module', 'newRoom')
            ->get();

        foreach ($makeupChanges as $makeup) {
            $events[] = [
                'id' => 'makeup_' . $makeup->id,
                'title' => '[Rattrapage] ' . ($makeup->schedule->module->name ?? 'Class'),
                'start' => $makeup->new_date . 'T' . $makeup->new_start_time,
                'end' => $makeup->new_date . 'T' . $makeup->new_end_time,
                'extendedProps' => [
                    'type' => 'makeup',
                    'session_type' => $makeup->schedule->session_type ?? 'cm',
                    'room' => $makeup->newRoom->name ?? 'TBA',
                ],
                'backgroundColor' => '#f59e0b', // Amber
            ];
        }

        // 4. Fetch Exams
        $examSeatings = ExamSeating::with(['exam.module', 'room'])
            ->where('student_id', $studentId)
            ->whereHas('exam', function($query) use ($startDate, $endDate) {
                $query->whereBetween('exam_date', [$startDate->toDateString(), $endDate->toDateString()]);
            })
            ->get();

        foreach ($examSeatings as $seating) {
            $exam = $seating->exam;
            $startDateTime = Carbon::parse($exam->exam_date . ' ' . $exam->start_time);
            $endDateTime = $startDateTime->copy()->addMinutes($exam->duration_minutes);

            $events[] = [
                'id' => 'exam_' . $exam->id,
                'title' => '[EXAM] ' . ($exam->module->name ?? 'Exam'),
                'start' => $startDateTime->toIso8601String(),
                'end' => $endDateTime->toIso8601String(),
                'extendedProps' => [
                    'type' => 'exam',
                    'exam_type' => $exam->type,
                    'room' => $seating->room->name ?? 'TBA',
                    'seat_number' => $seating->seat_number,
                ],
                'backgroundColor' => '#ef4444', // Red
            ];
        }

        return $events;
    }

    /**
     * Get a unified list of events for a professor.
     */
    public function getProfessorEvents(int $professorId, Carbon $startDate, Carbon $endDate): array
    {
        $events = [];
        
        // 1. Fetch recurring schedules for professor
        $schedules = Schedule::with(['module', 'room', 'group'])
            ->where('professor_id', $professorId)
            // ->where('professor_type', 'App\Models\Professor') // Ignoring polymorphic to be safe if it's just 'professor'
            ->where('is_active', true)
            ->get();

        $scheduleIds = $schedules->pluck('id')->toArray();
        $changes = ScheduleChange::whereIn('schedule_id', $scheduleIds)
            ->whereBetween('original_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get()
            ->groupBy('schedule_id');

        $currentDate = $startDate->copy();
        while ($currentDate->lte($endDate)) {
            $dayOfWeek = $currentDate->dayOfWeekIso;

            foreach ($schedules as $schedule) {
                if ($schedule->day_of_week === $dayOfWeek) {
                    $dateStr = $currentDate->toDateString();
                    
                    $isCancelled = false;
                    if ($changes->has($schedule->id)) {
                        $dayChanges = $changes->get($schedule->id)->where('original_date', $dateStr);
                        foreach ($dayChanges as $change) {
                            if ($change->type === 'cancellation') {
                                $isCancelled = true;
                                break;
                            }
                        }
                    }

                    if (!$isCancelled) {
                        $groupName = $schedule->group->name ?? '';
                        $events[] = [
                            'id' => 'schedule_' . $schedule->id . '_' . $dateStr,
                            'title' => ($schedule->module->name ?? 'Class') . ' - ' . $groupName,
                            'start' => $dateStr . 'T' . $schedule->start_time,
                            'end' => $dateStr . 'T' . $schedule->end_time,
                            'extendedProps' => [
                                'type' => 'class',
                                'session_type' => $schedule->session_type,
                                'room' => $schedule->room->name ?? 'TBA',
                            ],
                            'backgroundColor' => $this->getColorForSessionType($schedule->session_type),
                        ];
                    }
                }
            }
            $currentDate->addDay();
        }

        // 3. Add Makeup classes
        $makeupChanges = ScheduleChange::whereIn('schedule_id', $scheduleIds)
            ->where('type', 'makeup')
            ->whereBetween('new_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->with('schedule.module', 'newRoom')
            ->get();

        foreach ($makeupChanges as $makeup) {
            $events[] = [
                'id' => 'makeup_' . $makeup->id,
                'title' => '[Rattrapage] ' . ($makeup->schedule->module->name ?? 'Class'),
                'start' => $makeup->new_date . 'T' . $makeup->new_start_time,
                'end' => $makeup->new_date . 'T' . $makeup->new_end_time,
                'extendedProps' => [
                    'type' => 'makeup',
                    'session_type' => $makeup->schedule->session_type ?? 'cm',
                    'room' => $makeup->newRoom->name ?? 'TBA',
                ],
                'backgroundColor' => '#f59e0b',
            ];
        }

        // 4. Fetch Exam Surveillances
        $surveillances = ExamSurveillance::with(['exam.module', 'room'])
            ->whereHas('exam', function($query) use ($startDate, $endDate) {
                $query->whereBetween('exam_date', [$startDate->toDateString(), $endDate->toDateString()]);
            })
            // Since exam_surveillances binds professor_id to User table, check logic:
            ->where('professor_id', $professorId)
            ->get();

        foreach ($surveillances as $surveillance) {
            $exam = $surveillance->exam;
            $startDateTime = Carbon::parse($exam->exam_date . ' ' . $exam->start_time);
            $endDateTime = $startDateTime->copy()->addMinutes($exam->duration_minutes);

            $events[] = [
                'id' => 'surveillance_' . $surveillance->id,
                'title' => '[SURVEILLANCE] ' . ($exam->module->name ?? 'Exam'),
                'start' => $startDateTime->toIso8601String(),
                'end' => $endDateTime->toIso8601String(),
                'extendedProps' => [
                    'type' => 'surveillance',
                    'role' => $surveillance->role,
                    'room' => $surveillance->room->name ?? 'TBA',
                ],
                'backgroundColor' => '#8b5cf6', // Violet
            ];
        }

        return $events;
    }

    private function getColorForSessionType(string $type): string
    {
        return match (strtolower($type)) {
            'cm' => '#3b82f6', // Blue
            'td' => '#10b981', // Green
            'tp' => '#06b6d4', // Cyan
            default => '#64748b', // Slate
        };
    }
}

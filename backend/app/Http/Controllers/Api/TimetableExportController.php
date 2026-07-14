<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TimetableExportController extends Controller
{
    /**
     * Export timetable data formatted for FullCalendar.
     */
    public function exportForFullCalendar(Request $request, $type, $id): JsonResponse
    {
        $schedules = $this->fetchSchedules($type, $id);
        $events = [];
        $startDate = now()->startOfWeek();

        foreach ($schedules as $session) {
            // Map day_of_week (1 = Monday) to current week
            $dayOffset = $session->day_of_week - 1;
            
            $events[] = [
                'id' => $session->id,
                'title' => $session->module_name,
                'start' => $startDate->copy()->addDays($dayOffset)->setTimeFromTimeString($session->start_time)->toIso8601String(),
                'end' => $startDate->copy()->addDays($dayOffset)->setTimeFromTimeString($session->end_time)->toIso8601String(),
                'extendedProps' => [
                    'professor' => $session->prof_name,
                    'room' => $session->room_name,
                    'type' => $session->session_type,
                    'group' => $session->group_name ?? 'N/A',
                ],
                'backgroundColor' => '#3b82f6',
                'borderColor' => '#2563eb',
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $events
        ]);
    }

    public function exportPdf(Request $request, $type, $id)
    {
        $schedules = $this->fetchSchedules($type, $id);
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.timetable', ['schedules' => $schedules]);
        return $pdf->download("emploi_du_temps_{$type}_{$id}.pdf");
    }

    public function exportIcs(Request $request, $type, $id)
    {
        $schedules = $this->fetchSchedules($type, $id);
        $startDate = now()->startOfWeek();
        
        $ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ENCG ERP//Timetable//FR\nCALSCALE:GREGORIAN\n";

        foreach ($schedules as $session) {
            $dayOffset = $session->day_of_week - 1;
            $dtStart = $startDate->copy()->addDays($dayOffset)->setTimeFromTimeString($session->start_time)->format('Ymd\THis\Z');
            $dtEnd = $startDate->copy()->addDays($dayOffset)->setTimeFromTimeString($session->end_time)->format('Ymd\THis\Z');
            
            $ics .= "BEGIN:VEVENT\n";
            $ics .= "UID:session-{$session->id}@encg-erp.com\n";
            $ics .= "DTSTAMP:" . now()->format('Ymd\THis\Z') . "\n";
            $ics .= "DTSTART:{$dtStart}\n";
            $ics .= "DTEND:{$dtEnd}\n";
            $ics .= "SUMMARY:{$session->module_name}\n";
            $ics .= "LOCATION:{$session->room_name}\n";
            $ics .= "DESCRIPTION:Prof: {$session->prof_name}\n";
            $ics .= "END:VEVENT\n";
        }
        $ics .= "END:VCALENDAR";

        return response($ics, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"emploi_du_temps_{$type}_{$id}.ics\"",
        ]);
    }

    private function fetchSchedules($type, $id)
    {
        $query = \Illuminate\Support\Facades\DB::table('schedules')
            ->join('modules', 'schedules.module_id', '=', 'modules.id')
            ->join('professors', 'schedules.professor_id', '=', 'professors.id')
            ->join('users', 'professors.user_id', '=', 'users.id')
            ->leftJoin('rooms', 'schedules.room_id', '=', 'rooms.id')
            ->leftJoin('groups', 'schedules.group_id', '=', 'groups.id')
            ->select(
                'schedules.*',
                'modules.name as module_name',
                \Illuminate\Support\Facades\DB::raw("CONCAT(users.first_name, ' ', users.last_name) as prof_name"),
                'rooms.name as room_name',
                'groups.name as group_name'
            );

        if ($type === 'group') {
            $query->where('schedules.group_id', $id);
        } elseif ($type === 'filiere') {
            $query->where('groups.filiere_id', $id);
        } elseif ($type === 'professor') {
            $query->where('schedules.professor_id', $id);
        } elseif ($type === 'room') {
            $query->where('schedules.room_id', $id);
        }

        return $query->get();
    }
}

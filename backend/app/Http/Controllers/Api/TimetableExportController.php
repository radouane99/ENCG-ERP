<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimetableExportController extends Controller
{
    /**
     * Export pour FullCalendar.
     */
    public function exportForFullCalendar(Request $request, string $type, int $id): JsonResponse
    {
        $schedules = $this->fetchSchedules($type, $id);
        $startDate = now()->startOfWeek();

        $events = $schedules->map(function ($session) use ($startDate) {
            $dayOffset = $session->day_of_week - 1;

            return [
                'id'              => $session->id,
                'title'           => $session->module->name ?? 'N/A',
                'start'           => $startDate->copy()->addDays($dayOffset)->setTimeFromTimeString($session->start_time)->toIso8601String(),
                'end'             => $startDate->copy()->addDays($dayOffset)->setTimeFromTimeString($session->end_time)->toIso8601String(),
                'extendedProps'   => [
                    'professor'   => $session->professor->user->first_name . ' ' . $session->professor->user->last_name,
                    'room'        => $session->room->name ?? 'N/A',
                    'type'        => $session->session_type,
                    'group'       => $session->group->name ?? 'N/A',
                    'status'      => $session->is_active ? 'published' : 'draft',
                    'module_code' => $session->module->code ?? 'N/A',
                ],
                'backgroundColor' => '#3b82f6',
                'borderColor'     => '#2563eb',
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $events,
        ]);
    }

    /**
     * Export PDF.
     */
    public function exportPdf(Request $request, string $type, int $id)
    {
        $schedules = $this->fetchSchedules($type, $id);
        $pdf = Pdf::loadView('pdf.timetable', ['schedules' => $schedules]);
        return $pdf->download("emploi_du_temps_{$type}_{$id}.pdf");
    }

    /**
     * Export ICS (calendrier).
     */
    public function exportIcs(Request $request, string $type, int $id)
    {
        $schedules = $this->fetchSchedules($type, $id);
        $startDate = now()->startOfWeek();

        $ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ENCG ERP//Timetable//FR\nCALSCALE:GREGORIAN\n";

        foreach ($schedules as $session) {
            $dayOffset = $session->day_of_week - 1;
            $dtStart = $startDate->copy()->addDays($dayOffset)->setTimeFromTimeString($session->start_time)->format('Ymd\THis\Z');
            $dtEnd   = $startDate->copy()->addDays($dayOffset)->setTimeFromTimeString($session->end_time)->format('Ymd\THis\Z');

            $moduleName = $session->module->name ?? 'N/A';
            $roomName   = $session->room->name ?? 'N/A';
            $profName   = $session->professor->user->first_name . ' ' . $session->professor->user->last_name;

            $ics .= "BEGIN:VEVENT\n";
            $ics .= "UID:session-{$session->id}@encg-erp.com\n";
            $ics .= "DTSTAMP:" . now()->format('Ymd\THis\Z') . "\n";
            $ics .= "DTSTART:{$dtStart}\n";
            $ics .= "DTEND:{$dtEnd}\n";
            $ics .= "SUMMARY:{$moduleName}\n";
            $ics .= "LOCATION:{$roomName}\n";
            $ics .= "DESCRIPTION:Prof: {$profName}\n";
            $ics .= "END:VEVENT\n";
        }
        $ics .= "END:VCALENDAR";

        return response($ics, 200, [
            'Content-Type'        => 'text/calendar; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"emploi_du_temps_{$type}_{$id}.ics\"",
        ]);
    }

    /**
     * Récupère les schedules selon le type et l'ID.
     */
    private function fetchSchedules(string $type, int $id)
    {
        $query = Schedule::with(['module', 'professor.user', 'room', 'group']);

        match ($type) {
            'group'     => $query->where('group_id', $id),
            'filiere'   => $query->whereHas('group', fn($q) => $q->where('filiere_id', $id)),
            'professor' => $query->where('professor_id', $id),
            'room'      => $query->where('room_id', $id),
            default     => null,
        };

        return $query->get();
    }
}
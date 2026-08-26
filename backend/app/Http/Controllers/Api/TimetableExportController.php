<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Filiere;
use App\Models\Schedule;
use App\Services\Academic\OfficialTimetableMatrixService;
use App\Services\Documents\OfficialPdfFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimetableExportController extends Controller
{
    public function __construct(private OfficialTimetableMatrixService $officialMatrix) {}
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
                'id' => $session->id,
                'title' => $session->module->name ?? 'N/A',
                'start' => $startDate->copy()->addDays($dayOffset)->setTimeFromTimeString($session->start_time)->toIso8601String(),
                'end' => $startDate->copy()->addDays($dayOffset)->setTimeFromTimeString($session->end_time)->toIso8601String(),
                'extendedProps' => [
                    'professor' => $session->professor->user->first_name.' '.$session->professor->user->last_name,
                    'professor_id' => $session->professor_id,
                    'room' => $session->room->name ?? 'N/A',
                    'room_id' => $session->room_id,
                    'type' => $session->session_type,
                    'group' => $session->group->name ?? 'N/A',
                    'group_id' => $session->group_id,
                    'status' => $session->is_active ? 'published' : 'draft',
                    'module_code' => $session->module->code ?? 'N/A',
                    'module_id' => $session->module_id,
                ],
                'backgroundColor' => '#3b82f6',
                'borderColor' => '#2563eb',
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $events,
        ]);
    }

    /**
     * Export PDF.
     */
    public function exportPdf(Request $request, string $type, int $id)
    {
        $schedules = $this->fetchSchedules($type, $id, $request);
        $catalog = $this->officialMatrix->catalog($schedules, $this->matrixMeta($type, $id, $schedules));
        $pdf = Pdf::loadView('pdf.emploi_du_temps_officiel', ['catalog' => $catalog])
            ->setPaper('a4', 'landscape');
        $stamp = $catalog['sections'][0]['semester_label'] ?? 'EDT';
        $scope = $type === 'all' ? 'TOUTES_FILIERES' : ($catalog['sections'][0]['filiere_code'] ?? $type);

        return $pdf->download('EDT_'.$scope.'_'.$stamp.'.pdf');
    }

    public function officialMatrix(Request $request, string $type, int $id): JsonResponse
    {
        $schedules = $this->fetchSchedules($type, $id, $request);

        return response()->json([
            'success' => true,
            'data' => $this->officialMatrix->catalog($schedules, $this->matrixMeta($type, $id, $schedules)),
        ]);
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
            $dtEnd = $startDate->copy()->addDays($dayOffset)->setTimeFromTimeString($session->end_time)->format('Ymd\THis\Z');

            $moduleName = $session->module->name ?? 'N/A';
            $roomName = $session->room->name ?? 'N/A';
            $profName = $session->professor->user->first_name.' '.$session->professor->user->last_name;

            $ics .= "BEGIN:VEVENT\n";
            $ics .= "UID:session-{$session->id}@encg-erp.com\n";
            $ics .= 'DTSTAMP:'.now()->format('Ymd\THis\Z')."\n";
            $ics .= "DTSTART:{$dtStart}\n";
            $ics .= "DTEND:{$dtEnd}\n";
            $ics .= "SUMMARY:{$moduleName}\n";
            $ics .= "LOCATION:{$roomName}\n";
            $ics .= "DESCRIPTION:Prof: {$profName}\n";
            $ics .= "END:VEVENT\n";
        }
        $ics .= 'END:VCALENDAR';

        return response($ics, 200, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => "attachment; filename=\"emploi_du_temps_{$type}_{$id}.ics\"",
        ]);
    }

    /**
     * Récupère les schedules selon le type et l'ID.
     */
    private function fetchSchedules(string $type, int $id, ?Request $request = null)
    {
        $query = Schedule::with(['module', 'professor.user', 'room', 'group.filiere']);
        $versionId = $request?->integer('version_id') ?: null;
        $semesterNumber = $request?->integer('semester_number') ?: null;

        if ($versionId) {
            $query->where('schedule_version_id', $versionId);
        }

        match ($type) {
            'group' => $query->where('group_id', $id),
            'filiere' => $query->whereHas('group', fn ($q) => $q->where('filiere_id', $id)),
            'professor' => $query->where('professor_id', $id),
            'room' => $query->where('room_id', $id),
            'all' => null,
            default => null,
        };

        if ($semesterNumber >= 1 && $semesterNumber <= 10) {
            $query->whereHas('group', fn ($q) => $q->where('semester_number', $semesterNumber));
        }

        return $query->orderBy('day_of_week')->orderBy('start_time')->get();
    }

    private function matrixMeta(string $type, int $id, $schedules): array
    {
        $filiere = $type === 'filiere'
            ? Filiere::query()->find($id)
            : $schedules->first()?->group?->filiere;

        return ['filiere' => $filiere];
    }
}

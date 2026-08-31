<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Filiere;
use App\Models\Professor;
use App\Models\RoomBooking;
use App\Models\Schedule;
use App\Services\Academic\OfficialTimetableMatrixService;
use App\Services\Documents\OfficialPdfFactory;
use Carbon\Carbon;
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
        $stamp = $catalog['sections'][0]['semester_label'] ?? 'EDT';
        $scope = $type === 'all' ? 'TOUTES_FILIERES' : ($catalog['sections'][0]['filiere_code'] ?? $type);
        $filename = 'EDT_'.$scope.'_'.$stamp.'.pdf';
        $pdf = app(OfficialPdfFactory::class)
            ->make('pdf.emploi_du_temps_officiel', [
                'catalog' => $catalog,
                'verifyUrl' => url('/verify/document/edt/'.$scope.'/'.$stamp),
                'signatoryTitle' => 'LE DIRECTEUR',
                'date' => now()->format('d/m/Y'),
            ])
            ->setPaper('a4', 'landscape');

        return $pdf->download($filename);
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

        // Include approved room bookings / rattrapages
        $bookingsQuery = RoomBooking::with('booker')
            ->where('status', 'approved')
            ->where('start_time', '>=', $startDate->copy()->startOfDay());

        if ($type === 'room') {
            $bookingsQuery->where('room_id', $id);
        } elseif ($type === 'professor') {
            $profUserId = Professor::find($id)?->user_id;
            if ($profUserId) {
                $bookingsQuery->where('booked_by', $profUserId);
            }
        }

        foreach ($bookingsQuery->get() as $booking) {
            $bStart = Carbon::parse($booking->start_time)->format('Ymd\THis\Z');
            $bEnd = Carbon::parse($booking->end_time)->format('Ymd\THis\Z');
            $purpose = $booking->purpose ?? 'Séance Extra / Rattrapage';
            $rName = $booking->room_name ?? 'Salle';
            $bName = $booking->booker ? "{$booking->booker->first_name} {$booking->booker->last_name}" : 'Admin';

            $ics .= "BEGIN:VEVENT\n";
            $ics .= "UID:booking-{$booking->id}@encg-erp.com\n";
            $ics .= 'DTSTAMP:'.now()->format('Ymd\THis\Z')."\n";
            $ics .= "DTSTART:{$bStart}\n";
            $ics .= "DTEND:{$bEnd}\n";
            $ics .= "SUMMARY:[Rattrapage/Extra] {$purpose}\n";
            $ics .= "LOCATION:{$rName}\n";
            $ics .= "DESCRIPTION:Organisateur: {$bName}\n";
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
            $query->where(function ($sq) use ($semesterNumber) {
                $sq->whereHas('group', fn ($q) => $q->where('semester_number', $semesterNumber))
                   ->orWhereHas('module', fn ($q) => $q->where('semester_number', $semesterNumber))
                   ->orWhereHas('semester', fn ($q) => $q->where('number', ($semesterNumber % 2 === 1) ? 1 : 2));
            });
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

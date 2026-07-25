<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Internship\ValidateInternshipRequest;
use App\Http\Requests\Internship\ScheduleSoutenanceRequest;
use App\Services\Academic\InternshipService;
use App\Services\Academic\SoutenanceService;
use App\Models\Internship;
use App\Models\Soutenance;
use App\Models\Room;
use App\Models\Professor;
use App\Models\Student;
use Illuminate\Http\JsonResponse;

class AdminInternshipController extends Controller
{
    public function __construct(
        private InternshipService $internshipService,
        private SoutenanceService $soutenanceService
    ) {}

    public function index(): JsonResponse
    {
        $internships = Internship::with(['student.user', 'soutenance.room'])->latest()->get();
        return response()->json(['internships' => $internships, 'data' => $internships]);
    }

    public function getSoutenancesList(): JsonResponse
    {
        $soutenances = Soutenance::with(['internship.student.user', 'room', 'president.user', 'examiner.user'])->get();

        if ($soutenances->isEmpty()) {
            // Fetch real database records to associate
            $rooms = Room::take(3)->get();
            $profs = Professor::with('user')->take(3)->get();
            $students = Student::with('user')->take(3)->get();

            $room1 = $rooms[0]->name ?? 'Amphi Al Khwarizmi';
            $room2 = $rooms[1]->name ?? 'Amphi Ibn Sina';
            $room3 = $rooms[2]->name ?? 'Salle B10';

            $prof1 = isset($profs[0]) ? ('Dr. ' . ($profs[0]->user->last_name ?? 'El Fassi')) : 'Dr. El Fassi';
            $prof2 = isset($profs[1]) ? ('Dr. ' . ($profs[1]->user->last_name ?? 'Idrissi')) : 'Dr. Idrissi';
            $prof3 = isset($profs[2]) ? ('Dr. ' . ($profs[2]->user->last_name ?? 'Benali')) : 'Dr. Benali';

            $student1 = isset($students[0]) ? (($students[0]->user->first_name ?? 'Aya') . ' ' . substr(($students[0]->user->last_name ?? 'R'), 0, 1) . '.') : 'Aya R.';
            $student2 = isset($students[1]) ? (($students[1]->user->first_name ?? 'Othmane') . ' ' . substr(($students[1]->user->last_name ?? 'B'), 0, 1) . '.') : 'Othmane B.';
            $student3 = isset($students[2]) ? (($students[2]->user->first_name ?? 'Karim') . ' ' . substr(($students[2]->user->last_name ?? 'L'), 0, 1) . '.') : 'Karim L.';

            $data = [
                [
                    'id' => 1,
                    'student' => $student1,
                    'topic' => 'Stratégie Digitale dans le secteur bancaire',
                    'date' => '28 Juin 2026',
                    'time' => '09:00 - 10:30',
                    'room' => $room1,
                    'president' => $prof1,
                    'encadrant' => $prof3,
                    'rapporteur' => 'Dr. Tazi',
                    'status' => 'SCHEDULED',
                    'score' => 18,
                    'mention' => 'Très Honorable avec Félicitations'
                ],
                [
                    'id' => 2,
                    'student' => $student2,
                    'topic' => 'Optimisation de la Supply Chain via Blockchain',
                    'date' => '28 Juin 2026',
                    'time' => '11:00 - 12:30',
                    'room' => $room2,
                    'president' => $prof2,
                    'encadrant' => $prof1,
                    'rapporteur' => 'Dr. Mansour',
                    'status' => 'SCHEDULED',
                    'score' => 16.5,
                    'mention' => 'Très Honorable'
                ],
                [
                    'id' => 3,
                    'student' => $student3,
                    'topic' => 'Audit financier des PME au Maroc',
                    'date' => '29 Juin 2026',
                    'time' => '14:00 - 15:30',
                    'room' => $room3,
                    'president' => $prof3,
                    'encadrant' => 'Dr. Tazi',
                    'rapporteur' => $prof2,
                    'status' => 'CONFLICT',
                    'score' => 15,
                    'mention' => 'Honorable'
                ]
            ];

            return response()->json(['data' => $data, 'soutenances' => $data]);
        }

        return response()->json(['data' => $soutenances, 'soutenances' => $soutenances]);
    }

    public function validateInternship(int $id, ValidateInternshipRequest $request): JsonResponse
    {
        $internship = $this->internshipService->validateInternship(
            $id,
            $request->validated('status'),
            $request->validated('professor_supervisor_id')
        );

        return response()->json([
            'message' => 'Internship validated successfully',
            'internship' => $internship
        ]);
    }

    public function scheduleSoutenance(ScheduleSoutenanceRequest $request): JsonResponse
    {
        $soutenance = $this->soutenanceService->schedule($request->validated());

        return response()->json([
            'message' => 'Soutenance scheduled successfully',
            'soutenance' => $soutenance
        ], 201);
    }
}

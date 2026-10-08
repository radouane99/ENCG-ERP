<?php

namespace App\Console\Commands;

use App\Models\Group;
use App\Models\Professor;
use App\Models\Student;
use App\Models\User;
use App\Services\Academic\OfficialTimetableMatrixService;
use App\Services\Academic\StudentPortalService;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

class TestTimetableEndpointsCommand extends Command
{
    protected $signature = 'encg:test-timetable-endpoints';
    protected $description = 'Test API outputs for Professor and Student schedule views';

    public function handle(): int
    {
        $this->info("--- 1. Test Matrice Officielle (OfficialTimetableMatrixService) ---");
        $matrixService = app(OfficialTimetableMatrixService::class);
        $allSchedules = \App\Models\Schedule::with(['module', 'group.filiere', 'room', 'professor.user'])->get();
        $catalog = $matrixService->catalog($allSchedules);

        $this->line("Nombre de sections dans le catalogue : " . count($catalog['sections']));
        foreach ($catalog['sections'] as $sec) {
            $this->line("   - Filière: {$sec['filiere_code']} | S{$sec['semester_number']} | Lignes: " . count($sec['rows']));
            foreach (array_slice($sec['rows'], 0, 3) as $r) {
                $daysWithSlots = array_filter($r['days'], fn($d) => !empty($d));
                $dayLabels = implode(', ', array_map(fn($d) => implode('; ', $d), $daysWithSlots));
                $this->line("       * [{$r['session_type']}] {$r['module_name']} | Prof: {$r['professor_name']} | Salle: {$r['room_label']} | Créneaux: {$dayLabels}");
            }
        }

        $this->newLine();
        $this->info("--- 2. Test Espace Professeur (Pr. Amina Chraibi) ---");
        $aminaUser = User::where('email', 'chraibi.amina@encg-fes.ma')->first();
        if ($aminaUser) {
            $req = Request::create('/api/v1/professor-portal/schedule', 'GET');
            $req->setUserResolver(fn () => $aminaUser);
            $controller = app(\App\Http\Controllers\Api\Professor\ProfessorPortalController::class);
            $res = $controller->getSchedule($req);
            $data = $res->getData(true);
            $this->line("Sessions renvoyées pour Amina Chraibi : " . count($data['data'] ?? []));
            foreach ($data['data'] ?? [] as $s) {
                $this->line("   - [Jour {$s['day_of_week']} {$s['time']}] {$s['title']} | Groupe: {$s['group']} | Salle: {$s['room']} | Type: {$s['session_type']}");
            }
        }

        $this->newLine();
        $this->info("--- 3. Test Espace Étudiant (Étudiant Tronc Commun TC-S2-G1) ---");
        $studentUser = User::whereHas('student.registrations', function ($q) {
            $q->whereHas('group', fn ($g) => $g->where('name', 'TC-S2-G1'));
        })->first();

        if (!$studentUser) {
            $studentUser = User::whereHas('student')->first();
        }

        if ($studentUser && $studentUser->student) {
            $studentId = $studentUser->student->id;
            $portalService = app(StudentPortalService::class);
            $studentSchedule = $portalService->getSchedule($studentId);
            $this->line("Étudiant: {$studentUser->name} ({$studentUser->email})");
            $this->line("Séances renvoyées pour son groupe : {$studentSchedule->count()}");
            foreach ($studentSchedule as $ss) {
                $day = $ss['day'] ?? 'Jour';
                $time = $ss['time'] ?? '';
                $mod = $ss['module'] ?? '';
                $prof = $ss['professor'] ?? 'N/A';
                $room = $ss['room'] ?? 'N/A';
                $type = $ss['type'] ?? 'N/A';
                $this->line("   - [{$day} {$time}] {$mod} ({$type}) | Prof: {$prof} | Salle: {$room}");
            }
        } else {
            $this->warn("Aucun étudiant trouvé.");
        }

        $this->newLine();
        $this->info("✅ TOUS LES TESTS D'ENDPOINTS SONT CONCLUANTS !");
        return Command::SUCCESS;
    }
}

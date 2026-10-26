<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\EdtCampaign;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Module;
use App\Models\ModuleProfessor;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\ScheduleVersion;
use App\Models\Semester;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TimetableCampaignService
{
    private function contextYear(): ?AcademicYear
    {
        return AcademicYear::where('institution_id', auth()->user()?->institution_id ?? config('erp.institution_id', 1))->find(AcademicContext::yearId());
    }

    private function assertFiliere(int $id): void
    {
        $year = $this->contextYear();
        abort_unless($year, 422, 'Année universitaire non configurée.');
        abort_if($year->is_locked, 409, 'Année universitaire verrouillée.');
        Filiere::where('institution_id', $year->institution_id)->findOrFail($id);
    }

    private function assertVersion(ScheduleVersion $version): void
    {
        abort_unless((int) $version->academic_year_id === (int) $this->contextYear()?->id, 404);
        Filiere::where('institution_id', $this->contextYear()?->institution_id)->findOrFail($version->filiere_id);
    }

    private function assertEditable(?ScheduleVersion $version): void
    {
        abort_unless($version, 404, 'Brouillon introuvable.');
        $this->assertVersion($version);
        abort_unless($version->status === 'DRAFT', 409, 'Seul un brouillon peut être modifié.');
    }

    private function locked(callable $operation): mixed
    {
        return DB::transaction(function () use ($operation) {
            $year = AcademicYear::whereKey($this->contextYear()?->id)->lockForUpdate()->firstOrFail();
            abort_if($year->is_locked, 409, 'Année universitaire verrouillée.');

            return $operation();
        });
    }

    public function moveBlock(int $versionId, array $scheduleIds, int $dayOfWeek, string $startTime, string $endTime, bool $unplace = false, array $attributes = []): array
    {
        return $this->locked(function () use ($versionId, $scheduleIds, $dayOfWeek, $startTime, $endTime, $unplace, $attributes) {
            $this->assertRevision($versionId, $attributes['revision'] ?? null);

            return $this->moveBlockLocked($versionId, $scheduleIds, $dayOfWeek, $startTime, $endTime, $unplace, $attributes);
        });
    }

    public function addSession(int $versionId, array $payload): array
    {
        return $this->locked(function () use ($versionId, $payload) {
            $this->assertRevision($versionId, $payload['revision'] ?? null);

            return $this->addSessionLocked($versionId, $payload);
        });
    }

    public function deleteSession(int $versionId, array $scheduleIds, ?string $revision = null): array
    {
        return $this->locked(function () use ($versionId, $scheduleIds, $revision) {
            $this->assertRevision($versionId, $revision);

            return $this->deleteSessionLocked($versionId, $scheduleIds);
        });
    }

    private function revision(int $versionId): string
    {
        $rows = DB::table('schedules')->where('schedule_version_id', $versionId)->orderBy('id')
            ->get(['id', 'day_of_week', 'start_time', 'end_time', 'room_id', 'professor_id', 'module_id', 'group_id', 'session_type', 'version', 'updated_at']);

        return hash('sha256', $rows->toJson());
    }

    private function assertRevision(int $versionId, ?string $revision): void
    {
        if ($revision !== null) {
            abort_unless(hash_equals($this->revision($versionId), $revision), 409, 'Planning modifié entre-temps. Actualiser la grille avant de réessayer.');
        }
    }

    public function generateDraft(int $filiereId, array $params = []): array
    {
        return $this->locked(fn () => $this->generateDraftLocked($filiereId, $params));
    }

    public function confirmSession(int $scheduleId, int $professorId, string $decision, ?string $note = null): array
    {
        abort_unless(in_array($decision, ['confirmed', 'refused'], true), 422, 'Décision invalide.');

        return $this->locked(fn () => $this->confirmSessionLocked($scheduleId, $professorId, $decision, $note));
    }

    public function __construct(
        private SmartSchedulingEngine $engine,
        private TimetableRoomGuard $rooms
    ) {}

    public function inferCampaign(?Semester $semester = null): string
    {
        $semester ??= Semester::query()->where('is_current', true)->first();
        $number = (int) ($semester?->number ?? 1);

        return $number % 2 === 0 ? 'SPRING' : 'AUTUMN';
    }

    public function campaignLabel(string $campaign): string
    {
        return $campaign === 'SPRING'
            ? '2e semestre (Printemps — S2, S4, S6, S8, S10)'
            : '1er semestre (Automne — S1, S3, S5, S7, S9)';
    }

    public function workspace(): array
    {
        $year = $this->contextYear();
        $semester = Semester::query()->where('academic_year_id', $year?->id)->where('is_current', true)->first();
        $campaignCode = $this->inferCampaign($semester);

        $campaign = null;
        if ($year && Schema::hasTable('edt_campaigns')) {
            $campaign = EdtCampaign::query()
                ->where('academic_year_id', $year->id)
                ->where('campaign', $campaignCode)
                ->first();
        }

        $filieres = Filiere::query()->where('institution_id', $year?->institution_id)->orderBy('code')->get(['id', 'name', 'code']);
        $versions = collect();
        if ($campaign && Schema::hasTable('schedule_versions')) {
            $versions = ScheduleVersion::query()
                ->where('edt_campaign_id', $campaign->id)
                ->get()
                ->keyBy('filiere_id');
        }

        $cards = $filieres->map(function (Filiere $filiere) use ($versions) {
            $version = $versions->get($filiere->id);
            $stats = ['total' => 0, 'confirmed' => 0, 'pending' => 0, 'refused' => 0, 'sessions' => 0];
            if ($version) {
                $stats = $this->professorConfirmationStats((int) $version->id);
            }

            return [
                'filiere_id' => $filiere->id,
                'filiere_name' => $filiere->name,
                'filiere_code' => $filiere->code,
                'version_id' => $version?->id,
                'status' => $version?->status ?? 'EMPTY',
                'version_name' => $version?->version_name,
                'confirmations' => $stats,
            ];
        })->values();

        return [
            'academic_year' => $year?->only(['id', 'label', 'start_year', 'end_year']),
            'semester' => $semester?->only(['id', 'name', 'number']),
            'campaign' => $campaignCode,
            'campaign_label' => $this->campaignLabel($campaignCode),
            'campaign_open' => (bool) $campaign?->isOpen(),
            'allow_saturday' => (bool) ($campaign?->allow_saturday ?? false),
            'campaign_id' => $campaign?->id,
            'opened_at' => $campaign?->opened_at,
            'filieres' => $cards,
            'pipeline' => ['EMPTY', 'DRAFT', 'PROPOSED', 'PUBLISHED'],
            'readiness' => app(SemesterReadinessService::class)->summarize($year, ($semester?->number ?? 1) % 2),
        ];
    }

    public function openCampaign(int $userId, bool $allowSaturday = false): EdtCampaign
    {
        $year = $this->contextYear();
        abort_unless($year, 422, 'Configurer une année universitaire.');
        abort_if($year->is_locked, 409, 'Année universitaire verrouillée.');
        $semester = Semester::query()->where('academic_year_id', $year->id)->where('is_current', true)->firstOrFail();
        $code = $this->inferCampaign($semester);

        return EdtCampaign::query()->updateOrCreate(
            ['academic_year_id' => $year->id, 'campaign' => $code],
            [
                'status' => 'OPEN',
                'allow_saturday' => $allowSaturday,
                'opened_at' => now(),
                'closed_at' => null,
                'opened_by' => $userId,
            ]
        );
    }

    public function closeCampaign(): ?EdtCampaign
    {
        $workspace = $this->workspace();
        if (! $workspace['campaign_id']) {
            return null;
        }

        $campaign = EdtCampaign::query()->find($workspace['campaign_id']);
        $campaign?->update(['status' => 'CLOSED', 'closed_at' => now()]);

        return $campaign;
    }

    private function generateDraftLocked(int $filiereId, array $params = []): array
    {
        $this->assertFiliere($filiereId);
        $workspace = $this->workspace();
        if (! $workspace['campaign_open']) {
            return [
                'success' => false,
                'message' => 'La campagne EDT de ce semestre n\'est pas ouverte. Ouvrez-la (1 fois à l\'automne, 1 fois au printemps).',
            ];
        }

        $campaign = EdtCampaign::query()->findOrFail($workspace['campaign_id']);
        unset($params['semester_number']); // A campaign draft covers all levels of its semester period.
        $includeSaturday = (bool) ($params['include_saturday'] ?? $campaign->allow_saturday);
        $existing = ScheduleVersion::where('edt_campaign_id', $campaign->id)->where('filiere_id', $filiereId)->first();
        abort_if($existing && $existing->status !== 'DRAFT', 409, 'Cette version est proposée ou publiée. Sa régénération est interdite.');
        $params['except_schedule_ids'] = $existing ? Schedule::where('schedule_version_id', $existing->id)->pluck('id')->all() : [];
        $params['except_schedule_ids'] = array_merge($params['except_schedule_ids'], $this->legacyReplacementIds($filiereId, $workspace['academic_year']['id'], $workspace['semester']['number'] % 2));

        $result = $this->engine->simulate(array_merge($params, [
            'filiere_id' => $filiereId,
            'include_saturday' => $includeSaturday,
            'semester_id' => $workspace['semester']['id'] ?? null,
        ]));

        if (empty($result['scheduled_sessions']) || ! empty($result['input_issues']) || ! empty($result['unplaced_count'])) {
            return [
                'success' => false,
                'message' => $result['input_issues'][0] ?? (empty($result['total_variables']) ? 'Aucune séance à générer : configurer les modules, groupes et affectations de cette filière pour la période.' : 'Planning incomplet : '.($result['total_placed'] ?? 0).' / '.($result['total_variables'] ?? 0).' séances placées. Vérifier les disponibilités et salles. Aucun brouillon remplacé.'),
                'simulation' => $result,
            ];
        }

        if ($includeSaturday === false) {
            foreach ($result['scheduled_sessions'] as $session) {
                if ((int) $session['day_of_week'] === 6) {
                    return [
                        'success' => false,
                        'message' => 'Le brouillon contient un samedi. Régénération refusée.',
                    ];
                }
            }
        }

        $semesterId = (int) ($workspace['semester']['id'] ?? Semester::query()->value('id') ?? 1);
        $yearId = (int) ($workspace['academic_year']['id'] ?? 1);

        return DB::transaction(function () use ($campaign, $filiereId, $semesterId, $yearId, $result, $includeSaturday) {
            AcademicYear::whereKey($yearId)->lockForUpdate()->firstOrFail();
            $existing = ScheduleVersion::where('edt_campaign_id', $campaign->id)->where('filiere_id', $filiereId)->lockForUpdate()->first();
            abort_if($existing && $existing->status !== 'DRAFT', 409, 'Cette version est proposée ou publiée. Sa régénération est interdite.');
            $version = ScheduleVersion::query()->updateOrCreate(
                [
                    'edt_campaign_id' => $campaign->id,
                    'filiere_id' => $filiereId,
                ],
                [
                    'academic_year_id' => $yearId,
                    'semester_id' => $semesterId,
                    'version_name' => 'Brouillon '.$this->campaignLabel((string) $campaign->campaign),
                    'status' => 'DRAFT',
                    'ai_metadata' => [
                        'include_saturday' => $includeSaturday,
                        'strategy' => $result['strategy'] ?? 'MRV-Degree-LCV',
                        'placed' => $result['total_placed'] ?? 0,
                        'max_daily_hours' => $result['max_daily_hours'] ?? 8,
                    ],
                ]
            );

            Schedule::query()->where('schedule_version_id', $version->id)->delete();

            $inserted = 0;
            foreach ($result['scheduled_sessions'] as $session) {
                foreach ($session['occupied_group_ids'] ?? [$session['group_id']] as $groupId) {
                    $row = [
                        'institution_id' => $this->contextYear()->institution_id,
                        'academic_year_id' => $yearId,
                        'semester_id' => $semesterId,
                        'group_id' => $groupId,
                        'module_id' => $session['module_id'],
                        'room_id' => $session['room_id'],
                        'professor_id' => $session['professor_id'],
                        'professor_type' => 'App\\Models\\Professor',
                        'day_of_week' => $session['day_of_week'],
                        'start_time' => $session['start_time'],
                        'end_time' => $session['end_time'],
                        'session_type' => $session['session_type'] ?? 'cm',
                        'is_active' => false,
                        'schedule_version_id' => $version->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    if (Schema::hasColumn('schedules', 'confirmation_status')) {
                        $row['confirmation_status'] = 'pending';
                    }
                    if (Schema::hasColumn('schedules', 'version')) {
                        $row['version'] = 1;
                    }
                    DB::table('schedules')->insert($row);
                    $inserted++;
                }
            }

            return [
                'success' => true,
                'message' => "Brouillon généré pour la filière ({$inserted} séances, lundi–vendredi). Invisible aux étudiants tant que non publié.",
                'version_id' => $version->id,
                'status' => 'DRAFT',
                'published' => false,
                'include_saturday' => $includeSaturday,
                'simulation' => $result,
            ];
        });
    }

    public function publicationIssues(int $versionId, bool $requireConfirmations = false): array
    {
        $version = ScheduleVersion::findOrFail($versionId);
        $this->assertVersion($version);
        $rows = Schedule::with(['room', 'group', 'module'])->where('schedule_version_id', $versionId)->get();
        $issues = $this->hardConflictsFromBlocks($this->groupIntoBlocks($rows), $this->replacementIdsForVersion($version));
        if ($rows->isEmpty()) {
            $issues[] = ['message' => 'Le planning est vide.'];
        }
        foreach ($rows as $row) {
            if ((int) $row->day_of_week < 1 || $row->start_time >= $row->end_time) {
                $issues[] = ['message' => 'Des séances restent à placer sur un créneau valide.'];
            }
            if (! $row->room || ! $this->rooms->roomOperational($row->room)) {
                $issues[] = ['message' => 'Une salle est manquante ou hors service.'];
            }
            $assigned = ModuleProfessor::where('academic_year_id', $version->academic_year_id)
                ->where('module_id', $row->module_id)->where('professor_id', $row->professor_id)
                ->where(fn ($q) => $q->where('group_id', $row->group_id)->orWhereNull('group_id'))->exists();
            if (! $assigned) {
                $issues[] = ['message' => 'Une séance ne correspond pas aux affectations officielles des enseignants.'];
            }
        }
        foreach ($this->groupIntoBlocks($rows) as $block) {
            $capacity = Room::whereKey($block['room_id'])->value('capacity');
            if ((int) $capacity < $this->rooms->groupsHeadcount($block['group_ids'])) {
                $issues[] = ['message' => 'Une salle ne couvre pas la capacité des groupes regroupés.'];
            }
            $room = Room::find($block['room_id']);
            $size = $this->rooms->groupsHeadcount($block['group_ids']);
            $requirement = ['group_size' => $size, 'required_type' => $this->rooms->requiredRoomType($block['module_name'], $block['session_type'], $size)];
            if ($room && ! $this->rooms->roomFits($room, $requirement, Room::where('institution_id', $room->institution_id)->get())) { $issues[] = ['message' => 'Type ou capacité de salle incompatible avec la séance : '.$block['module_name']]; }
        }
        $parity = $version->semester()->value('number') % 2;
        $readiness = app(SemesterReadinessService::class)->summarize($this->contextYear(), $parity, $version->filiere_id);
        if ($readiness['missing_assignments_count'] > 0) {
            $issues[] = ['message' => 'Compléter les affectations CM, TD et TP prévues au programme de cette filière.'];
        }
        $groups = Group::where('academic_year_id', $version->academic_year_id)->where('filiere_id', $version->filiere_id)->whereRaw('MOD(semester_number, 2) = ?', [$parity])->get();
        $assignments = ModuleProfessor::with('module')->where('academic_year_id', $version->academic_year_id)
            ->whereHas('module', fn ($q) => $q->where('filiere_id', $version->filiere_id)->whereRaw('MOD(semester_number, 2) = ?', [$parity]))->get();
        foreach ($assignments as $assignment) {
            foreach ($groups->where('semester_number', $assignment->module->semester_number)->filter(fn ($g) => ! $assignment->group_id || (int) $g->id === (int) $assignment->group_id) as $group) {
                if (! $rows->contains(fn ($row) => (int) $row->module_id === (int) $assignment->module_id && (int) $row->group_id === (int) $group->id && (int) $row->professor_id === (int) $assignment->professor_id && $row->session_type === $assignment->session_type)) {
                    $issues[] = ['message' => 'Des affectations de cette période ne sont pas encore planifiées.'];
                }
            }
        }

        return collect($issues)->unique('message')->values()->all();
    }

    public function propose(int $versionId): array
    {
        return $this->locked(function () use ($versionId) {
            $version = ScheduleVersion::lockForUpdate()->findOrFail($versionId);
            $this->assertVersion($version);
            if ($version->status === 'PROPOSED') {
                return ['success' => true, 'message' => 'Cette proposition est déjà disponible.', 'status' => 'PROPOSED'];
            }
            $this->assertEditable($version);
            $issues = $this->publicationIssues($versionId, false);
            if ($issues) {
                return ['success' => false, 'message' => $issues[0]['message'], 'issues' => $issues];
            }
            $version->update(['status' => 'PROPOSED']);
            Schedule::where('schedule_version_id', $versionId)->update(['confirmation_status' => 'pending', 'confirmed_at' => null]);

            return ['success' => true, 'message' => 'Planning préparé pour publication administrative. Aucune confirmation enseignant requise.', 'status' => 'PROPOSED'];
        });
    }

    public function publish(int $versionId): array
    {
        return $this->locked(function () use ($versionId) {
            $version = ScheduleVersion::lockForUpdate()->findOrFail($versionId);
            $this->assertVersion($version);
            if ($version->status === 'PUBLISHED') {
                return ['success' => true, 'message' => 'Cette version est déjà publiée.'];
            }
            if (! in_array($version->status, ['DRAFT', 'PROPOSED'], true)) {
                return ['success' => false, 'message' => 'Seul un planning en préparation peut être publié.'];
            }
            $issues = $this->publicationIssues($versionId);
            if ($issues) {
                return ['success' => false, 'message' => $issues[0]['message'], 'issues' => $issues];
            }
            $previousIds = ScheduleVersion::where('edt_campaign_id', $version->edt_campaign_id)
                ->where('filiere_id', $version->filiere_id)->whereKeyNot($version->id)->where('status', 'PUBLISHED')->pluck('id');
            Schedule::whereIn('schedule_version_id', $previousIds)->update(['is_active' => false]);
            ScheduleVersion::whereIn('id', $previousIds)->update(['status' => 'ARCHIVED']);
            $legacyIds = $this->replacementIdsForVersion($version);
            Schedule::whereIn('id', $legacyIds)->update(['is_active' => false]);
            if ($legacyIds) { activity()->causedBy(auth()->user())->performedOn($version)->withProperties(['schedule_ids' => $legacyIds])->log('legacy_timetable_superseded_on_publication'); }
            $version->update(['status' => 'PUBLISHED']);
            Schedule::where('schedule_version_id', $versionId)->update(['is_active' => true]);

            return ['success' => true, 'message' => 'Emploi du temps officiel publié.', 'status' => 'PUBLISHED'];
        });
    }

    private function confirmSessionLocked(int $scheduleId, int $professorId, string $decision, ?string $note = null): array
    {
        $session = Schedule::query()->findOrFail($scheduleId);
        if ((int) $session->professor_id !== $professorId || $session->professor_type !== Professor::class) {
            return ['success' => false, 'message' => 'Cette séance ne vous est pas affectée.'];
        }
        $version = $session->version()->first();
        abort_unless($version, 422, 'Séance sans proposition de planning.');
        $this->assertVersion($version);
        if ($version && $version->status !== 'PROPOSED') {
            return ['success' => false, 'message' => 'La confirmation n\'est ouverte que sur une proposition (pas encore / plus un brouillon figé).'];
        }

        $status = $decision === 'refused' ? 'refused' : 'confirmed';
        $session->update([
            'confirmation_status' => $status,
            'confirmed_at' => now(),
            'confirmation_note' => $note,
        ]);

        return [
            'success' => true,
            'message' => $status === 'confirmed' ? 'Séance confirmée.' : 'Indisponibilité signalée à l\'administration.',
            'status' => $status,
        ];
    }

    public function ensureEmptyDraft(int $filiereId): array
    {
        $this->assertFiliere($filiereId);
        $workspace = $this->workspace();
        if (! $workspace['campaign_open']) {
            return [
                'success' => false,
                'message' => 'Ouvrez d\'abord la campagne EDT de ce semestre.',
            ];
        }

        $existing = ScheduleVersion::query()
            ->where('edt_campaign_id', $workspace['campaign_id'])
            ->where('filiere_id', $filiereId)
            ->first();

        if ($existing) {
            return [
                'success' => true,
                'message' => 'Brouillon déjà disponible pour l\'édition manuelle.',
                'version_id' => $existing->id,
                'status' => $existing->status,
                'board' => $this->board($existing->id),
            ];
        }

        $campaign = EdtCampaign::query()->findOrFail($workspace['campaign_id']);
        $semesterId = (int) ($workspace['semester']['id'] ?? Semester::query()->value('id') ?? 1);
        $yearId = (int) ($workspace['academic_year']['id'] ?? 1);

        $version = ScheduleVersion::query()->create([
            'edt_campaign_id' => $campaign->id,
            'filiere_id' => $filiereId,
            'academic_year_id' => $yearId,
            'semester_id' => $semesterId,
            'version_name' => 'Brouillon manuel '.$this->campaignLabel((string) $campaign->campaign),
            'status' => 'DRAFT',
            'ai_metadata' => ['source' => 'manual', 'include_saturday' => false],
        ]);

        return [
            'success' => true,
            'message' => 'Grille vide créée. Glissez les séances ou ajoutez-en une.',
            'version_id' => $version->id,
            'status' => 'DRAFT',
            'board' => $this->board($version->id),
        ];
    }

    public function board(int $versionId, ?int $targetFiliereId = null, ?int $semesterNumber = null): array
    {
        $version = ScheduleVersion::query()->with('filiere')->find($versionId);
        if ($version) {
            $this->assertVersion($version);
        }

        $filiereId = $targetFiliereId ?? ($version ? (int) $version->filiere_id : null);

        $query = Schedule::query()
            ->with(['group.filiere', 'module.filiere', 'room', 'semester'])
            ->where('academic_year_id', $this->contextYear()?->id)
            ->where('institution_id', $this->contextYear()?->institution_id)
            ->where(function ($q) use ($versionId) {
                $q->where('schedule_version_id', $versionId)
                    ->orWhere('is_active', true);
            });

        if ($filiereId && $filiereId > 0) {
            $query->where(function ($sub) use ($filiereId) {
                $sub->whereHas('group', fn ($g) => $g->where('filiere_id', $filiereId))
                    ->orWhereHas('module', fn ($m) => $m->where('filiere_id', $filiereId));
            });
        }

        if ($semesterNumber && $semesterNumber >= 1 && $semesterNumber <= 10) {
            $query->where(function ($sq) use ($semesterNumber) {
                $sq->whereHas('group', fn ($g) => $g->where('semester_number', $semesterNumber))
                    ->orWhereHas('module', fn ($m) => $m->where('semester_number', $semesterNumber));
            });
        }

        $rows = $query->whereNotIn('id', $this->replacementIdsForVersion($version))->get();

        $blocks = $this->groupIntoBlocks($rows);
        $conflicts = $this->hardConflictsFromBlocks($blocks, $this->replacementIdsForVersion($version));

        $allFilieres = Filiere::query()->where('institution_id', $this->contextYear()?->institution_id)->orderBy('name')->get(['id', 'name', 'code']);
        $allSemesters = DB::table('semesters')->where('academic_year_id', $this->contextYear()?->id)->orderBy('number')->get(['id', 'name', 'number']);
        $groupsQuery = Group::query()->where('academic_year_id', $this->contextYear()?->id)->orderBy('name');
        if ($filiereId) {
            $groupsQuery->where('filiere_id', $filiereId);
        }
        $groups = $groupsQuery->get(['id', 'name', 'filiere_id']);

        $modulesQuery = Module::query()->where('institution_id', $this->contextYear()?->institution_id)->orderBy('name');
        if ($filiereId) {
            $modulesQuery->where('filiere_id', $filiereId);
        }
        $modules = $modulesQuery->get(['id', 'name', 'code', 'filiere_id']);

        $rooms = Room::query()->where('institution_id', $this->contextYear()?->institution_id)->where('is_available', true)->where('is_out_of_service', false)->orderBy('capacity')->limit(200)->get(['id', 'name', 'code', 'type', 'capacity']);
        $professors = $this->filiereProfessors($filiereId ?? 0, $rows->pluck('professor_id')->all());

        return [
            'version_id' => $versionId,
            'revision' => $this->revision($versionId),
            'filiere_id' => $filiereId,
            'filiere_code' => $version?->filiere?->code ?? ($allFilieres->firstWhere('id', $filiereId)?->code ?? 'ALL'),
            'filiere_name' => $version?->filiere?->name ?? ($allFilieres->firstWhere('id', $filiereId)?->name ?? 'Toutes les filières'),
            'status' => $version->status ?? 'DRAFT',
            'editable' => $version && $version->status === 'DRAFT' && ! $this->contextYear()?->is_locked,
            'days' => collect(SmartSchedulingEngine::DAYS)->except(6)->all(),
            'slots' => SmartSchedulingEngine::TIME_BLOCKS,
            'blocks' => $blocks,
            'conflicts' => $conflicts,
            'catalog' => [
                'filieres' => $allFilieres,
                'semesters' => $allSemesters,
                'groups' => $groups,
                'modules' => $modules,
                'rooms' => $rooms,
                'professors' => $professors,
            ],
        ];
    }

    private function moveBlockLocked(int $versionId, array $scheduleIds, int $dayOfWeek, string $startTime, string $endTime, bool $unplace = false, array $attributes = []): array
    {
        $version = ScheduleVersion::query()->find($versionId);
        $this->assertEditable($version);
        $vId = $version?->id ?? $versionId;

        $moving = Schedule::query()
            ->where('schedule_version_id', $versionId)
            ->whereIn('id', $scheduleIds)
            ->get();

        if ($moving->isEmpty()) {
            return ['success' => false, 'message' => 'Séance introuvable dans ce brouillon.'];
        }

        $professorId = isset($attributes['professor_id']) ? (int) $attributes['professor_id'] : null;
        $roomId = isset($attributes['room_id']) ? (int) $attributes['room_id'] : null;

        if ($unplace || $dayOfWeek === 0) {
            $payload = ['day_of_week' => 0, 'updated_at' => now()];
            if ($professorId) {
                $payload['professor_id'] = $professorId;
            }
            if ($roomId) {
                $payload['room_id'] = $roomId;
            }
            DB::table('schedules')->whereIn('id', $moving->pluck('id'))->update($payload);

            return ['success' => true, 'message' => 'Séance retirée de la grille (à replacer).', 'board' => $this->board($vId)];
        }

        if ($dayOfWeek === 6) {
            return ['success' => false, 'message' => 'Le samedi est désactivé pour cette campagne.'];
        }

        if ($dayOfWeek < 1 || $dayOfWeek > 5) {
            return ['success' => false, 'message' => 'Jour invalide (lundi–vendredi).'];
        }

        $startTime = $this->normalizeTime($startTime);
        $endTime = $this->normalizeTime($endTime);
        abort_unless($startTime < $endTime, 422, 'Heure de fin invalide.');
        $fromDay = (int) $moving->first()->day_of_week;
        $fromStart = $this->normalizeTime((string) $moving->first()->start_time);
        $fromEnd = $this->normalizeTime((string) $moving->first()->end_time);

        $others = Schedule::query()
            ->where('academic_year_id', $version->academic_year_id)
            ->where('institution_id', $this->contextYear()->institution_id)
            ->whereHas('module', fn ($q) => $q->whereRaw('MOD(semester_number, 2) = ?', [$version->semester()->value('number') % 2]))
            ->where(function ($q) use ($vId) {
                $q->where('schedule_version_id', $vId)
                    ->orWhere('is_active', true);
            })
            ->whereNotIn('id', $this->replacementIdsForVersion($version))
            ->whereNotIn('id', $moving->pluck('id'))
            ->get();

        $swapIds = $this->overlappingResourceIds($moving, $others, $dayOfWeek, $startTime, $endTime);
        if ($others->whereIn('id', $swapIds)->contains(fn ($row) => (int) $row->schedule_version_id !== (int) $vId)) {
            return ['success' => false, 'message' => 'Ce créneau est occupé par un autre planning. Aucune permutation effectuée.'];
        }

        $proposed = $others->map(function (Schedule $row) use ($swapIds, $fromDay, $fromStart, $fromEnd) {
            $clone = $row->replicate();
            $clone->id = $row->id;
            if ($swapIds->contains((int) $row->id)) {
                $clone->day_of_week = $fromDay;
                $clone->start_time = $fromStart;
                $clone->end_time = $fromEnd;
            }

            return $clone;
        });

        $moved = $moving->map(function (Schedule $row) use ($dayOfWeek, $startTime, $endTime, $professorId, $roomId) {
            $clone = $row->replicate();
            $clone->id = $row->id;
            $clone->day_of_week = $dayOfWeek;
            $clone->start_time = $startTime;
            $clone->end_time = $endTime;
            if ($professorId) {
                $clone->professor_id = $professorId;
            }
            if ($roomId) {
                $clone->room_id = $roomId;
            }

            return $clone;
        });

        foreach ($moved as $row) {
            $room = Room::where('institution_id', $this->contextYear()->institution_id)->findOrFail($row->room_id);
            abort_unless($this->rooms->roomOperational($room) && $room->capacity >= $this->rooms->groupsHeadcount([$row->group_id]), 422, 'Salle indisponible ou trop petite.');
            Professor::where('institution_id', $this->contextYear()->institution_id)->where('is_active', true)->findOrFail($row->professor_id);
        }

        $conflicts = $this->hardConflictsFromBlocks($this->groupIntoBlocks($proposed->concat($moved)), $this->replacementIdsForVersion($version));
        if ($conflicts !== []) {
            return [
                'success' => false,
                'message' => $conflicts[0]['message'] ?? 'Conflit détecté (professeur, salle ou groupe).',
                'conflicts' => $conflicts,
            ];
        }

        return DB::transaction(function () use ($moving, $swapIds, $dayOfWeek, $startTime, $endTime, $fromDay, $fromStart, $fromEnd, $vId, $professorId, $roomId) {
            if ($swapIds->isNotEmpty()) {
                DB::table('schedules')->whereIn('id', $swapIds)->update([
                    'day_of_week' => $fromDay,
                    'start_time' => $fromStart,
                    'end_time' => $fromEnd,
                    'updated_at' => now(),
                ]);
            }

            $update = [
                'day_of_week' => $dayOfWeek,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'updated_at' => now(),
            ];
            if ($professorId) {
                $update['professor_id'] = $professorId;
            }
            if ($roomId) {
                $update['room_id'] = $roomId;
            }

            DB::table('schedules')->whereIn('id', $moving->pluck('id'))->update($update);

            $swapped = $swapIds->isNotEmpty();

            return [
                'success' => true,
                'message' => $swapped ? 'Permutation effectuée.' : 'Séance déplacée.',
                'swapped' => $swapped,
                'board' => $this->board($vId),
            ];
        });
    }

    private function addSessionLocked(int $versionId, array $payload): array
    {
        $version = ScheduleVersion::query()->find($versionId);
        $this->assertEditable($version);
        $vId = $version?->id ?? $versionId;

        $groupIds = array_values(array_unique(array_map('intval', $payload['group_ids'] ?? [])));
        if ($groupIds === [] && ! empty($payload['group_id'])) {
            $groupIds = [(int) $payload['group_id']];
        }
        if ($groupIds === []) {
            return ['success' => false, 'message' => 'Choisissez au moins un groupe.'];
        }

        $sessionType = strtolower((string) ($payload['session_type'] ?? 'td'));
        abort_unless(in_array($sessionType, ['cm', 'td', 'tp'], true), 422, 'Type de séance invalide.');
        $module = Module::where('filiere_id', $version->filiere_id)->findOrFail($payload['module_id']);
        abort_unless((int) $module->semester_number % 2 === (int) $version->semester()->value('number') % 2, 422, 'Module hors de la période de cette campagne.');
        $groups = Group::where('academic_year_id', $version->academic_year_id)->where('filiere_id', $version->filiere_id)
            ->where('semester_number', $module->semester_number)->whereIn('id', $groupIds)->get();
        abort_unless($groups->count() === count($groupIds), 422, 'Groupes incompatibles avec le module et son semestre.');
        Professor::where('institution_id', $this->contextYear()->institution_id)->where('is_active', true)->findOrFail($payload['professor_id']);

        $day = (int) ($payload['day_of_week'] ?? 0);
        $start = $this->normalizeTime((string) ($payload['start_time'] ?? '08:30:00'));
        $end = $this->normalizeTime((string) ($payload['end_time'] ?? '10:15:00'));
        if ($day === 6) {
            return ['success' => false, 'message' => 'Le samedi est désactivé.'];
        }
        abort_unless($day >= 0 && $day <= 5 && ($day === 0 || $start < $end), 422, 'Créneau invalide.');

        $room = Room::query()->find((int) $payload['room_id']);
        if (! $room) {
            return ['success' => false, 'message' => 'Salle introuvable.'];
        }

        $institutionId = $this->contextYear()->institution_id;
        abort_unless((int) $room->institution_id === (int) $institutionId && $this->rooms->roomOperational($room), 422, 'Salle indisponible ou hors établissement.');
        $headcount = $this->rooms->groupsHeadcount($groupIds);
        if (! $this->rooms->roomFits($room, ['group_size' => $headcount, 'required_type' => $this->rooms->requiredRoomType($module->name, $sessionType, $headcount)], Room::where('institution_id', $institutionId)->get())) {
            return ['success' => false, 'message' => 'Capacité de salle insuffisante pour les groupes sélectionnés.'];
        }
        $yearId = $version?->academic_year_id ?? (AcademicYear::where('is_current', true)->value('id') ?? 1);
        $semesterId = $version?->semester_id ?? (DB::table('semesters')->value('id') ?? 1);
        $now = now();

        if ($day >= 1) {
            $grid = new TimetableOccupancyGrid;
            $this->rooms->seedOccupancy($grid, $this->replacementIdsForVersion($version));
            if ($grid->roomBusy($day, $start, $end, $room->id) || $grid->professorBusy($day, $start, $end, $payload['professor_id']) || $grid->groupsBusy($day, $start, $end, $groupIds)) {
                return ['success' => false, 'message' => 'Conflit de salle, professeur ou groupe sur ce créneau.'];
            }
            $overlap = Schedule::query()
                ->where('schedule_version_id', $vId)
                ->whereIn('group_id', $groupIds)
                ->where('day_of_week', $day)
                ->where('start_time', '<', $end)
                ->where('end_time', '>', $start)
                ->exists();

            if ($overlap) {
                return ['success' => false, 'message' => 'Ce groupe a déjà une séance sur ce créneau.'];
            }
        }

        foreach ($groupIds as $groupId) {
            $row = [
                'institution_id' => $institutionId,
                'academic_year_id' => $yearId,
                'semester_id' => $semesterId,
                'group_id' => $groupId,
                'module_id' => (int) $payload['module_id'],
                'room_id' => (int) $payload['room_id'],
                'professor_id' => (int) $payload['professor_id'],
                'professor_type' => Professor::class,
                'day_of_week' => $day,
                'start_time' => $day >= 1 ? $start : '00:00:00',
                'end_time' => $day >= 1 ? $end : '00:00:00',
                'session_type' => $sessionType,
                'is_active' => false,
                'schedule_version_id' => $version?->id,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            DB::table('schedules')->insert($row);
        }

        return [
            'success' => true,
            'message' => $day >= 1 ? 'Séance ajoutée sur la grille.' : 'Séance créée — glissez-la sur un créneau.',
            'board' => $this->board($vId),
        ];
    }

    private function deleteSessionLocked(int $versionId, array $scheduleIds): array
    {
        $version = ScheduleVersion::query()->find($versionId);
        $this->assertEditable($version);
        $vId = $version?->id ?? $versionId;

        Schedule::query()
            ->where('schedule_version_id', $vId)
            ->whereIn('id', $scheduleIds)
            ->delete();

        return ['success' => true, 'message' => 'Séance supprimée.', 'board' => $this->board($vId)];
    }

    /**
     * @param  Collection<int, Schedule>  $rows
     * @return list<array<string, mixed>>
     */
    private function groupIntoBlocks(Collection $rows): array
    {
        $grouped = [];
        foreach ($rows as $row) {
            $day = (int) $row->day_of_week;
            $start = $this->normalizeTime((string) $row->start_time);
            $end = $this->normalizeTime((string) $row->end_time);
            $sessionType = strtolower((string) $row->session_type);
            $cohortKey = $sessionType === 'cm' ? 'cm' : 'g'.$row->group_id;
            $key = implode('|', [
                $sessionType,
                $cohortKey,
                (string) $row->module_id,
                (string) $row->professor_id,
                (string) $day,
                substr($start, 0, 5),
                substr($end, 0, 5),
                (string) $row->room_id,
            ]);
            if (! isset($grouped[$key])) {
                $slot = $this->resolveTimeBlock($start, $end);
                $grouped[$key] = [
                    'block_id' => $key,
                    'schedule_ids' => [],
                    'day_of_week' => $day,
                    'start_time' => $slot['start'] ?? $start,
                    'end_time' => $slot['end'] ?? $end,
                    'actual_start_time' => $start,
                    'actual_end_time' => $end,
                    'slot_index' => $slot['slot_index'] ?? null,
                    'session_type' => strtolower((string) $row->session_type),
                    'module_id' => $row->module_id,
                    'module_name' => $row->module?->name ?? ('Module #'.$row->module_id),
                    'professor_id' => $row->professor_id,
                    'professor_name' => $this->professorDisplayName((int) $row->professor_id),
                    'room_id' => $row->room_id,
                    'room_name' => $row->room?->name ?? ('Salle #'.$row->room_id),
                    'group_ids' => [],
                    'group_names' => [],
                    'unplaced' => $day < 1,
                    'off_slot' => $day >= 1 && $slot === null,
                ];
            }
            $grouped[$key]['schedule_ids'][] = (int) $row->id;
            $grouped[$key]['group_ids'][] = (int) $row->group_id;
            $name = $row->group?->name ?? ('G'.$row->group_id);
            if (! in_array($name, $grouped[$key]['group_names'], true)) {
                $grouped[$key]['group_names'][] = $name;
            }
        }

        return array_values(array_map(function (array $block) {
            $block['group_ids'] = array_values(array_unique($block['group_ids']));
            $block['group_label'] = implode(' + ', $block['group_names']);

            return $block;
        }, $grouped));
    }

    /**
     * @param  list<array<string, mixed>>  $blocks
     * @return list<array{message: string}>
     */
    private function replacementIdsForVersion(?ScheduleVersion $version): array
    {
        return $version ? $this->legacyReplacementIds($version->filiere_id, $version->academic_year_id, $version->semester()->value('number') % 2) : [];
    }

    private function legacyReplacementIds(int $filiereId, int $yearId, int $parity): array
    {
        return Schedule::where('institution_id', $this->contextYear()->institution_id)->where('academic_year_id', $yearId)
            ->whereNull('schedule_version_id')->where('is_active', true)
            ->whereHas('module', fn ($q) => $q->where('filiere_id', $filiereId)->whereRaw('MOD(semester_number, 2) = ?', [$parity]))->pluck('id')->all();
    }

    private function hardConflictsFromBlocks(array $blocks, array $except = []): array
    {
        $grid = new TimetableOccupancyGrid;
        foreach ($blocks as $block) {
            foreach ($block['schedule_ids'] ?? [] as $id) {
                if ((int) $id > 0) {
                    $except[] = (int) $id;
                }
            }
        }
        $this->rooms->seedOccupancy($grid, $except);
        $conflicts = [];
        $availability = ProfessorAvailabilityService::map();
        foreach ($blocks as $block) {
            $day = (int) $block['day_of_week'];
            if ($day < 1) {
                continue;
            }
            if ($day === 6) {
                $conflicts[] = ['message' => 'Une séance est placée le samedi.'];

                continue;
            }
            $start = $this->normalizeTime((string) ($block['actual_start_time'] ?? $block['start_time']));
            $end = $this->normalizeTime((string) ($block['actual_end_time'] ?? $block['end_time']));
            $professorId = $block['professor_id'];
            $roomId = $block['room_id'];
            $groupIds = $block['group_ids'] ?? [];
            $label = $block['module_name'] ?? 'Séance';
            if (! ProfessorAvailabilityService::allows($availability, (int) $professorId, $day, $start, $end)) {
                $conflicts[] = ['message' => "Indisponibilité déclarée de l’enseignant : {$label}."];
            }

            if ($grid->professorBusy($day, $start, $end, $professorId)) {
                $conflicts[] = ['message' => "Conflit professeur : {$label} chevauche un autre cours."];
            } elseif ($grid->roomBusy($day, $start, $end, $roomId)) {
                $conflicts[] = ['message' => "Conflit salle : {$label} utilise une salle déjà occupée."];
            } elseif ($grid->groupsBusy($day, $start, $end, $groupIds)) {
                $conflicts[] = ['message' => "Conflit groupe : {$label} chevauche un CM/TD du même groupe."];
            }

            $grid->occupy($day, 0, $start, $end, $professorId, $groupIds, $roomId);
        }

        return $conflicts;
    }

    /**
     * @param  Collection<int, Schedule>  $moving
     * @param  Collection<int, Schedule>  $others
     * @return Collection<int, int>
     */
    private function overlappingResourceIds(Collection $moving, Collection $others, int $day, string $start, string $end): Collection
    {
        $s = TimetableOccupancyGrid::minutes($start);
        $e = TimetableOccupancyGrid::minutes($end);
        $profIds = $moving->pluck('professor_id')->map(fn ($id) => (string) $id)->all();
        $roomIds = $moving->pluck('room_id')->map(fn ($id) => (string) $id)->all();
        $groupIds = $moving->pluck('group_id')->map(fn ($id) => (string) $id)->all();

        $hit = [];
        foreach ($others as $row) {
            if ((int) $row->day_of_week !== $day) {
                continue;
            }
            $os = TimetableOccupancyGrid::minutes($this->normalizeTime((string) $row->start_time));
            $oe = TimetableOccupancyGrid::minutes($this->normalizeTime((string) $row->end_time));
            if (! TimetableOccupancyGrid::intervalsOverlap($s, $e, $os, $oe)) {
                continue;
            }
            $shares = in_array((string) $row->professor_id, $profIds, true)
                || in_array((string) $row->room_id, $roomIds, true)
                || in_array((string) $row->group_id, $groupIds, true);
            if ($shares) {
                $hit[] = (int) $row->id;
            }
        }

        return collect(array_values(array_unique($hit)));
    }

    private function professorConfirmationStats(int $versionId): array
    {
        $sessionCount = Schedule::query()->where('schedule_version_id', $versionId)->count();
        $stats = [
            'total' => 0,
            'confirmed' => 0,
            'pending' => 0,
            'refused' => 0,
            'sessions' => $sessionCount,
        ];

        $query = Schedule::query()
            ->where('schedule_version_id', $versionId)
            ->whereNotNull('professor_id')
            ->select('professor_id');

        if (Schema::hasColumn('schedules', 'confirmation_status')) {
            $query->addSelect(DB::raw("SUM(CASE WHEN confirmation_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_n"))
                ->addSelect(DB::raw("SUM(CASE WHEN confirmation_status = 'refused' THEN 1 ELSE 0 END) as refused_n"))
                ->addSelect(DB::raw('COUNT(*) as n'))
                ->groupBy('professor_id');
            $rows = $query->get();
            $stats['total'] = $rows->count();
            foreach ($rows as $row) {
                $n = (int) $row->n;
                if ($n > 0 && (int) $row->confirmed_n === $n) {
                    $stats['confirmed']++;
                } elseif ((int) $row->refused_n > 0 && (int) $row->confirmed_n === 0) {
                    $stats['refused']++;
                } else {
                    $stats['pending']++;
                }
            }

            return $stats;
        }

        $stats['total'] = (int) $query->distinct()->count('professor_id');
        $stats['pending'] = $stats['total'];

        return $stats;
    }

    /**
     * @param  array<int, mixed>  $onBoardIds
     * @return Collection<int, array{id: int, name: string}>
     */
    private function filiereProfessors(int $filiereId, array $onBoardIds): Collection
    {
        $moduleIds = Module::query()->where('filiere_id', $filiereId)->pluck('id');
        $assignedIds = [];
        if (Schema::hasTable('module_professor') && $moduleIds->isNotEmpty()) {
            $assignedIds = DB::table('module_professor')->whereIn('module_id', $moduleIds)->pluck('professor_id')->all();
        }
        $ids = array_values(array_unique(array_filter(array_merge($assignedIds, $onBoardIds), fn ($id) => (int) $id > 0)));

        $query = Professor::query()->where('institution_id', $this->contextYear()?->institution_id)->with('user:id,first_name,last_name')->where('is_active', true)->orderBy('id');
        if ($ids !== []) {
            $query->whereIn('id', $ids);
        } else {
            $query->limit(40);
        }

        return $query->get()->map(fn (Professor $p) => [
            'id' => $p->id,
            'name' => trim(($p->user?->first_name ?? '').' '.($p->user?->last_name ?? '')) ?: ('Prof #'.$p->id),
        ]);
    }

    /**
     * @return array{slot_index: int, start: string, end: string, label: string}|null
     */
    private function resolveTimeBlock(string $start, string $end): ?array
    {
        $s = TimetableOccupancyGrid::minutes($start);
        foreach (SmartSchedulingEngine::TIME_BLOCKS as $block) {
            $bs = TimetableOccupancyGrid::minutes($block['start']);
            $be = TimetableOccupancyGrid::minutes($block['end']);
            if ($s === $bs || ($s >= $bs && $s < $be)) {
                return $block;
            }
        }

        $best = null;
        $bestDist = PHP_INT_MAX;
        foreach (SmartSchedulingEngine::TIME_BLOCKS as $block) {
            $dist = abs(TimetableOccupancyGrid::minutes($block['start']) - $s);
            if ($dist < $bestDist && $dist <= 90) {
                $bestDist = $dist;
                $best = $block;
            }
        }

        return $best;
    }

    private function normalizeTime(string $time): string
    {
        $time = trim($time);
        if (preg_match('/(\d{1,2}):(\d{2})(?::(\d{2}))?/', $time, $m)) {
            return sprintf('%02d:%02d:%02d', (int) $m[1], (int) $m[2], (int) ($m[3] ?? 0));
        }
        if (strlen($time) === 5) {
            return $time.':00';
        }

        return substr($time, 0, 8);
    }

    private function professorDisplayName(int $professorId): string
    {
        $professor = Professor::query()->with('user:id,first_name,last_name')->find($professorId);

        $name = trim(($professor?->user?->first_name ?? '').' '.($professor?->user?->last_name ?? ''));

        return $name !== '' ? $name : 'Enseignant';
    }
}

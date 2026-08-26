<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\EdtCampaign;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Module;
use App\Models\Professor;
use App\Models\Room;
use App\Models\Schedule;
use App\Models\ScheduleVersion;
use App\Models\Semester;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class TimetableCampaignService
{
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
        $year = AcademicYear::query()->where('is_current', true)->first()
            ?? AcademicYear::query()->orderByDesc('id')->first();
        $semester = Semester::query()->where('is_current', true)->first();
        $campaignCode = $this->inferCampaign($semester);

        $campaign = null;
        if ($year && Schema::hasTable('edt_campaigns')) {
            $campaign = EdtCampaign::query()
                ->where('academic_year_id', $year->id)
                ->where('campaign', $campaignCode)
                ->first();
        }

        $filieres = Filiere::query()->orderBy('code')->get(['id', 'name', 'code']);
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
        ];
    }

    public function openCampaign(int $userId, bool $allowSaturday = false): EdtCampaign
    {
        $year = AcademicYear::query()->where('is_current', true)->firstOrFail();
        $semester = Semester::query()->where('is_current', true)->first();
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

    public function generateDraft(int $filiereId, array $params = []): array
    {
        $workspace = $this->workspace();
        if (! $workspace['campaign_open']) {
            return [
                'success' => false,
                'message' => 'La campagne EDT de ce semestre n\'est pas ouverte. Ouvrez-la (1 fois à l\'automne, 1 fois au printemps).',
            ];
        }

        $campaign = EdtCampaign::query()->findOrFail($workspace['campaign_id']);
        $includeSaturday = (bool) ($params['include_saturday'] ?? $campaign->allow_saturday);

        $result = $this->engine->simulate(array_merge($params, [
            'filiere_id' => $filiereId,
            'include_saturday' => $includeSaturday,
            'semester_id' => $workspace['semester']['id'] ?? null,
        ]));

        if (empty($result['scheduled_sessions'])) {
            return [
                'success' => false,
                'message' => 'Aucune séance générée. Vérifiez les modules, groupes et salles de la filière.',
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
                    ],
                ]
            );

            Schedule::query()->where('schedule_version_id', $version->id)->delete();

            $groupIds = Group::query()->where('filiere_id', $filiereId)->pluck('id');
            if (Schema::hasColumn('schedules', 'schedule_version_id')) {
                Schedule::query()
                    ->whereIn('group_id', $groupIds)
                    ->where('academic_year_id', $yearId)
                    ->where(function ($q) {
                        $q->whereNull('schedule_version_id')
                            ->orWhereHas('version', fn ($v) => $v->where('status', 'DRAFT'));
                    })
                    ->where('is_active', false)
                    ->delete();
            }

            $inserted = 0;
            foreach ($result['scheduled_sessions'] as $session) {
                foreach ($session['occupied_group_ids'] ?? [$session['group_id']] as $groupId) {
                    $row = [
                        'institution_id' => 1,
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

    public function propose(int $versionId): array
    {
        $version = ScheduleVersion::query()->findOrFail($versionId);
        if (! in_array($version->status, ['DRAFT', 'PROPOSED'], true)) {
            return ['success' => false, 'message' => 'Seuls les brouillons peuvent être proposés aux enseignants.'];
        }
        $version->update(['status' => 'PROPOSED']);
        if (Schema::hasColumn('schedules', 'confirmation_status')) {
            Schedule::query()->where('schedule_version_id', $version->id)->update([
                'confirmation_status' => 'pending',
                'confirmed_at' => null,
            ]);
        }

        return [
            'success' => true,
            'message' => 'Proposition envoyée aux enseignants. Ils confirment leurs séances ; l\'EDT reste un brouillon pour les étudiants.',
            'status' => 'PROPOSED',
        ];
    }

    public function publish(int $versionId): array
    {
        $version = ScheduleVersion::query()->findOrFail($versionId);
        if ($version->status === 'PUBLISHED') {
            return ['success' => true, 'message' => 'Cette version est déjà publiée.'];
        }

        ScheduleVersion::query()
            ->where('edt_campaign_id', $version->edt_campaign_id)
            ->where('filiere_id', $version->filiere_id)
            ->where('id', '!=', $version->id)
            ->where('status', 'PUBLISHED')
            ->update(['status' => 'ARCHIVED']);

        $version->update(['status' => 'PUBLISHED']);
        Schedule::query()->where('schedule_version_id', $version->id)->update(['is_active' => true]);

        return [
            'success' => true,
            'message' => 'Emploi du temps officiel publié : visible étudiants et application mobile.',
            'status' => 'PUBLISHED',
        ];
    }

    public function confirmSession(int $scheduleId, int $professorId, string $decision, ?string $note = null): array
    {
        $session = Schedule::query()->findOrFail($scheduleId);
        if ((int) $session->professor_id !== $professorId) {
            return ['success' => false, 'message' => 'Cette séance ne vous est pas affectée.'];
        }
        $version = $session->version;
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

    public function board(int $versionId): array
    {
        $version = ScheduleVersion::query()->with('filiere')->findOrFail($versionId);
        $rows = Schedule::query()
            ->with(['group', 'module', 'room'])
            ->where('schedule_version_id', $version->id)
            ->get();

        $blocks = $this->groupIntoBlocks($rows);
        $conflicts = $this->hardConflictsFromBlocks($blocks);

        $filiereId = (int) $version->filiere_id;
        $groups = Group::query()->where('filiere_id', $filiereId)->orderBy('name')->get(['id', 'name']);
        $modules = Module::query()->where('filiere_id', $filiereId)->orderBy('name')->get(['id', 'name', 'code']);
        $rooms = Room::query()->orderBy('capacity')->limit(200)->get(['id', 'name', 'code', 'type', 'capacity']);
        $professors = $this->filiereProfessors($filiereId, $rows->pluck('professor_id')->all());

        return [
            'version_id' => $version->id,
            'filiere_id' => $filiereId,
            'filiere_code' => $version->filiere?->code,
            'filiere_name' => $version->filiere?->name,
            'status' => $version->status,
            'editable' => in_array($version->status, ['DRAFT', 'PROPOSED'], true),
            'days' => collect(SmartSchedulingEngine::DAYS)->except(6)->all(),
            'slots' => SmartSchedulingEngine::TIME_BLOCKS,
            'blocks' => $blocks,
            'conflicts' => $conflicts,
            'catalog' => [
                'groups' => $groups,
                'modules' => $modules,
                'rooms' => $rooms,
                'professors' => $professors,
            ],
        ];
    }

    public function moveBlock(int $versionId, array $scheduleIds, int $dayOfWeek, string $startTime, string $endTime, bool $unplace = false, array $attributes = []): array
    {
        $version = ScheduleVersion::query()->findOrFail($versionId);
        if (! in_array($version->status, ['DRAFT', 'PROPOSED'], true)) {
            return ['success' => false, 'message' => 'L\'EDT publié ne se déplace plus ici. Créez un nouveau brouillon.'];
        }

        $moving = Schedule::query()
            ->where('schedule_version_id', $version->id)
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

            return ['success' => true, 'message' => 'Séance retirée de la grille (à replacer).', 'board' => $this->board($version->id)];
        }

        if ($dayOfWeek === 6) {
            return ['success' => false, 'message' => 'Le samedi est désactivé pour cette campagne.'];
        }

        if ($dayOfWeek < 1 || $dayOfWeek > 5) {
            return ['success' => false, 'message' => 'Jour invalide (lundi–vendredi).'];
        }

        $startTime = $this->normalizeTime($startTime);
        $endTime = $this->normalizeTime($endTime);
        $fromDay = (int) $moving->first()->day_of_week;
        $fromStart = $this->normalizeTime((string) $moving->first()->start_time);
        $fromEnd = $this->normalizeTime((string) $moving->first()->end_time);

        $others = Schedule::query()
            ->where('schedule_version_id', $version->id)
            ->whereNotIn('id', $moving->pluck('id'))
            ->get();

        $swapIds = $this->overlappingResourceIds($moving, $others, $dayOfWeek, $startTime, $endTime);

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

        $conflicts = $this->hardConflictsFromBlocks($this->groupIntoBlocks($proposed->concat($moved)));
        if ($conflicts !== []) {
            return [
                'success' => false,
                'message' => $conflicts[0]['message'] ?? 'Conflit détecté (professeur, salle ou groupe).',
                'conflicts' => $conflicts,
            ];
        }

        return DB::transaction(function () use ($moving, $swapIds, $dayOfWeek, $startTime, $endTime, $fromDay, $fromStart, $fromEnd, $version, $professorId, $roomId) {
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
                'board' => $this->board($version->id),
            ];
        });
    }

    public function addSession(int $versionId, array $payload): array
    {
        $version = ScheduleVersion::query()->findOrFail($versionId);
        if (! in_array($version->status, ['DRAFT', 'PROPOSED'], true)) {
            return ['success' => false, 'message' => 'Impossible d\'ajouter une séance sur un EDT publié.'];
        }

        $groupIds = array_values(array_unique(array_map('intval', $payload['group_ids'] ?? [])));
        if ($groupIds === [] && ! empty($payload['group_id'])) {
            $groupIds = [(int) $payload['group_id']];
        }
        if ($groupIds === []) {
            return ['success' => false, 'message' => 'Choisissez au moins un groupe.'];
        }

        $sessionType = strtolower((string) ($payload['session_type'] ?? 'td'));
        if ($sessionType === 'cm' && count($groupIds) === 1) {
            $allGroups = Group::query()->where('filiere_id', $version->filiere_id)->pluck('id')->map(fn ($id) => (int) $id)->all();
            if (count($allGroups) > 1) {
                $groupIds = $allGroups;
            }
        }

        $day = (int) ($payload['day_of_week'] ?? 0);
        $start = $this->normalizeTime((string) ($payload['start_time'] ?? '08:30:00'));
        $end = $this->normalizeTime((string) ($payload['end_time'] ?? '10:30:00'));
        if ($day === 6) {
            return ['success' => false, 'message' => 'Le samedi est désactivé.'];
        }

        $room = Room::query()->find((int) $payload['room_id']);
        if (! $room) {
            return ['success' => false, 'message' => 'Salle introuvable.'];
        }
        $headcount = $this->rooms->groupsHeadcount($groupIds);
        $var = [
            'session_type' => $sessionType,
            'occupied_group_ids' => $groupIds,
            'group_size' => $headcount,
            'required_type' => ($sessionType === 'cm' && count($groupIds) > 1) ? 'amphitheater' : 'classroom',
        ];
        if (! $this->rooms->roomFits($room, $var, Room::query()->get())) {
            return [
                'success' => false,
                'message' => $sessionType === 'cm' && count($groupIds) > 1
                    ? "Cette salle ({$room->name}, {$room->capacity} places) est trop petite pour le CM des deux groupes ({$headcount} étudiants). Choisissez un amphi."
                    : "Cette salle ({$room->name}, {$room->capacity} places) ne convient pas à l'effectif ({$headcount} étudiants).",
            ];
        }
        if ($day >= 1 && $this->rooms->roomBusyInWorld((int) $room->id, $day, $start, $end)) {
            return ['success' => false, 'message' => "La salle {$room->name} est déjà prise le même créneau (cours ou réservation)."];
        }

        $draft = Schedule::query()->where('schedule_version_id', $version->id)->get();
        if ($day >= 1) {
            $ghosts = collect($groupIds)->map(function (int $groupId) use ($payload, $day, $start, $end, $sessionType) {
                $row = new Schedule;
                $row->id = 0;
                $row->group_id = $groupId;
                $row->module_id = $payload['module_id'];
                $row->professor_id = $payload['professor_id'];
                $row->room_id = $payload['room_id'];
                $row->day_of_week = $day;
                $row->start_time = $start;
                $row->end_time = $end;
                $row->session_type = $sessionType;

                return $row;
            });
            $conflicts = $this->hardConflictsFromBlocks($this->groupIntoBlocks($draft->concat($ghosts)));
            if ($conflicts !== []) {
                return ['success' => false, 'message' => $conflicts[0]['message'], 'conflicts' => $conflicts];
            }
        }

        $yearId = (int) $version->academic_year_id;
        $semesterId = (int) $version->semester_id;
        $now = now();

        foreach ($groupIds as $groupId) {
            $row = [
                'institution_id' => 1,
                'academic_year_id' => $yearId,
                'semester_id' => $semesterId,
                'group_id' => $groupId,
                'module_id' => (int) $payload['module_id'],
                'room_id' => (int) $payload['room_id'],
                'professor_id' => (int) $payload['professor_id'],
                'professor_type' => Professor::class,
                'day_of_week' => $day,
                'start_time' => $start,
                'end_time' => $end,
                'session_type' => $sessionType,
                'is_active' => false,
                'schedule_version_id' => $version->id,
                'created_at' => $now,
                'updated_at' => $now,
            ];
            if (Schema::hasColumn('schedules', 'uuid')) {
                $row['uuid'] = (string) Str::uuid();
            }
            if (Schema::hasColumn('schedules', 'confirmation_status')) {
                $row['confirmation_status'] = 'pending';
            }
            if (Schema::hasColumn('schedules', 'version')) {
                $row['version'] = 1;
            }
            DB::table('schedules')->insert($row);
        }

        return [
            'success' => true,
            'message' => $day >= 1 ? 'Séance ajoutée sur la grille.' : 'Séance créée — glissez-la sur un créneau.',
            'board' => $this->board($version->id),
        ];
    }

    public function deleteSession(int $versionId, array $scheduleIds): array
    {
        $version = ScheduleVersion::query()->findOrFail($versionId);
        if (! in_array($version->status, ['DRAFT', 'PROPOSED'], true)) {
            return ['success' => false, 'message' => 'Impossible de supprimer une séance publiée ici.'];
        }

        Schedule::query()
            ->where('schedule_version_id', $version->id)
            ->whereIn('id', $scheduleIds)
            ->delete();

        return ['success' => true, 'message' => 'Séance supprimée.', 'board' => $this->board($version->id)];
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
    private function hardConflictsFromBlocks(array $blocks): array
    {
        $grid = new TimetableOccupancyGrid;
        $except = [];
        foreach ($blocks as $block) {
            foreach ($block['schedule_ids'] ?? [] as $id) {
                if ((int) $id > 0) {
                    $except[] = (int) $id;
                }
            }
        }
        $this->rooms->seedOccupancy($grid, $except);
        $conflicts = [];
        foreach ($blocks as $block) {
            $day = (int) $block['day_of_week'];
            if ($day < 1) {
                continue;
            }
            if ($day === 6) {
                $conflicts[] = ['message' => 'Une séance est placée le samedi.'];

                continue;
            }
            $start = $this->normalizeTime((string) $block['start_time']);
            $end = $this->normalizeTime((string) $block['end_time']);
            $professorId = $block['professor_id'];
            $roomId = $block['room_id'];
            $groupIds = $block['group_ids'] ?? [];
            $label = $block['module_name'] ?? 'Séance';

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

        $query = Professor::query()->with('user:id,first_name,last_name')->where('is_active', true)->orderBy('id');
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

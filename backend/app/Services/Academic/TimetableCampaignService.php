<?php

namespace App\Services\Academic;

use App\Models\AcademicYear;
use App\Models\EdtCampaign;
use App\Models\Filiere;
use App\Models\Group;
use App\Models\Schedule;
use App\Models\ScheduleVersion;
use App\Models\Semester;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class TimetableCampaignService
{
    public function __construct(private SmartSchedulingEngine $engine) {}

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
            $stats = ['total' => 0, 'confirmed' => 0, 'pending' => 0, 'refused' => 0];
            if ($version && Schema::hasColumn('schedules', 'confirmation_status')) {
                $rows = Schedule::query()->where('schedule_version_id', $version->id)
                    ->selectRaw('confirmation_status, count(*) as agg')
                    ->groupBy('confirmation_status')
                    ->pluck('agg', 'confirmation_status');
                $stats['confirmed'] = (int) ($rows['confirmed'] ?? 0);
                $stats['pending'] = (int) ($rows['pending'] ?? 0);
                $stats['refused'] = (int) ($rows['refused'] ?? 0);
                $stats['total'] = $stats['confirmed'] + $stats['pending'] + $stats['refused'];
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
                    'version_name' => 'Brouillon '.$this->campaignLabel($campaign->campaign),
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
}

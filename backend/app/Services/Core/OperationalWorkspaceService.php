<?php

namespace App\Services\Core;

use App\Models\{AcademicYear, DocumentRequest, ExamSeating, ExamSurveillance, Student, StudentRegistration, User};
use Illuminate\Support\Facades\DB;

class OperationalWorkspaceService
{
    public function isStaff(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director', 'scolarite']);
    }

    public function requests(User $user)
    {
        return DocumentRequest::query()->whereHas('student', fn ($q) => $q->where('institution_id', $user->institution_id)
            ->when(! $this->isStaff($user), fn ($q) => $q->where('user_id', $user->id)));
    }

    public function snapshot(User $user): array
    {
        $staff = $this->isStaff($user);
        $requests = $this->requests($user)->with('documentType', 'student.user')->latest()->limit(50)->get();
        $tasks = [
            ['label' => 'Notifications non lues', 'count' => $user->unreadNotifications()->count(), 'url' => '/notifications'],
            ['label' => $staff ? 'Demandes à traiter' : 'Mes demandes en cours', 'count' => $this->requests($user)->whereIn('status', ['pending', 'processing'])->count(), 'url' => $staff ? '/admin/guichet' : '/student/documents'],
        ];
        $upcoming = ExamSurveillance::where('professor_id', $user->id)->whereHas('exam', fn ($q) => $q->whereDate('exam_date', '>=', today())->whereHas('examSession', fn ($s) => $s->where('institution_id', $user->institution_id)))->count();
        if ($user->hasAnyRole(['professor', 'professeur', 'vacataire'])) {
            $tasks[] = ['label' => 'Surveillances à venir', 'count' => $upcoming, 'url' => '/professor/proctor-convocations'];
            $tasks[] = ['label' => 'Mes demandes enseignant en cours', 'count' => \App\Models\ProfessorDocumentRequest::where('user_id', $user->id)->whereIn('status', ['pending', 'processing'])->count(), 'url' => '/professor/documents'];
        }
        if ($user->hasAnyRole(['student', 'etudiant'])) {
            $tasks[] = ['label' => 'Convocations à venir', 'count' => ExamSeating::whereHas('student', fn ($q) => $q->where('user_id', $user->id)->where('institution_id', $user->institution_id))->where('status', 'sent')->whereHas('exam', fn ($q) => $q->whereDate('exam_date', '>=', today()))->count(), 'url' => '/student/convocations'];
        }
        $followups = DB::table('operational_request_followups')->whereIn('document_request_id', $requests->pluck('id'))->get()->keyBy('document_request_id');
        $data = [
            'staff' => $staff, 'tasks' => $tasks, 'generated_at' => now()->toIso8601String(),
            'requests' => $requests->map(function ($row) use ($followups, $staff) {
                $follow = $followups->get($row->id);
                return ['id' => $row->id, 'label' => $row->documentType?->name ?? 'Document', 'person' => $row->student?->user?->name,
                    'status' => $row->status, 'requested_at' => $row->requested_at ?? $row->created_at,
                    'email_state' => ($row->admin_notes['email_sent'] ?? false) ? 'accepted' : (! empty($row->admin_notes['email_error']) ? 'failed' : 'unknown'),
                    'assigned_to' => $follow?->assigned_to, 'due_at' => $follow?->due_at,
                    'overdue' => $follow?->due_at && now()->gt($follow->due_at) && in_array($row->status, ['pending', 'processing'], true),
                    'revision' => $staff ? (int) ($follow?->version ?? 0) : null];
            }),
        ];
        if ($staff) {
            try { $data['backup'] = app(VerifiedDatabaseBackupService::class)->latestStatus(); }
            catch (\Throwable $e) { report($e); $data['backup'] = ['error' => 'État des sauvegardes indisponible.']; }
            $year = AcademicYear::where('institution_id', $user->institution_id)->where('is_current', true)->first();
            $students = Student::where('institution_id', $user->institution_id);
            $duplicateCnes = (clone $students)->whereNotNull('cne')->where('cne', '!=', '')->selectRaw('LOWER(TRIM(cne)) as normalized, COUNT(*) as total')->groupByRaw('LOWER(TRIM(cne))')->havingRaw('COUNT(*) > 1')->get();
            $data['quality'] = [
                'duplicate_cne_groups' => $duplicateCnes->count(),
                'missing_cne' => (clone $students)->where(fn ($q) => $q->whereNull('cne')->orWhereRaw("TRIM(cne) = ''"))->count(),
                'registrations_without_group' => $year ? StudentRegistration::where('academic_year_id', $year->id)->whereNull('group_id')->whereIn('status', ['academic_validated', 'admin_validated', 'validated'])->whereHas('student', fn ($q) => $q->where('institution_id', $user->institution_id))->count() : null,
                'academic_year' => $year?->displayLabel(),
                'duplicate_cne_samples' => $duplicateCnes->take(10)->map(fn ($row) => ['cne' => $row->normalized, 'count' => (int) $row->total])->values(),
                'missing_cne_ids' => (clone $students)->where(fn ($q) => $q->whereNull('cne')->orWhereRaw("TRIM(cne) = ''"))->limit(10)->pluck('id'),
            ];
            $data['agents'] = User::where('institution_id', $user->institution_id)->where('is_active', true)->get()->filter(fn ($agent) => $this->isStaff($agent))->map(fn ($agent) => $agent->only('id', 'name'))->values();
            $data['notification_activity'] = DB::table('notifications')->where('type', \App\Notifications\SystemNotification::class)->where('notifiable_type', (new User)->getMorphClass())->whereIn('notifiable_id', User::where('institution_id', $user->institution_id)->select('id'))->latest()->limit(30)->get(['id', 'notifiable_id', 'data', 'read_at', 'created_at'])->map(function ($row) { $row->data = json_decode($row->data, true); return $row; });
            $data['transport_logs'] = \App\Models\NotificationLog::whereHas('user', fn ($q) => $q->where('institution_id', $user->institution_id))->latest()->limit(30)->get(['id', 'type', 'recipient', 'status', 'created_at']);
        }
        return $data;
    }
}

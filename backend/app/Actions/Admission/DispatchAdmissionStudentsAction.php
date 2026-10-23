<?php
namespace App\Actions\Admission;
use App\Models\{AdmissionCampaign, Application, Group, StudentPathway, StudentRegistration};
use App\Support\AdmissionAccess;
use Illuminate\Support\Facades\DB;
final class DispatchAdmissionStudentsAction
{
    public function execute(AdmissionCampaign $campaign): int
    {
        abort_unless(AdmissionAccess::staff(auth()->user()), 403);
        return DB::transaction(function () use ($campaign) {
            $campaign = AdmissionCampaign::whereKey($campaign->id)->lockForUpdate()->firstOrFail();
            abort_unless((int) $campaign->institution_id === (int) auth()->user()->institution_id, 403);
            abort_if(\App\Models\AcademicYear::findOrFail($campaign->academic_year_id)->is_locked, 422, 'Année verrouillée.');
            $groups = Group::where('filiere_id', $campaign->filiere_id)->where('academic_year_id', $campaign->academic_year_id)->where('semester_number', $campaign->entry_semester)->orderBy('id')->lockForUpdate()->get();
            abort_if($groups->isEmpty(), 422, 'Configurez les groupes et leurs capacités pour le niveau d’entrée de cette campagne.');
            $ids = Application::where('admission_campaign_id', $campaign->id)->where('dossier_status', 'approved')->whereNotNull('student_id')->pluck('student_id');
            $pending = StudentPathway::with('student.user')->whereIn('student_id', $ids)->where('academic_year_id', $campaign->academic_year_id)->where('filiere_id', $campaign->filiere_id)->where('current_semester', $campaign->entry_semester)->where('is_current', true)->whereNull('group_id')->orderBy('student_id')->lockForUpdate()->get()->sortBy(fn ($p) => mb_strtolower(($p->student->user->last_name ?? '').' '.($p->student->user->first_name ?? '').' '.$p->student_id))->values();
            $loads = [];
            foreach ($groups as $group) $loads[$group->id] = StudentPathway::where('academic_year_id', $campaign->academic_year_id)->where('group_id', $group->id)->where('is_current', true)->count();
            $free = $groups->sum(fn ($g) => max(0, (int) $g->capacity - $loads[$g->id]));
            abort_if($pending->count() > $free, 422, 'Places disponibles insuffisantes : aucune affectation effectuée.');
            $touched = [];
            foreach ($pending as $pathway) {
                $group = $groups->filter(fn ($g) => $loads[$g->id] < (int) $g->capacity)->sortBy(fn ($g) => $loads[$g->id])->first();
                $registration = StudentRegistration::where('student_id', $pathway->student_id)->where('academic_year_id', $campaign->academic_year_id)->where('semester_number', $campaign->entry_semester)->where('filiere_id', $campaign->filiere_id)->where('registration_type', 'initial')->where('status', 'admin_validated')->lockForUpdate()->firstOrFail();
                $pathway->update(['group_id' => $group->id]); $registration->update(['group_id' => $group->id]);
                $loads[$group->id]++; $touched[$group->id] = $group;
            }
            foreach ($touched as $group) app(\App\Services\Academic\StudentSubGroupDispatcherService::class)->dispatchGroup($group);
            activity()->causedBy(auth()->user())->performedOn($campaign)->withProperties(['count' => $pending->count()])->log('admission_students_dispatched');
            return $pending->count();
        });
    }
}
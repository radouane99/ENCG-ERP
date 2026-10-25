<?php

namespace App\Services\Academic;

use App\Actions\Academic\ConfirmStudentRenewalAction;
use App\Domain\Admission\AdmissionEntryRules;
use App\Models\AcademicYear;
use App\Models\Application;
use App\Models\Assessment;
use App\Models\DocumentRequest;
use App\Models\Grade;
use App\Models\Group;
use App\Models\Internship;
use App\Models\ModuleProfessor;
use App\Models\ModulePvSignature;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\StudentRegistration;
use App\Models\User;
use App\Services\Security\ClassroomAccessService;
use App\Support\InternshipAccess;
use Illuminate\Support\Facades\DB;

class UserActionCenterService
{
    public function professor(User $user, ?int $groupId = null): array
    {
        $year = AcademicYear::where('institution_id', $user->institution_id)->where('is_current', true)->first();
        $profile = $user->professor;
        if (! $year || ! $profile || (int) $profile->institution_id !== (int) $user->institution_id) {
            return ['items' => [], 'academic_year' => $year?->label, 'message' => 'Affectations de l’année courante à vérifier.'];
        }
        $assignments = ModuleProfessor::with('module')->where('professor_id', $profile->id)->where('academic_year_id', $year->id)
            ->whereHas('module', fn ($q) => $q->where('institution_id', $user->institution_id))->orderBy('id')->limit(51)->get();
        $items = [];
        $seen = [];
        $limited = $assignments->count() > 50;
        foreach ($assignments->take(50) as $assignment) {
            $module = $assignment->module;
            $groups = Group::where('academic_year_id', $year->id)->where('filiere_id', $module->filiere_id)->where('semester_number', $module->semester_number)
                ->when($assignment->group_id, fn ($q) => $q->whereKey($assignment->group_id))->when($groupId, fn ($q) => $q->whereKey($groupId))->limit(30)->get();
            foreach ($groups as $group) {
                if (isset($seen[$module->id.':'.$group->id])) {
                    continue;
                }
                if (count($seen) >= 30) {
                    $limited = true;
                    break 2;
                }
                $seen[$module->id.':'.$group->id] = true;
                app(ClassroomAccessService::class)->authorize($user, $module, $group, true);
                $studentIds = StudentRegistration::where('academic_year_id', $year->id)->where('group_id', $group->id)->whereNotIn('status', ['rejected', 'cancelled'])->whereHas('student', fn ($q) => $q->where('institution_id', $user->institution_id))->distinct()->pluck('student_id');
                $assessments = Assessment::where('module_id', $module->id)->where('academic_year_id', $year->id)->get()->reject(fn ($a) => in_array(strtolower($a->type), ['rattrapage', 'resit', 'r']));
                $params = http_build_query(['module_id' => $module->id, 'group_id' => $group->id, 'filiere_id' => $module->filiere_id, 'semester' => $module->semester_number, 'academic_year_id' => $year->id]);
                $expected = $studentIds->count() * $assessments->count();
                $entered = Grade::whereIn('assessment_id', $assessments->pluck('id'))->whereIn('student_id', $studentIds)->where(fn ($q) => $q->whereNotNull('value')->orWhere('absent', true))->get(['student_id', 'assessment_id'])->unique(fn ($g) => $g->student_id.':'.$g->assessment_id)->count();
                if ($assessments->isEmpty() || Assessment::withoutGlobalScopes()->where('module_id', $module->id)->where('academic_year_id', $year->id)->where('needs_review', true)->exists()) {
                    $items[] = $this->item('modalities-'.$module->id.'-'.$group->id, 'Modalités à vérifier', $module->name.' · '.$group->name, '/admin/grades/edit?'.$params);
                } elseif ($entered < $expected) {
                    $items[] = $this->item('grades-'.$module->id.'-'.$group->id, ($expected - $entered).' note(s) à compléter', $module->name.' · '.$group->name, '/admin/grades/edit?'.$params);
                } elseif ($expected > 0 && ! ModulePvSignature::where('module_id', $module->id)->where('academic_year_id', $year->id)->where(fn ($q) => $q->where('group_id', $group->id)->orWhereNull('group_id'))->exists()) {
                    $items[] = $this->item('pv-'.$module->id.'-'.$group->id, 'PV à vérifier', $module->name.' · '.$group->name, '/admin/grades/pv?'.$params);
                }
            }
        }
        foreach (InternshipAccess::query($user)->where(fn ($q) => $q->where('supervisor_id', $profile->id)->orWhereHas('soutenance', fn ($d) => $d->where('president_id', $profile->id)->orWhere('examiner_id', $profile->id)->orWhere('supervisor_id', $profile->id)))
            ->where(fn ($q) => $q->whereBetween('start_date', [$year->start_date, $year->end_date])->orWhereHas('soutenance', fn ($d) => $d->whereBetween('date_time', [$year->start_date->startOfDay(), $year->end_date->endOfDay()])))
            ->whereNotIn('status', ['completed', 'cancelled'])->with('student.user', 'soutenance')->orderBy('id')->limit(20)->get() as $stage) {
            $defense = $stage->soutenance;
            $canEvaluate = $defense && $defense->status === 'scheduled' && $defense->date_time?->isPast() && in_array((int) $profile->id, array_map('intval', [$defense->president_id, $defense->examiner_id, $defense->supervisor_id]), true);
            $items[] = $this->item('stage-'.$stage->id, $canEvaluate ? 'Soutenance à évaluer' : 'Suivre le stage / PFE', $stage->student->user?->name ?? 'Dossier de stage', '/professor/internships?internship_id='.$stage->id);
        }

        return ['items' => array_slice($items, 0, 50), 'academic_year' => $year->label, 'limited' => $limited || count($items) > 50];
    }

    public function student(User $user): array
    {
        $items = [];
        $year = AcademicYear::where('institution_id', $user->institution_id)->where('is_current', true)->first();
        $app = Application::where('owner_user_id', $user->id)->whereHas('campaign', fn ($q) => $q->where('institution_id', $user->institution_id)->when($year, fn ($q) => $q->where('academic_year_id', $year->id)))->latest('id')->first();
        if ($app && $app->dossier_status !== 'approved') {
            $required = AdmissionEntryRules::documents($app->campaign->entry_route);
            $present = StudentDocument::where('application_id', $app->id)->where('is_current', true)->whereNull('withdrawn_at')->pluck('type')->all();
            $missing = count(array_diff($required, $present));
            $items[] = $this->item('admission', in_array($app->dossier_status, ['draft', 'needs_correction']) ? 'Compléter mon dossier d’admission' : 'Suivre mon dossier d’admission', $missing.' pièce(s) manquante(s) · '.$app->campaign->name, '/admissions/mon-dossier', $app->campaign->close_date->toDateString());
        }
        $student = Student::where('user_id', $user->id)->where('institution_id', $user->institution_id)->first();
        if ($student && $year) {
            if ($student->status === 'graduated') {
                $items[] = $this->item('graduate', 'Cursus terminé', 'Consultez vos documents de fin de cursus auprès du guichet.', '/student/documents');
            } else {
                $action = app(ConfirmStudentRenewalAction::class);
                $registration = $action->eligibleRegistration($student, $year->id);
                $hasAnnual = $student->registrations()->where('academic_year_id', $year->id)->where('registration_type', 're_enrollment')->whereNotIn('status', ['cancelled', 'rejected'])->exists();
                if ($hasAnnual) {
                    $calendar = app(RenewalCampaignService::class)->forYear($year);
                    $receipt = DB::table('student_renewals')->where('student_id', $student->id)->where('academic_year_id', $year->id)->first();
                    $items[] = $this->item('renewal', $receipt ? 'Mon récépissé de réinscription' : (! $registration ? 'Suivre ma validation annuelle' : ($calendar['is_open'] ? 'Confirmer ma réinscription' : 'Consulter le calendrier de réinscription')), $receipt ? ($receipt->physical_verified_at ? 'Contrôle physique effectué' : 'Originaux à présenter à la scolarité') : (! $registration ? 'La décision académique annuelle doit être rapprochée par la scolarité.' : $calendar['message']), '/student/reinscription', $calendar['closes_on'] ?? null);
                }
            }
            foreach (DocumentRequest::where('student_id', $student->id)->whereIn('status', ['ready', 'signed', 'needs_correction', 'rejected'])->orderByDesc('id')->limit(10)->get() as $document) {
                $items[] = $this->item('document-'.$document->id, in_array($document->status, ['ready', 'signed']) ? 'Document disponible' : 'Demande de document à consulter', 'Demande n°'.$document->id, '/student/documents');
            }
            foreach (Internship::where('student_id', $student->id)->whereNotIn('status', ['completed', 'cancelled'])->orderByDesc('id')->limit(5)->get() as $stage) {
                $items[] = $this->item('stage-'.$stage->id, 'Suivre mon stage / PFE', 'Dossier n°'.$stage->id, '/student/internships?internship_id='.$stage->id);
            }
        }

        return ['items' => $items, 'academic_year' => $year?->label, 'has_student' => (bool) $student];
    }

    private function item(string $id, string $title, ?string $description, string $href, ?string $deadline = null): array
    {
        return compact('id', 'title', 'description', 'href', 'deadline');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Actions\Admission\DispatchAdmissionStudentsAction;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\StudentRegistration;
use App\Services\Document\WorkflowDocumentExportService;
use App\Support\AdmissionAccess;
use Illuminate\Http\Request;

final class AdmissionEnrollmentController extends Controller
{
    private function rows(Request $request)
    {
        AdmissionAccess::review($request);
        $campaign = AdmissionAccess::campaign($request);

        return [$campaign, StudentRegistration::with('student.user', 'group', 'filiere')->where('academic_year_id', $campaign->academic_year_id)->where('filiere_id', $campaign->filiere_id)->where('semester_number', $campaign->entry_semester)->where('registration_type', 'initial')->where('status', 'admin_validated')->whereIn('student_id', Application::where('admission_campaign_id', $campaign->id)->where('dossier_status', 'approved')->select('student_id'))];
    }

    public function index(Request $request)
    {
        [$campaign, $query] = $this->rows($request);
        if ($request->filled('search')) {
            $query->whereHas('student', fn ($q) => $q->whereLike('cne', '%'.$request->string('search')->limit(100).'%')->orWhereHas('user', fn ($u) => $u->whereLike('name', '%'.$request->string('search')->limit(100).'%')));
        }
        $rows = $query->orderBy('student_id')->paginate(25);

        return response()->json(['data' => collect($rows->items())->map(fn ($r) => ['id' => $r->id, 'student_id' => $r->student_id, 'name' => $r->student->user->name, 'cne' => $r->student->cne, 'student_number' => $r->student->student_number, 'group' => $r->group?->name, 'sub_group' => $r->sub_group, 'validated_at' => $r->admin_validated_at]), 'total' => $rows->total(), 'last_page' => $rows->lastPage(), 'entry_semester' => $campaign->entry_semester]);
    }

    public function dispatch(Request $request)
    {
        AdmissionAccess::review($request);
        $campaign = AdmissionAccess::campaign($request);
        $count = app(DispatchAdmissionStudentsAction::class)->execute($campaign);

        return response()->json(['message' => $count.' étudiant(s) sans groupe affecté(s). Les affectations existantes sont conservées.', 'dispatched_count' => $count]);
    }

    public function export(Request $request)
    {
        [$campaign, $query] = $this->rows($request);
        $format = $request->validate(['format' => 'required|in:csv,zip'])['format'];
        abort_if((clone $query)->count() > 500, 422, 'Export limité à 500 inscriptions par campagne.');
        $rows = $query->orderBy('student_id')->get();
        abort_if($rows->isEmpty(), 422, 'Aucune inscription définitive à exporter.');
        if ($format === 'csv') {
            return response()->streamDownload(function () use ($rows) {
                $out = fopen('php://output', 'w');
                fwrite($out, "\xEF\xBB\xBF");
                fputcsv($out, ['Nom', 'CNE', 'Numéro officiel', 'Email du compte', 'Groupe', 'Sous-groupe'], ';', '"', '');
                foreach ($rows as $r) {
                    fputcsv($out, array_map(fn ($v) => preg_match('/^[=+@\-\t\r]/u', (string) $v) ? "'".$v : $v, [$r->student->user->name, $r->student->cne, $r->student->student_number, $r->student->user->email, $r->group?->name, $r->sub_group]), ';', '"', '');
                } fclose($out);
            }, 'Inscriptions_Campagne_'.$campaign->id.'.csv', ['Content-Type' => 'text/csv; charset=UTF-8', 'Cache-Control' => 'private, no-store']);
        }
        $documents = app(WorkflowDocumentExportService::class);
        $files = [];
        foreach ($rows as $r) {
            $files['Inscription_'.$r->student_id.'.pdf'] = $documents->pdf('Attestation d’inscription — à viser', ['Étudiant' => $r->student->user->name, 'CNE' => $r->student->cne, 'Numéro officiel' => $r->student->student_number, 'Campagne' => $campaign->name, 'Niveau' => 'S'.$campaign->entry_semester, 'Formation' => $r->filiere->name], notice: 'Inscription issue de la revue numérique et physique du dossier. À viser par la scolarité.');
        }

        return $documents->zip($files, 'Attestations_Campagne_'.$campaign->id.'.zip');
    }
}

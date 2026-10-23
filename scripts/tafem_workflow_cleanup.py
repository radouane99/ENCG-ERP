from pathlib import Path
import re
import sys
import difflib
root=Path(__file__).resolve().parents[1]
sys.stdout.reconfigure(encoding='utf-8')
if '--preview' in sys.argv:
    def preview(path, text, **kwargs):
        print(''.join(difflib.unified_diff(path.read_text(encoding='utf-8').splitlines(True), text.splitlines(True), fromfile=str(path), tofile=str(path))))
        return len(text)
    Path.write_text = preview

# Drop unused legacy implementations so no future call can revive fabricated data.
p=root/'backend/app/Http/Controllers/Api/AdmissionCampaignController.php'
t=p.read_text(encoding='utf-8'); t=t[:t.index('    private function legacyApplications')]+ '}\n'; p.write_text(t,encoding='utf-8')
p=root/'backend/app/Http/Controllers/Api/TafemMinistryImportController.php'
t=p.read_text(encoding='utf-8'); t=t[:t.index('    // ─── HELPERS')]+ '}\n'; p.write_text(t,encoding='utf-8')

p=root/'backend/app/Services/Core/DocumentOcrAuditorService.php'
p.write_text('''<?php
namespace App\\Services\\Core;
class DocumentOcrAuditorService
{
    public function auditCandidateDocuments(array $candidateData, array $documents): array
    {
        return ['overall_status' => 'needs_review', 'message' => 'Une revue humaine des versions documentaires est requise. Aucun document ne peut être certifié par cette méthode.'];
    }
}
''',encoding='utf-8')
p=root/'backend/app/Services/Admissions/TafemQualityReportService.php'
p.write_text('''<?php
namespace App\\Services\\Admissions;
use App\\Models\\Application;
use App\\Models\\StudentDocument;
use Illuminate\\Support\\Facades\\DB;

class TafemQualityReportService
{
    public function build(bool $audit = true): array
    {
        $campaign = request()->input('campaign_id') ?: \\App\\Models\\AdmissionCampaign::where('institution_id', config('erp.institution_id', 1))->where('status', 'open')->latest('id')->value('id');
        $apps = Application::with('owner')->where('admission_campaign_id', $campaign)->get();
        $photos = StudentDocument::whereIn('application_id', $apps->pluck('id'))->where('type', 'photo')->where('is_current', true)->whereNull('withdrawn_at')->pluck('application_id')->all();
        $duplicates = $apps->groupBy('cne')->filter(fn ($g, $cne) => $cne !== '' && $g->count() > 1)->sum(fn ($g) => $g->count());
        $mismatch = 0;
        foreach (DB::table('admission_ocr_runs')->whereIn('application_id', $apps->pluck('id'))->whereNotNull('fields')->get(['application_id', 'fields']) as $run) {
            $fields = json_decode($run->fields, true) ?: [];
            if (! empty($fields['cne']['conflict'])) $mismatch++;
        }
        return ['duplicates_cne' => $duplicates,
            'missing_cin' => $apps->filter(fn ($a) => trim((string) ($a->owner?->cin ?: $a->cin)) === '')->count(),
            'missing_photo' => $apps->filter(fn ($a) => ! in_array($a->id, $photos))->count(),
            'massar_mismatch' => $mismatch];
    }
}
''',encoding='utf-8')

# Keep only the version-aware secure implementation of legacy document serving.
p=root/'backend/app/Http/Controllers/Api/AdmissionController.php'; t=p.read_text(encoding='utf-8')
start=t.index('    public function serveCandidateDocumentPublic('); end=t.index('    public function deleteCandidateDocument', start)
body='''    public function serveCandidateDocumentPublic(Request $request, string $type, string $cne): BinaryFileResponse|JsonResponse|Response
    {
        $cne = strtoupper(trim($cne));
        $signed = SignedDocumentUrl::isValid($type, $cne, $request->query('exp'), $request->query('sig'));
        if (! $signed) \\App\\Support\\AdmissionAccess::dossier($request);
        $type = \\App\\Actions\\Admission\\ManageDossierAction::type($type);
        $doc = StudentDocument::where('cne', $cne)->where('type', $type)->where('is_current', true)->whereNull('withdrawn_at')->firstOrFail();
        if (! $signed) \\App\\Support\\AdmissionAccess::dossier($request, false, $doc->application_id);
        $disk = Storage::disk($doc->storage_disk);
        abort_unless($disk->exists($doc->file_path), 404);
        return response()->file($disk->path($doc->file_path), ['Content-Type' => $doc->mime_type ?: 'application/pdf', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

'''
t=t[:start]+body+t[end:]
# Block the generic status shortcut that bypassed the physical/document review.
start=t.index('    public function updateStatus('); end=t.index('    public function update(',start)
t=t[:start]+'''    public function updateStatus(Request $request, int $applicationId): JsonResponse
    {
        \\App\\Support\\AdmissionAccess::review($request);
        abort(422, 'Utilisez la revue du dossier, son numéro officiel et sa checklist.');
    }

'''+t[end:]
t=t.replace('        $application->update($request->validated());', "        abort_unless($application->dossier_status === 'draft', 403, 'Dossier déjà soumis.');\n        $application->update($request->validated());")
start=t.index('    public function destroy('); end=t.index('    public function getTafemStats(',start)
t=t[:start]+'''    public function destroy(int $applicationId): JsonResponse
    {
        \\App\\Support\\AdmissionAccess::review(request());
        abort(422, 'Les dossiers sont conservés pour audit. Utilisez une décision motivée.');
    }

'''+t[end:]
p.write_text(t,encoding='utf-8')

# Authenticated owner-only access to the old aliases. Remove old broad/public registrations.
p=root/'backend/routes/api/admin.php'; t=p.read_text(encoding='utf-8')
targets=['track-dossier','update-candidate-dossier','upload-candidate-document','delete-candidate-document','ocr-extract-documents','preinscription','send-convocation-email','toggle-lock-candidate-dossier','verify-physical-dossier','scan-envelope','enrollment-stats','security-daily-list','auto-repartition','promote-waiting-list']
lines=t.splitlines()
lines=[line for line in lines if not ('Route::' in line and 'AdmissionController::class' in line and any("/"+target in line for target in targets))]
t='\n'.join(lines)+'\n'
t+='''
Route::middleware(['auth:sanctum', 'institution.context'])->group(function () {
    Route::get('/public/track-dossier', [AdmissionController::class, 'trackCandidateDossier']);
    Route::post('/public/update-candidate-dossier', [AdmissionController::class, 'updateCandidateDossier']);
    Route::post('/public/upload-candidate-document', [AdmissionController::class, 'uploadCandidateDocument'])->middleware('throttle:uploads');
    Route::delete('/public/delete-candidate-document', [AdmissionController::class, 'deleteCandidateDocument']);
    Route::post('/public/ocr-extract-documents', [AdmissionController::class, 'extractDocumentDataOcr'])->middleware('throttle:ocr');
    Route::post('/public/preinscription', [AdmissionController::class, 'submitOnlinePreinscription']);
    Route::post('/public/send-convocation-email', [AdmissionController::class, 'sendCandidateConvocationEmail'])->middleware('throttle:3,1');
    Route::post('/public/toggle-lock-candidate-dossier', [AdmissionController::class, 'toggleLockCandidateDossier']);
    Route::post('/admin/tafem/verify-physical-dossier', [AdmissionController::class, 'verifyPhysicalDossier']);
    Route::get('/admin/tafem/scan-envelope/{token}', [AdmissionController::class, 'scanEnvelopeQrCode']);
    Route::get('/admin/tafem/enrollment-stats', [AdmissionController::class, 'getEnrollmentStats']);
    Route::get('/admin/tafem/security-daily-list', [AdmissionController::class, 'getSecurityDailyList']);
    Route::post('/admin/tafem/auto-repartition', [AdmissionController::class, 'runAutoRepartition']);
    Route::post('/admin/tafem/promote-waiting-list', [AdmissionController::class, 'promoteWaitingList']);
});
'''
p.write_text(t,encoding='utf-8')

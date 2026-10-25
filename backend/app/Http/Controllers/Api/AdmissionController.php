<?php

namespace App\Http\Controllers\Api;

use App\Actions\Admission\ManageDossierAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Models\Application;
use App\Models\StudentDocument;
use App\Services\Academic\AdmissionService;
use App\Services\AI\GeminiApiService;
use App\Support\AdmissionAccess;
use App\Support\SignedDocumentUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AdmissionController extends Controller
{
    public function __construct(
        private AdmissionService $admissionService,
        private GeminiApiService $geminiService
    ) {}

    /**
     * Liste des candidatures pour une campagne.
     */
    public function index(?int $campaignId = null): JsonResponse
    {
        if ($campaignId) {
            request()->merge(['campaign_id' => $campaignId]);
        }

        return app(AdmissionWorkflowController::class)->listing(request());
    }

    public function store(StoreApplicationRequest $request): JsonResponse
    {
        AdmissionAccess::review($request);
        $data = $request->validated();
        $campaign = AdmissionAccess::campaign($request, true);
        $cne = strtoupper(trim($data['cne']));
        abort_if(Application::where('admission_campaign_id', $campaign->id)->where('cne', $cne)->exists(), 409, 'Un dossier existe déjà pour cette campagne.');
        $app = Application::create(['admission_campaign_id' => $campaign->id, 'reference_number' => 'TAFEM-'.Str::upper(Str::random(14)),
            'cne' => $cne, 'cin' => strtoupper(trim($data['cin'] ?? '')), 'first_name' => $data['first_name'],
            'last_name' => $data['last_name'], 'email' => $data['email'] ?? null, 'phone' => $data['phone'] ?? null,
            'bac_average' => $data['bac_average'] ?? null, 'dossier_status' => 'draft', 'status' => 'pending', 'eligibility' => 'unconfirmed']);
        app(ManageDossierAction::class)->event($app, 'draft_created');

        return response()->json(['success' => true, 'data' => $app], 201);
    }

    public function updateStatus(Request $request, int $applicationId): JsonResponse
    {
        AdmissionAccess::review($request);
        abort(422, 'Utilisez la revue du dossier, son numéro officiel et sa checklist.');
    }

    public function update(UpdateApplicationRequest $request, int $applicationId): JsonResponse
    {
        $application = Application::findOrFail($applicationId);
        abort_unless($request->user()->hasRole('super-admin') || (string) $application->campaign?->institution_id === (string) $request->user()->institution_id, 403);
        abort_unless($application->dossier_status === 'draft', 403, 'Dossier déjà soumis.');
        $application->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Candidature mise à jour.',
            'data' => $application,
        ]);
    }

    /**
     * Supprimer une candidature.
     */
    public function destroy(int $applicationId): JsonResponse
    {
        AdmissionAccess::review(request());
        abort(422, 'Les dossiers sont conservés pour audit. Utilisez une décision motivée.');
    }

    public function getTafemStats(Request $request): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->stats($request);
    }

    /**
     * Répartition automatique IA dans les amphithéâtres.
     */
    public function runAutoRepartition(Request $request): JsonResponse
    {
        return app(AdmissionAppointmentController::class)->preview($request);
    }

    /**
     * Appel automatique de la Liste d'Attente selon rang de mérite.
     */
    public function promoteWaitingList(Request $request): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->promote($request);
    }

    /**
     * Liste officielle Ministère TAFEM avec recherche et scores complets.
     */
    public function getMinistryTafemList(Request $request): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->listing($request);
    }

    /**
     * Vérification du dossier physique et génération Code APOGEE officiel.
     */
    public function verifyPhysicalDossier(Request $request): JsonResponse
    {
        AdmissionAccess::review($request);
        $request->merge(['decision' => 'approved']);

        return app(AdmissionWorkflowController::class)->decide($request);
    }

    /**
     * Pré-inscription en ligne par le candidat admis.
     */
    public function submitOnlinePreinscription(Request $request): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->submit($request);
    }

    /**
     * Scan QR Code enveloppe.
     */
    public function scanEnvelopeQrCode(string $token): JsonResponse
    {
        return app(AdmissionAppointmentController::class)->scan(request(), $token);
    }

    /**
     * Statistiques d'inscription TAFEM.
     */
    public function getEnrollmentStats(): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->stats(request());
    }

    /**
     * Liste de sécurité pour le contrôle d'accès.
     */
    public function getSecurityDailyList(Request $request): JsonResponse
    {
        return app(AdmissionAppointmentController::class)->daily($request);
    }

    /**
     * Suivi du dossier candidat en temps réel.
     */
    public function trackCandidateDossier(Request $request): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->show($request);
    }

    /**
     * Promotion des candidats en liste d'attente.
     */
    public function promoteWaitingListCandidates(): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->promote(request());
    }

    /**
     * Envoi email de convocation au candidat.
     */
    public function sendCandidateConvocationEmail(Request $request): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->notify($request);
    }

    // ─── DOCUMENTS ────────────────────────────────────────────

    /**
     * Mettre à jour le dossier candidat.
     */
    public function updateCandidateDossier(Request $request): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->legacySave($request);
    }

    /**
     * Upload document candidat.
     */
    public function uploadCandidateDocument(Request $request): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->upload($request);
    }

    /**
     * Servir un document privé.
     */
    public function serveCandidateDocument(string $type, string $cne): BinaryFileResponse|JsonResponse|Response
    {
        return $this->serveCandidateDocumentPublic(request(), $type, $cne);
    }

    /**
     * Servir un document candidat (Public / Iframe display).
     * Cherche par CNE dans student_documents (portail candidat + admin).
     */
    public function serveCandidateDocumentPublic(Request $request, string $type, string $cne): BinaryFileResponse|JsonResponse|Response
    {
        $cne = strtoupper(trim($cne));
        $signed = SignedDocumentUrl::isValid($type, $cne, $request->query('exp'), $request->query('sig'));
        if (! $signed) {
            abort_unless($request->user(), 403, 'Accès au document refusé.');
            AdmissionAccess::dossier($request);
        }
        $type = ManageDossierAction::type($type);
        $doc = StudentDocument::where('cne', $cne)->where('type', $type)->where('is_current', true)->whereNull('withdrawn_at')->firstOrFail();
        if (! $signed) {
            AdmissionAccess::dossier($request, false, $doc->application_id);
        }
        $disk = Storage::disk($doc->storage_disk);
        abort_unless($disk->exists($doc->file_path), 404);

        return response()->file($disk->path($doc->file_path), ['Content-Type' => $doc->mime_type ?: 'application/pdf', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    public function deleteCandidateDocument(Request $request): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->withdraw($request);
    }

    /**
     * Verrouiller / Déverrouiller le dossier candidat (Admin / Scolarité).
     */
    public function toggleLockCandidateDossier(Request $request): JsonResponse
    {
        AdmissionAccess::review($request);
        abort(422, 'Utilisez la revue du dossier et sa checklist de validation.');
    }

    /**
     * Extraction OCR via Gemini AI.
     * Sync par défaut (tunnel TAFEM). ?async=1 enqueue le job Horizon.
     */
    public function extractDocumentDataOcr(Request $request): JsonResponse
    {
        return app(AdmissionWorkflowController::class)->startOcr($request);
    }
}

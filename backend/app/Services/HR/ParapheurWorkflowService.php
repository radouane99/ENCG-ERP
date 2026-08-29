<?php

namespace App\Services\HR;

use App\Models\Department;
use App\Models\Professor;
use App\Models\ProfessorDocumentRequest;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ParapheurWorkflowService
{
    /**
     * Soumettre une nouvelle demande administrative / ordre de mission par un enseignant.
     */
    public function submitRequest(User $user, array $data): ProfessorDocumentRequest
    {
        $professor = Professor::where('user_id', $user->id)->first();
        $departmentId = $data['department_id'] ?? $professor?->department_id;

        $docType = $data['document_type'] ?? 'ordre_de_mission';
        $prefix = $docType === 'ordre_de_mission' ? 'OM' : 'DOC-PROF';
        $year = date('Y');
        $random = strtoupper(Str::random(5));
        $trackingCode = "{$prefix}-{$year}-{$random}";
        $qrToken = 'om_'.Str::random(32);

        return ProfessorDocumentRequest::create([
            'user_id' => $user->id,
            'professor_id' => $professor?->id,
            'department_id' => $departmentId,
            'document_type' => $docType,
            'tracking_code' => $trackingCode,
            'purpose' => $data['purpose'],
            'destination' => $data['destination'] ?? null,
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'transport_mode' => $data['transport_mode'] ?? 'voiture_personnelle',
            'vehicle_registration' => $data['vehicle_registration'] ?? null,
            'expense_coverage' => $data['expense_coverage'] ?? 'sans_frais',
            'mission_category' => $data['mission_category'] ?? 'colloque_international',
            'status' => 'pending',
            'department_visa' => 'pending',
            'direction_decision' => 'pending',
            'qr_token' => $qrToken,
        ]);
    }

    /**
     * Apposer le visa du Chef de Département (Favorable / Défavorable).
     */
    public function applyDepartmentVisa(int $requestId, User $signer, string $visa, ?string $notes = null): ProfessorDocumentRequest
    {
        $request = ProfessorDocumentRequest::with(['user', 'professor', 'department'])->find($requestId);
        if (! $request) {
            throw new NotFoundHttpException('Demande introuvable.');
        }

        if (! in_array($visa, ['favorable', 'unfavorable'])) {
            throw new BadRequestHttpException('Type de visa invalide.');
        }

        $isUnfavorable = ($visa === 'unfavorable');

        $request->update([
            'department_visa' => $visa,
            'department_visa_by' => $signer->id,
            'department_visa_at' => now(),
            'department_notes' => $notes,
            'status' => $isUnfavorable ? 'rejected' : 'pending',
            'admin_notes' => $isUnfavorable ? ($notes ?? 'Avis défavorable motivé par le Chef de Département') : $request->admin_notes,
        ]);

        return $request->fresh(['user', 'professor', 'department', 'departmentVisaUser']);
    }

    /**
     * Décision et signature numérique par le Directeur / Secrétaire Général.
     */
    public function signDirectionDecision(
        int $requestId,
        User $signer,
        string $decision,
        ?string $notes = null,
        ?string $signatoryTitle = 'LE DIRECTEUR DE L\'ENCG FÈS'
    ): ProfessorDocumentRequest {
        $request = ProfessorDocumentRequest::with(['user', 'professor', 'department'])->find($requestId);
        if (! $request) {
            throw new NotFoundHttpException('Demande introuvable.');
        }

        if (! in_array($decision, ['approved', 'rejected'])) {
            throw new BadRequestHttpException('Décision de direction invalide.');
        }

        $now = now();
        $isApproved = ($decision === 'approved');

        $digitalSeal = null;
        if ($isApproved) {
            $digitalSeal = hash('sha256', "{$request->id}|{$request->tracking_code}|{$request->user_id}|{$now->toIso8601String()}|ENCG_FES_OFFICIAL_SEAL");
        }

        $request->update([
            'direction_decision' => $decision,
            'direction_signed_by' => $signatoryTitle ?: ($signer->name.' - Direction'),
            'direction_signed_at' => $now,
            'direction_notes' => $notes,
            'signed_by' => $isApproved ? ($signatoryTitle ?: ($signer->name.' - Direction')) : null,
            'signed_at' => $isApproved ? $now : null,
            'status' => $isApproved ? 'ready' : 'rejected',
            'digital_seal' => $digitalSeal,
            'admin_notes' => ! $isApproved ? ($notes ?? 'Demande rejetée par la Direction') : $request->admin_notes,
        ]);

        return $request->fresh(['user', 'professor', 'department', 'departmentVisaUser']);
    }

    /**
     * Signature par lot pour la Direction.
     */
    public function batchSignDirection(array $requestIds, User $signer, ?string $signatoryTitle = null): array
    {
        $signed = [];
        $failed = [];

        foreach ($requestIds as $id) {
            try {
                $signedDoc = $this->signDirectionDecision($id, $signer, 'approved', 'Signature groupée validée', $signatoryTitle);
                $signed[] = $signedDoc->id;
            } catch (\Throwable $e) {
                $failed[] = ['id' => $id, 'error' => $e->getMessage()];
            }
        }

        return [
            'success' => true,
            'total_processed' => count($requestIds),
            'signed_count' => count($signed),
            'failed_count' => count($failed),
            'signed_ids' => $signed,
            'failed' => $failed,
        ];
    }

    /**
     * Récupération des demandes pour la boîte de réception du Parapheur.
     */
    public function getParapheurList(User $user, array $filters = []): Collection
    {
        $query = ProfessorDocumentRequest::with(['user', 'professor', 'department', 'departmentVisaUser'])
            ->orderBy('created_at', 'desc');

        // Filtrage par département si l'utilisateur est un chef de département spécifique
        if (! empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        // Filtre de statut de parapheur
        if (! empty($filters['stage'])) {
            switch ($filters['stage']) {
                case 'pending_dept':
                    $query->where('department_visa', 'pending')->where('status', '!=', 'rejected');
                    break;
                case 'pending_direction':
                    $query->where('department_visa', 'favorable')
                        ->where('direction_decision', 'pending')
                        ->where('status', '!=', 'rejected');
                    break;
                case 'ready':
                case 'approved':
                    $query->where('status', 'ready');
                    break;
                case 'rejected':
                    $query->where(function ($q) {
                        $q->where('status', 'rejected')
                            ->orWhere('department_visa', 'unfavorable')
                            ->orWhere('direction_decision', 'rejected');
                    });
                    break;
            }
        }

        if (! empty($filters['document_type'])) {
            $query->where('document_type', $filters['document_type']);
        }

        if (! empty($filters['search'])) {
            $s = '%'.$filters['search'].'%';
            $query->where(function ($q) use ($s) {
                $q->where('tracking_code', 'ilike', $s)
                    ->orWhere('purpose', 'ilike', $s)
                    ->orWhere('destination', 'ilike', $s)
                    ->orWhereHas('user', function ($uq) use ($s) {
                        $uq->where('name', 'ilike', $s)
                            ->orWhere('email', 'ilike', $s);
                    });
            });
        }

        return $query->get();
    }

    /**
     * Récupération des compteurs synoptiques pour le Parapheur.
     */
    public function getParapheurCounters(User $user, ?int $departmentId = null): array
    {
        $baseQuery = ProfessorDocumentRequest::query();
        if ($departmentId) {
            $baseQuery->where('department_id', $departmentId);
        }

        $pendingDept = (clone $baseQuery)
            ->where('department_visa', 'pending')
            ->where('status', '!=', 'rejected')
            ->count();

        $pendingDirection = (clone $baseQuery)
            ->where('department_visa', 'favorable')
            ->where('direction_decision', 'pending')
            ->where('status', '!=', 'rejected')
            ->count();

        $approvedReady = (clone $baseQuery)
            ->where('status', 'ready')
            ->count();

        $rejected = (clone $baseQuery)
            ->where(function ($q) {
                $q->where('status', 'rejected')
                    ->orWhere('department_visa', 'unfavorable')
                    ->orWhere('direction_decision', 'rejected');
            })->count();

        $totalThisMonth = (clone $baseQuery)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return [
            'pending_dept' => $pendingDept,
            'pending_direction' => $pendingDirection,
            'approved_ready' => $approvedReady,
            'rejected' => $rejected,
            'total_this_month' => $totalThisMonth,
            'total' => $pendingDept + $pendingDirection + $approvedReady + $rejected,
        ];
    }

    /**
     * Rendu PDF de l'Ordre de Mission Officiel.
     */
    public function renderMissionOrderPdf(ProfessorDocumentRequest $request, bool $isDraft = false)
    {
        $user = $request->user ?? User::find($request->user_id);
        $professor = $request->professor ?? Professor::where('user_id', $request->user_id)->first();
        $department = $request->department ?? ($professor ? Department::find($professor->department_id) : null);

        $verifyUrl = url('/verify/document/'.$request->tracking_code);
        $qrCodeData = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data='.urlencode($verifyUrl);

        $data = [
            'request' => $request,
            'user' => $user,
            'professor' => $professor,
            'department' => $department,
            'trackingCode' => $request->tracking_code,
            'qrToken' => $request->qr_token,
            'digitalSeal' => $request->digital_seal,
            'qrCodeUrl' => $qrCodeData,
            'verifyUrl' => $verifyUrl,
            'isDraft' => $isDraft || $request->status !== 'ready',
            'signatoryTitle' => $request->direction_signed_by ?? $request->signed_by ?? 'LE DIRECTEUR DE L\'ENCG FÈS',
            'date' => $request->signed_at ? Carbon::parse($request->signed_at)->format('d/m/Y') : Carbon::now()->format('d/m/Y'),
            'mission' => [
                'motif' => $request->purpose,
                'destination' => $request->destination ?? 'Non spécifiée',
                'start_date' => $request->start_date ? Carbon::parse($request->start_date)->format('d/m/Y') : Carbon::now()->format('d/m/Y'),
                'end_date' => $request->end_date ? Carbon::parse($request->end_date)->format('d/m/Y') : Carbon::now()->addDays(2)->format('d/m/Y'),
                'transport_mode' => $this->formatTransportMode($request->transport_mode, $request->vehicle_registration),
                'expense_coverage' => $this->formatExpenseCoverage($request->expense_coverage),
                'category' => $this->formatCategory($request->mission_category),
            ],
        ];

        return Pdf::loadView('pdf.ordre_mission_officiel', $data)
            ->setPaper('a4', 'portrait')
            ->setOptions(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true]);
    }

    private function formatTransportMode(?string $mode, ?string $immat): string
    {
        $labels = [
            'voiture_personnelle' => 'Voiture Personnelle'.($immat ? " (Immat: {$immat})" : ''),
            'voiture_service' => 'Véhicule de Service ENCG'.($immat ? " (Immat: {$immat})" : ''),
            'train' => 'Train ONCF (Al Boraq / Al Atlas)',
            'avion' => 'Transport Aérien (RAM / Compagnies Aériennes)',
            'autre' => 'Autre moyen autorisé',
        ];

        return $labels[$mode] ?? 'Voiture Personnelle / Train ONCF';
    }

    private function formatExpenseCoverage(?string $coverage): string
    {
        $labels = [
            'charge_ecole' => 'Prise en charge totale par le budget de fonctionnement de l\'ENCG Fès (Décret n° 2-97-511)',
            'charge_organisme_accueil' => 'Frais pris en charge par l\'organisme / université d\'accueil',
            'sans_frais' => 'Sans incidence financière sur le budget de l\'établissement',
        ];

        return $labels[$coverage] ?? 'Prise en charge réglementaire';
    }

    private function formatCategory(?string $cat): string
    {
        $labels = [
            'colloque_international' => 'Colloque / Congrès Scientifique International',
            'seminaire_national' => 'Séminaire de Recherche / Journée d\'Études Nationale',
            'jury_these' => 'Participation à un Jury de Thèse / Habilitation (HDR)',
            'visite_entreprise' => 'Visite d\'Entreprise & Encadrement PFE / Stages',
            'reunion_pedagogique' => 'Réunion Pédagogique Inter-Universitaire',
        ];

        return $labels[$cat] ?? 'Mission Académique & Recherche';
    }
}

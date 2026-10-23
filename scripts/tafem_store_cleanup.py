from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'backend/app/Http/Controllers/Api/AdmissionController.php'; t=p.read_text(encoding='utf-8')
start=t.index('    public function store('); end=t.index('    public function updateStatus(',start)
t=t[:start]+'''    public function store(StoreApplicationRequest $request): JsonResponse
    {
        \\App\\Support\\AdmissionAccess::review($request);
        $data = $request->validated();
        $campaign = \\App\\Support\\AdmissionAccess::campaign($request, true);
        $cne = strtoupper(trim($data['cne']));
        abort_if(Application::where('admission_campaign_id', $campaign->id)->where('cne', $cne)->exists(), 409, 'Un dossier existe déjà pour cette campagne.');
        $app = Application::create(['admission_campaign_id' => $campaign->id, 'reference_number' => 'TAFEM-'.Str::upper(Str::random(14)),
            'cne' => $cne, 'cin' => strtoupper(trim($data['cin'] ?? '')), 'first_name' => $data['first_name'],
            'last_name' => $data['last_name'], 'email' => $data['email'] ?? null, 'phone' => $data['phone'] ?? null,
            'bac_average' => $data['bac_average'] ?? null, 'dossier_status' => 'draft', 'status' => 'pending', 'eligibility' => 'unconfirmed']);
        app(\\App\\Actions\\Admission\\ManageDossierAction::class)->event($app, 'draft_created');
        return response()->json(['success' => true, 'data' => $app], 201);
    }

'''+t[end:]
start=t.index('    public function index(');end=t.index('    public function store(',start)
t=t[:start]+'''    public function index(?int $campaignId = null): JsonResponse
    {
        if ($campaignId) request()->merge(['campaign_id' => $campaignId]);
        return app(AdmissionWorkflowController::class)->listing(request());
    }

'''+t[end:]
p.write_text(t,encoding='utf-8')

<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
body{font-family:DejaVu Sans,sans-serif;font-size:11px;color:#172554}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:8px;border-bottom:1px solid #cbd5e1;text-align:left}small{color:#475569}.footer{margin-top:28px;border-top:1px solid #cbd5e1;padding-top:12px}
</style></head><body><p>ENCG · Service des admissions</p><h1>{{ $title }}</h1><p>{{ $campaign->name }} · Campagne {{ $campaign->id }}</p>
<table><thead><tr><th>Référence</th><th>Nom et prénom</th><th>CNE</th><th>Rang officiel</th><th>Score officiel</th><th>État du dossier</th></tr></thead><tbody>
@foreach($applications as $a)<tr><td>{{ $a->reference_number }}</td><td>{{ $a->last_name }} {{ $a->first_name }}</td><td>{{ $a->cne }}</td><td>{{ $a->ranking ?? 'Non renseigné' }}</td><td>{{ $a->selection_score ?? 'Non renseigné' }}</td><td>{{ $a->dossier_status }}</td></tr>@endforeach
</tbody></table>
@if($receipt)<p>Ce récépissé confirme le dépôt du dossier. Il ne remplace pas la décision administrative ni une inscription pédagogique définitive.</p>@endif
<p class="footer">Généré le {{ now()->format('d/m/Y H:i') }}. Les rangs et scores proviennent de la source importée ; aucun résultat n’est calculé par l’IA. Le statut actualisé est disponible dans l’espace personnel.</p></body></html>

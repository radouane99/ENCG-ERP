<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>Carte étudiante - ENCG Fès</title><style>
@page { size: 242.64pt 153.01pt; margin:0; }
* { margin:0; padding:0; box-sizing:border-box; }
html,body { width:242.64pt; font-family:'DejaVu Sans',sans-serif; }
.card { position:relative; width:242.64pt; height:153pt; overflow:hidden; background:#fff; color:#17243a; }
.brand { position:absolute; top:0; left:0; right:0; height:39pt; border-bottom:2pt solid #1a3673; }
.logo { position:absolute; left:8pt; top:4pt; width:132pt; height:28pt; }
.title { position:absolute; right:8pt; top:10pt; width:82pt; text-align:right; color:#1a3673; font-size:6.5pt; font-weight:bold; }
.year { font-size:5.2pt; font-weight:normal; margin-top:3pt; }
.photo { position:absolute; top:48pt; left:8pt; width:49pt; height:62pt; border:0.6pt solid #cbd5e1; background:#f1f5f9; text-align:center; color:#64748b; }
.photo img { max-width:48pt; max-height:61pt; }
.name { position:absolute; left:65pt; right:8pt; top:46pt; font-size:7.5pt; line-height:1.15; color:#1a3673; font-weight:bold; }
.details { position:absolute; left:65pt; top:68pt; right:8pt; width:169pt; border-collapse:collapse; }
.details td { font-size:5.5pt; padding:2pt 0; vertical-align:top; line-height:1.2; }
.label { width:37pt; color:#64748b; } .value { font-weight:bold; color:#17243a; word-wrap:break-word; }
.notice { position:absolute; left:8pt; bottom:16pt; width:181pt; font-size:4.5pt; line-height:1.2; color:#475569; }
</style></head><body><div class="card">
<div class="brand">
@if(file_exists(public_path('logo-encg.png')))<img class="logo" src="{{ public_path('logo-encg.png') }}" alt="ENCG Fès">@endif
<div class="title">CARTE ÉTUDIANTE<div class="year">{{ $academicYear ?? 'Année à vérifier' }}</div></div></div>
<div class="photo">@if(!empty($photoPath) && file_exists($photoPath))<img src="{{ $photoPath }}" alt="Photo">@else<div style="padding-top:25pt;font-size:6pt;">PHOTO</div>@endif</div>
<div class="name">{{ $studentName ?? 'Identité à vérifier' }}</div>
<table class="details"><tr><td class="label">CNE</td><td class="value">{{ $cne ?? 'Non renseigné' }}</td></tr><tr><td class="label">N° inscr.</td><td class="value">{{ $studentNumber ?? 'Non renseigné' }}</td></tr><tr><td class="label">Filière</td><td class="value">{{ \Illuminate\Support\Str::limit($filiereName ?? 'Non renseignée', 45) }}</td></tr></table>
<div class="notice">Carte strictement personnelle. En cas de perte, contacter la scolarité. Le QR contrôle la référence du PDF.</div>
</div></body></html>

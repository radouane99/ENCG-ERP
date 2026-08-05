<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>PV de Rachat &mdash; ENCG Fès</title>
    <style>
        @page { size: A4 portrait; margin: 18mm 18mm 20mm 18mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 10pt; color: #000; background: #fff; line-height: 1.5; }

        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .header-table td { vertical-align: middle; }
        .logo-cell { width: 80px; text-align: center; }
        .logo-box { width: 70px; height: 70px; border: 3px solid #000; display: flex; align-items: center; justify-content: center; font-size: 7pt; font-weight: 900; text-align: center; padding: 4px; }
        .header-center { text-align: center; }
        .header-center .kingdom { font-size: 9pt; font-weight: 700; }
        .header-center .ministry { font-size: 8pt; font-weight: 600; color: #333; margin: 2px 0; }
        .header-center .university { font-size: 8.5pt; font-weight: 700; }
        .header-center .school { font-size: 10pt; font-weight: 900; text-transform: uppercase; margin-top: 2px; }
        .header-right { text-align: right; width: 110px; font-size: 8pt; }
        .ref-box { border: 2px solid #000; padding: 6px 8px; font-size: 7.5pt; font-weight: 900; text-align: center; }
        .divider { border: none; border-top: 2.5px solid #000; margin: 10px 0; }
        .doc-title-bar { background: #000; color: #fff; text-align: center; padding: 10px 0 8px 0; font-size: 14pt; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; margin: 12px 0 4px 0; }
        .doc-subtitle { text-align: center; font-size: 9pt; font-weight: 700; color: #444; margin-bottom: 14px; }
        .section-title { background: #1e293b; color: #fff; font-size: 9.5pt; font-weight: 900; padding: 6px 10px; letter-spacing: 0.5px; text-transform: uppercase; margin: 14px 0 8px 0; }
        .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .info-grid td { padding: 5px 8px; font-size: 9.5pt; vertical-align: top; }
        .info-grid .lbl { font-weight: 900; width: 38%; color: #111; white-space: nowrap; }
        .info-grid .val { font-weight: 700; color: #000; border-bottom: 1.5px solid #000; }
        .rachat-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9pt; }
        .rachat-table th { background: #0f172a; color: #fff; font-weight: 900; padding: 7px 6px; border: 2px solid #000; text-align: center; font-size: 8.5pt; text-transform: uppercase; }
        .rachat-table td { border: 2px solid #000; padding: 6px 8px; text-align: center; font-weight: 700; }
        .rachat-table tr:nth-child(even) td { background: #f8fafc; }
        .badge-v { background: #d1fae5; color: #065f46; padding: 2px 8px; border-radius: 4px; font-weight: 900; font-size: 8.5pt; border: 1.5px solid #065f46; }
        .badge-nv { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-weight: 900; font-size: 8.5pt; border: 1.5px solid #991b1b; }
        .motif-box { border: 2px solid #000; padding: 10px 12px; min-height: 50px; font-size: 9.5pt; font-weight: 600; background: #fffbeb; margin-bottom: 14px; }
        .legal-note { border: 1.5px solid #e5e7eb; background: #f8fafc; padding: 7px 10px; font-size: 8pt; color: #374151; margin-bottom: 18px; font-style: italic; }
        .signature-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .signature-table td { width: 33.33%; text-align: center; vertical-align: top; padding: 0 8px; }
        .sig-block { border: 2px solid #000; padding: 10px 8px 8px 8px; height: 130px; position: relative; }
        .sig-block .sig-title { font-size: 8.5pt; font-weight: 900; text-transform: uppercase; color: #000; margin-bottom: 4px; }
        .sig-name-line { border-bottom: 1px solid #000; height: 18px; margin: 4px 0; }
        .sig-label { font-size: 7.5pt; color: #555; font-weight: 600; position: absolute; bottom: 6px; left: 0; right: 0; text-align: center; }
        .sig-required { font-size: 7pt; color: #dc2626; font-weight: 900; position: absolute; top: 4px; right: 6px; }
        .stamp-area { margin-top: 12px; text-align: right; }
        .stamp-box { display: inline-block; border: 2px dashed #9ca3af; padding: 8px 14px; font-size: 7.5pt; color: #6b7280; font-style: italic; }
        .footer { border-top: 2px solid #000; padding-top: 5px; font-size: 7.5pt; color: #555; margin-top: 20px; display: flex; justify-content: space-between; }
    </style>
</head>
<body>

<!-- HEADER -->
<table class="header-table">
    <tr>
        <td class="logo-cell">
            <div class="logo-box">ENCG<br>FÈS</div>
        </td>
        <td class="header-center">
            <div class="kingdom">Royaume du Maroc</div>
            <div class="ministry">Ministère de l'Enseignement Supérieur, de la Recherche Scientifique et de l'Innovation</div>
            <div class="university">Université Sidi Mohamed Ben Abdellah — Fès</div>
            <div class="school">École Nationale de Commerce et de Gestion de Fès</div>
        </td>
        <td class="header-right">
            <div class="ref-box">
                N° Réf :<br>
                RACH/{{ date('Y') }}/{{ str_pad($student?->id ?? 0, 4, '0', STR_PAD_LEFT) }}<br>
                <small>{{ $generated_at }}</small>
            </div>
        </td>
    </tr>
</table>

<hr class="divider">

<!-- TITLE -->
<div class="doc-title-bar">✦ PROCÈS-VERBAL DE RACHAT ✦</div>
<div class="doc-subtitle">
    Décision du Jury de Délibération — Filière : <strong>{{ $filiere?->name ?? 'N/D' }}</strong>
    &nbsp;|&nbsp; Semestre : <strong>S{{ $semester }}</strong>
    &nbsp;|&nbsp; Année : <strong>{{ $academic_year?->label ?? date('Y').'/'.((int)date('Y')+1) }}</strong>
</div>

<hr class="divider">

<!-- ÉTUDIANT -->
<div class="section-title">I. Identification de l'Étudiant</div>
<table class="info-grid">
    <tr>
        <td class="lbl">Nom Complet :</td>
        <td class="val">{{ strtoupper($student?->last_name ?? '—') }} {{ $student?->first_name ?? '' }}</td>
        <td style="width:10px;"></td>
        <td class="lbl">CNE :</td>
        <td class="val">{{ $student?->cne ?? '—' }}</td>
    </tr>
    <tr>
        <td class="lbl">N° Apogée :</td>
        <td class="val">{{ $student?->apogee_code ?? $student?->student_number ?? '—' }}</td>
        <td></td>
        <td class="lbl">CIN :</td>
        <td class="val">{{ $student?->cin ?? '—' }}</td>
    </tr>
    <tr>
        <td class="lbl">Filière :</td>
        <td class="val">{{ $filiere?->name ?? '—' }}</td>
        <td></td>
        <td class="lbl">Semestre :</td>
        <td class="val">Semestre {{ $semester }} (S{{ $semester }})</td>
    </tr>
</table>

<!-- DÉTAIL RACHAT -->
<div class="section-title">II. Détail de la Décision de Rachat</div>
<table class="rachat-table">
    <thead>
        <tr>
            <th>Module Concerné</th>
            <th>Note Avant Rachat</th>
            <th>Points Accordés (Rachat)</th>
            <th>Note Après Rachat</th>
            <th>Décision Finale</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            @php
                $moduleName = request()->query('module', '(Voir dossier étudiant)');
                $before     = max(0, (float)(request()->query('note_before') ?? 0));
                $after      = round($before + (float)$points_added, 2);
            @endphp
            <td>{{ $moduleName }}</td>
            <td>{{ number_format($before, 2) }} / 20</td>
            <td style="color:#d97706; font-weight:900;">+ {{ number_format((float)$points_added, 2) }} pt</td>
            <td style="color:#059669; font-weight:900;">{{ number_format($after, 2) }} / 20</td>
            <td>
                @if($after >= 10)
                    <span class="badge-v">V — Validé</span>
                @else
                    <span class="badge-nv">NV — Non Validé</span>
                @endif
            </td>
        </tr>
    </tbody>
</table>

<!-- MOTIF -->
<div class="section-title">III. Motif et Justification du Jury</div>
<div class="motif-box">{{ $reason ?? 'Rachat accordé par le Jury de Délibération.' }}</div>

<!-- NOTE LÉGALE -->
<div class="legal-note">
    📋 Le présent Procès-Verbal de Rachat est établi en vertu du Règlement Intérieur de l'ENCG Fès et du
    cadre réglementaire de l'Enseignement Supérieur Marocain. Ce document n'a de valeur juridique qu'après
    signature des trois parties désignées ci-dessous. Toute modification non signée est nulle et non avenue.
    Document généré automatiquement par le Système ERP-ENCG le {{ $generated_at }} — Généré par : {{ $generated_by }}.
</div>

<!-- SIGNATURES -->
<div class="section-title">IV. Signatures Obligatoires du Jury (Rachat)</div>
<table class="signature-table">
    <tr>
        <td>
            <div class="sig-block">
                <span class="sig-required">★ REQUIS</span>
                <div class="sig-title">Professeur du Module</div>
                <div class="sig-name-line"></div>
                <div style="font-size:7.5pt; color:#555; margin-top:2px;">Nom &amp; Prénom :</div>
                <div class="sig-name-line" style="margin-top:2px;"></div>
                <div class="sig-name-line"></div>
                <div class="sig-label">Date &amp; Signature</div>
            </div>
            <div style="font-size:7.5pt; text-align:center; margin-top:4px; font-weight:700; color:#333;">
                Enseignant Responsable<br>du Module Concerné
            </div>
        </td>
        <td>
            <div class="sig-block">
                <span class="sig-required">★ REQUIS</span>
                <div class="sig-title">Chef de Filière</div>
                <div class="sig-name-line"></div>
                <div style="font-size:7.5pt; color:#555; margin-top:2px;">Nom &amp; Prénom :</div>
                <div class="sig-name-line" style="margin-top:2px;"></div>
                <div class="sig-name-line"></div>
                <div class="sig-label">Date &amp; Signature / Cachet</div>
            </div>
            <div style="font-size:7.5pt; text-align:center; margin-top:4px; font-weight:700; color:#333;">
                Directeur des Études<br>Filière : {{ $filiere?->code ?? '—' }}
            </div>
        </td>
        <td>
            <div class="sig-block">
                <span class="sig-required">★ REQUIS</span>
                <div class="sig-title">Chef de Département</div>
                <div class="sig-name-line"></div>
                <div style="font-size:7.5pt; color:#555; margin-top:2px;">Nom &amp; Prénom :</div>
                <div class="sig-name-line" style="margin-top:2px;"></div>
                <div class="sig-name-line"></div>
                <div class="sig-label">Date &amp; Signature / Cachet</div>
            </div>
            <div style="font-size:7.5pt; text-align:center; margin-top:4px; font-weight:700; color:#333;">
                Département Concerné<br>ENCG Fès
            </div>
        </td>
    </tr>
</table>

<div class="stamp-area">
    <div class="stamp-box">Emplacement Cachet Officiel<br>ENCG Fès</div>
</div>

<!-- FOOTER -->
<div class="footer">
    <span>PV-RACH / {{ $filiere?->code ?? '—' }} / S{{ $semester }} / {{ date('Y') }}</span>
    <span>ENCG Fès — Document Officiel Confidentiel — Réservé au Jury</span>
    <span>{{ $generated_at }}</span>
</div>

</body>
</html>

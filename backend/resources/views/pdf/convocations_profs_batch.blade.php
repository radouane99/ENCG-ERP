<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta charset="UTF-8">
    <title>Convocation de Surveillance — ENCG Fès</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
            size: A4 portrait;
            margin: 7mm 9mm 7mm 9mm;
        }

        body {
            font-family: 'DejaVu Sans', Arial, Helvetica, sans-serif;
            font-size: 8pt;
            color: #1a1a2e;
            background: #fff;
            line-height: 1.35;
        }

        .page-break { page-break-after: always; }

        .page-frame {
            border: 1.5px double #1a3a5c;
            padding: 4mm 5mm 3mm 5mm;
        }

        .page-shell {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .page-shell td { vertical-align: top; }

        /* ── TITLE ── */
        .title-banner {
            background: #1a3a5c;
            color: #fff;
            text-align: center;
            padding: 5px 8px;
            margin-bottom: 5px;
        }
        .title-main {
            font-size: 11pt;
            font-weight: bold;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .title-sub {
            font-size: 7.5pt;
            margin-top: 2px;
            color: #cde;
        }
        .session-badge {
            display: inline-block;
            margin-top: 2px;
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.35);
            font-size: 6.5pt;
            font-weight: bold;
            padding: 1px 8px;
            letter-spacing: 0.6px;
            text-transform: uppercase;
        }

        /* ── PROFESSOR INFO ── */
        .info-card {
            border: 1px solid #94a3b8;
            margin-bottom: 5px;
            width: 100%;
        }
        .info-card-title {
            background: #e8f0f8;
            font-size: 7pt;
            font-weight: bold;
            color: #1a3a5c;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 2px 7px;
            border-bottom: 1px solid #94a3b8;
        }
        .info-inner-table { width: 100%; }
        .info-inner-table td {
            vertical-align: top;
            width: 50%;
            padding: 4px 7px;
        }
        .info-inner-table td:first-child { border-right: 1px solid #cbd5e1; }
        .info-label {
            font-size: 6pt;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            display: block;
            margin-bottom: 1px;
        }
        .info-value {
            font-size: 8pt;
            font-weight: bold;
            color: #1a1a2e;
            margin-bottom: 3px;
            display: block;
        }
        .info-value.big { font-size: 9.5pt; color: #1a3a5c; text-transform: uppercase; }

        .instruction {
            background: #f0f6ff;
            border-left: 2.5px solid #1a3a5c;
            padding: 3px 7px;
            font-size: 7pt;
            color: #1a3a5c;
            font-style: italic;
            margin-bottom: 5px;
        }

        .section-label {
            font-size: 7pt;
            font-weight: bold;
            color: #1a3a5c;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
            padding-left: 4px;
            border-left: 2px solid #1a3a5c;
        }

        /* ── SURVEILLANCE TABLE ── */
        table.exam-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
            font-size: 7pt;
            table-layout: fixed;
        }
        .exam-table thead tr { background: #1a3a5c; color: #fff; }
        .exam-table th {
            padding: 3px 3px;
            text-align: center;
            font-size: 6.5pt;
            font-weight: bold;
            text-transform: uppercase;
            border: 1px solid #1a3a5c;
        }
        .exam-table td {
            padding: 2.5px 3px;
            border: 1px solid #cbd5e1;
            text-align: center;
            vertical-align: middle;
            word-wrap: break-word;
        }
        .exam-table tbody tr:nth-child(even) { background: #f5f9ff; }
        .exam-table td.date-cell { font-weight: bold; color: #1a3a5c; }
        .exam-table th.col-horaire,
        .exam-table td.time-cell {
            width: 9%;
            max-width: 9%;
            background: #e8f0f8;
            font-weight: bold;
            color: #2d6a9f;
            font-size: 6pt;
            padding: 2px 1px;
            line-height: 1.15;
        }
        .exam-table th.col-module,
        .exam-table td.module-cell {
            width: 40%;
            max-width: 40%;
            text-align: left;
            font-weight: bold;
            color: #1a3a5c;
            font-size: 7pt;
            padding: 2px 5px;
            line-height: 1.2;
        }
        .role-pill {
            background: #0f2863;
            color: #fff;
            padding: 1px 5px;
            font-size: 6.5pt;
            font-weight: bold;
            border-radius: 2px;
            white-space: nowrap;
        }
        .role-pill.principal {
            background: #b45309;
        }

        /* ── CHARTE SURVEILLANCE ── */
        .rules-title {
            font-size: 7pt;
            font-weight: bold;
            color: #1a3a5c;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 2px;
            padding-left: 4px;
            border-left: 2px solid #1a3a5c;
        }
        .rules-box {
            font-size: 6.3pt;
            line-height: 1.45;
            color: #334155;
            text-align: justify;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            margin-bottom: 0;
        }

        /* ── FOOTER ── */
        .footer-block {
            border-top: 1.5px solid #1a3a5c;
            padding-top: 4px;
            margin-top: 6px;
        }
        .footer-inner {
            width: 100%;
            border-collapse: collapse;
        }
        .footer-inner td { vertical-align: middle; }
        .footer-left { width: 58%; padding-right: 6px; }
        .footer-right { width: 42%; text-align: right; }

        .ref-block {
            font-size: 6pt;
            color: #64748b;
            line-height: 1.5;
        }
        .ref-code {
            font-family: DejaVu Sans Mono, monospace;
            font-weight: bold;
            color: #475569;
            letter-spacing: 0.3px;
        }
        .valid-stamp {
            display: inline-block;
            border: 1px solid #16a34a;
            color: #16a34a;
            font-size: 6.5pt;
            font-weight: bold;
            padding: 1px 6px;
            text-transform: uppercase;
            margin-top: 3px;
        }

        .sig-label {
            font-size: 7pt;
            font-weight: bold;
            color: #1a3a5c;
        }
        .sig-sub {
            font-size: 6pt;
            color: #64748b;
            font-style: italic;
            margin-bottom: 3px;
        }
        .sig-line {
            border-bottom: 1px dashed #94a3b8;
            height: 16px;
            margin: 0 0 3px 20px;
        }
        .sig-caption { font-size: 6pt; color: #94a3b8; }
        .qr-wrap { text-align: right; margin-top: 2px; }
        .qr-wrap img { border: 1px solid #1a3a5c; padding: 2px; width: 52px; height: 52px; }

        .tagline {
            font-size: 5.5pt;
            color: #94a3b8;
            text-align: center;
            margin-top: 4px;
            border-top: 0.5px solid #e2e8f0;
            padding-top: 2px;
        }
    </style>
</head>
<body>
@foreach($professorsData as $index => $data)
@php
    $academicYear = $data['academic_year'] ?? '2025 — 2026';
    $role = $data['person_role'] ?? 'Enseignant / Surveillant';
@endphp

<div class="page-frame">
<table class="page-shell" cellpadding="0" cellspacing="0">
<tr>
<td>

{{-- HEADER INSTITUTIONNEL --}}
@include('pdf.encg-header')

{{-- TITLE BANNER --}}
<div class="title-banner">
    <div class="title-main">Convocation de Surveillance des Examens</div>
    <div class="title-sub">{{ $data['session_name'] ?? 'Session d\'Examens' }}</div>
    <span class="session-badge">Session : {{ strtoupper($data['session_type'] ?? 'Normale') }}</span>
</div>

{{-- PROFESSOR INFO CARD --}}
<div class="info-card">
    <div class="info-card-title">Informations de l'Enseignant</div>
    <table class="info-inner-table" cellpadding="0" cellspacing="0">
        <tr>
            <td>
                <span class="info-label">Professeur / Surveillant</span>
                <span class="info-value big">{{ strtoupper($data['person_name'] ?? '') }}</span>
                <span class="info-label">Matricule / CIN</span>
                <span class="info-value">{{ strtoupper($data['person_id'] ?? 'N/A') }}</span>
            </td>
            <td>
                <span class="info-label">Département / Corps</span>
                <span class="info-value">{{ $data['filiere_name'] ?? 'Corps Enseignant ENCG Fès' }}</span>
                <span class="info-label">Année Universitaire</span>
                <span class="info-value">{{ $academicYear }}</span>
            </td>
        </tr>
    </table>
</div>

{{-- INSTRUCTION --}}
<div class="instruction">
    Dans le cadre de l'organisation des examens universitaires, vous êtes prié(e) d'assurer la surveillance des épreuves selon le planning officiel ci-dessous :
</div>

{{-- PLANNING TABLE --}}
<div class="section-label">Planning des Séances de Surveillance</div>
<table class="exam-table" cellpadding="0" cellspacing="0">
    <colgroup>
        <col style="width:12%">
        <col style="width:9%">
        <col style="width:40%">
        <col style="width:20%">
        <col style="width:19%">
    </colgroup>
    <thead>
        <tr>
            <th style="width:12%">Date</th>
            <th class="col-horaire" style="width:9%">Horaire</th>
            <th class="col-module" style="width:40%">Matière / Épreuve</th>
            <th style="width:20%">Salle / Amphi</th>
            <th style="width:19%">Mission / Rôle</th>
        </tr>
    </thead>
    <tbody>
        @forelse($data['exams'] as $exam)
            @php
                $timeParts = preg_split('/\s*-\s*/', (string) ($exam['time'] ?? ''), 2);
                $timeStart = trim($timeParts[0] ?? '');
                $timeEnd = trim($timeParts[1] ?? '');
                $examRole = $exam['role'] ?? 'Surveillant';
                $isPrincipal = stripos($examRole, 'principal') !== false;
            @endphp
            <tr>
                <td class="date-cell">{{ $exam['date'] }}</td>
                <td class="time-cell">
                    @if($timeStart && $timeEnd)
                        {{ $timeStart }}<br>-<br>{{ $timeEnd }}
                    @else
                        {{ $exam['time'] }}
                    @endif
                </td>
                <td class="module-cell">{{ $exam['module'] }}</td>
                <td style="font-weight:bold; color:#1e3a8a;">{{ $exam['room'] }}</td>
                <td>
                    <span class="role-pill {{ $isPrincipal ? 'principal' : '' }}">
                        {{ ucfirst($examRole) }}
                    </span>
                </td>
            </tr>
        @empty
            <tr>
                <td colspan="5" style="padding:8px; color:#64748b;">Aucune séance de surveillance assignée.</td>
            </tr>
        @endforelse
    </tbody>
</table>

{{-- DIRECTIVES DE SURVEILLANCE --}}
<div class="rules-title">Charte &amp; Directives de Surveillance — ENCG Fès</div>
<div class="rules-box">
    — <strong>Ponctualité :</strong> La présence en salle est impérative <strong>15 minutes avant</strong> le début de l'épreuve pour la vérification des listes et l'installation des étudiants.<br>
    — <strong>Contrôle d'identité :</strong> La vérification de la Carte d'Étudiant ou CIN et l'émargement individuel de la feuille de présence sont obligatoires.<br>
    — <strong>Dispositifs électroniques :</strong> L'usage des smartphones, montres connectées et écouteurs est strictement interdit aux étudiants en salle d'examen.<br>
    — <strong>Fraude :</strong> En cas de flagrant délit, un Procès-Verbal (PV) de fraude doit être dressé immédiatement, signé par les surveillants et remis à la Direction dans les 24h.<br>
    — <strong>Remise des copies :</strong> Le comptage précis des copies et leur remise contre décharge au bureau de scolarité s'effectue immédiatement à l'issue de l'épreuve.
</div>

</td>
</tr>
<tr>
<td class="footer-block">

<table class="footer-inner" cellpadding="0" cellspacing="0">
    <tr>
        <td class="footer-left">
            <div class="ref-block">
                Édité le : {{ $data['generated_at'] ?? now()->format('d/m/Y H:i:s') }}<br>
                Réf. : <span class="ref-code">{{ strtoupper(substr(md5(($data['id'] ?? 'PROF').($data['person_name'] ?? '').($data['created_at'] ?? '')), 0, 14)) }}</span>
            </div>
            <div class="valid-stamp">Document Officiel</div>
        </td>
        <td class="footer-right">
            <div class="sig-label">Le Directeur Adjoint</div>
            <div class="sig-sub">Chargé des Affaires Pédagogiques</div>
            <div class="sig-line"></div>
            <div class="sig-caption">Cachet &amp; Signature</div>
            @if(!empty($data['qrCodeBase64']))
                <div class="qr-wrap">
                    <img src="{{ $data['qrCodeBase64'] }}" alt="QR Code">
                </div>
            @elseif(!empty($data['qr_token']))
                <div class="qr-wrap">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=52x52&amp;data={{ urlencode($data['qr_token']) }}" alt="QR">
                </div>
            @endif
        </td>
    </tr>
</table>

<div class="tagline">
    ENCG Fès — Route d'Imouzzer, B.P. 1255, Fès - Maroc | Tél: +212 5 35 64 49 20 | https://encg-fes.ac.ma
</div>

</td>
</tr>
</table>
</div>

@if(!$loop->last)
<div class="page-break"></div>
@endif

@endforeach
</body>
</html>

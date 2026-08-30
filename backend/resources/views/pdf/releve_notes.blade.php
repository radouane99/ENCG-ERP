@extends('pdf.layouts.pdf_master')

@section('title', 'Relevé de Notes Officiel — ENCG Fès')

@section('releve_compact', '1')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 3mm 7mm 2mm 7mm;
    }

    .doc-title-container {
        text-align: center;
        margin: 0 0 5px 0;
    }
    .doc-title {
        font-size: 11.5pt;
        font-weight: 900;
        color: #002e5b;
        letter-spacing: 1px;
        text-transform: uppercase;
        border-bottom: 1.5px solid #002e5b;
        display: inline-block;
        padding-bottom: 2px;
    }
    .doc-subtitle {
        font-size: 6.5pt;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        margin-top: 2px;
        letter-spacing: 0.4px;
    }

    .student-info-table {
        width: 100%;
        border-collapse: collapse;
        margin: 0 0 5px 0;
        border: 0.5px solid #002e5b;
        table-layout: fixed;
    }
    .student-info-table td {
        background: #f1f5f9;
        border: 0.5px solid #94a3b8;
        padding: 2.5px 4px;
        vertical-align: middle;
    }
    .student-info-table .label {
        color: #64748b;
        font-weight: 700;
        width: 14%;
        text-transform: uppercase;
        font-size: 6pt;
    }
    .student-info-table .val { font-weight: 800; color: #0f172a; font-size: 7pt; }
    .student-info-table .val-accent { color: #047857; font-family: DejaVu Sans Mono, monospace; font-weight: 900; }
    .student-info-table .val-mono { font-family: DejaVu Sans Mono, monospace; font-weight: 800; color: #002e5b; }

    .grades-table {
        width: 100%;
        border-collapse: collapse;
        margin: 0 0 5px 0;
        font-size: 6.8pt;
        border: 0.5px solid #002e5b;
        table-layout: fixed;
    }
    .grades-table th,
    .grades-table td {
        border: 0.5px solid #94a3b8;
        padding: 3px 4px;
    }

    .sem-main-header td {
        background-color: #002e5b !important;
        color: #ffffff !important;
        padding: 2.5px 5px;
        font-size: 7pt;
        font-weight: 900;
        text-transform: uppercase;
        border-color: #002e5b !important;
    }
    .sem-title-text { text-align: left; }
    .sem-avg-text { text-align: right; color: #fef08a !important; font-weight: 900; }

    .grades-sub-header th {
        background-color: #e2e8f0;
        color: #002e5b;
        font-weight: 900;
        font-size: 5.8pt;
        text-align: center;
        text-transform: uppercase;
        padding: 2px 3px;
    }
    .grades-table tr:nth-child(even) td { background-color: #f8fafc; }

    .sem-footer-tr td {
        background-color: #e2e8f0 !important;
        font-weight: 900;
        color: #002e5b;
        font-size: 6.8pt;
        padding: 2px 4px;
        border-top: 1px solid #002e5b !important;
    }

    .col-code { font-family: DejaVu Sans Mono, monospace; font-weight: 800; color: #002e5b; font-size: 6.2pt; }
    .col-name { font-weight: 700; color: #0f172a; font-size: 6.6pt; }
    .col-session { text-align: center; font-size: 6pt; color: #475569; }
    .col-year { text-align: center; font-family: DejaVu Sans Mono, monospace; font-weight: 800; color: #002e5b; font-size: 6.2pt; }
    .col-note { text-align: center; font-family: DejaVu Sans Mono, monospace; font-weight: 900; }
    .note-ok { color: #15803d; }
    .note-ko { color: #b91c1c; }
    .col-result { text-align: center; }

    .badge-v, .badge-vcomp, .badge-nv {
        display: inline-block;
        padding: 0 4px;
        font-weight: 900;
        font-size: 5.8pt;
    }
    .badge-v { background: #dcfce7; color: #166534; border: 0.5px solid #86efac; }
    .badge-vcomp { background: #e0e7ff; color: #3730a3; border: 0.5px solid #a5b4fc; }
    .badge-nv { background: #fee2e2; color: #991b1b; border: 0.5px solid #fca5a5; }

    .result-banner {
        width: 100%;
        background: #002e5b;
        color: #ffffff;
        padding: 5px 8px;
        margin: 0;
        page-break-inside: avoid;
        box-sizing: border-box;
    }
    .result-banner .result-main {
        font-size: 7.2pt;
        font-weight: 900;
        text-transform: uppercase;
        text-align: center;
        color: #ffffff;
        letter-spacing: 0.2px;
    }
    .result-banner .result-main .avg { color: #fef08a; }
    .result-banner .result-sub {
        font-size: 6.5pt;
        font-weight: 700;
        text-align: center;
        margin-top: 2px;
        color: #e2e8f0;
    }
    .result-banner .decision-ok { color: #86efac; font-weight: 900; }
    .result-banner .decision-ko { color: #fca5a5; font-weight: 900; }
    .result-banner .mention { color: #fef08a; font-weight: 900; }
</style>
@endsection

@section('content')
<div class="doc-title-container">
    <div class="doc-title">RELEVÉ DE NOTES ET RÉSULTATS</div>
    <div class="doc-subtitle">
        SESSION ORDINAIRE &amp; RATTRAPAGE — ANNÉE UNIVERSITAIRE {{ $year ?? '2026-2027' }}
    </div>
</div>

<table class="student-info-table" width="100%" cellpadding="0" cellspacing="0">
    <tr>
        <td class="label">Étudiant(e)</td>
        <td class="val" style="width: 34%;">
            {{ $studentName ?? (strtoupper(($student->last_name ?? '') . ' ' . ($student->first_name ?? ''))) }}
        </td>
        <td class="label">N° Apogée</td>
        <td class="val-mono" style="width: 20%;">
            {{ $student->student_number ?? ($student->id ?? '—') }}
        </td>
    </tr>
    <tr>
        <td class="label">CNE / Massar</td>
        <td class="val-accent">{{ $cne ?? ($student->cne ?? '—') }}</td>
        <td class="label">CIN / CNIE</td>
        <td class="val-mono">{{ $cin ?? ($student->cin ?? '—') }}</td>
    </tr>
    <tr>
        <td class="label">Filière</td>
        <td class="val" colspan="3" style="color: #002e5b;">
            {{ $filiereName ?? ($student->latestPathway ? $student->latestPathway->filiere->name : '—') }}
        </td>
    </tr>
</table>

@php
    $oddLabel = $oddSemesterLabel ?? 'S1';
    $evenLabel = $evenSemesterLabel ?? 'S2';
    $oddNum = preg_replace('/^S/i', '', (string) $oddLabel);
    $evenNum = preg_replace('/^S/i', '', (string) $evenLabel);
@endphp

<table class="grades-table" width="100%" cellpadding="0" cellspacing="0">
    <tr class="sem-main-header">
        <td colspan="4" class="sem-title-text">SEMESTRE {{ $oddNum }}</td>
        <td colspan="2" class="sem-avg-text">MOYENNE {{ $oddLabel }} : {{ number_format($oddAvg ?? 0, 2) }} / 20</td>
    </tr>
    <tr class="grades-sub-header">
        <th style="text-align:left;width:12%;">Code</th>
        <th style="text-align:left;width:36%;">Intitulé</th>
        <th style="width:13%;">Session</th>
        <th style="width:9%;">Année</th>
        <th style="width:11%;">Note</th>
        <th style="width:11%;">Résultat</th>
    </tr>
    @forelse($oddModules ?? [] as $module)
    <tr>
        <td class="col-code">{{ $module['code'] ?? '—' }}</td>
        <td class="col-name">{{ $module['name'] ?? 'Module' }}</td>
        <td class="col-session">{{ $module['session'] ?? 'Normale' }}</td>
        <td class="col-year">{{ $module['academic_year'] ?? '—' }}</td>
        <td class="col-note {{ ($module['is_validated'] ?? false) ? 'note-ok' : 'note-ko' }}">{{ number_format($module['score'] ?? 0, 2) }}</td>
        <td class="col-result">
            @if(($module['is_comp'] ?? false) || ($module['decision'] ?? '') === 'V.COMP')
                <span class="badge-vcomp">V. COMP</span>
            @elseif($module['is_validated'] ?? false)
                <span class="badge-v">VALIDÉ</span>
            @else
                <span class="badge-nv">NON VAL.</span>
            @endif
        </td>
    </tr>
    @empty
    <tr><td colspan="6" style="text-align:center;color:#94a3b8;font-style:italic;padding:4px;">Aucun module.</td></tr>
    @endforelse
    <tr class="sem-footer-tr">
        <td colspan="4" style="text-align:right;">Résultat {{ $oddLabel }}</td>
        <td style="text-align:center;font-family:DejaVu Sans Mono,monospace;">{{ number_format($oddAvg ?? 0, 2) }} / 20</td>
        <td style="text-align:center;">
            <span class="{{ ($oddAvg ?? 0) >= 10 ? 'badge-v' : 'badge-vcomp' }}">{{ ($oddAvg ?? 0) >= 10 ? 'VALIDÉ' : 'V. COMP' }}</span>
        </td>
    </tr>
</table>

<table class="grades-table" width="100%" cellpadding="0" cellspacing="0">
    <tr class="sem-main-header">
        <td colspan="4" class="sem-title-text">SEMESTRE {{ $evenNum }}</td>
        <td colspan="2" class="sem-avg-text">MOYENNE {{ $evenLabel }} : {{ number_format($evenAvg ?? 0, 2) }} / 20</td>
    </tr>
    <tr class="grades-sub-header">
        <th style="text-align:left;width:12%;">Code</th>
        <th style="text-align:left;width:36%;">Intitulé</th>
        <th style="width:13%;">Session</th>
        <th style="width:9%;">Année</th>
        <th style="width:11%;">Note</th>
        <th style="width:11%;">Résultat</th>
    </tr>
    @forelse($evenModules ?? [] as $module)
    <tr>
        <td class="col-code">{{ $module['code'] ?? '—' }}</td>
        <td class="col-name">{{ $module['name'] ?? 'Module' }}</td>
        <td class="col-session">{{ $module['session'] ?? 'Normale' }}</td>
        <td class="col-year">{{ $module['academic_year'] ?? '—' }}</td>
        <td class="col-note {{ ($module['is_validated'] ?? false) ? 'note-ok' : 'note-ko' }}">{{ number_format($module['score'] ?? 0, 2) }}</td>
        <td class="col-result">
            @if(($module['is_comp'] ?? false) || ($module['decision'] ?? '') === 'V.COMP')
                <span class="badge-vcomp">V. COMP</span>
            @elseif($module['is_validated'] ?? false)
                <span class="badge-v">VALIDÉ</span>
            @else
                <span class="badge-nv">NON VAL.</span>
            @endif
        </td>
    </tr>
    @empty
    <tr><td colspan="6" style="text-align:center;color:#94a3b8;font-style:italic;padding:4px;">Aucun module.</td></tr>
    @endforelse
    <tr class="sem-footer-tr">
        <td colspan="4" style="text-align:right;">Résultat {{ $evenLabel }}</td>
        <td style="text-align:center;font-family:DejaVu Sans Mono,monospace;">{{ number_format($evenAvg ?? 0, 2) }} / 20</td>
        <td style="text-align:center;">
            <span class="{{ ($evenAvg ?? 0) >= 10 ? 'badge-v' : 'badge-vcomp' }}">{{ ($evenAvg ?? 0) >= 10 ? 'VALIDÉ' : 'V. COMP' }}</span>
        </td>
    </tr>
</table>

<div class="result-banner">
    <div class="result-main">
        Résultat annuel — <span class="avg">Moyenne = {{ number_format($avgGrade ?? 0, 2) }} / 20</span>
    </div>
    <div class="result-sub">
        Jury :
        <span class="{{ ($avgGrade ?? 0) >= 10 ? 'decision-ok' : 'decision-ko' }}">
            {{ ($avgGrade ?? 0) >= 10 ? 'ADMIS(E) EN ANNÉE SUPÉRIEURE' : 'NON ADMIS(E) / RATTRAPAGE' }}
        </span>
        · Mention : <span class="mention">{{ strtoupper($mention ?? '—') }}</span>
    </div>
</div>
@endsection

@section('signature_right')
    <div style="font-size: 6.8pt; color: #334155; text-align: right; font-weight: 700;">Fait à Fès, le {{ $date ?? date('d/m/Y') }}</div>
    <div style="font-size: 6pt; font-weight: 700; color: #64748b; margin-top: 1px; text-align: right;">Pour le Directeur et par délégation</div>
    <div style="font-size: 7pt; font-weight: 900; color: #002e5b; text-transform: uppercase; margin-top: 1px; text-align: right;">
        Le Directeur Adjoint aux Affaires Pédagogiques
    </div>
    <div style="margin-top: 2px; text-align: right;">
        <svg width="80" height="18" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8,22 C16,10 24,4 30,4 C35,4 32,22 36,24 C40,26 45,14 50,10 C55,4 60,18 65,16 C70,14 82,6 90,14 C98,10 102,4 112,8" stroke="#002e5b" stroke-width="2" stroke-linecap="round"/>
        </svg>
    </div>
@endsection

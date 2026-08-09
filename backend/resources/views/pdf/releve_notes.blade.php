@extends('pdf.layouts.pdf_master')

@section('title', 'Relevé de Notes Officiel — ENCG Fès')

@section('styles')
<style>
    @page {
        size: a4 portrait;
        margin: 5mm 8mm;
    }
    body {
        font-family: 'DejaVu Sans', 'Helvetica Neue', 'Arial', sans-serif;
        font-size: 7.5pt;
        color: #0f172a;
        margin: 0;
        padding: 0;
        line-height: 1.2;
    }

    /* Top Title */
    .doc-title {
        text-align: center;
        font-size: 13pt;
        font-weight: 900;
        color: #0f2863;
        letter-spacing: 1px;
        text-transform: uppercase;
        margin: 6px 0 10px 0;
        border-bottom: 2px solid #0f2863;
        padding-bottom: 4px;
    }

    /* Student Info Box */
    .student-card {
        width: 100%;
        border: 1.5px solid #0f2863;
        border-radius: 6px;
        padding: 6px 10px;
        background-color: #f8fafc;
        margin-bottom: 10px;
    }
    .student-card table { width: 100%; border-collapse: collapse; }
    .student-card td { padding: 2px 4px; vertical-align: middle; }
    .student-card .label { color: #475569; font-weight: 900; width: 20%; text-transform: uppercase; font-size: 7pt; }
    .student-card .val { font-weight: 900; color: #0f2863; font-size: 8pt; }

    /* Semester Tables */
    .sem-header-bar {
        background-color: #0f2863;
        color: #ffffff;
        padding: 4px 8px;
        font-size: 8pt;
        font-weight: 900;
        text-transform: uppercase;
        border-radius: 4px 4px 0 0;
        margin-top: 6px;
    }
    .sem-avg-badge {
        float: right;
        color: #fef08a;
        font-weight: 900;
        font-size: 8pt;
    }

    .grades-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 8px;
        font-size: 7.5pt;
        border: 1.5px solid #0f2863;
    }
    .grades-sub-header th {
        padding: 3px 6px;
        background-color: #1e293b;
        color: #ffffff;
        font-weight: 900;
        font-size: 7pt;
        text-align: center;
        text-transform: uppercase;
    }
    .grades-table td {
        padding: 3px 6px;
        border-bottom: 1px solid #cbd5e1;
        border-right: 1px solid #cbd5e1;
        font-size: 7.5pt;
    }
    .grades-table tr:nth-child(even) td { background-color: #f8fafc; }

    .sem-footer-tr td {
        background-color: #e0e7ff !important;
        font-weight: 900;
        color: #0f2863;
        font-size: 8pt;
        padding: 4px 6px;
    }

    /* Badges */
    .badge-v { background-color: #15803d; color: #ffffff; padding: 1px 5px; border-radius: 3px; font-weight: 900; font-size: 6.5pt; display: inline-block; }
    .badge-vcomp { background-color: #4338ca; color: #ffffff; padding: 1px 5px; border-radius: 3px; font-weight: 900; font-size: 6.5pt; display: inline-block; }
    .badge-nv { background-color: #be123c; color: #ffffff; padding: 1px 5px; border-radius: 3px; font-weight: 900; font-size: 6.5pt; display: inline-block; }

    /* Annual Result Box */
    .result-box {
        border: 2px solid #0f2863;
        border-radius: 6px;
        padding: 6px 10px;
        text-align: center;
        margin-bottom: 10px;
        background-color: #f1f5f9;
    }
    .result-main {
        font-size: 9.5pt;
        font-weight: 900;
        color: #0f2863;
    }
    .result-sub {
        font-size: 8.5pt;
        color: #0f172a;
        font-weight: 900;
        margin-top: 2px;
    }
</style>
@endsection

@section('content')
<div class="doc-title">
    RELEVÉ DE NOTES OFFICIEL
</div>

<div class="student-card">
    <table>
        <tr>
            <td class="label">Étudiant(e) :</td>
            <td class="val">{{ $studentName ?? (strtoupper($student->last_name ?? '') . ' ' . ($student->first_name ?? '')) }}</td>
            <td class="label">N° Apogée :</td>
            <td class="val">{{ $student->student_number ?? $student->cne ?? 'N/A' }}</td>
        </tr>
        <tr>
            <td class="label">CNE / Massar :</td>
            <td class="val">{{ $cne ?? ($student->cne ?? 'N/A') }}</td>
            <td class="label">CIN :</td>
            <td class="val">{{ $cin ?? ($student->cin ?? 'N/A') }}</td>
        </tr>
        <tr>
            <td class="label">Filière :</td>
            <td class="val">{{ $filiereName ?? ($student->latestPathway ? $student->latestPathway->filiere->name : 'Tronc Commun ENCG') }}</td>
            <td class="label">Année Académique :</td>
            <td class="val">{{ $year ?? '2026/2027' }}</td>
        </tr>
    </table>
</div>

{{-- SEMESTRE 1 --}}
<div class="sem-header-bar">
    SEMESTRE 1
    <span class="sem-avg-badge">Moyenne S1 : {{ number_format($oddAvg ?? 0, 2) }} / 20</span>
</div>
<table class="grades-table">
    <tr class="grades-sub-header">
        <th style="text-align: left; width: 22%;">CODE MODULE</th>
        <th style="text-align: left; width: 48%;">INTITULÉ DU MODULE</th>
        <th style="width: 15%;">NOTE / 20</th>
        <th style="width: 15%;">RÉSULTAT</th>
    </tr>
    @forelse($oddModules ?? [] as $module)
    <tr>
        <td style="font-family: monospace; font-weight: bold; color: #0f2863;">{{ $module['code'] ?? 'MOD' }}</td>
        <td style="font-weight: bold; color: #1e293b;">{{ $module['name'] ?? 'Module' }}</td>
        <td style="text-align: center; font-family: monospace; font-weight: 900; color: {{ ($module['is_validated'] ?? false) ? '#15803d' : '#b91c1c' }};">
            {{ number_format($module['score'] ?? 0, 2) }}
        </td>
        <td style="text-align: center;">
            @if(($module['is_comp'] ?? false) || ($module['decision'] ?? '') === 'V.COMP')
                <span class="badge-vcomp">VALIDÉ P. COMP</span>
            @elseif($module['is_validated'] ?? false)
                <span class="badge-v">VALIDÉ</span>
            @else
                <span class="badge-nv">NON VALIDÉ</span>
            @endif
        </td>
    </tr>
    @empty
    <tr>
        <td colspan="4" style="text-align: center; color: #94a3b8; font-style: italic;">Aucun module enregistré pour le Semestre 1.</td>
    </tr>
    @endforelse
    <tr class="sem-footer-tr">
        <td colspan="2" style="text-align: right;">RÉSULTAT S1 : MOYENNE DU SEMESTRE 1</td>
        <td style="text-align: center; font-family: monospace;">{{ number_format($oddAvg ?? 0, 2) }} / 20</td>
        <td style="text-align: center;">
            <span class="badge-v">{{ ($oddAvg ?? 0) >= 10 ? 'VALIDÉ' : 'V.COMP' }}</span>
        </td>
    </tr>
</table>

{{-- SEMESTRE 2 --}}
<div class="sem-header-bar">
    SEMESTRE 2
    <span class="sem-avg-badge">Moyenne S2 : {{ number_format($evenAvg ?? 0, 2) }} / 20</span>
</div>
<table class="grades-table">
    <tr class="grades-sub-header">
        <th style="text-align: left; width: 22%;">CODE MODULE</th>
        <th style="text-align: left; width: 48%;">INTITULÉ DU MODULE</th>
        <th style="width: 15%;">NOTE / 20</th>
        <th style="width: 15%;">RÉSULTAT</th>
    </tr>
    @forelse($evenModules ?? [] as $module)
    <tr>
        <td style="font-family: monospace; font-weight: bold; color: #0f2863;">{{ $module['code'] ?? 'MOD' }}</td>
        <td style="font-weight: bold; color: #1e293b;">{{ $module['name'] ?? 'Module' }}</td>
        <td style="text-align: center; font-family: monospace; font-weight: 900; color: {{ ($module['is_validated'] ?? false) ? '#15803d' : '#b91c1c' }};">
            {{ number_format($module['score'] ?? 0, 2) }}
        </td>
        <td style="text-align: center;">
            @if(($module['is_comp'] ?? false) || ($module['decision'] ?? '') === 'V.COMP')
                <span class="badge-vcomp">VALIDÉ P. COMP</span>
            @elseif($module['is_validated'] ?? false)
                <span class="badge-v">VALIDÉ</span>
            @else
                <span class="badge-nv">NON VALIDÉ</span>
            @endif
        </td>
    </tr>
    @empty
    <tr>
        <td colspan="4" style="text-align: center; color: #94a3b8; font-style: italic;">Aucun module enregistré pour le Semestre 2.</td>
    </tr>
    @endforelse
    <tr class="sem-footer-tr">
        <td colspan="2" style="text-align: right;">RÉSULTAT S2 : MOYENNE DU SEMESTRE 2</td>
        <td style="text-align: center; font-family: monospace;">{{ number_format($evenAvg ?? 0, 2) }} / 20</td>
        <td style="text-align: center;">
            <span class="badge-vcomp">{{ ($evenAvg ?? 0) >= 10 ? 'VALIDÉ P. COMP' : 'NON VALIDÉ' }}</span>
        </td>
    </tr>
</table>

{{-- ANNUALE / GLOBAL SUMMARY --}}
<div class="result-box">
    <div class="result-main">RÉSULTAT ANNUEL CONSOLIDÉ : <span style="color: #0f2863;">MOYENNE GÉNÉRALE = {{ number_format($avgGrade ?? 0, 2) }} / 20</span></div>
    <div class="result-sub">Décision Finale du Jury : <span style="color: {{ ($avgGrade ?? 0) >= 10 ? '#15803d' : '#b91c1c' }};">{{ ($avgGrade ?? 0) >= 10 ? 'ADMIS(E) AU NIVEAU SUPÉRIEUR (VALIDÉ PAR COMPENSATION)' : 'NON ADMIS(E) / RATTRAPAGE' }}</span></div>
</div>
@endsection

@section('signature_right')
    <div style="font-size: 8pt; color: #334155; text-align: right;">Fait à Fès, le {{ $date ?? date('d/m/Y') }}</div>
    <div style="font-size: 7pt; font-weight: bold; color: #475569; margin-top: 2px; text-align: right;">Pour le Directeur et par délégation</div>
    <div style="font-size: 8.5pt; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 1px; text-align: right;">
        LE CHEF DU SERVICE DE LA SCOLARITÉ
    </div>
    <div style="margin-top: 4px; text-align: right;">
        <svg width="110" height="30" viewBox="0 0 120 35" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10,20 Q15,8 20,16 T30,12 T40,20 T50,12 T60,20 T70,8 T80,20 T90,12 T100,16 T110,20" stroke="#0f2863" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>
    </div>
@endsection

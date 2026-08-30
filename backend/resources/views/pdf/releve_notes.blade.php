@extends('pdf.layouts.pdf_master')

@section('title', 'Relevé de Notes Officiel — ENCG Fès')

@section('styles')
<style>
    /* Document Title Banner */
    .doc-title-container {
        text-align: center;
        margin: 0 0 7px 0;
    }
    .doc-title {
        font-size: 12.5pt;
        font-weight: 900;
        color: #002e5b;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        border-bottom: 2px solid #002e5b;
        display: inline-block;
        padding-bottom: 2px;
    }
    .doc-subtitle {
        font-size: 7.5pt;
        font-weight: 800;
        color: #475569;
        text-transform: uppercase;
        margin-top: 2px;
        letter-spacing: 0.8px;
    }

    /* Student Information Card */
    .student-card {
        width: 100%;
        border: 1.2px solid #002e5b;
        border-radius: 5px;
        padding: 4.5px 8px;
        background-color: #f8fafc;
        margin-bottom: 7px;
        box-sizing: border-box;
    }
    .student-card table { 
        width: 100%; 
        border-collapse: collapse; 
    }
    .student-card td { 
        padding: 2px 4px; 
        vertical-align: middle; 
    }
    .student-card .label { 
        color: #475569; 
        font-weight: 800; 
        width: 17%; 
        text-transform: uppercase; 
        font-size: 6.8pt; 
    }
    .student-card .val { 
        font-weight: 900; 
        color: #002e5b; 
        font-size: 8pt; 
    }

    /* Unified Grade Tables */
    .grades-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 6px;
        font-size: 7.2pt;
        border: 1.2px solid #002e5b;
        box-sizing: border-box;
    }
    
    /* Semester Top Banner as 1st Row */
    .sem-main-header td {
        background-color: #002e5b !important;
        color: #ffffff !important;
        padding: 3.5px 8px;
        font-size: 7.8pt;
        font-weight: 900;
        text-transform: uppercase;
        border-bottom: 1.2px solid #002e5b;
    }
    .sem-title-text {
        text-align: left;
        letter-spacing: 0.5px;
    }
    .sem-avg-text {
        text-align: right;
        color: #fef08a !important;
        font-weight: 900;
    }

    .grades-sub-header th {
        padding: 3px 6px;
        background-color: #1e293b;
        color: #ffffff;
        font-weight: 900;
        font-size: 6.8pt;
        text-align: center;
        text-transform: uppercase;
        border-right: 0.5px solid #334155;
        border-bottom: 0.5px solid #cbd5e1;
    }
    .grades-table td {
        padding: 2.8px 6px;
        border-bottom: 0.5px solid #cbd5e1;
        border-right: 0.5px solid #cbd5e1;
        font-size: 7.2pt;
    }
    .grades-table tr:nth-child(even) td { 
        background-color: #f8fafc; 
    }

    .sem-footer-tr td {
        background-color: #e2e8f0 !important;
        font-weight: 900;
        color: #002e5b;
        font-size: 7.5pt;
        padding: 3px 6px;
        border-top: 1.2px solid #002e5b;
    }

    /* Status Badges */
    .badge-v { 
        background-color: #15803d; 
        color: #ffffff; 
        padding: 1px 5px; 
        border-radius: 3px; 
        font-weight: 900; 
        font-size: 6.2pt; 
        display: inline-block; 
    }
    .badge-vcomp { 
        background-color: #4338ca; 
        color: #ffffff; 
        padding: 1px 5px; 
        border-radius: 3px; 
        font-weight: 900; 
        font-size: 6.2pt; 
        display: inline-block; 
    }
    .badge-nv { 
        background-color: #be123c; 
        color: #ffffff; 
        padding: 1px 5px; 
        border-radius: 3px; 
        font-weight: 900; 
        font-size: 6.2pt; 
        display: inline-block; 
    }

    /* Annual Consolidation Box */
    .result-box {
        border: 1.5px solid #002e5b;
        border-radius: 5px;
        padding: 4.5px 8px;
        text-align: center;
        margin-bottom: 6px;
        background-color: #f8fafc;
        box-sizing: border-box;
    }
    .result-main {
        font-size: 8.8pt;
        font-weight: 900;
        color: #002e5b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .result-sub {
        font-size: 7.8pt;
        color: #1e293b;
        font-weight: 900;
        margin-top: 1.5px;
    }
</style>
@endsection

@section('content')
<div class="doc-title-container">
    <div class="doc-title">
        RELEVÉ DE NOTES ET RÉSULTATS
    </div>
    <div class="doc-subtitle">
        SESSION ORDINAIRE &amp; RATTRAPAGE — ANNÉE UNIVERSITAIRE {{ $year ?? '2026-2027' }}
    </div>
</div>

<div class="student-card">
    <table>
        <tr>
            <td class="label">Étudiant(e) :</td>
            <td class="val" style="width: 34%;">
                {{ $studentName ?? (strtoupper(($student->last_name ?? '') . ' ' . ($student->first_name ?? ''))) }}
            </td>
            <td class="label">N° Apogée :</td>
            <td class="val" style="font-family: monospace; width: 20%;">
                {{ $student->student_number ?? ($student->id ?? '159') }}
            </td>
        </tr>
        <tr>
            <td class="label">CNE / Massar :</td>
            <td class="val" style="font-family: monospace; color: #059669;">
                {{ $cne ?? ($student->cne ?? 'H148073298') }}
            </td>
            <td class="label">CIN / CNIE :</td>
            <td class="val" style="font-family: monospace;">
                {{ $cin ?? ($student->cin ?? 'ZG195334') }}
            </td>
        </tr>
        <tr>
            <td class="label">Filière :</td>
            <td class="val" colspan="3" style="color: #002e5b;">
                {{ $filiereName ?? ($student->latestPathway ? $student->latestPathway->filiere->name : 'DEUX ANNÉES PRÉPARATOIRES (TRONC COMMUN)') }}
            </td>
        </tr>
    </table>
</div>

{{-- ── SEMESTRE 1 TABLE ── --}}
<table class="grades-table" width="100%" cellpadding="0" cellspacing="0">
    <tr class="sem-main-header">
        <td colspan="3" class="sem-title-text">
            SEMESTRE 1
        </td>
        <td colspan="2" class="sem-avg-text">
            MOYENNE S1 : {{ number_format($oddAvg ?? 0, 2) }} / 20
        </td>
    </tr>
    <tr class="grades-sub-header">
        <th style="text-align: left; width: 17%;">CODE MODULE</th>
        <th style="text-align: left; width: 45%;">INTITULÉ DU MODULE</th>
        <th style="width: 14%;">SESSION</th>
        <th style="width: 12%;">NOTE / 20</th>
        <th style="width: 12%;">RÉSULTAT</th>
    </tr>
    @forelse($oddModules ?? [] as $module)
    <tr>
        <td style="font-family: monospace; font-weight: 900; color: #002e5b;">{{ $module['code'] ?? 'MOD1' }}</td>
        <td style="font-weight: 800; color: #1e293b;">{{ $module['name'] ?? 'Module' }}</td>
        <td style="text-align: center; font-size: 6.8pt; color: #475569; font-weight: bold;">{{ $module['session'] ?? 'Session Normale' }}</td>
        <td style="text-align: center; font-family: monospace; font-weight: 900; color: {{ ($module['is_validated'] ?? false) ? '#15803d' : '#b91c1c' }};">
            {{ number_format($module['score'] ?? 0, 2) }}
        </td>
        <td style="text-align: center;">
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
    <tr>
        <td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic; padding: 5px;">Aucun module enregistré pour le Semestre 1.</td>
    </tr>
    @endforelse
    <tr class="sem-footer-tr">
        <td colspan="3" style="text-align: right;">RÉSULTAT SEMESTRE 1 :</td>
        <td style="text-align: center; font-family: monospace; font-size: 7.8pt;">{{ number_format($oddAvg ?? 0, 2) }} / 20</td>
        <td style="text-align: center;">
            <span class="{{ ($oddAvg ?? 0) >= 10 ? 'badge-v' : 'badge-vcomp' }}">{{ ($oddAvg ?? 0) >= 10 ? 'VALIDÉ' : 'V. COMP' }}</span>
        </td>
    </tr>
</table>

{{-- ── SEMESTRE 2 TABLE ── --}}
<table class="grades-table" width="100%" cellpadding="0" cellspacing="0">
    <tr class="sem-main-header">
        <td colspan="3" class="sem-title-text">
            SEMESTRE 2
        </td>
        <td colspan="2" class="sem-avg-text">
            MOYENNE S2 : {{ number_format($evenAvg ?? 0, 2) }} / 20
        </td>
    </tr>
    <tr class="grades-sub-header">
        <th style="text-align: left; width: 17%;">CODE MODULE</th>
        <th style="text-align: left; width: 45%;">INTITULÉ DU MODULE</th>
        <th style="width: 14%;">SESSION</th>
        <th style="width: 12%;">NOTE / 20</th>
        <th style="width: 12%;">RÉSULTAT</th>
    </tr>
    @forelse($evenModules ?? [] as $module)
    <tr>
        <td style="font-family: monospace; font-weight: 900; color: #002e5b;">{{ $module['code'] ?? 'MOD2' }}</td>
        <td style="font-weight: 800; color: #1e293b;">{{ $module['name'] ?? 'Module' }}</td>
        <td style="text-align: center; font-size: 6.8pt; color: #475569; font-weight: bold;">{{ $module['session'] ?? 'Session Normale' }}</td>
        <td style="text-align: center; font-family: monospace; font-weight: 900; color: {{ ($module['is_validated'] ?? false) ? '#15803d' : '#b91c1c' }};">
            {{ number_format($module['score'] ?? 0, 2) }}
        </td>
        <td style="text-align: center;">
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
    <tr>
        <td colspan="5" style="text-align: center; color: #94a3b8; font-style: italic; padding: 5px;">Aucun module enregistré pour le Semestre 2.</td>
    </tr>
    @endforelse
    <tr class="sem-footer-tr">
        <td colspan="3" style="text-align: right;">RÉSULTAT SEMESTRE 2 :</td>
        <td style="text-align: center; font-family: monospace; font-size: 7.8pt;">{{ number_format($evenAvg ?? 0, 2) }} / 20</td>
        <td style="text-align: center;">
            <span class="{{ ($evenAvg ?? 0) >= 10 ? 'badge-v' : 'badge-vcomp' }}">{{ ($evenAvg ?? 0) >= 10 ? 'VALIDÉ' : 'V. COMP' }}</span>
        </td>
    </tr>
</table>

{{-- ── ANNUAL DELIBERATION SUMMARY ── --}}
<div class="result-box">
    <div class="result-main">
        RÉSULTAT ANNUEL CONSOLIDÉ : <span style="color: #002e5b;">MOYENNE GÉNÉRALE = {{ number_format($avgGrade ?? 0, 2) }} / 20</span>
    </div>
    <div class="result-sub">
        Décision du Jury : 
        <strong style="color: {{ ($avgGrade ?? 0) >= 10 ? '#15803d' : '#b91c1c' }};">
            {{ ($avgGrade ?? 0) >= 10 ? 'ADMIS(E) EN ANNÉE SUPÉRIEURE (VALIDÉ PAR COMPENSATION)' : 'NON ADMIS(E) / RATTRAPAGE' }}
        </strong>
        &nbsp;•&nbsp; Mention : <strong style="color: #002e5b;">{{ strtoupper($mention ?? 'BIEN') }}</strong>
    </div>
</div>
@endsection

@section('signature_right')
    <div style="font-size: 7.5pt; color: #334155; text-align: right;">Fait à Fès, le {{ $date ?? date('d/m/Y') }}</div>
    <div style="font-size: 6.8pt; font-weight: bold; color: #475569; margin-top: 1px; text-align: right;">Pour le Directeur et par délégation</div>
    <div style="font-size: 8pt; font-weight: 900; color: #002e5b; text-transform: uppercase; margin-top: 1px; text-align: right;">
        LE DIRECTEUR ADJOINT AUX AFFAIRES PÉDAGOGIQUES
    </div>
    <div style="margin-top: 2px; text-align: right;">
        <svg width="100" height="24" viewBox="0 0 120 35" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10,20 Q15,8 20,16 T30,12 T40,20 T50,12 T60,20 T70,8 T80,20 T90,12 T100,16 T110,20" stroke="#002e5b" stroke-width="2" fill="none" stroke-linecap="round"/>
        </svg>
    </div>
@endsection

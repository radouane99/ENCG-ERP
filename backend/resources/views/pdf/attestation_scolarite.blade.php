@extends('pdf.layouts.pdf_master')

@section('title', 'Attestation de Scolarité — ENCG Fès')

@section('styles')
<style>
    /* Document Title Banner */
    .doc-title-container {
        text-align: center;
        margin: 8px 0 16px 0;
        page-break-inside: avoid;
    }
    .doc-title {
        font-size: 15pt;
        font-weight: 900;
        color: #002e5b;
        letter-spacing: 2px;
        text-transform: uppercase;
        border-bottom: 2.5px solid #002e5b;
        display: inline-block;
        padding-bottom: 4px;
    }
    .doc-subtitle {
        font-size: 8.5pt;
        font-weight: 800;
        color: #475569;
        text-transform: uppercase;
        margin-top: 4px;
        letter-spacing: 1px;
    }

    /* Narrative Text */
    .attestation-narrative {
        font-size: 9.5pt;
        line-height: 1.7;
        text-align: justify;
        color: #1e293b;
        margin-bottom: 12px;
        page-break-inside: avoid;
    }

    /* Combined Identity & Academic Record Table */
    .info-card-table {
        width: 100%;
        border-collapse: collapse;
        margin: 10px 0 16px 0;
        border: 1.5px solid #002e5b;
        border-radius: 5px;
        box-sizing: border-box;
        page-break-inside: avoid;
    }
    .info-card-header td {
        background-color: #002e5b !important;
        color: #ffffff !important;
        padding: 5.5px 10px;
        font-size: 8.5pt;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        border-bottom: 1.5px solid #002e5b;
    }
    .info-card-table td {
        padding: 5.5px 10px;
        border-bottom: 1px solid #cbd5e1;
        font-size: 8.8pt;
        vertical-align: middle;
    }
    .info-card-table tr:nth-child(even) td {
        background-color: #f8fafc;
    }
    .info-card-table .label {
        width: 32%;
        font-weight: 800;
        color: #475569;
        text-transform: uppercase;
        font-size: 7.8pt;
        letter-spacing: 0.4px;
        background-color: #f1f5f9;
        border-right: 1px solid #cbd5e1;
    }
    .info-card-table .val {
        font-weight: 900;
        color: #1e293b;
    }
    .info-card-table .val-name {
        font-size: 10.5pt;
        color: #002e5b;
        text-transform: uppercase;
        font-weight: 900;
        letter-spacing: 0.5px;
    }
    .info-card-table .val-accent {
        font-family: DejaVu Sans Mono, monospace;
        font-weight: 900;
        color: #059669;
        font-size: 10pt;
    }
    .info-card-table .val-mono {
        font-family: DejaVu Sans Mono, monospace;
        font-weight: 900;
        color: #002e5b;
        font-size: 9.5pt;
    }

    /* Purpose Box */
    .purpose-box {
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-left: 3.5px solid #002e5b;
        padding: 10px 14px;
        font-size: 9pt;
        line-height: 1.6;
        color: #334155;
        margin: 12px 0 16px 0;
        page-break-inside: avoid;
        text-align: justify;
    }

    /* Official Stamp Circle */
    .official-seal-box {
        display: inline-block;
        border: 1.8px solid #002e5b;
        border-radius: 50%;
        width: 62px;
        height: 62px;
        text-align: center;
        vertical-align: middle;
        padding: 5px 2px;
        color: #002e5b;
        font-size: 5pt;
        font-weight: 900;
        text-transform: uppercase;
        line-height: 1.25;
        margin-right: 10px;
    }
</style>
@endsection

@section('content')
<div class="doc-title-container">
    <div class="doc-title">
        ATTESTATION DE SCOLARITÉ
    </div>
    <div class="doc-subtitle">
        ANNÉE UNIVERSITAIRE {{ $year ?? '2026-2027' }}
    </div>
</div>

<div class="attestation-narrative">
    Le Directeur de l'École Nationale de Commerce et de Gestion de Fès (Université Sidi Mohamed Ben Abdellah) atteste et certifie par la présente que l'étudiant(e) désigné(e) ci-après est régulièrement inscrit(e) et poursuit ses études supérieures au sein de notre établissement :
</div>

{{-- ── IDENTITÉ ET CURSUS ACADÉMIQUE ── --}}
<table class="info-card-table" width="100%" cellpadding="0" cellspacing="0">
    <tr class="info-card-header">
        <td colspan="2">1. IDENTITÉ ET ÉTAT CIVIL DE L'ÉTUDIANT(E)</td>
    </tr>
    <tr>
        <td class="label">Nom et Prénom :</td>
        <td class="val val-name">
            {{ $studentName ?? (strtoupper(($student->last_name ?? '') . ' ' . ($student->first_name ?? ''))) }}
        </td>
    </tr>
    <tr>
        <td class="label">Date et Lieu de Naissance :</td>
        <td class="val">
            {{ $birthDate ?? ($student->birth_date ? \Carbon\Carbon::parse($student->birth_date)->format('d/m/Y') : '25/07/2008') }} à {{ strtoupper($birthCity ?? ($student->birth_place ?? 'OUJDA')) }}
        </td>
    </tr>
    <tr>
        <td class="label">Nationalité :</td>
        <td class="val" style="font-weight: bold; color: #1e293b;">
            {{ $nationality ?? ($student->nationality ?? 'Marocaine') }}
        </td>
    </tr>
    <tr>
        <td class="label">Code Massar / CNE :</td>
        <td class="val val-accent">
            {{ $cne ?? ($student->cne ?? 'H148073298') }}
        </td>
    </tr>
    <tr>
        <td class="label">Carte d'Identité (CIN / CNIE) :</td>
        <td class="val val-mono">
            {{ $cin ?? ($student->cin ?? 'ZG195334') }}
        </td>
    </tr>
    <tr>
        <td class="label">N° d'Inscription / Apogée :</td>
        <td class="val val-mono">
            {{ $student->student_number ?? ($student->id ?? 'H148073298') }}
        </td>
    </tr>
    <tr class="info-card-header">
        <td colspan="2">2. INSCRIPTION PÉDAGOGIQUE ET FILIÈRE</td>
    </tr>
    <tr>
        <td class="label">Diplôme Préparé :</td>
        <td class="val" style="color: #002e5b; font-weight: 900;">
            Diplôme des Écoles Nationales de Commerce et de Gestion (Bac+5 / Grade Master)
        </td>
    </tr>
    <tr>
        <td class="label">Filière / Spécialité :</td>
        <td class="val" style="color: #002e5b; font-weight: 900;">
            {{ $filiereName ?? ($student->latestPathway?->filiere?->name ?? 'DEUX ANNÉES PRÉPARATOIRES (TRONC COMMUN)') }}
        </td>
    </tr>
    <tr>
        <td class="label">Régime des Études :</td>
        <td class="val">
            Formation Initiale à Temps Plein (Régime Présentiel)
        </td>
    </tr>
    <tr>
        <td class="label">Année Universitaire :</td>
        <td class="val" style="color: #002e5b; font-weight: 900;">
            {{ $year ?? '2026-2027' }}
        </td>
    </tr>
</table>

<div class="purpose-box">
    La présente attestation officielle est délivrée à l'intéressé(e) sur sa demande pour servir et valoir ce que de droit, notamment pour les démarches administratives, de stage, de couverture médicale, de bourse ou d'assurance.
</div>
@endsection

@section('signature_right')
    <div style="font-size: 8pt; color: #334155; text-align: right; font-weight: bold;">Fait à Fès, le {{ $date ?? date('d/m/Y') }}</div>
    <div style="font-size: 7.2pt; font-weight: bold; color: #475569; margin-top: 1.5px; text-align: right;">Pour le Directeur et par délégation</div>
    <div style="font-size: 8.8pt; font-weight: 900; color: #002e5b; text-transform: uppercase; margin-top: 1px; text-align: right;">
        LE SECRÉTAIRE GÉNÉRAL
    </div>
    <div style="margin-top: 3px; text-align: right;">
        <table align="right" style="border-collapse: collapse; margin-left: auto;">
            <tr>
                <td style="vertical-align: middle; padding-right: 8px;">
                    <div class="official-seal-box">
                        ROYAUME DU MAROC<br>
                        ★ ENCG FÈS ★<br>
                        USMBA<br>
                        SCEAU OFFICIEL
                    </div>
                </td>
                <td style="vertical-align: middle;">
                    <svg width="95" height="26" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8,22 C16,10 24,4 30,4 C35,4 32,22 36,24 C40,26 45,14 50,10 C55,4 60,18 65,16 C70,14 82,6 90,14 C98,10 102,4 112,8" stroke="#002e5b" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </td>
            </tr>
        </table>
    </div>
@endsection

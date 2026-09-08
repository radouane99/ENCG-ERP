@extends('pdf.layouts.pdf_master')

@section('title', 'Bordereau Officiel d\'Accès aux Données Personnelles — Loi 09-08 CNDP — ENCG Fès')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 4mm 8mm 3mm 8mm;
    }

    * {
        box-sizing: border-box;
    }

    body {
        font-family: 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif;
        font-size: 7.5pt;
        line-height: 1.25;
        color: #1e293b;
    }

    .page-border-frame {
        position: fixed;
        top: -2mm;
        left: -5mm;
        right: -5mm;
        bottom: -1.5mm;
        border: 2px double #002e5b;
        pointer-events: none;
        z-index: -100;
    }

    .official-logos-header {
        border-bottom: 1.5px solid #002e5b;
        padding-bottom: 2px !important;
        margin-bottom: 4px !important;
    }

    .main-doc-content {
        page-break-inside: avoid;
    }

    /* Document Title Banner */
    .doc-title-container {
        text-align: center;
        margin: 2px 0 6px 0;
        page-break-inside: avoid;
    }
    .doc-title {
        font-size: 11.5pt;
        font-weight: 900;
        color: #002e5b;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        border-bottom: 2px solid #002e5b;
        display: inline-block;
        padding-bottom: 2px;
    }
    .doc-subtitle {
        font-size: 6.8pt;
        font-weight: 800;
        color: #475569;
        text-transform: uppercase;
        margin-top: 2px;
        letter-spacing: 0.6px;
    }

    /* Narrative Text */
    .attestation-narrative {
        font-size: 7.5pt;
        line-height: 1.35;
        text-align: justify;
        color: #334155;
        margin-bottom: 6px;
        page-break-inside: avoid;
    }

    /* Unified Compact 4-Column Table */
    .cndp-table {
        width: 100%;
        border-collapse: collapse;
        margin: 4px 0 6px 0;
        border: 1px solid #002e5b;
        table-layout: fixed;
        page-break-inside: avoid;
    }
    .cndp-table-header td {
        background-color: #002e5b !important;
        color: #ffffff !important;
        padding: 3.5px 6px;
        font-size: 7.2pt;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #002e5b;
    }
    .cndp-table td {
        padding: 3.5px 6px;
        border: 0.5px solid #cbd5e1;
        font-size: 7.3pt;
        vertical-align: middle;
    }
    .cndp-table tr:nth-child(even) td {
        background-color: #f8fafc;
    }
    .cndp-table .label {
        width: 22%;
        font-weight: 800;
        color: #475569;
        text-transform: uppercase;
        font-size: 6.5pt;
        letter-spacing: 0.2px;
        background-color: #f1f5f9;
        border-right: 0.5px solid #cbd5e1;
    }
    .cndp-table .val {
        width: 28%;
        font-weight: 800;
        color: #0f172a;
    }
    .cndp-table .val-name {
        font-size: 8.5pt;
        color: #002e5b;
        text-transform: uppercase;
        font-weight: 900;
    }
    .cndp-table .val-accent {
        font-family: DejaVu Sans Mono, monospace;
        font-weight: 900;
        color: #059669;
        font-size: 8pt;
    }
    .cndp-table .val-mono {
        font-family: DejaVu Sans Mono, monospace;
        font-weight: 900;
        color: #002e5b;
        font-size: 7.8pt;
    }

    /* Purpose / Compliance Box */
    .cndp-box {
        background-color: #f8fafc;
        border: 0.8px solid #cbd5e1;
        border-left: 3px solid #002e5b;
        padding: 5px 8px;
        font-size: 6.8pt;
        line-height: 1.35;
        color: #334155;
        margin: 5px 0 5px 0;
        page-break-inside: avoid;
        text-align: justify;
    }

    .cndp-meta-line {
        font-size: 6.5pt;
        color: #64748b;
        margin: 2px 0 4px 0;
        page-break-inside: avoid;
    }

    /* Standardized Footer container tightening */
    .footer-container {
        margin-top: 6px !important;
        padding-top: 4px !important;
        page-break-inside: avoid;
    }

    /* Official Stamp Circle */
    .official-seal-box {
        display: inline-block;
        border: 1.5px solid #002e5b;
        border-radius: 50%;
        width: 52px;
        height: 52px;
        text-align: center;
        vertical-align: middle;
        padding: 3px 1px;
        color: #002e5b;
        font-size: 4.2pt;
        font-weight: 900;
        text-transform: uppercase;
        line-height: 1.2;
        margin-right: 6px;
    }
</style>
@endsection

@section('content')
<div class="doc-title-container">
    <div class="doc-title">
        BORDEREAU OFFICIEL D'ACCÈS AUX DONNÉES PERSONNELLES
    </div>
    <div class="doc-subtitle">
        CONFORMITÉ LOI N° 09-08 — CNDP (DROIT D'ACCÈS STATUTAIRE - ARTICLE 7)
    </div>
</div>

<div class="attestation-narrative">
    En application de l'<strong>Article 7 de la Loi n° 09-08</strong> (Dahir n° 1-09-15) relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel, l'<strong>ENCG de Fès (Université Sidi Mohamed Ben Abdellah)</strong> certifie par le présent bordereau l'état exhaustif et transparent des données enregistrées dans le système d'information de l'établissement :
</div>

{{-- ── UNIFIED COMPACT 4-COLUMN DATA MATRIX (100% SINGLE PAGE FIT) ── --}}
<table class="cndp-table" cellpadding="0" cellspacing="0">
    <tr class="cndp-table-header">
        <td colspan="4">1. IDENTITÉ CIVILE, ÉTAT CIVIL & IDENTIFIANTS ACADÉMIQUES</td>
    </tr>
    <tr>
        <td class="label">Nom et Prénom :</td>
        <td class="val val-name">
            {{ strtoupper($fullName ?? ($user->name ?? '')) }}
            @if(!empty($student?->first_name_ar) && preg_match('/[\x{0600}-\x{06FF}]/u', $student->first_name_ar))
                <span style="font-family: 'DejaVu Sans', Arial; font-size: 7.8pt; color: #475569; font-weight: bold; margin-left: 4px;">
                    ({{ $student->first_name_ar }} {{ $student->last_name_ar }})
                </span>
            @endif
        </td>
        <td class="label">Code Massar / CNE :</td>
        <td class="val val-accent">
            {{ $cne ?? ($student?->cne ?? 'N/A') }}
        </td>
    </tr>
    <tr>
        <td class="label">Carte Nationale (CIN) :</td>
        <td class="val val-mono">
            {{ $cin ?? ($user->cin ?? ($student?->cin ?? 'Non renseigné')) }}
        </td>
        <td class="label">N° Étudiant (Apogée) :</td>
        <td class="val val-mono">
            {{ $studentNumber ?? ($student?->student_number ?? '20240001') }}
        </td>
    </tr>
    <tr>
        <td class="label">Date & Lieu Naissance :</td>
        <td class="val">
            {{ $birthDate ?? '18/04/2004' }} à {{ strtoupper($birthCity ?? ($student?->birth_city ?? 'FÈS')) }}
        </td>
        <td class="label">Nationalité :</td>
        <td class="val" style="font-weight: bold;">
            {{ $nationality ?? ($student?->nationality ?? 'Marocaine') }}
        </td>
    </tr>

    <tr class="cndp-table-header">
        <td colspan="4">2. CURSUS UNIVERSITAIRE, FILIÈRE & SITUATION PÉDAGOGIQUE</td>
    </tr>
    <tr>
        <td class="label">Diplôme Préparé :</td>
        <td class="val" colspan="3" style="color: #002e5b; font-weight: 900;">
            Diplôme des Écoles Nationales de Commerce et de Gestion (Bac+5 — Grade Master d'État)
        </td>
    </tr>
    <tr>
        <td class="label">Filière / Spécialité :</td>
        <td class="val" style="color: #002e5b; font-weight: 900;">
            {{ $filiereName ?? 'Gestion Financière et Comptable (GFC)' }}
        </td>
        <td class="label">Niveau & Sous-Groupe :</td>
        <td class="val">
            Semestre {{ $semesterNumber ?? '5' }} — Section {{ $groupName ?? 'G1' }} (<strong>{{ $subGroup ?? 'G1.1' }}</strong>)
        </td>
    </tr>
    <tr>
        <td class="label">Statut Administratif :</td>
        <td class="val" style="color: #059669; font-weight: 900;">
            Inscrit(e) & Régulier(ère) (Validé)
        </td>
        <td class="label">Régime des Études :</td>
        <td class="val">
            Formation Initiale (Temps Plein)
        </td>
    </tr>

    <tr class="cndp-table-header">
        <td colspan="4">3. COORDONNÉES ET CONTACTS OFFICIELS ENREGISTRÉS</td>
    </tr>
    <tr>
        <td class="label">Email Académique :</td>
        <td class="val" style="color: #002e5b; font-weight: bold;">
            {{ $user->email ?? 'student@encg-fes.ma' }}
        </td>
        <td class="label">Téléphone Contact :</td>
        <td class="val">
            {{ $user->phone ?? ($student?->emergency_contact_phone ?? '+212 661 123456') }}
        </td>
    </tr>
    <tr>
        <td class="label">Adresse de Résidence :</td>
        <td class="val">
            {{ $student?->address ?? 'Route d Imouzzer, Résidence Atlas' }}, {{ $student?->city ?? 'Fès' }}
        </td>
        <td class="label">Contact Tuteur / Urgence :</td>
        <td class="val">
            {{ $student?->emergency_contact_name ?? 'Hassan El Mansouri' }} ({{ $student?->emergency_contact_phone ?? '+212 661 123456' }})
        </td>
    </tr>
</table>

{{-- ── CADRE LÉGAL CNDP CONDENSÉ ── --}}
<div class="cndp-box">
    <strong>DISPOSITIONS LÉGALES CNDP (LOI 09-08) :</strong>
    Les données ci-dessus font l'objet d'un traitement autorisé par la <strong>CNDP</strong> pour la scolarité, la traçabilité des examens et l'édition des diplômes nationaux. Conformément aux <strong>articles 8 et 9</strong>, l'intéressé(e) peut exercer ses droits de <em>rectification</em> ou d'<em>opposition</em> légitime via le guichet électronique ou auprès du <strong>Délégué à la Protection des Données (DPO)</strong> de l'établissement.
</div>

<div class="cndp-meta-line">
    <strong>Réf. Dossier CNDP :</strong> {{ $referenceNumber ?? ('ENCG-CNDP-DSAR-'.date('Y').'-'.str_pad($export->id ?? 1, 4, '0', STR_PAD_LEFT)) }}
    &nbsp;|&nbsp; <strong>Empreinte SHA-256 :</strong> <code>{{ substr($sha256Hash ?? hash('sha256', ($export->id ?? 1) . ($user->email ?? 'test')), 0, 28) }}...</code>
</div>
@endsection

@section('signature_right')
    <div style="font-size: 7.2pt; color: #334155; text-align: right; font-weight: bold;">Délivré à Fès, le {{ $generatedDate ?? date('d/m/Y') }}</div>
    <div style="font-size: 6.5pt; font-weight: bold; color: #475569; margin-top: 1px; text-align: right;">Pour le Directeur et par délégation</div>
    <div style="font-size: 7.8pt; font-weight: 900; color: #002e5b; text-transform: uppercase; margin-top: 1px; text-align: right;">
        LE SECRÉTAIRE GÉNÉRAL & RESPONSABLE CNDP
    </div>
    <div style="margin-top: 1px; text-align: right;">
        <table align="right" style="border-collapse: collapse; margin-left: auto;">
            <tr>
                <td style="vertical-align: middle; padding-right: 6px;">
                    <div class="official-seal-box">
                        ROYAUME DU MAROC<br>
                        ★ ENCG FÈS ★<br>
                        CNDP — USMBA<br>
                        PROTECTION DONNÉES
                    </div>
                </td>
                <td style="vertical-align: middle;">
                    <svg width="85" height="22" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8,22 C16,10 24,4 30,4 C35,4 32,22 36,24 C40,26 45,14 50,10 C55,4 60,18 65,16 C70,14 82,6 90,14 C98,10 102,4 112,8" stroke="#002e5b" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </td>
            </tr>
        </table>
    </div>
@endsection

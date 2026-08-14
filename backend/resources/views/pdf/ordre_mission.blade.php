@extends('pdf.layouts.pdf_master')

@section('title', 'ORDRE DE MISSION OFFICIEL — ENCG FÈS')

@section('styles')
<style>
    .mission-header-banner {
        background: #0f2863;
        color: #ffffff;
        text-align: center;
        padding: 10px 16px;
        border-radius: 6px;
        margin-bottom: 14px;
    }
    .mission-title {
        font-size: 16pt;
        font-weight: 900;
        letter-spacing: 2px;
        color: #ffffff;
        text-transform: uppercase;
        margin: 0;
    }
    .mission-subtitle {
        font-size: 8.5pt;
        font-weight: bold;
        color: #bfdbfe;
        margin-top: 3px;
        text-transform: uppercase;
        letter-spacing: 0.8px;
    }
    .meta-ref-bar {
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 7px 14px;
        margin-bottom: 14px;
    }
    .meta-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9pt;
    }
    .intro-paragraph {
        margin: 12px 0 16px 0;
        text-align: justify;
        line-height: 1.65;
        font-size: 9.5pt;
        color: #1e293b;
    }
    .details-table-card {
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        overflow: hidden;
        margin-bottom: 16px;
    }
    .details-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9pt;
    }
    .details-table td {
        padding: 7px 12px;
        vertical-align: middle;
    }
    .details-table tr:nth-child(even) {
        background-color: #f8fafc;
    }
    .label-col {
        width: 34%;
        font-weight: bold;
        color: #334155;
        border-bottom: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
    }
    .val-col {
        width: 66%;
        font-weight: 600;
        color: #0f172a;
        border-bottom: 1px solid #e2e8f0;
    }
    .legal-clause-box {
        border-left: 4px solid #0f2863;
        background-color: #f1f5f9;
        border-radius: 0 6px 6px 0;
        padding: 8px 14px;
        margin-bottom: 18px;
    }
    .legal-clause-title {
        font-size: 8pt;
        font-weight: 900;
        color: #0f2863;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 3px;
    }
    .legal-clause-text {
        font-size: 7.5pt;
        color: #475569;
        line-height: 1.45;
        font-style: italic;
    }
</style>
@endsection

@section('content')
<div style="position: relative; width: 100%;">

    <!-- Header Title Banner -->
    <div class="mission-header-banner">
        <div class="mission-title">ORDRE DE MISSION</div>
        <div class="mission-subtitle">
            Cadre Déplacement Académique &amp; Recherche Scientifique
        </div>
    </div>

    <!-- Reference Box -->
    <div class="meta-ref-bar">
        <table class="meta-table">
            <tr>
                <td style="width: 60%;">
                    <strong style="color: #475569;">RÉFÉRENCE OFFICIELLE :</strong> 
                    <span style="font-family: monospace; font-weight: 900; color: #0f2863; font-size: 9.5pt;">{{ $trackingCode ?? ('DOC-PROF-' . date('Y') . '-0842') }}</span>
                </td>
                <td style="width: 40%; text-align: right; color: #475569;">
                    Fès, le <strong style="color: #0f2863;">{{ $date ?? date('d/m/Y') }}</strong>
                </td>
            </tr>
        </table>
    </div>

    <!-- Official Authorization Statement -->
    <p class="intro-paragraph">
        Le Directeur de l'<strong>École Nationale de Commerce et de Gestion (ENCG) de Fès</strong> autorise et ordonne par la présente à l'enseignant(e)-chercheur(se) désigné(e) ci-après d'effectuer le déplacement officiel pour l'accomplissement de la mission académique et institutionnelle décrite :
    </p>

    <!-- Structured Mission Table -->
    <div class="details-table-card">
        <table class="details-table">
            <tr>
                <td class="label-col" style="background-color: #f1f5f9; color: #0f2863;">Enseignant(e)-Chercheur(se) :</td>
                <td class="val-col" style="background-color: #f1f5f9; font-weight: 900; color: #0f2863; font-size: 10pt; text-transform: uppercase;">
                    Pr. {{ isset($professor) ? (($professor->last_name ?? '') . ' ' . ($professor->first_name ?? '')) : 'ABDELHAK EL AMRANI' }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Grade &amp; Statut :</td>
                <td class="val-col">
                    Professeur de l'Enseignement Supérieur (Permanent)
                </td>
            </tr>
            <tr>
                <td class="label-col">Département de Rattachement :</td>
                <td class="val-col" style="color: #047857; font-weight: bold;">
                    {{ (isset($professor) && isset($professor->department)) ? $professor->department->name : ($professor->specialty ?? 'Sciences de Gestion') }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Établissement Universitaire :</td>
                <td class="val-col">
                    École Nationale de Commerce et de Gestion — Université Sidi Mohamed Ben Abdellah
                </td>
            </tr>
            <tr>
                <td class="label-col" style="color: #0f2863;">Objet / Motif de la Mission :</td>
                <td class="val-col" style="font-weight: 700; color: #0f172a;">
                    {{ $mission['motif'] ?? 'Participation à la Conférence Internationale & Encadrement Thèses' }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Lieu &amp; Destination :</td>
                <td class="val-col" style="font-weight: 900; color: #0f2863;">
                    {{ $mission['destination'] ?? 'Casablanca / Rabat (Maroc)' }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Période du Déplacement :</td>
                <td class="val-col" style="font-weight: 900; color: #b45309;">
                    Du {{ $mission['start_date'] ?? date('d/m/Y') }} au {{ $mission['end_date'] ?? date('d/m/Y', strtotime('+3 days')) }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Moyen de Transport Autorisé :</td>
                <td class="val-col" style="font-weight: 700; color: #0f2863;">
                    {{ $mission['transport_mode'] ?? 'Voiture Personnelle / Train ONCF (Al Boraq - Al Atlas) / Aérien' }}
                </td>
            </tr>
        </table>
    </div>

    <!-- Official Decree & Requisition Notice -->
    <div class="legal-clause-box">
        <div class="legal-clause-title">DISPOSITIONS RÉGLEMENTAIRES &amp; PRISE EN CHARGE :</div>
        <div class="legal-clause-text">
            • Les frais de déplacement, de restauration et d'hébergement sont imputés sur le budget de fonctionnement de l'établissement conformément aux dispositions du décret n° 2-97-511.<br>
            • Les autorités civiles, militaires et de sûreté nationale de la destination sont priées de prêter aide et assistance au porteur du présent ordre de mission pour faciliter l'accomplissement de ses obligations de service public.
        </div>
    </div>

</div>
@endsection

@section('signature_right')
    <div style="font-size: 8pt; color: #475569;">Fait à Fès, le {{ $date ?? date('d/m/Y') }}</div>
    <div style="font-size: 7.5pt; font-weight: bold; color: #64748b; margin-top: 4px;">Pour le Directeur et par délégation</div>
    <div style="font-size: 9pt; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 2px;">
        {{ $signatoryTitle ?? 'LE SECRÉTAIRE GÉNÉRAL' }}
    </div>
    <div style="margin-top: 4px;">
        <svg width="100" height="26" viewBox="0 0 100 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8,18 C14,8 20,4 25,4 C29,4 27,18 30,20 C34,22 38,12 42,8 C46,4 50,16 54,14 C58,12 68,6 76,12 C82,8 86,4 94,6" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
        </svg>
    </div>
    <div style="font-size: 6.5pt; color: #059669; font-weight: bold;">
        [Signé numériquement avec Cachet Officiel]
    </div>
@endsection

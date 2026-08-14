@extends('pdf.layouts.pdf_master')

@section('title', 'ORDRE DE MISSION OFFICIEL — ENCG FÈS')

@section('styles')
<style>
    .mission-header-banner {
        background: #0f2863;
        color: #ffffff;
        text-align: center;
        padding: 12px 18px;
        border-radius: 6px;
        margin-bottom: 16px;
    }
    .mission-title {
        font-size: 17pt;
        font-weight: 900;
        letter-spacing: 2.5px;
        color: #ffffff;
        text-transform: uppercase;
        margin: 0;
    }
    .mission-subtitle {
        font-size: 9pt;
        font-weight: bold;
        color: #bfdbfe;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .meta-ref-bar {
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 8px 16px;
        margin-bottom: 16px;
    }
    .meta-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9.5pt;
    }
    .intro-paragraph {
        margin: 14px 0 18px 0;
        text-align: justify;
        line-height: 1.7;
        font-size: 10pt;
        color: #1e293b;
    }
    .details-table-card {
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 18px;
    }
    .details-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9.5pt;
    }
    .details-table td {
        padding: 9px 14px;
        vertical-align: middle;
    }
    .details-table tr:nth-child(even) {
        background-color: #f8fafc;
    }
    .label-col {
        width: 35%;
        font-weight: bold;
        color: #334155;
        border-bottom: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
    }
    .val-col {
        width: 65%;
        font-weight: 600;
        color: #0f172a;
        border-bottom: 1px solid #e2e8f0;
    }
    .legal-clause-box {
        border-left: 4px solid #0f2863;
        background-color: #f1f5f9;
        border-radius: 0 8px 8px 0;
        padding: 10px 16px;
        margin-bottom: 20px;
    }
    .legal-clause-title {
        font-size: 8.5pt;
        font-weight: 900;
        color: #0f2863;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
    }
    .legal-clause-text {
        font-size: 8pt;
        color: #475569;
        line-height: 1.5;
        font-style: italic;
    }

    /* Spacious Official Stamp & Signature Block */
    .signature-container-box {
        width: 100%;
        text-align: right;
        padding-top: 4px;
    }
    .official-seal-badge {
        display: inline-block;
        border: 2px dashed #002e5b;
        border-radius: 50%;
        width: 105px;
        height: 105px;
        text-align: center;
        padding: 14px 6px;
        color: #002e5b;
        font-size: 7.5pt;
        font-weight: bold;
        line-height: 1.25;
        background-color: #f8fafc;
        margin-right: 15px;
        vertical-align: middle;
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
                <td style="width: 58%;">
                    <strong style="color: #475569;">RÉFÉRENCE OFFICIELLE :</strong> 
                    <span style="font-family: monospace; font-weight: 900; color: #0f2863; font-size: 10.5pt;">{{ $trackingCode ?? ('DOC-PROF-' . date('Y') . '-0842') }}</span>
                </td>
                <td style="width: 42%; text-align: right; color: #475569;">
                    Fès, le <strong style="color: #0f2863; font-size: 10pt;">{{ $date ?? date('d/m/Y') }}</strong>
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
                <td class="val-col" style="background-color: #f1f5f9; font-weight: 900; color: #0f2863; font-size: 10.5pt; text-transform: uppercase;">
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
                <td class="val-col" style="font-weight: 900; color: #0f2863; font-size: 10pt;">
                    {{ $mission['destination'] ?? 'Casablanca / Rabat (Maroc)' }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Période du Déplacement :</td>
                <td class="val-col" style="font-weight: 900; color: #b45309; font-size: 10pt;">
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
    <div class="signature-container-box">
        <div style="font-size: 9.5pt; color: #334155; font-weight: bold;">
            Fait à Fès, le {{ $date ?? date('d/m/Y') }}
        </div>
        <div style="font-size: 8.5pt; font-weight: bold; color: #64748b; margin-top: 4px;">
            Pour le Directeur et par délégation
        </div>
        <div style="font-size: 10.5pt; font-weight: 900; color: #002e5b; text-transform: uppercase; margin-top: 3px; letter-spacing: 0.5px;">
            {{ $signatoryTitle ?? 'LE SECRÉTAIRE GÉNÉRAL DE L\'ENCG FÈS' }}
        </div>

        <!-- Clean spacious area left open for Official Stamp and Signature -->
        <div style="margin-top: 25px; min-height: 85px;">
            <div style="font-size: 7.5pt; color: #059669; font-weight: bold; padding-top: 40px;">
                [Document Certifié Numériquement &bull; Clé SHA-256]
            </div>
        </div>
    </div>
@endsection

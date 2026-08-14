@extends('pdf.layouts.pdf_master')

@section('title', 'ATTESTATION DE TRAVAIL OFFICIELLE — ENCG FÈS')

@section('styles')
<style>
    .attestation-header-banner {
        background: #0f2863;
        color: #ffffff;
        text-align: center;
        padding: 12px 18px;
        border-radius: 6px;
        margin-bottom: 16px;
    }
    .attestation-title {
        font-size: 17pt;
        font-weight: 900;
        letter-spacing: 2.5px;
        color: #ffffff;
        text-transform: uppercase;
        margin: 0;
    }
    .attestation-subtitle {
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
    .closing-paragraph {
        margin: 16px 0 20px 0;
        text-align: justify;
        line-height: 1.65;
        font-size: 9.5pt;
        color: #334155;
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
    <div class="attestation-header-banner">
        <div class="attestation-title">ATTESTATION DE TRAVAIL</div>
        <div class="attestation-subtitle">
            Corps Enseignant-Chercheur Permanent • ENCG Fès
        </div>
    </div>

    <!-- Reference Box -->
    <div class="meta-ref-bar">
        <table class="meta-table">
            <tr>
                <td style="width: 58%;">
                    <strong style="color: #475569;">RÉFÉRENCE OFFICIELLE :</strong> 
                    <span style="font-family: monospace; font-weight: 900; color: #0f2863; font-size: 10.5pt;">{{ $trackingCode ?? ('DOC-PROF-' . date('Y') . '-0001') }}</span>
                </td>
                <td style="width: 42%; text-align: right; color: #475569;">
                    Fès, le <strong style="color: #0f2863; font-size: 10pt;">{{ $date ?? date('d/m/Y') }}</strong>
                </td>
            </tr>
        </table>
    </div>

    <!-- Official Certification Statement -->
    <p class="intro-paragraph">
        Le Directeur de l'<strong>École Nationale de Commerce et de Gestion (ENCG) de Fès</strong>, établissement d'enseignement supérieur public rattaché à l'<strong>Université Sidi Mohamed Ben Abdellah</strong>, certifie par la présente que l'enseignant(e)-chercheur(se) désigné(e) ci-après est en fonction au sein de notre établissement :
    </p>

    <!-- Structured Details Table -->
    <div class="details-table-card">
        <table class="details-table">
            <tr>
                <td class="label-col" style="background-color: #f1f5f9; color: #0f2863;">Nom &amp; Prénom de l'Enseignant :</td>
                <td class="val-col" style="background-color: #f1f5f9; font-weight: 900; color: #0f2863; font-size: 10.5pt; text-transform: uppercase;">
                    Pr. {{ isset($professor) ? (($professor->last_name ?? '') . ' ' . ($professor->first_name ?? '')) : 'ABDELHAK EL AMRANI' }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Carte d'Identité Nationale (CIN) :</td>
                <td class="val-col" style="font-weight: 900; font-family: monospace; font-size: 10pt; color: #0f172a;">
                    {{ $professor->cin ?? 'CD542190' }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Grade &amp; Statut Administratif :</td>
                <td class="val-col">
                    Professeur de l'Enseignement Supérieur (Permanent — Titulaire)
                </td>
            </tr>
            <tr>
                <td class="label-col">Département de Rattachement :</td>
                <td class="val-col" style="color: #047857; font-weight: bold;">
                    {{ (isset($professor) && isset($professor->department)) ? $professor->department->name : ($professor->specialty ?? 'Sciences de Gestion') }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Spécialité &amp; Discipline :</td>
                <td class="val-col">
                    {{ $professor->specialty ?? 'Sciences de Gestion & Finance d\'Entreprise' }}
                </td>
            </tr>
            <tr>
                <td class="label-col">Établissement &amp; Université :</td>
                <td class="val-col">
                    École Nationale de Commerce et de Gestion — Université Sidi Mohamed Ben Abdellah
                </td>
            </tr>
            <tr>
                <td class="label-col">Année Universitaire en Cours :</td>
                <td class="val-col" style="font-weight: 900; color: #b45309; font-size: 10pt;">
                    {{ $year ?? '2025/2026' }}
                </td>
            </tr>
        </table>
    </div>

    <!-- Official Closing Note -->
    <p class="closing-paragraph">
        La présente attestation est délivrée à l'intéressé(e) sur sa demande, pour servir et valoir ce que de droit, et ce sans aucune autre obligation de la part de l'administration.
    </p>

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

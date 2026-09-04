@extends('pdf.layouts.pdf_master')

@section('title', 'ATTESTATION DE RETENUE À LA SOURCE IGR (VACATIONS) — ENCG FÈS')

@section('styles')
<style>
    .igr-header-banner {
        background: #0f2863;
        color: #ffffff;
        text-align: center;
        padding: 12px 18px;
        border-radius: 6px;
        margin-bottom: 14px;
    }
    .igr-title {
        font-size: 14pt;
        font-weight: 900;
        letter-spacing: 1.5px;
        color: #ffffff;
        text-transform: uppercase;
        margin: 0;
    }
    .igr-subtitle {
        font-size: 8.5pt;
        font-weight: bold;
        color: #fef08a;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .meta-ref-bar {
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 8px 14px;
        margin-bottom: 14px;
    }
    .meta-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9pt;
    }
    .intro-paragraph {
        margin: 10px 0 14px 0;
        text-align: justify;
        line-height: 1.65;
        font-size: 9.5pt;
        color: #1e293b;
    }
    .details-table-card {
        border: 1.5px solid #cbd5e1;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 14px;
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
        width: 38%;
        font-weight: bold;
        color: #334155;
        border-bottom: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
    }
    .val-col {
        width: 62%;
        font-weight: 600;
        color: #0f172a;
        border-bottom: 1px solid #e2e8f0;
    }
    .tax-breakdown-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9pt;
        margin: 12px 0 16px 0;
        border: 1.5px solid #0f2863;
    }
    .tax-breakdown-table th {
        background-color: #0f2863;
        color: #ffffff;
        padding: 8px 10px;
        font-weight: 800;
        text-transform: uppercase;
        font-size: 8.5pt;
        border: 1px solid #cbd5e1;
    }
    .tax-breakdown-table td {
        padding: 8px 10px;
        border: 1px solid #cbd5e1;
    }
    .legal-notice-box {
        background-color: #f1f5f9;
        border-left: 4px solid #0f2863;
        padding: 8px 12px;
        font-size: 8pt;
        color: #475569;
        line-height: 1.5;
        margin-bottom: 16px;
    }
    .closing-paragraph {
        margin: 10px 0 14px 0;
        text-align: justify;
        line-height: 1.6;
        font-size: 9pt;
        color: #334155;
    }
    .signature-container-box {
        width: 100%;
        text-align: right;
        padding-top: 4px;
    }
    .official-seal-badge {
        display: inline-block;
        border: 2px dashed #002e5b;
        border-radius: 50%;
        width: 95px;
        height: 95px;
        text-align: center;
        padding-top: 18px;
        color: #002e5b;
        font-weight: 900;
        font-size: 7.5pt;
        text-transform: uppercase;
        background: #f0f7ff;
    }
</style>
@endsection

@section('content')
<div class="igr-header-banner">
    <h1 class="igr-title">ATTESTATION FISCALE DE RETENUE À LA SOURCE (I.G.R)</h1>
    <div class="igr-subtitle">شهادة الاقتطاع الضريبي من المنبع برسم الضريبة على الدخل (حصص التدريس العرضية)</div>
</div>

<div class="meta-ref-bar">
    <table class="meta-table">
        <tr>
            <td style="width: 50%; font-weight: bold; color: #0f2863;">
                RÉFÉRENCE : <span style="font-family: monospace; font-size: 10pt; color: #0284c7;">{{ $trackingCode }}</span>
            </td>
            <td style="width: 50%; text-align: right; color: #475569;">
                Fès, le <strong>{{ $date }}</strong>
            </td>
        </tr>
    </table>
</div>

<p class="intro-paragraph">
    Le Directeur et l'Ordonnateur des Dépenses de l'<strong>École Nationale de Commerce et de Gestion de Fès</strong> 
    (Université Sidi Mohamed Ben Abdellah), certifient que le prélèvement au titre de l'Impôt sur le Revenu (I.G.R) 
    a été opéré à la source sur les rémunérations d'heures de vacation servies à :
</p>

<div class="details-table-card">
    <table class="details-table">
        <tr>
            <td class="label-col">Bénéficiaire (Nom et Prénom) :</td>
            <td class="val-col" style="font-size: 10.5pt; font-weight: 800; color: #0f2863;">
                {{ strtoupper($professor->last_name ?? '') }} {{ ucfirst($professor->first_name ?? '') }}
            </td>
        </tr>
        <tr>
            <td class="label-col">Qualité / Statut :</td>
            <td class="val-col" style="color: #b45309; font-weight: 800;">
                Enseignant Vacataire Non Permanent
            </td>
        </tr>
        <tr>
            <td class="label-col">Carte d'Identité Nationale (CIN) :</td>
            <td class="val-col" style="font-family: monospace; font-size: 10pt; font-weight: bold;">
                {{ $professor->cin ?? 'Non renseigné' }}
            </td>
        </tr>
        <tr>
            <td class="label-col">Réf. Contrat de Vacation :</td>
            <td class="val-col" style="font-family: monospace;">{{ $contractRef ?? 'CONTRAT-VAC-2026' }}</td>
        </tr>
        <tr>
            <td class="label-col">Année d'Imposition &amp; Fiscale :</td>
            <td class="val-col" style="font-weight: 800;">{{ $fiscalYear ?? '2026' }} (Exercice Budgétaire ENCG)</td>
        </tr>
    </table>
</div>

<div class="legal-notice-box">
    <strong>Base Légale :</strong> Décret n° 2-97-511 et Article 73-II-F du Code Général des Impôts (CGI) marocain régissant la retenue à la source libératoire au taux légal de 17% sur les indemnités accordées aux personnes ne faisant pas partie du personnel permanent dispensant des heures d'enseignement.
</div>

<table class="tax-breakdown-table">
    <thead>
        <tr>
            <th style="width: 45%; text-align: left;">Désignation des Éléments Fiscaux</th>
            <th style="width: 25%; text-align: center;">Base de Calcul</th>
            <th style="width: 30%; text-align: right;">Montant Certifié (MAD)</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td style="font-weight: 700;">Volume d'Enseignement Effectué</td>
            <td style="text-align: center; font-family: monospace;">{{ $hoursDone ?? 0 }} Heures × {{ $hourlyRate ?? 350 }} MAD/h</td>
            <td style="text-align: right; font-family: monospace; font-weight: 700;">—</td>
        </tr>
        <tr style="background-color: #f8fafc;">
            <td style="font-weight: 800; color: #0f2863;">Montant Brut Imposable (Assiette IGR) :</td>
            <td style="text-align: center; font-size: 8pt; color: #64748b;">Brut avant retenues</td>
            <td style="text-align: right; font-family: monospace; font-size: 10pt; font-weight: 800; color: #0f2863;">
                {{ number_format($grossAmount ?? 0, 2, ',', ' ') }} MAD
            </td>
        </tr>
        <tr>
            <td style="font-weight: 700; color: #b91c1c;">Taux de Retenue à la Source IGR Légale :</td>
            <td style="text-align: center; font-weight: 800; color: #b91c1c; font-family: monospace;">17,00 % (Article 73-II-F CGI)</td>
            <td style="text-align: right; font-family: monospace; font-weight: 800; color: #b91c1c;">
                - {{ number_format($taxAmount ?? 0, 2, ',', ' ') }} MAD
            </td>
        </tr>
        <tr style="background-color: #ecfdf5; font-size: 9.5pt; font-weight: 900;">
            <td style="color: #047857; text-transform: uppercase;">
                Montant Net Versé au Bénéficiaire :
            </td>
            <td style="text-align: center; color: #047857; font-size: 8pt;">Virement Bancaire Trésorerie</td>
            <td style="text-align: right; font-family: monospace; font-size: 11pt; color: #047857;">
                {{ number_format($netAmount ?? 0, 2, ',', ' ') }} MAD
            </td>
        </tr>
    </tbody>
</table>

<p class="closing-paragraph">
    Le montant de la retenue à la source susmentionné a été intégralement versé à la Trésorerie Préfectorale / Recette de l'Administration Fiscale au titre des déclarations périodiques de l'établissement.
    La présente attestation est délivrée pour valoir justificatif fiscal officiel et éviter toute double imposition.
</p>

<table style="width: 100%; margin-top: 10px;">
    <tr>
        <td style="width: 35%; vertical-align: bottom;">
            @if(!empty($qrBase64))
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px; background: #ffffff; display: inline-block; text-align: center;">
                <img src="{{ $qrBase64 }}" style="width: 75px; height: 75px; display: block;" alt="QR Code" />
                <div style="font-size: 6.5pt; color: #64748b; margin-top: 2px; font-family: monospace;">FISC-VERIF-ENCG</div>
            </div>
            @endif
        </td>
        <td style="width: 65%; vertical-align: top; text-align: right;">
            <div class="signature-container-box">
                <div style="font-size: 8.5pt; font-weight: 800; color: #0f2863; text-transform: uppercase;">
                    POUR LE DIRECTEUR DE L'ENCG FÈS
                </div>
                <div style="font-size: 7.5pt; font-weight: bold; color: #475569; margin-top: 2px;">
                    LE SERVICE DE LA COMPTABILITÉ &amp; DES FINANCES
                </div>
                <div style="margin-top: 8px;">
                    <div class="official-seal-badge">
                        ROYAUME DU MAROC<br>
                        ★ ENCG FÈS ★<br>
                        SERVICE FINANCIER
                    </div>
                </div>
                <div style="font-size: 7.5pt; color: #059669; font-weight: bold; margin-top: 4px;">
                    Visa Fiscal &amp; Scellement Numérique
                </div>
            </div>
        </td>
    </tr>
</table>
@endsection

@extends('pdf.layouts.pdf_master')

@section('title', 'ATTESTATION D\'HEURES DE VACATION OFFICIELLE — ENCG FÈS')

@section('styles')
<style>
    .attestation-header-banner {
        background: #0f2863;
        color: #ffffff;
        text-align: center;
        padding: 12px 18px;
        border-radius: 6px;
        margin-bottom: 14px;
    }
    .attestation-title {
        font-size: 15pt;
        font-weight: 900;
        letter-spacing: 2px;
        color: #ffffff;
        text-transform: uppercase;
        margin: 0;
    }
    .attestation-subtitle {
        font-size: 9pt;
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
        width: 32%;
        font-weight: bold;
        color: #334155;
        border-bottom: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
    }
    .val-col {
        width: 68%;
        font-weight: 600;
        color: #0f172a;
        border-bottom: 1px solid #e2e8f0;
    }
    .modules-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 8.5pt;
        margin: 10px 0 14px 0;
        border: 1px solid #cbd5e1;
    }
    .modules-table th {
        background-color: #0f2863;
        color: #ffffff;
        padding: 7px 8px;
        font-weight: 800;
        text-transform: uppercase;
        font-size: 8pt;
        border: 1px solid #cbd5e1;
    }
    .modules-table td {
        padding: 6px 8px;
        border: 1px solid #e2e8f0;
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
<div class="attestation-header-banner">
    <h1 class="attestation-title">ATTESTATION D'HEURES DE VACATION</h1>
    <div class="attestation-subtitle">شهادة إنجاز ساعات التدريس كأستاذ عرضي</div>
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
    Le Directeur de l'<strong>École Nationale de Commerce et de Gestion de Fès</strong> (Université Sidi Mohamed Ben Abdellah), 
    soussigné, atteste par la présente que :
</p>

<div class="details-table-card">
    <table class="details-table">
        <tr>
            <td class="label-col">Nom et Prénom :</td>
            <td class="val-col" style="font-size: 10.5pt; font-weight: 800; color: #0f2863;">
                {{ strtoupper($professor->last_name ?? '') }} {{ ucfirst($professor->first_name ?? '') }}
            </td>
        </tr>
        <tr>
            <td class="label-col">Qualité / Statut :</td>
            <td class="val-col" style="color: #b45309; font-weight: 800;">
                Enseignant Vacataire Contractuel (Heures d'Enseignement Supérieur)
            </td>
        </tr>
        <tr>
            <td class="label-col">Carte d'Identité Nationale (CIN) :</td>
            <td class="val-col" style="font-family: monospace; font-size: 10pt; font-weight: bold;">
                {{ $professor->cin ?? 'Non renseigné' }}
            </td>
        </tr>
        <tr>
            <td class="label-col">Discipline / Spécialité :</td>
            <td class="val-col">{{ $professor->specialty ?? 'Sciences de Gestion & Commerce' }}</td>
        </tr>
        <tr>
            <td class="label-col">Département d'Attache :</td>
            <td class="val-col">{{ $professor->department->name ?? 'Sciences de Gestion' }}</td>
        </tr>
        <tr>
            <td class="label-col">Année Universitaire :</td>
            <td class="val-col" style="font-weight: 800;">{{ $year ?? '2026/2027' }}</td>
        </tr>
    </table>
</div>

<p class="intro-paragraph" style="margin-top: 8px; margin-bottom: 6px;">
    A dispensé au sein de l'établissement les enseignements et volumes horaires suivants, validés par le Chef de Département et conformes aux obligations pédagogiques :
</p>

<table class="modules-table">
    <thead>
        <tr>
            <th style="width: 40%; text-align: left;">Élément de Module / Cours</th>
            <th style="width: 25%; text-align: left;">Filière &amp; Groupe</th>
            <th style="width: 18%; text-align: center;">Volume Effectué</th>
            <th style="width: 17%; text-align: center;">Validation</th>
        </tr>
    </thead>
    <tbody>
        @forelse($contracts ?? [] as $c)
        <tr>
            <td style="font-weight: 700; color: #0f172a;">
                {{ $c->module ? ($c->module->code . ' – ' . $c->module->name) : 'Module Pédagogique' }}
            </td>
            <td style="color: #475569;">
                {{ $c->group->name ?? 'TC / GFC / MCM' }}
            </td>
            <td style="text-align: center; font-weight: 800; font-family: monospace; color: #0f2863;">
                {{ $c->agreed_hours ?? 0 }} Heures
            </td>
            <td style="text-align: center; font-weight: 700; color: #059669;">
                Service Validé
            </td>
        </tr>
        @empty
        <tr>
            <td colspan="4" style="text-align: center; color: #64748b; font-style: italic; padding: 10px;">
                Volume de vacation certifié au titre du semestre universitaire en cours.
            </td>
        </tr>
        @endforelse
    </tbody>
    <tfoot>
        <tr style="background-color: #f1f5f9; font-weight: 900;">
            <td colspan="2" style="text-align: right; text-transform: uppercase; color: #0f2863;">
                Volume Total Réalisé &amp; Certifié :
            </td>
            <td style="text-align: center; font-family: monospace; font-size: 9.5pt; color: #0f2863;">
                {{ $totalHours ?? 0 }} Heures
            </td>
            <td style="text-align: center; color: #059669;">
                Certifié Conforme
            </td>
        </tr>
    </tfoot>
</table>

<p class="closing-paragraph">
    La présente attestation est délivrée à l'intéressé(e) sur sa demande pour servir et valoir ce que de droit, 
    notamment auprès des administrations publiques, organismes de concours, ou établissements de recherche et d'enseignement supérieur.
</p>

<table style="width: 100%; margin-top: 8px;">
    <tr>
        <td style="width: 35%; vertical-align: bottom;">
            @if(!empty($qrBase64))
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px; background: #ffffff; display: inline-block; text-align: center;">
                <img src="{{ $qrBase64 }}" style="width: 75px; height: 75px; display: block;" alt="QR Code" />
                <div style="font-size: 6.5pt; color: #64748b; margin-top: 2px; font-family: monospace;">DOC-VERIF-ENCG</div>
            </div>
            @endif
        </td>
        <td style="width: 65%; vertical-align: top; text-align: right;">
            <div class="signature-container-box">
                <div style="font-size: 8.5pt; font-weight: 800; color: #0f2863; text-transform: uppercase;">
                    POUR LE DIRECTEUR DE L'ENCG FÈS
                </div>
                <div style="font-size: 7.5pt; font-weight: bold; color: #475569; margin-top: 2px;">
                    LE SECRÉTAIRE GÉNÉRAL DE L'ÉCOLE
                </div>
                <div style="margin-top: 8px;">
                    <div class="official-seal-badge">
                        ROYAUME DU MAROC<br>
                        ★ ENCG FÈS ★<br>
                        DIRECTION
                    </div>
                </div>
                <div style="font-size: 7.5pt; color: #059669; font-weight: bold; margin-top: 4px;">
                    Document Scellé et Signé Numériquement
                </div>
            </div>
        </td>
    </tr>
</table>
@endsection

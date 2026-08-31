@extends('pdf.layouts.pdf_master')

@section('title', 'ARRÊTÉ DE NOMINATION — CHEF DE DÉPARTEMENT')

@section('footer_inline', '1')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 6mm 9mm 6mm 9mm;
    }
    .page-border-frame {
        top: -3mm;
        left: -5mm;
        right: -5mm;
        bottom: -3mm;
    }
    .official-logos-header {
        margin-bottom: 5px;
        padding-bottom: 3px;
    }
    .footer-container {
        position: static;
        margin-top: 8px;
        padding-top: 5px;
        border-top: 1px dashed #cbd5e1;
        page-break-inside: avoid;
    }
    .main-doc-content {
        page-break-inside: avoid;
    }

    .arrete-title-wrap {
        text-align: center;
        margin: 2px 0 8px 0;
    }
    .arrete-title {
        display: inline-block;
        font-size: 11.5pt;
        font-weight: 900;
        text-transform: uppercase;
        color: #002e5b;
        letter-spacing: 0.5px;
        line-height: 1.3;
        border-bottom: 2px solid #002e5b;
        padding-bottom: 3px;
        margin: 0;
    }
    .arrete-subtitle {
        font-size: 8pt;
        font-weight: 800;
        margin-top: 4px;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.6px;
    }

    .arrete-ref-bar {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 7px;
        font-size: 7.5pt;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
    }
    .arrete-ref-bar td {
        padding: 3px 8px;
        vertical-align: middle;
    }
    .arrete-ref-bar .ref-code {
        font-family: DejaVu Sans Mono, monospace;
        font-weight: 900;
        color: #002e5b;
    }

    .arrete-body {
        font-size: 8.5pt;
        line-height: 1.5;
        text-align: justify;
        color: #1e293b;
    }
    .arrete-director {
        font-weight: 900;
        color: #0f2863;
        margin: 0 0 5px 0;
        text-transform: uppercase;
        font-size: 8.5pt;
    }
    .arrete-vu {
        margin: 0 0 8px 0;
        padding-left: 16px;
    }
    .arrete-vu li {
        margin-bottom: 3px;
        font-size: 8pt;
        line-height: 1.45;
    }

    .arrete-articles {
        border: 1.5px solid #002e5b;
        border-radius: 4px;
        padding: 7px 10px;
        background-color: #f8fafc;
        margin-bottom: 10px;
        page-break-inside: avoid;
    }
    .arrete-articles h3 {
        font-size: 8.5pt;
        font-weight: 900;
        color: #002e5b;
        text-transform: uppercase;
        margin: 0 0 6px 0;
        border-bottom: 1px solid #94a3b8;
        padding-bottom: 3px;
        letter-spacing: 0.4px;
    }
    .arrete-articles p {
        font-size: 8.2pt;
        line-height: 1.48;
        margin: 0 0 6px 0;
        text-align: justify;
    }
    .arrete-articles p:last-child {
        margin-bottom: 0;
    }
    .arrete-highlight {
        color: #002e5b;
        font-weight: 900;
    }

    .arrete-signatures {
        width: 100%;
        border-collapse: collapse;
        margin-top: 2px;
        page-break-inside: avoid;
    }
    .arrete-signatures td {
        vertical-align: top;
        padding: 0;
    }
    .arrete-cert-left {
        font-size: 7.5pt;
        color: #64748b;
        line-height: 1.4;
    }
    .arrete-cert-left strong {
        color: #002e5b;
        font-size: 7.8pt;
        text-transform: uppercase;
    }
    .arrete-cert-left .uuid {
        font-family: DejaVu Sans Mono, monospace;
        font-size: 6.8pt;
        color: #475569;
        word-break: break-all;
    }
    .arrete-sign-right {
        text-align: right;
    }
    .arrete-sign-right .role {
        font-size: 8.5pt;
        font-weight: 900;
        color: #002e5b;
        text-transform: uppercase;
        margin: 0;
    }
    .arrete-sign-right .sub {
        font-size: 7.5pt;
        color: #475569;
        margin: 2px 0 6px 0;
    }
    .tampon-box {
        border: 1.5px dashed #002e5b;
        padding: 6px 10px;
        display: inline-block;
        background-color: #f1f5f9;
        border-radius: 4px;
        text-align: center;
    }
    .tampon-box .label {
        font-size: 7.5pt;
        font-weight: 900;
        color: #002e5b;
        text-transform: uppercase;
    }
    .tampon-box .note {
        font-size: 6.5pt;
        color: #64748b;
        margin-top: 2px;
    }
</style>
@endsection

@section('content')
    <div class="arrete-title-wrap">
        <div class="arrete-title">
            DÉCISION N° {{ $decisionNumber ?? '384/'.date('Y') }}<br>
            PORTANT NOMINATION D'UN CHEF DE DÉPARTEMENT
        </div>
        <div class="arrete-subtitle">Année Académique {{ $academicYear ?? '2026/2027' }}</div>
    </div>

    <table class="arrete-ref-bar" cellpadding="0" cellspacing="0">
        <tr>
            <td width="55%">
                <strong>Réf. :</strong>
                <span class="ref-code">{{ $trackingCode ?? 'ARRETE-ENCG' }}</span>
            </td>
            <td width="45%" style="text-align: right; color: #475569;">
                Fait à Fès, le <strong>{{ $date ?? now()->format('d/m/Y') }}</strong>
            </td>
        </tr>
    </table>

    <div class="arrete-body">
        <p class="arrete-director">Le Directeur de l'École Nationale de Commerce et de Gestion de Fès,</p>
        <ul class="arrete-vu">
            <li>Vu le Dahir n° 1-00-199 du 15 Safar 1421 (19 mai 2000) portant promulgation de la loi n° 01-00 portant réorganisation de l'enseignement supérieur ;</li>
            <li>Vu le décret n° 2-90-554 du 2 Rajab 1411 (18 janvier 1991) relatif aux établissements universitaires ;</li>
            <li>Vu les délibérations du Conseil d'Établissement de l'ENCG Fès ;</li>
            <li>Considérant les compétences académiques et scientifiques de l'intéressé(e).</li>
        </ul>
    </div>

    <div class="arrete-articles">
        <h3>DÉCIDE CE QUI SUIT :</h3>

        <p>
            <strong><u>ARTICLE PREMIER :</u></strong><br>
            Monsieur / Madame le Professeur <span class="arrete-highlight">{{ $headName ?? 'Chef de Département' }}</span>,
            Enseignant-Chercheur titulaire à l'ENCG Fès, est nommé(e)
            <span class="arrete-highlight">Chef du Département {{ $departmentName ?? 'Sciences de Gestion' }} ({{ $departmentCode ?? 'SG' }})</span>.
        </p>

        <p>
            <strong><u>ARTICLE 2 :</u></strong><br>
            L'intéressé(e) exerce ses fonctions conformément aux dispositions réglementaires en vigueur régissant l'organisation pédagogique et administrative des départements universitaires.
        </p>

        <p>
            <strong><u>ARTICLE 3 :</u></strong><br>
            Le Secrétaire Général de l'Établissement est chargé de l'exécution de la présente décision qui prend effet à compter du
            <strong>{{ $effectiveDate ?? '01 Septembre '.date('Y') }}</strong>.
        </p>
    </div>

    <table class="arrete-signatures" cellpadding="0" cellspacing="0">
        <tr>
            <td width="48%" class="arrete-cert-left">
                <strong>Document Officiel Certifié</strong><br>
                Émis le {{ $date ?? now()->format('d/m/Y') }}<br>
                <span class="uuid">Ref. vérification : {{ md5($trackingCode ?? ($departmentCode ?? 'SG')) }}</span>
            </td>
            <td width="4%"></td>
            <td width="48%" class="arrete-sign-right">
                <p class="role">Le Directeur de l'ENCG Fès</p>
                <p class="sub">Pr. Directeur de l'Établissement</p>
                <div class="tampon-box">
                    <div class="label">Tampon et Signature Officielle</div>
                    <div class="note">Signé électroniquement via ENCG ERP</div>
                </div>
            </td>
        </tr>
    </table>
@endsection

@section('signature_right')
    <div style="font-size: 7pt; color: #334155; font-weight: bold;">
        Fait à Fès, le {{ $date ?? now()->format('d/m/Y') }}
    </div>
    <div style="font-size: 6.5pt; font-weight: bold; color: #64748b; margin-top: 1px;">
        Pour le Directeur et par délégation
    </div>
    <div style="font-size: 8pt; font-weight: 900; color: #002e5b; text-transform: uppercase; margin-top: 1px;">
        {{ $signatoryTitle ?? 'LE SECRÉTAIRE GÉNÉRAL' }}
    </div>
    <div style="margin-top: 2px;">
        <svg width="90" height="20" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8,22 C16,10 24,4 30,4 C35,4 32,22 36,24 C40,26 45,14 50,10 C55,4 60,18 65,16 C70,14 82,6 90,14 C98,10 102,4 112,8" stroke="#059669" stroke-width="2" stroke-linecap="round"/>
        </svg>
    </div>
@endsection

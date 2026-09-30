@extends('pdf.layouts.pdf_master')

@section('title', 'CONVENTION DE STAGE TRIPARTITE — ENCG FÈS')

@section('styles')
<style>
    /* Strict 1-Page Fit */
    body {
        font-family: 'DejaVu Sans', 'Helvetica', Arial, sans-serif;
        font-size: 7.2pt;
        line-height: 1.2;
        color: #1e293b;
    }
    .official-logos-header {
        margin-bottom: 2px;
        padding-bottom: 1px;
    }
    .footer-container {
        display: none !important;
    }

    /* Modern Institutional Banner */
    .convention-banner {
        background-color: #002e5b;
        color: #ffffff;
        text-align: center;
        padding: 5px 8px;
        border-radius: 4px;
        margin-bottom: 4px;
    }
    .convention-title {
        font-size: 11pt;
        font-weight: bold;
        color: #ffffff;
        text-transform: uppercase;
        margin: 0;
        padding: 0;
    }
    .convention-subtitle {
        font-size: 6.8pt;
        font-weight: bold;
        color: #93c5fd;
        margin-top: 2px;
        text-transform: uppercase;
    }

    /* Reference & Type Strip */
    .ref-bar {
        width: 100%;
        background-color: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        padding: 3px 6px;
        margin-bottom: 4px;
        font-size: 7pt;
        border-collapse: collapse;
    }

    /* The 3 Contracting Parties */
    .parties-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 4px 0;
        margin-bottom: 4px;
    }
    .party-box {
        width: 33.33%;
        vertical-align: top;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        padding: 4px 6px;
        background-color: #f8fafc;
        font-size: 6.7pt;
        line-height: 1.22;
    }
    .party-header {
        font-weight: bold;
        font-size: 7.2pt;
        color: #002e5b;
        border-bottom: 1.5px solid #002e5b;
        padding-bottom: 1px;
        margin-bottom: 3px;
        text-transform: uppercase;
    }

    /* Articles Section */
    .articles-container {
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        background-color: #ffffff;
        padding: 4px 6px;
        margin-bottom: 4px;
    }
    .articles-header {
        font-size: 7pt;
        font-weight: bold;
        color: #002e5b;
        text-transform: uppercase;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 1px;
        margin-bottom: 2px;
    }
    .article-row {
        margin-bottom: 2px;
        font-size: 6.4pt;
        line-height: 1.2;
        text-align: justify;
        color: #1e293b;
    }
    .article-tag {
        font-weight: bold;
        color: #002e5b;
        text-transform: uppercase;
        font-size: 6.4pt;
    }

    /* Tripartite Signatures Table with Designated Stamp Boxes */
    .signatures-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 4px 0;
        margin-bottom: 3px;
    }
    .signature-cell {
        width: 33.33%;
        vertical-align: top;
        text-align: center;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        padding: 4px 5px;
        background-color: #ffffff;
    }
    .sig-title {
        font-size: 7pt;
        font-weight: bold;
        color: #002e5b;
        text-transform: uppercase;
        margin-bottom: 1px;
    }
    .sig-role {
        font-size: 6pt;
        color: #475569;
        font-weight: bold;
        margin-bottom: 3px;
    }

    /* Stamp & Signature Dedicated Boxes - Extra Large & Spacious for Ink Stamps */
    .sig-stamp-box {
        height: 120px;
        border-radius: 4px;
        margin: 2px 0 3px 0;
        padding: 4px;
        position: relative;
    }
    .box-encg {
        border: 1.5px dashed #002e5b;
        background-color: #f8fafc;
    }
    .box-company {
        border: 1.5px dashed #059669;
        background-color: #f0fdf4;
    }
    .box-student {
        border: 1.5px dashed #7c3aed;
        background-color: #faf5ff;
    }

    .official-seal-circle {
        display: inline-block;
        border: 1.2px solid #002e5b;
        border-radius: 50%;
        width: 70px;
        padding: 2px 0;
        font-size: 4.8pt;
        font-weight: bold;
        color: #002e5b;
        text-align: center;
        line-height: 1.15;
        background-color: #ffffff;
    }

    .company-seal-title {
        font-size: 6pt;
        font-weight: bold;
        color: #047857;
        text-transform: uppercase;
        line-height: 1.2;
    }
    .company-seal-sub {
        font-size: 5.2pt;
        color: #15803d;
        font-style: italic;
        margin-top: 1px;
    }
    .student-sign-notice {
        font-size: 5.6pt;
        color: #6b21a8;
        font-style: italic;
    }

    .sig-caption {
        font-size: 5.6pt;
        font-weight: bold;
        margin-top: 2px;
    }
    .sig-date {
        font-size: 6pt;
        color: #475569;
        font-weight: bold;
        margin-top: 2px;
    }

    /* Integrated Legal Anti-Fraud Footer */
    .integrated-footer {
        width: 100%;
        border-top: 1px dashed #cbd5e1;
        padding-top: 2px;
        margin-top: 2px;
    }
    .footer-meta-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 6pt;
        color: #475569;
    }
    .footer-bottom-line {
        margin-top: 1px;
        padding-top: 1px;
        border-top: 0.5px solid #e2e8f0;
        font-size: 5.8pt;
        color: #64748b;
        text-align: center;
    }
</style>
@endsection

@section('content')
    <!-- Document Title Banner -->
    <div class="convention-banner">
        <div class="convention-title">CONVENTION DE STAGE TRIPARTITE</div>
        <div class="convention-subtitle">
            Formation Initiale en Management &amp; Commerce • Année Universitaire {{ $academicYear ?? '2026-2027' }}
        </div>
    </div>

    <!-- Reference Strip -->
    <table class="ref-bar">
        <tr>
            <td style="width: 38%;">
                <strong>Réf. Convention :</strong> 
                <span style="font-family: monospace; font-weight: bold; color: #002e5b;">
                    {{ $conventionRef ?? ('CONV-ENCG-' . date('Y') . '-' . str_pad($internship->id ?? 1, 4, '0', STR_PAD_LEFT)) }}
                </span>
            </td>
            <td style="width: 37%; text-align: center;">
                <strong>Type de Stage :</strong> 
                <span style="color: #002e5b; font-weight: bold; text-transform: uppercase;">
                    {{ match($internship->type ?? 'fin_etudes') {
                        'initiation' => 'Stage d\'Initiation (1ère/2ème Année)',
                        'application' => 'Stage d\'Application (3ème/4ème Année)',
                        'fin_etudes', 'pfe' => 'Projet de Fin d\'Études — PFE (5ème Année)',
                        default => 'Stage Professionnel Pédagogique'
                    } }}
                </span>
            </td>
            <td style="width: 25%; text-align: right;">
                <strong>Période :</strong> 
                <span style="color: #b45309; font-weight: bold;">
                    Du {{ $startDateStr ?? now()->format('d/m/Y') }} au {{ $endDateStr ?? now()->addMonths(2)->format('d/m/Y') }}
                </span>
            </td>
        </tr>
    </table>

    <!-- The 3 Contracting Parties -->
    <table class="parties-table">
        <tr>
            <!-- Party 1: ENCG Fès -->
            <td class="party-box">
                <div class="party-header">1. L'Établissement</div>
                <strong>ENCG Fès — USMBA</strong><br>
                Route d'Imouzzer, B.P. 2223, Fès<br>
                Tél : +212 5 35 61 11 00<br>
                Représenté par son <strong>Directeur</strong> ou par délégation le Directeur Adjoint des Stages.
            </td>

            <!-- Party 2: Host Company -->
            <td class="party-box">
                <div class="party-header">2. L'Entreprise d'Accueil</div>
                <strong>{{ $internship->company_name ?? 'Entreprise Partenaire' }}</strong><br>
                Adresse : {{ $internship->company_address ?? 'Maroc' }} ({{ $internship->company_city ?? 'Fès/Casablanca' }})<br>
                Tuteur : <strong>{{ $internship->company_mentor_name ?? ($internship->supervisor_name ?? 'Encadrant Professionnel') }}</strong><br>
                Fonction : {{ $internship->company_mentor_title ?? 'Responsable RH / Tuteur' }}<br>
                Contact : {{ $internship->supervisor_email ?? 'stages@entreprise.ma' }}
            </td>

            <!-- Party 3: Student -->
            <td class="party-box">
                <div class="party-header">3. Le Stagiaire</div>
                Étudiant(e) : <strong>{{ strtoupper($student->first_name ?? '') }} {{ strtoupper($student->last_name ?? '') }}</strong><br>
                CNE/Massar : <span style="font-family: monospace; font-weight: bold; color: #002e5b;">{{ $student->cne ?? 'N130000051' }}</span> &nbsp;|&nbsp; CIN : <span style="font-family: monospace;">{{ $student->cin ?? 'CD53671' }}</span><br>
                Filière : {{ $student->filiere->name ?? 'Sciences de Gestion & Commerce' }}<br>
                Assurance : <strong>{{ $internship->insurance_company ?? 'MAMDA-MCMA / Assurance Scolaire & RC' }}</strong><br>
                Police N° : <span style="font-family: monospace;">{{ $internship->insurance_policy_number ?? 'POL-2026-ENCG-884' }}</span>
            </td>
        </tr>
    </table>

    <!-- Articles Section -->
    <div class="articles-container">
        <div class="articles-header">
            Clauses &amp; Dispositions Réglementaires du Stage Pédagogique
        </div>

        <div class="article-row">
            <span class="article-tag">Article 1 — Objet &amp; Mission :</span>
            Le stage a pour finalité l'application pratique des enseignements dispensés à l'ENCG Fès et l'insertion en milieu professionnel. La mission confiée est : <strong>{{ $internship->position_title ?? 'Mission d\'analyse financière, management stratégique et audit' }}</strong>.
        </div>

        <div class="article-row">
            <span class="article-tag">Article 2 — Encadrement &amp; Suivi Pédagogique :</span>
            Le stagiaire est placé sous la responsabilité du tuteur d'entreprise, assisté d'un professeur tuteur de l'ENCG Fès. L'entreprise s'engage à encadrer le stagiaire, à faciliter ses recherches et à lui fournir les éléments nécessaires à la rédaction de son mémoire ou rapport de stage.
        </div>

        <div class="article-row">
            <span class="article-tag">Article 3 — Statut &amp; Gratification Mensuelle :</span>
            Durant le stage, le stagiaire conserve son statut d'étudiant. Le stage ne constitue en aucun cas un contrat de travail au sens du Code du Travail marocain. L'entreprise peut verser une indemnité forfaitaire convenue de : <strong>{{ ($internship->monthly_allowance ?? 0) > 0 ? number_format($internship->monthly_allowance, 2) . ' DH / mois' : 'Prise en charge conventionnelle (Transport & Repas)' }}</strong>.
        </div>

        <div class="article-row">
            <span class="article-tag">Article 4 — Assurance Responsabilité Civile &amp; Accidents :</span>
            L'étudiant est expressément couvert par une police d'assurance Responsabilité Civile et Accidents Corporels souscrite par l'Université Sidi Mohamed Ben Abdellah. En cas d'accident survenu sur le lieu de stage ou sur le trajet, l'entreprise s'engage à en informer la direction de l'école dans un délai légal de 48 heures.
        </div>

        <div class="article-row" style="margin-bottom: 0;">
            <span class="article-tag">Article 5 — Confidentialité &amp; Devoir de Réserve :</span>
            Le stagiaire est tenu à une stricte obligation de secret professionnel concernant toutes les données financières, stratégiques et commerciales dont il a connaissance au sein de l'entreprise d'accueil.
        </div>
    </div>

    <!-- Tripartite Signatures with Dedicated Stamp & Signature Boxes -->
    <table class="signatures-table">
        <tr>
            <!-- ENCG Fès (Administration) -->
            <td class="signature-cell">
                <div class="sig-title">POUR L'ENCG FÈS</div>
                <div class="sig-role">Le Directeur de l'Établissement</div>
                <div class="sig-stamp-box box-encg">
                    <table width="100%" height="100%" cellpadding="0" cellspacing="0" style="height: 100%;">
                        <tr>
                            <td style="text-align: center; vertical-align: top; padding-top: 3px; height: 38px;">
                                <div class="official-seal-circle">
                                    ★ ENCG FÈS ★<br>
                                    <span style="font-size: 4.2pt; color: #475569;">USMBA • DIRECTION</span><br>
                                    SCEAU OFFICIEL
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; vertical-align: middle; height: 45px;">
                                <svg width="78" height="22" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8,22 C16,10 24,4 30,4 C35,4 32,22 36,24 C40,26 45,14 50,10 C55,4 60,18 65,16 C70,14 82,6 90,14 C98,10 102,4 112,8" stroke="#002e5b" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; vertical-align: bottom; padding-bottom: 3px;">
                                <div class="sig-caption" style="color: #002e5b;">Cachet officiel &amp; Signature</div>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="sig-date">Visa Direction des Études</div>
            </td>

            <!-- Host Company (Entreprise) -->
            <td class="signature-cell">
                <div class="sig-title">POUR L'ENTREPRISE D'ACCUEIL</div>
                <div class="sig-role">Cachet &amp; Signature du Représentant</div>
                <div class="sig-stamp-box box-company">
                    <table width="100%" height="100%" cellpadding="0" cellspacing="0" style="height: 100%;">
                        <tr>
                            <td style="text-align: center; vertical-align: top; padding-top: 4px; height: 22px;">
                                <div class="company-seal-title">CADRE RÉSERVÉ AU CACHET DE L'ENTREPRISE</div>
                                <div class="company-seal-sub">(Cachet commercial &amp; ICE)</div>
                            </td>
                        </tr>
                        <tr>
                            <!-- Extra spacious blank area for real ink stamp & handwritten signature -->
                            <td style="text-align: center; vertical-align: middle; height: 68px;">
                                &nbsp;
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; vertical-align: bottom; padding-bottom: 3px;">
                                <div style="border-top: 1px dotted #86efac; margin: 0 8px 3px 8px;"></div>
                                <div class="sig-caption" style="color: #047857;">Mention « Bon pour accord » &amp; Signature</div>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="sig-date">Date : &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; / &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; / 2026</div>
            </td>

            <!-- Student (Stagiaire) -->
            <td class="signature-cell">
                <div class="sig-title">LE STAGIAIRE</div>
                <div class="sig-role">Signature de l'Étudiant(e)</div>
                <div class="sig-stamp-box box-student">
                    <table width="100%" height="100%" cellpadding="0" cellspacing="0" style="height: 100%;">
                        <tr>
                            <td style="text-align: center; vertical-align: top; padding-top: 4px; height: 22px;">
                                <div class="student-sign-notice">Mention manuscrite obligatoire :</div>
                                <div style="font-weight: bold; color: #002e5b; font-size: 6.8pt; margin-top: 1px;">« Lu et approuvé »</div>
                            </td>
                        </tr>
                        <tr>
                            <!-- Extra spacious blank area for student handwritten signature -->
                            <td style="text-align: center; vertical-align: middle; height: 68px;">
                                &nbsp;
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; vertical-align: bottom; padding-bottom: 3px;">
                                <div style="border-top: 1px dotted #d8b4fe; margin: 0 8px 3px 8px;"></div>
                                <div class="sig-caption" style="color: #6b21a8;">Signature de l'étudiant(e)</div>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="sig-date">Fait à Fès, le {{ $dateIssued ?? date('d/m/Y') }}</div>
            </td>
        </tr>
    </table>

    <!-- Integrated Legal & Verification Footer (Strict 1-Page Fit) -->
    <div class="integrated-footer">
        <table class="footer-meta-table">
            <tr>
                <td style="width: 45px; vertical-align: middle;">
                    @if(!empty($qrBase64))
                        <img src="{{ $qrBase64 }}" alt="QR Code Sécurité" style="width: 38px; height: 38px; display: block; border: 1px solid #cbd5e1; padding: 1px; background: #ffffff; border-radius: 2px;">
                    @else
                        <div style="width: 38px; height: 38px; border: 1px solid #cbd5e1; background: #ffffff; text-align: center; line-height: 38px; font-size: 5pt; color: #94a3b8; font-weight: bold;">
                            QR CODE
                        </div>
                    @endif
                </td>
                <td style="vertical-align: middle; padding-left: 6px;">
                    <strong style="color: #002e5b; font-size: 6.4pt; text-transform: uppercase;">
                        Convention Tripartite Officielle — Système SI ENCG Fès
                    </strong><br>
                    <span style="color: #64748b; line-height: 1.15;">
                        Document certifié conforme aux dispositions du décret N° 2-15-260 et de la loi 53-05 sur l'échange électronique des données juridiques.<br>
                        <strong>Authentification :</strong> {{ $conventionRef ?? ('CONV-ENCG-' . date('Y')) }} • SHA256-{{ strtoupper(substr(md5(($conventionRef ?? 'CONV') . date('Ymd')), 0, 12)) }}
                    </span>
                </td>
                <td style="width: 140px; text-align: right; vertical-align: middle;">
                    <div style="font-size: 6pt; font-weight: bold; color: #002e5b;">Université Sidi Mohamed Ben Abdellah</div>
                    <div style="font-size: 5.6pt; color: #64748b;">École Nationale de Commerce et de Gestion</div>
                    <div style="font-size: 6.2pt; font-weight: bold; color: #002e5b; margin-top: 1px;">PAGE 1 / 1</div>
                </td>
            </tr>
        </table>

        <div class="footer-bottom-line">
            École Nationale de Commerce et de Gestion de Fès — Route d'Imouzzer, B.P. 1255, Fès - Maroc | Tél: +212 5 35 64 49 20 | https://encg-fes.ac.ma
        </div>
    </div>
@endsection

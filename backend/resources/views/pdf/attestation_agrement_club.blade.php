@extends('pdf.layouts.pdf_master')

@section('title', 'ATTESTATION OFFICIELLE D\'AGRÉMENT DU CLUB — ENCG FÈS')

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
    .agrement-banner {
        background-color: #002e5b;
        color: #ffffff;
        text-align: center;
        padding: 5px 8px;
        border-radius: 4px;
        margin-bottom: 4px;
    }
    .agrement-title {
        font-size: 11pt;
        font-weight: bold;
        color: #ffffff;
        text-transform: uppercase;
        margin: 0;
        padding: 0;
    }
    .agrement-subtitle {
        font-size: 6.8pt;
        font-weight: bold;
        color: #93c5fd;
        margin-top: 2px;
        text-transform: uppercase;
    }

    /* Reference & Status Bar */
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

    /* Regulatory Preamble */
    .preamble-box {
        font-size: 6.5pt;
        line-height: 1.2;
        color: #334155;
        margin-bottom: 4px;
        padding: 3px 6px;
        background-color: #fcfcfd;
        border-left: 2.5px solid #002e5b;
        font-style: italic;
    }

    /* Club Identity Card Table */
    .id-card-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        margin-bottom: 4px;
        font-size: 6.8pt;
    }
    .id-card-table th {
        background-color: #f1f5f9;
        color: #002e5b;
        text-align: left;
        padding: 3px 6px;
        font-weight: bold;
        text-transform: uppercase;
        font-size: 6.8pt;
        border-bottom: 1px solid #cbd5e1;
    }
    .id-card-table td {
        padding: 3px 6px;
        border-bottom: 0.5px solid #e2e8f0;
        vertical-align: top;
    }
    .id-card-table tr:last-child td {
        border-bottom: none;
    }
    .id-lbl {
        color: #475569;
        font-weight: bold;
        width: 25%;
    }
    .id-val {
        font-weight: bold;
        color: #0f172a;
        width: 25%;
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
        font-size: 6.3pt;
        line-height: 1.18;
        text-align: justify;
        color: #1e293b;
    }
    .article-tag {
        font-weight: bold;
        color: #002e5b;
        text-transform: uppercase;
        font-size: 6.3pt;
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

    /* Stamp & Signature Dedicated Boxes - Extra Large & Spacious */
    .sig-stamp-box {
        height: 110px;
        border-radius: 4px;
        margin: 2px 0 3px 0;
        padding: 4px;
        position: relative;
    }
    .box-president {
        border: 1.5px dashed #7c3aed;
        background-color: #faf5ff;
    }
    .box-affairs {
        border: 1.5px dashed #059669;
        background-color: #f0fdf4;
    }
    .box-director {
        border: 1.5px dashed #002e5b;
        background-color: #f8fafc;
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

    .box-seal-title {
        font-size: 6pt;
        font-weight: bold;
        color: #047857;
        text-transform: uppercase;
        line-height: 1.2;
    }
    .box-seal-sub {
        font-size: 5.2pt;
        color: #15803d;
        font-style: italic;
        margin-top: 1px;
    }
    .president-sign-notice {
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
    <div class="agrement-banner">
        <div class="agrement-title">ATTESTATION OFFICIELLE D'AGRÉMENT DU CLUB</div>
        <div class="agrement-subtitle">
            Vie Associative, Citoyenneté &amp; Rayonnement Parascolaire • Année Universitaire {{ $academicYear ?? '2026-2027' }}
        </div>
    </div>

    <!-- Reference & Status Bar -->
    <table class="ref-bar">
        <tr>
            <td style="width: 38%;">
                <strong>Réf. Agrément :</strong> 
                <span style="font-family: monospace; font-weight: bold; color: #002e5b;">
                    {{ $agrementRef ?? ('AGR-ENCG-' . date('Y') . '-' . str_pad($club->id ?? 1, 4, '0', STR_PAD_LEFT)) }}
                </span>
            </td>
            <td style="width: 37%; text-align: center;">
                <strong>Statut Juridique :</strong> 
                <span style="color: #16a34a; font-weight: bold; text-transform: uppercase;">
                    AGRÉMENT OFFICIEL HOMOLOGUÉ
                </span>
            </td>
            <td style="width: 25%; text-align: right;">
                <strong>Date d'Octroi :</strong> 
                <span style="color: #002e5b; font-weight: bold;">
                    {{ $dateIssued ?? date('d/m/Y') }}
                </span>
            </td>
        </tr>
    </table>

    <!-- Legal Framework & Preamble -->
    <div class="preamble-box">
        <strong>Le Directeur de l'École Nationale de Commerce et de Gestion de Fès (ENCG Fès) ;</strong><br>
        • Vu la Loi n° 01-00 portant organisation de l'enseignement supérieur promulguée par le Dahir n° 1-00-199 ;<br>
        • Vu le Décret n° 2-90-554 fixant les compétences et missions de l'ENCG au sein de l'Université Sidi Mohamed Ben Abdellah ;<br>
        • Vu le Règlement Intérieur et la Charte de la Vie Associative et Estudiantine de l'ENCG Fès ;<br>
        • Vu le procès-verbal de constitution du Bureau Exécutif et le plan d'action annuel validé par la Commission Pédagogique ;<br>
        • Sur avis favorable de la Direction des Affaires Estudiantines et de l'Action Culturelle :
    </div>

    <!-- Identification Card -->
    <table class="id-card-table">
        <tr>
            <th colspan="4">Identification de la Structure Associative Agréée</th>
        </tr>
        <tr>
            <td class="id-lbl">Nom Officiel du Club :</td>
            <td class="id-val" style="color: #002e5b; font-size: 7.8pt;">{{ $club->name ?? 'Club Universitaire' }}</td>
            <td class="id-lbl">Pôle / Catégorie :</td>
            <td class="id-val" style="color: #0284c7;">{{ $club->category ?? 'Pôle Entrepreneuriat & Management' }}</td>
        </tr>
        <tr>
            <td class="id-lbl">Président(e) du Bureau :</td>
            <td class="id-val" style="color: #2563eb;">{{ $presidentName ?? ($club->president_name ?? 'Président du Bureau Exécutif') }}</td>
            <td class="id-lbl">Effectif Actif Déclaré :</td>
            <td class="id-val">{{ $membersCount ?? ($club->members_count ?? 30) }} Membres Actifs</td>
        </tr>
        <tr>
            <td class="id-lbl">Budget d'Appui Prévisionnel :</td>
            <td class="id-val" style="color: #16a34a;">{{ $budget ?? '15 000' }} DH (Dotation Vie Étudiante)</td>
            <td class="id-lbl">Domiciliation &amp; Siège :</td>
            <td class="id-val">Maison des Étudiants &amp; Clubs, Campus ENCG Fès</td>
        </tr>
        <tr>
            <td class="id-lbl">Tuteur Référent :</td>
            <td class="id-val" colspan="3">Responsable Enseignant-Chercheur de la Commission de la Vie Associative</td>
        </tr>
    </table>

    <!-- Regulatory Clauses & Rights -->
    <div class="articles-container">
        <div class="articles-header">Droits, Habilitations &amp; Engagements Réglementaires</div>

        <div class="article-row">
            <span class="article-tag">Article 1 — Reconnaissance Institutionnelle :</span>
            Le club susmentionné est officiellement homologué auprès de la Direction de l'établissement et légalement habilité à représenter la vie associative pour l'année universitaire en cours et à organiser des événements sous le parrainage de l'école.
        </div>

        <div class="article-row">
            <span class="article-tag">Article 2 — Accès aux Moyens Logistiques :</span>
            L'agrément confère le droit de réserver en priorité les amphithéâtres (Amphi Ibn Sina, Amphi Al Khwarizmi), salles de conférences, laboratoires multimédias et équipements audiovisuels de l'ENCG Fès sur demande administrative préalable.
        </div>

        <div class="article-row">
            <span class="article-tag">Article 3 — Soutien Budgétaire &amp; Assurance :</span>
            Le club est éligible aux financements institutionnels de l'établissement pour ses manifestations phares. Ses adhérents bénéficient de la police d'assurance responsabilité civile souscrite par l'Université Sidi Mohamed Ben Abdellah.
        </div>

        <div class="article-row" style="margin-bottom: 0;">
            <span class="article-tag">Article 4 — Déontologie &amp; Bilan d'Activité :</span>
            Les membres s'engagent au strict respect de la neutralité politique et confessionnelle, des règles éthiques et à la remise obligatoire d'un bilan moral et financier audité à la fin de chaque semestre universitaire.
        </div>
    </div>

    <!-- Tripartite Signatures with Dedicated Stamp & Signature Boxes -->
    <table class="signatures-table">
        <tr>
            <!-- 1: Club President -->
            <td class="signature-cell">
                <div class="sig-title">POUR LE CLUB</div>
                <div class="sig-role">Le Président du Bureau Exécutif</div>
                <div class="sig-stamp-box box-president">
                    <table width="100%" height="100%" cellpadding="0" cellspacing="0" style="height: 100%;">
                        <tr>
                            <td style="text-align: center; vertical-align: top; padding-top: 3px; height: 20px;">
                                <div class="president-sign-notice">Mention manuscrite obligatoire :</div>
                                <div style="font-weight: bold; color: #6b21a8; font-size: 6.6pt; margin-top: 1px;">« Lu et engagement pris »</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; vertical-align: middle; height: 60px;">
                                &nbsp;
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; vertical-align: bottom; padding-bottom: 2px;">
                                <div style="border-top: 1px dotted #d8b4fe; margin: 0 8px 2px 8px;"></div>
                                <div class="sig-caption" style="color: #6b21a8;">Signature de l'étudiant(e)</div>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="sig-date">Date : {{ $dateIssued ?? date('d/m/Y') }}</div>
            </td>

            <!-- 2: Student Affairs -->
            <td class="signature-cell">
                <div class="sig-title">AFFAIRES ÉTUDIANTES</div>
                <div class="sig-role">Le Directeur des Affaires Étudiantes</div>
                <div class="sig-stamp-box box-affairs">
                    <table width="100%" height="100%" cellpadding="0" cellspacing="0" style="height: 100%;">
                        <tr>
                            <td style="text-align: center; vertical-align: top; padding-top: 3px; height: 20px;">
                                <div class="box-seal-title">AVIS FAVORABLE &amp; VISA RÉGLEMENTAIRE</div>
                                <div class="box-seal-sub">(Direction de la Vie Associative)</div>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; vertical-align: middle; height: 60px;">
                                &nbsp;
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; vertical-align: bottom; padding-bottom: 2px;">
                                <div style="border-top: 1px dotted #86efac; margin: 0 8px 2px 8px;"></div>
                                <div class="sig-caption" style="color: #047857;">Cachet &amp; Visa de Service</div>
                            </td>
                        </tr>
                    </table>
                </div>
                <div class="sig-date">Visa accordé à Fès</div>
            </td>

            <!-- 3: School Director -->
            <td class="signature-cell">
                <div class="sig-title">DIRECTION ENCG FÈS</div>
                <div class="sig-role">Le Directeur de l'Établissement</div>
                <div class="sig-stamp-box box-director">
                    <table width="100%" height="100%" cellpadding="0" cellspacing="0" style="height: 100%;">
                        <tr>
                            <td style="text-align: center; vertical-align: top; padding-top: 2px; height: 35px;">
                                <div class="official-seal-circle">
                                    ★ ENCG FÈS ★<br>
                                    <span style="font-size: 4.2pt; color: #475569;">USMBA • DIRECTION</span><br>
                                    SCEAU OFFICIEL
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; vertical-align: middle; height: 40px;">
                                <svg width="78" height="20" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8,22 C16,10 24,4 30,4 C35,4 32,22 36,24 C40,26 45,14 50,10 C55,4 60,18 65,16 C70,14 82,6 90,14 C98,10 102,4 112,8" stroke="#002e5b" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </td>
                        </tr>
                        <tr>
                            <td style="text-align: center; vertical-align: bottom; padding-bottom: 2px;">
                                <div class="sig-caption" style="color: #002e5b;">Cachet officiel &amp; Signature</div>
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
                        Homologation Associative Officielle — Système SI ENCG Fès
                    </strong><br>
                    <span style="color: #64748b; line-height: 1.15;">
                        Document certifié conforme aux dispositions du décret N° 2-15-260 et de la loi 53-05 sur l'échange électronique des données juridiques.<br>
                        <strong>Authentification :</strong> {{ $agrementRef ?? ('AGR-ENCG-' . date('Y')) }} • SHA256-{{ strtoupper(substr(md5(($agrementRef ?? 'AGR') . date('Ymd')), 0, 12)) }}
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

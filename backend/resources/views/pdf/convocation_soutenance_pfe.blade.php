<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Convocation Officielle de Soutenance PFE — {{ $studentName }} — ENCG Fès</title>
    <style>
        @page { 
            size: A4 portrait; 
            margin: 4mm 6mm 4mm 6mm; 
        }
        * { 
            box-sizing: border-box; 
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 6.8pt;
            line-height: 1.18;
            background: #ffffff;
        }
        .page-container {
            border: 1.8px solid #002147;
            padding: 5px 8px 4px 8px;
            background: #ffffff;
            position: relative;
            page-break-inside: avoid;
        }

        /* Filigrane officiel */
        .watermark {
            position: absolute;
            top: 48%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-28deg);
            opacity: 0.03;
            font-size: 34pt;
            font-weight: 900;
            color: #002147;
            text-transform: uppercase;
            letter-spacing: 3px;
            text-align: center;
            width: 100%;
            pointer-events: none;
            z-index: 0;
        }

        .content-layer {
            position: relative;
            z-index: 1;
        }

        /* En-tête officiel ENCG Fès */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 2px;
        }
        .header-table td {
            vertical-align: middle;
            border: none;
            padding: 0;
        }
        .hdr-kingdom {
            font-size: 6.8pt;
            font-weight: bold;
            color: #002147;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            line-height: 1.1;
        }
        .hdr-ar-kingdom {
            font-size: 7.8pt;
            font-weight: bold;
            color: #002147;
            line-height: 1.15;
        }
        .hdr-univ {
            font-size: 5.8pt;
            color: #334155;
            line-height: 1.1;
        }
        .hdr-ar-univ {
            font-size: 6.4pt;
            font-weight: bold;
            color: #1e293b;
            line-height: 1.1;
        }
        .hdr-school {
            font-size: 6.8pt;
            font-weight: bold;
            color: #002147;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            line-height: 1.1;
        }
        .hdr-ar-school {
            font-size: 6.8pt;
            font-weight: bold;
            color: #002147;
            line-height: 1.15;
        }
        .hdr-dept {
            font-size: 5.2pt;
            font-weight: bold;
            color: #c9a227;
            letter-spacing: 0.3px;
            text-transform: uppercase;
            margin-top: 1px;
        }

        /* Cartouche de Référence */
        .ref-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #c9a227;
            background-color: #fffdf7;
            border-radius: 2px;
            text-align: left;
        }
        .ref-table td {
            padding: 1.5px 3px;
            font-size: 5.4pt;
            line-height: 1.1;
            color: #334155;
        }
        .ref-hdr {
            background-color: #002147;
            color: #ffffff !important;
            font-weight: bold;
            font-size: 5.2pt;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            text-align: center;
        }
        .ref-val {
            font-family: 'DejaVu Sans Mono', monospace, sans-serif;
            font-size: 5.8pt;
            font-weight: bold;
            color: #002147;
            border-bottom: 1px solid #f1e5c3;
        }
        .ref-badge {
            display: inline-block;
            background-color: #002147;
            color: #ffffff;
            font-size: 5.0pt;
            font-weight: bold;
            padding: 1px 3px;
            border-radius: 2px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }

        /* Séparateur Royal Double Ligne */
        .royal-divider {
            margin: 1.5px 0 2.5px 0;
            border-top: 1.2px solid #002147;
            border-bottom: 0.8px solid #c9a227;
            height: 1.5px;
        }

        /* Titre Officiel Bilingue */
        .title-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2px;
        }
        .title-cell {
            background-color: #002147;
            border-top: 1px solid #c9a227;
            color: #ffffff;
            text-align: center;
            padding: 2.5px 4px;
            border-radius: 2px;
        }
        .title-cell h1 {
            font-size: 9.0pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #ffffff;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.05;
        }
        .title-cell .ar-sub {
            font-size: 7.0pt;
            font-weight: bold;
            color: #fde047;
            margin-top: 1px;
            line-height: 1.15;
        }
        .title-cell .degree-sub {
            font-size: 5.0pt;
            font-weight: bold;
            color: #e2e8f0;
            margin-top: 0.5px;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }

        /* Notification Réglementaire */
        .decree-box {
            font-size: 5.4pt;
            line-height: 1.16;
            color: #334155;
            background: #f8fafc;
            border: 0.8px solid #cbd5e1;
            border-left: 2.5px solid #002147;
            padding: 2.5px 5px;
            margin-bottom: 2px;
            text-align: justify;
        }

        /* Bento Candidat */
        .dossier-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 2px;
        }
        .dossier-cell {
            border: 0.8px solid #cbd5e1;
            padding: 2.5px 4px;
            background: #ffffff;
            vertical-align: top;
        }
        .tile-label {
            font-size: 4.5pt;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            margin-bottom: 0.5px;
        }
        .tile-value {
            font-size: 6.8pt;
            font-weight: 900;
            color: #002147;
            line-height: 1.1;
        }
        .tile-sub {
            font-size: 4.8pt;
            color: #475569;
            margin-top: 0.5px;
        }
        .tile-mono {
            font-family: 'DejaVu Sans Mono', monospace, sans-serif;
            font-size: 5.8pt;
            font-weight: 700;
            color: #0f172a;
        }

        /* Sujet PFE */
        .topic-box {
            border: 0.8px solid #cbd5e1;
            border-left: 3px solid #c9a227;
            background: #fcfcfd;
            padding: 2.5px 5px;
            margin-bottom: 2px;
        }
        .topic-title {
            font-size: 4.8pt;
            font-weight: 800;
            color: #854d0e;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            margin-bottom: 0.5px;
        }
        .topic-text {
            font-size: 6.6pt;
            font-weight: bold;
            color: #002147;
            font-style: italic;
            line-height: 1.15;
        }

        /* Spatio-temporel */
        .logistics-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 2px;
        }
        .logistics-cell {
            border: 0.8px solid #cbd5e1;
            padding: 2.5px 4px;
            background: #f8fafc;
            text-align: center;
        }
        .log-label {
            font-size: 4.5pt;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            margin-bottom: 0.5px;
        }
        .log-val {
            font-size: 7.2pt;
            font-weight: 900;
            color: #002147;
            line-height: 1.1;
        }
        .log-sub {
            font-size: 4.5pt;
            color: #64748b;
            margin-top: 0.5px;
        }

        /* Jury Section */
        .jury-header {
            background-color: #002147;
            color: #ffffff;
            font-size: 5.5pt;
            font-weight: 900;
            padding: 2px 5px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border-radius: 2px 2px 0 0;
            border-bottom: 0.8px solid #c9a227;
        }
        .jury-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 0.8px solid #002147;
            margin-bottom: 2px;
        }
        .jury-table th {
            background-color: #f1f5f9;
            color: #002147;
            font-size: 4.8pt;
            font-weight: 800;
            padding: 2px 3px;
            border: 0.8px solid #cbd5e1;
            text-align: left;
            text-transform: uppercase;
        }
        .jury-table td {
            font-size: 6.0pt;
            padding: 2.5px 3px;
            border: 0.8px solid #cbd5e1;
            vertical-align: middle;
        }
        .badge-role {
            display: inline-block;
            padding: 1px 3px;
            border-radius: 2px;
            font-size: 4.8pt;
            font-weight: 900;
            text-transform: uppercase;
        }
        .badge-pres {
            background-color: #eff6ff;
            color: #1e40af;
            border: 0.5px solid #bfdbfe;
        }
        .badge-enc {
            background-color: #f0fdf4;
            color: #166534;
            border: 0.5px solid #bbf7d0;
        }
        .badge-rap {
            background-color: #faf5ff;
            color: #6b21a8;
            border: 0.5px solid #e9d5ff;
        }
        .visa-box {
            border: 0.8px dashed #94a3b8;
            height: 15px;
            background: #ffffff;
            border-radius: 2px;
            text-align: center;
            font-size: 4.5pt;
            color: #94a3b8;
            line-height: 15px;
        }

        /* Charte & Directives */
        .charte-box {
            border: 0.8px solid #cbd5e1;
            background: #fdfdfd;
            padding: 2px 5px;
            margin-bottom: 2px;
            border-radius: 2px;
        }
        .charte-title {
            font-size: 4.8pt;
            font-weight: 900;
            color: #002147;
            text-transform: uppercase;
            margin-bottom: 0.5px;
        }
        .charte-list {
            margin: 0;
            padding-left: 10px;
            font-size: 4.8pt;
            color: #334155;
            line-height: 1.18;
        }
        .charte-list li {
            margin-bottom: 0.5px;
        }

        /* Authentification & Sceau */
        .auth-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 0.8px solid #cbd5e1;
            background: #ffffff;
            margin-bottom: 1.5px;
        }
        .auth-table td {
            vertical-align: middle;
            padding: 2px 4px;
            border: none;
        }
        .auth-left {
            width: 50%;
            border-right: 0.8px solid #e2e8f0;
        }
        .auth-right {
            width: 50%;
            text-align: center;
            padding-left: 6px;
        }
        .seal-circle {
            display: inline-block;
            width: 36px;
            height: 36px;
            border: 1.2px dashed #1d4ed8;
            border-radius: 50%;
            text-align: center;
            padding: 1.5px;
            margin-top: 1px;
            color: #1d4ed8;
        }

        /* Pied de Page */
        .footer-bar {
            border-top: 0.8px solid #cbd5e1;
            padding-top: 1.5px;
            font-size: 4.6pt;
            color: #64748b;
            text-align: center;
            line-height: 1.1;
        }
    </style>
</head>
<body>

<div class="page-container">
    <div class="watermark">ROYAUME DU MAROC • ENCG FÈS</div>

    <div class="content-layer">
        
        <!-- En-tête Officiel Bilingue -->
        <table class="header-table">
            <tr>
                <td style="width: 24%; text-align: left;">
                    @if(!empty($logoBase64))
                        <img src="{{ $logoBase64 }}" style="max-height: 48px; max-width: 135px; width: auto; display: block;" alt="Logo ENCG Fès">
                    @else
                        <strong style="color: #002147; font-size: 10pt; letter-spacing: 0.5px;">ENCG FÈS</strong><br>
                        <span style="font-size: 5.5pt; color: #64748b;">Université USMBA</span>
                    @endif
                </td>
                <td style="width: 52%; text-align: center;">
                    <div class="hdr-kingdom">ROYAUME DU MAROC</div>
                    <div class="hdr-ar-kingdom">{!! $arKingdom ?? 'المملكة المغربية' !!}</div>
                    <div class="hdr-univ">Université Sidi Mohamed Ben Abdellah de Fès</div>
                    <div class="hdr-ar-univ">{!! $arUniv ?? 'جامعة سيدي محمد بن عبد الله - فاس' !!}</div>
                    <div class="hdr-school">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                    <div class="hdr-ar-school">{!! $arSchool ?? 'المدرسة الوطنية للتجارة والتسيير بفاس' !!}</div>
                    <div class="hdr-dept">DIRECTION DES AFFAIRES PÉDAGOGIQUES &amp; DE LA SCOLARITÉ</div>
                </td>
                <td style="width: 24%; text-align: right;">
                    <table class="ref-table">
                        <tr>
                            <td class="ref-hdr" colspan="2">RÉFÉRENCE OFFICIELLE</td>
                        </tr>
                        <tr>
                            <td class="ref-val" colspan="2">{{ $refNumber ?? 'ENCG/PFE/2026/N° 0842' }}</td>
                        </tr>
                        <tr>
                            <td><strong>SESSION :</strong> Juin 2026</td>
                            <td style="text-align: right;"><strong>ANNÉE :</strong> {{ $academicYear ?? '2025/2026' }}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="text-align: center; padding: 0.5px;">
                                <span class="ref-badge">CONVOCATION PFE</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="royal-divider"></div>

        <!-- Titre Solennel Bilingue -->
        <table class="title-table">
            <tr>
                <td class="title-cell">
                    <h1>CONVOCATION OFFICIELLE À LA SOUTENANCE DU PFE</h1>
                    <div class="ar-sub">{!! $arTitle ?? 'إشعار ومقرر الحضور لمناقشة مشروع نهاية الدراسة' !!}</div>
                    <div class="degree-sub">DIPLÔME DE L'ÉCOLE NATIONALE DE COMMERCE ET DE GESTION (GRADE DE MASTER &bull; BAC+5)</div>
                </td>
            </tr>
        </table>

        <!-- Texte Réglementaire -->
        <div class="decree-box">
            Conformément au Dahir n° 1-00-199 portant promulgation de la loi n° 01-00 portant organisation de l'enseignement supérieur, 
            au Cahier des Normes Pédagogiques Nationales (CNPN) du diplôme de l'ENCG, et aux délibérations de la Commission Pédagogique de l'établissement : 
            Il est porté à la connaissance de Monsieur/Madame le membre de la commission d'évaluation et de l'étudiant(e) candidat(e) que 
            la séance publique de soutenance du Projet de Fin d'Études (PFE) aura lieu selon les modalités officielles suivantes :
        </div>

        <!-- Bento Candidat -->
        <table class="dossier-table">
            <tr>
                <td class="dossier-cell" style="width: 38%;">
                    <div class="tile-label">Étudiant(e) Candidat(e)</div>
                    <div class="tile-value">{{ strtoupper($studentName) }}</div>
                    @if(!empty($studentNameAr))
                        <div style="font-size: 6.6pt; font-weight: bold; color: #002147; margin-top: 0.5px;">{!! $studentNameAr !!}</div>
                    @endif
                </td>
                <td class="dossier-cell" style="width: 34%;">
                    <div class="tile-label">Filière / Spécialité</div>
                    <div class="tile-value">{{ $filiereName ?? 'Commerce & Gestion' }}</div>
                    <div class="tile-sub">Diplôme d'État ENCG Fès</div>
                </td>
                <td class="dossier-cell" style="width: 28%;">
                    <div class="tile-label">Identifiants Académiques</div>
                    <div class="tile-mono">CNE: {{ $cne ?? 'N138094101' }}</div>
                    <div class="tile-mono">CIN: {{ $cin ?? 'CD654321' }}</div>
                </td>
            </tr>
        </table>

        <!-- Intitulé du Sujet -->
        <div class="topic-box">
            <div class="topic-title">Intitulé Officiel du Projet de Fin d'Études (PFE) :</div>
            <div class="topic-text">« {{ $topic }} »</div>
        </div>

        <!-- Cadre Spatio-Temporel -->
        <table class="logistics-table">
            <tr>
                <td class="logistics-cell" style="border-right: none; border-radius: 2px 0 0 2px;">
                    <div class="log-label">📅 Date d'Audience</div>
                    <div class="log-val">{{ $dateFormatted }}</div>
                    <div class="log-sub">Session Principale Juin 2026</div>
                </td>
                <td class="logistics-cell" style="border-right: none;">
                    <div class="log-label">⏰ Horaire &amp; Durée</div>
                    <div class="log-val">{{ $timeFormatted }}</div>
                    <div class="log-sub">Durée : 90 min (Exposé + Débat + Délibération)</div>
                </td>
                <td class="logistics-cell" style="border-radius: 0 2px 2px 0;">
                    <div class="log-label">📍 Lieu d'Affectation</div>
                    <div class="log-val">{{ $roomName }}</div>
                    <div class="log-sub">Campus Universitaire ENCG Fès</div>
                </td>
            </tr>
        </table>

        <!-- Composition du Jury -->
        <div class="jury-header">COMPOSITION OFFICIELLE DE LA COMMISSION DU JURY D'ÉVALUATION</div>
        <table class="jury-table">
            <thead>
                <tr>
                    <th style="width: 25%;">Qualité / Rôle</th>
                    <th style="width: 32%;">Nom &amp; Prénom du Membre</th>
                    <th style="width: 28%;">Grade &amp; Établissement</th>
                    <th style="width: 15%; text-align: center;">Émargement</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><span class="badge-role badge-pres">Président du Jury</span></td>
                    <td><strong>{{ $presidentName }}</strong></td>
                    <td>Professeur de l'Ens. Sup. (PES) &bull; ENCG Fès</td>
                    <td><div class="visa-box">Visa</div></td>
                </tr>
                <tr>
                    <td><span class="badge-role badge-enc">Encadrant Pédagogique</span></td>
                    <td><strong>{{ $encadrantName }}</strong></td>
                    <td>Professeur Habilité (PH) &bull; ENCG Fès</td>
                    <td><div class="visa-box">Visa</div></td>
                </tr>
                <tr>
                    <td><span class="badge-role badge-rap">Rapporteur / Examinateur</span></td>
                    <td><strong>{{ $rapporteurName }}</strong></td>
                    <td>Professeur Chercheur (PA) &bull; ENCG Fès</td>
                    <td><div class="visa-box">Visa</div></td>
                </tr>
            </tbody>
        </table>

        <!-- Charte Réglementaire -->
        <div class="charte-box">
            <div class="charte-title">Dispositions Réglementaires &amp; Déroulement de l'Épreuve :</div>
            <ul class="charte-list">
                <li><strong>Ponctualité :</strong> Le candidat et les membres du jury sont priés de se présenter 15 minutes avant le début officiel de la séance.</li>
                <li><strong>Protocole d'Évaluation :</strong> Présentation orale de synthèse : 20 à 30 minutes, suivie des échanges et questions du jury (30 min).</li>
                <li><strong>Huis Clos :</strong> La délibération et l'attribution de la note finale et de la mention se déroulent strictement à huis clos.</li>
                <li><strong>Validation du Diplôme :</strong> La délivrance du diplôme est subordonnée au dépôt de la version finale corrigée du mémoire sous 10 jours.</li>
            </ul>
        </div>

        <!-- Bloc Signature & Authentification -->
        <table class="auth-table">
            <tr>
                <td class="auth-left">
                    <table style="width: 100%; border-collapse: collapse; border: none;">
                        <tr>
                            @if(!empty($qrCodeBase64))
                            <td style="width: 44px; vertical-align: middle; border: none; padding-right: 4px;">
                                <img src="{{ $qrCodeBase64 }}" style="width: 40px; height: 40px; border: 0.8px solid #cbd5e1; padding: 1.5px; display: block;" alt="QR Code">
                            </td>
                            @endif
                            <td style="vertical-align: middle; border: none;">
                                <strong style="color: #002147; font-size: 5.2pt;">CONTRÔLE D'AUTHENTICITÉ NUMÉRIQUE</strong><br>
                                <span style="font-size: 4.5pt; color: #475569;">Système d'Information Scolarité &bull; ENCG Fès</span><br>
                                <span style="font-size: 4.3pt; color: #64748b;">Empreinte SHA-256 : <span style="font-family: monospace;">{{ hash('sha256', ($soutenanceId ?? '1').($studentName ?? '').'ENCG-PFE') }}</span></span><br>
                                <span style="font-size: 4.3pt; color: #047857; font-weight: bold;">Document officiel certifié conforme dématérialisé.</span>
                            </td>
                        </tr>
                    </table>
                </td>
                <td class="auth-right">
                    <div style="font-style: italic; color: #334155; font-size: 5.2pt; margin-bottom: 0.5px;">Fait à Fès, le {{ date('d/m/Y') }}</div>
                    <div style="font-weight: 900; color: #002147; font-size: 5.6pt; text-transform: uppercase;">Pour le Directeur de l'ENCG de Fès et par délégation,</div>
                    <div style="font-size: 4.8pt; color: #64748b; margin-bottom: 1px;">Le Directeur Adjoint aux Affaires Pédagogiques</div>
                    
                    <div class="seal-circle">
                        <div style="font-size: 2.5pt; font-weight: 900;">USMBA</div>
                        <div style="font-size: 5pt; color: #c9a227; line-height: 1;">★</div>
                        <div style="font-size: 2.3pt; font-weight: 800;">ENCG FÈS</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div class="footer-bar">
            <strong>École Nationale de Commerce et de Gestion de Fès</strong> &bull; Université Sidi Mohamed Ben Abdellah &bull; Quartier Industriel Ain Chkef, Route d'Imouzzer, BP 81 A Fès — Maroc &bull; Tél: +212 5 35 61 14 00 &bull; www.encg-fes.ac.ma
        </div>

    </div>
</div>

</body>
</html>

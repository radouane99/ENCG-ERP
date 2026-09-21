<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Convocation Officielle de Soutenance PFE — {{ $studentName }} — ENCG Fès</title>
    <style>
        @page { 
            size: A4 portrait; 
            margin: 8mm 10mm 8mm 10mm; 
        }
        * { 
            box-sizing: border-box; 
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            font-size: 7.6pt;
            line-height: 1.25;
            background: #ffffff;
        }
        .page-container {
            border: 2px solid #002147;
            padding: 8px 12px;
            background: #ffffff;
            position: relative;
            page-break-inside: avoid;
            height: 98%;
        }

        /* Filigrane officiel */
        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            opacity: 0.035;
            font-size: 40pt;
            font-weight: 900;
            color: #002147;
            text-transform: uppercase;
            letter-spacing: 5px;
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
            margin-bottom: 4px;
        }
        .header-table td {
            vertical-align: middle;
            border: none;
            padding: 0;
        }
        .gold-divider {
            height: 2px;
            background: #c9a227;
            margin: 4px 0 6px 0;
        }

        /* Bannière Titre */
        .title-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 6px;
        }
        .title-cell {
            background-color: #002147;
            border-top: 1.5px solid #c9a227;
            border-bottom: 1.5px solid #c9a227;
            color: #ffffff;
            text-align: center;
            padding: 5px 8px;
            border-radius: 3px;
        }
        .title-cell h1 {
            font-size: 10pt;
            font-weight: 900;
            letter-spacing: 0.8px;
            color: #ffffff;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.2;
        }
        .title-cell .ar-sub {
            font-size: 9pt;
            font-weight: bold;
            color: #fde047;
            margin-top: 2px;
        }
        .title-cell .sub {
            font-size: 6.5pt;
            font-weight: bold;
            color: #e2e8f0;
            margin-top: 1px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Texte Réglementaire */
        .notice-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-left: 3.5px solid #002147;
            padding: 5px 8px;
            border-radius: 3px;
            margin-bottom: 6px;
            font-size: 6.8pt;
            color: #334155;
            line-height: 1.3;
            font-style: italic;
        }

        /* Bento Candidat */
        .dossier-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 6px;
        }
        .dossier-cell {
            border: 1px solid #cbd5e1;
            padding: 4px 8px;
            background: #f8fafc;
            vertical-align: top;
        }
        .tile-label {
            font-size: 5.4pt;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 1px;
        }
        .tile-value {
            font-size: 7.8pt;
            font-weight: 900;
            color: #002147;
        }
        .tile-mono {
            font-family: monospace;
            font-size: 7.2pt;
            color: #0f172a;
            font-weight: 800;
        }

        /* Encadré Sujet PFE */
        .topic-container {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-left: 3.5px solid #1d4ed8;
            border-radius: 3px;
            padding: 5px 8px;
            margin-bottom: 6px;
        }
        .topic-title {
            font-size: 5.6pt;
            font-weight: 900;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 2px;
        }
        .topic-content {
            font-size: 8.2pt;
            font-weight: 900;
            color: #002147;
            font-style: italic;
            line-height: 1.25;
        }

        /* Cartouches Spatio-Temporelles */
        .logistics-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 6px;
        }
        .logistics-cell {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            text-align: center;
            background: #ffffff;
        }
        .log-label {
            font-size: 5.6pt;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-bottom: 2px;
        }
        .log-val {
            font-size: 8.4pt;
            font-weight: 900;
            color: #002147;
        }
        .log-sub {
            font-size: 5.8pt;
            color: #64748b;
            margin-top: 1px;
        }

        /* Tableau du Jury */
        .jury-header {
            font-size: 6.8pt;
            font-weight: 900;
            color: #002147;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
        }
        .jury-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 6px;
        }
        .jury-table th, .jury-table td {
            border: 1px solid #94a3b8;
            padding: 4px 6px;
            vertical-align: middle;
        }
        .jury-table th {
            background-color: #002147;
            color: #ffffff;
            font-size: 6.4pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            text-align: left;
            border-bottom: 1.8px solid #c9a227;
        }
        .role-pill {
            display: inline-block;
            padding: 1.5px 5px;
            border-radius: 2px;
            font-size: 6.0pt;
            font-weight: 900;
            text-transform: uppercase;
        }
        .pill-pres { background: #eff6ff; color: #1e3a8a; border: 0.6px solid #bfdbfe; }
        .pill-enc  { background: #ecfdf5; color: #065f46; border: 0.6px solid #a7f3d0; }
        .pill-rap  { background: #faf5ff; color: #6b21a8; border: 0.6px solid #e9d5ff; }

        .visa-box {
            border: 1px dashed #cbd5e1;
            height: 20px;
            line-height: 20px;
            text-align: center;
            font-size: 5.5pt;
            color: #94a3b8;
            font-style: italic;
        }

        /* Charte & Réglementation */
        .rules-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 3px solid #64748b;
            padding: 4px 8px;
            margin-bottom: 6px;
            font-size: 6.0pt;
            color: #334155;
            line-height: 1.25;
        }
        .rules-title {
            font-weight: 900;
            color: #002147;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
        }
        .rules-list {
            margin: 0;
            padding-left: 12px;
        }

        /* Bloc Signature & Cachet */
        .auth-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-top: 4px;
        }
        .auth-table td {
            vertical-align: top;
            border: none;
            padding: 0;
        }
        .auth-left {
            width: 45%;
            font-size: 5.8pt;
            color: #64748b;
            line-height: 1.25;
        }
        .auth-right {
            width: 55%;
            text-align: center;
            font-size: 6.8pt;
        }
        .official-seal-wrap {
            display: inline-block;
            width: 52px;
            height: 52px;
            border: 1.8px dashed #1d4ed8;
            border-radius: 50%;
            text-align: center;
            padding: 3px;
            margin-top: 2px;
            color: #1d4ed8;
        }

        /* Pied de page */
        .footer-bar {
            border-top: 1px solid #cbd5e1;
            padding-top: 3px;
            margin-top: 4px;
            font-size: 5.4pt;
            color: #64748b;
            text-align: center;
            line-height: 1.2;
        }
    </style>
</head>
<body>

<div class="page-container">
    <div class="watermark">ENCG FÈS &bull; SOUTENANCE OFFICIELLE</div>

    <div class="content-layer">
        
        <!-- En-tête Officiel -->
        <table class="header-table">
            <tr>
                <td style="width: 25%; text-align: left;">
                    @if(!empty($resolvedLogoSrc))
                        <img src="{{ $resolvedLogoSrc }}" style="max-height: 48px; max-width: 130px;" alt="Logo ENCG Fès">
                    @else
                        <strong style="color: #002147; font-size: 11pt; letter-spacing: 0.5px;">ENCG FÈS</strong><br>
                        <span style="font-size: 6pt; color: #64748b;">Université USMBA</span>
                    @endif
                </td>
                <td style="width: 48%; text-align: center;">
                    <div style="font-size: 8.5pt; font-weight: bold; color: #002147;">المملكة المغربية</div>
                    <div style="font-size: 7.0pt; font-weight: 900; color: #002147; text-transform: uppercase;">ROYAUME DU MAROC</div>
                    <div style="font-size: 6.6pt; color: #334155;">Université Sidi Mohamed Ben Abdellah de Fès</div>
                    <div style="font-size: 7.8pt; font-weight: bold; color: #002147;">المدرسة الوطنية للتجارة والتسيير بفاس</div>
                    <div style="font-size: 7.4pt; font-weight: 900; color: #002147; text-transform: uppercase;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                </td>
                <td style="width: 27%; text-align: right;">
                    <div style="border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 3px; padding: 3px 5px; text-align: right; font-size: 6.2pt;">
                        <div><strong>RÉFÉRENCE :</strong> <span style="font-family: monospace; font-weight: 900; color: #002147;">{{ $refNumber ?? 'ENCG/PFE/2026/N° 0842' }}</span></div>
                        <div><strong>SESSION :</strong> Juin / Juillet 2026</div>
                        <div><strong>ANNÉE :</strong> {{ $academicYear ?? '2025 - 2026' }}</div>
                        <div style="margin-top: 1px;"><span style="background: #002147; color: #fff; padding: 1px 3px; border-radius: 2px; font-weight: 900; font-size: 5.5pt;">CONVOCATION PFE</span></div>
                    </div>
                </td>
            </tr>
        </table>

        <div class="gold-divider"></div>

        <!-- Titre Solennel -->
        <table class="title-table">
            <tr>
                <td class="title-cell">
                    <h1>CONVOCATION OFFICIELLE À LA SOUTENANCE DU PFE</h1>
                    <div class="ar-sub">إشعار ومقرر الحضور لمناقشة مشروع نهاية الدراسة</div>
                    <div class="sub">DIPLÔME DE L'ÉCOLE NATIONALE DE COMMERCE ET DE GESTION (GRADE DE MASTER &bull; BAC+5)</div>
                </td>
            </tr>
        </table>

        <!-- Texte Réglementaire -->
        <div class="notice-box">
            Conformément au Dahir n° 1-00-199 portant promulgation de la loi n° 01-00 portant organisation de l'enseignement supérieur, 
            au Cahier des Normes Pédagogiques Nationales (CNPN) du diplôme de l'ENCG, et aux délibérations de la Commission Pédagogique de l'établissement : 
            Il est porté à la connaissance de Monsieur/Madame le membre de la commission d'évaluation et de l'étudiant(e) candidat(e) que 
            la séance publique de soutenance du Projet de Fin d'Études (PFE) aura lieu selon les modalités suivantes :
        </div>

        <!-- Bento Candidat -->
        <table class="dossier-table">
            <tr>
                <td class="dossier-cell" style="width: 38%;">
                    <div class="tile-label">Étudiant(e) Candidat(e)</div>
                    <div class="tile-value">{{ strtoupper($studentName) }}</div>
                </td>
                <td class="dossier-cell" style="width: 32%;">
                    <div class="tile-label">Filière / Spécialité</div>
                    <div class="tile-value">{{ $filiereName ?? 'Commerce & Gestion' }}</div>
                </td>
                <td class="dossier-cell" style="width: 30%;">
                    <div class="tile-label">Identifiants Académiques</div>
                    <div class="tile-mono">CNE: {{ $cne ?? 'N138094101' }} &bull; CIN: {{ $cin ?? 'CD654321' }}</div>
                </td>
            </tr>
        </table>

        <!-- Sujet PFE -->
        <div class="topic-container">
            <div class="topic-title">Intitulé Officiel du Projet de Fin d'Études (PFE) :</div>
            <div class="topic-content">« {{ $topic }} »</div>
        </div>

        <!-- Spatio-temporel -->
        <table class="logistics-table">
            <tr>
                <td class="logistics-cell" style="border-right: none; border-radius: 3px 0 0 3px;">
                    <div class="log-label">📅 Date d'Audience</div>
                    <div class="log-val">{{ $dateFormatted }}</div>
                    <div class="log-sub">Session Principale Juin 2026</div>
                </td>
                <td class="logistics-cell" style="border-right: none;">
                    <div class="log-label">⏰ Horaire &amp; Durée</div>
                    <div class="log-val">{{ $timeFormatted }}</div>
                    <div class="log-sub">Durée : 90 min (Exposé + Débat + Délibération)</div>
                </td>
                <td class="logistics-cell" style="border-radius: 0 3px 3px 0;">
                    <div class="log-label">📍 Lieu d'Affectation</div>
                    <div class="log-val">{{ $roomName }}</div>
                    <div class="log-sub">Campus Universitaire ENCG Fès</div>
                </td>
            </tr>
        </table>

        <!-- Jury -->
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
                    <td><span class="role-pill pill-pres">Président du Jury</span></td>
                    <td><strong>{{ $presidentName }}</strong></td>
                    <td>Professeur de l'Ens. Sup. (PES) &bull; ENCG Fès</td>
                    <td><div class="visa-box">Visa</div></td>
                </tr>
                <tr>
                    <td><span class="role-pill pill-enc">Encadrant Pédagogique</span></td>
                    <td><strong>{{ $encadrantName }}</strong></td>
                    <td>Professeur Habilité (PH) &bull; ENCG Fès</td>
                    <td><div class="visa-box">Visa</div></td>
                </tr>
                <tr>
                    <td><span class="role-pill pill-rap">Rapporteur / Examinateur</span></td>
                    <td><strong>{{ $rapporteurName }}</strong></td>
                    <td>Professeur Chercheur (PA) &bull; ENCG Fès</td>
                    <td><div class="visa-box">Visa</div></td>
                </tr>
            </tbody>
        </table>

        <!-- Charte -->
        <div class="rules-card">
            <div class="rules-title">Dispositions Réglementaires &amp; Protocole de Séance :</div>
            <ul class="rules-list">
                <li><strong>Ponctualité :</strong> Le candidat et les membres du jury sont priés de se présenter 15 minutes avant le début officiel de la séance.</li>
                <li><strong>Protocole :</strong> Présentation orale de synthèse : 20 à 30 minutes, suivie des échanges et questions de la commission (30 min).</li>
                <li><strong>Huis Clos :</strong> La délibération et l'attribution de la note finale et de la mention se déroulent strictement à huis clos.</li>
                <li><strong>Validation :</strong> La délivrance du diplôme est subordonnée au dépôt de la version finale corrigée du mémoire sous 10 jours.</li>
            </ul>
        </div>

        <!-- Bloc Signature & Sceau -->
        <table class="auth-table">
            <tr>
                <td class="auth-left">
                    <table style="width: 100%; border-collapse: collapse; border: none;">
                        <tr>
                            @if(!empty($qrCodeBase64))
                            <td style="width: 52px; vertical-align: middle; border: none; padding-right: 6px;">
                                <img src="{{ $qrCodeBase64 }}" style="width: 48px; height: 48px; border: 1px solid #cbd5e1; padding: 2px;" alt="QR Code">
                            </td>
                            @endif
                            <td style="vertical-align: middle; border: none;">
                                <strong style="color: #002147;">CONTRÔLE D'AUTHENTICITÉ NUMÉRIQUE</strong><br>
                                Système d'Information Scolarité &bull; ENCG Fès<br>
                                Empreinte SHA-256 : <span style="font-family: monospace; font-size: 5.0pt;">{{ hash('sha256', ($soutenanceId ?? '1').($studentName ?? '').'ENCG-PFE') }}</span><br>
                                Document officiel certifié conforme dématérialisé.
                            </td>
                        </tr>
                    </table>
                </td>
                <td class="auth-right">
                    <div style="font-style: italic; color: #334155; margin-bottom: 2px;">Fait à Fès, le {{ date('d/m/Y') }}</div>
                    <div style="font-weight: 900; color: #002147; text-transform: uppercase;">Pour le Directeur de l'ENCG de Fès et par délégation,</div>
                    <div style="font-size: 5.8pt; color: #64748b; margin-bottom: 3px;">Le Directeur Adjoint aux Affaires Pédagogiques</div>
                    
                    <div class="official-seal-wrap">
                        <div style="font-size: 3.2pt; font-weight: 900;">USMBA</div>
                        <div style="font-size: 7pt; color: #c9a227; line-height: 1;">★</div>
                        <div style="font-size: 3.0pt; font-weight: 800;">ENCG FÈS</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div class="footer-bar">
            <strong>École Nationale de Commerce et de Gestion de Fès</strong> &bull; 
            Université Sidi Mohamed Ben Abdellah &bull; 
            Quartier Universitaire, B.P. 2220, Fès — Tél : +212 (0) 5 35 60 03 40 &bull; www.encg-fes.ac.ma &bull; <strong>Page 1/1</strong>
        </div>

    </div>
</div>

</body>
</html>

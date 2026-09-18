<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Lot des Convocations au Conseil de Discipline — ENCG Fès</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 5mm 7mm 5mm 7mm;
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
            line-height: 1.3;
            background: #ffffff;
        }
        .page-break {
            page-break-before: always;
        }
        .page-container {
            border: 2px solid #581c1c;
            outline: 1px solid #c9a227;
            outline-offset: -4px;
            padding: 7px 10px 5px 10px;
            background: #ffffff;
            position: relative;
        }

        /* En-tête officiel */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-bottom: 1px;
        }
        .header-table td {
            vertical-align: middle;
            border: none;
            padding: 0;
        }
        .hdr-kingdom {
            font-size: 7.5pt;
            font-weight: bold;
            color: #581c1c;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 1px;
        }
        .hdr-ar-kingdom {
            font-size: 8.5pt;
            font-weight: bold;
            color: #581c1c;
            margin-bottom: 1px;
        }
        .hdr-univ {
            font-size: 6.5pt;
            color: #334155;
        }
        .hdr-ar-univ {
            font-size: 7pt;
            font-weight: bold;
            color: #1e293b;
        }
        .hdr-school {
            font-size: 7.2pt;
            font-weight: bold;
            color: #002147;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .hdr-ar-school {
            font-size: 7.2pt;
            font-weight: bold;
            color: #002147;
            margin-bottom: 1px;
        }
        .hdr-council {
            font-size: 6.2pt;
            font-weight: bold;
            color: #854d0e;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Cartouche de Référence */
        .ref-badge-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #c9a227;
            background-color: #fffdf7;
            border-radius: 3px;
            text-align: left;
        }
        .ref-badge-table td {
            padding: 2px 5px;
            font-size: 6pt;
            line-height: 1.2;
            color: #334155;
        }
        .ref-title {
            background-color: #581c1c;
            color: #ffffff !important;
            font-weight: bold;
            font-size: 5.8pt;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            text-align: center;
        }
        .ref-code {
            font-family: 'DejaVu Sans Mono', monospace, sans-serif;
            font-size: 6.5pt;
            font-weight: bold;
            color: #581c1c;
            border-bottom: 1px solid #f1e5c3;
        }
        .ref-meta {
            border-bottom: 1px solid #f8f1de;
        }
        .badge-convoc {
            display: inline-block;
            background-color: #991b1b;
            color: #ffffff;
            font-size: 5.8pt;
            font-weight: bold;
            padding: 1px 4px;
            border-radius: 2px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        /* Séparateur Royal Double Ligne */
        .royal-divider {
            margin: 2px 0 4px 0;
            border-top: 1.5px solid #581c1c;
            border-bottom: 1px solid #c9a227;
            height: 2px;
        }

        /* Titre */
        .title-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }
        .title-cell {
            background-color: #581c1c;
            border-top: 1.2px solid #c9a227;
            border-bottom: 1.2px solid #c9a227;
            color: #ffffff;
            text-align: center;
            padding: 4px 8px;
            border-radius: 3px;
        }
        .title-cell h1 {
            font-size: 10pt;
            font-weight: bold;
            letter-spacing: 0.8px;
            color: #ffffff;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.15;
        }
        .title-cell .ar-title {
            font-size: 11.5pt;
            font-weight: bold;
            color: #fde68a;
            margin: 1.5px 0 1px 0;
            letter-spacing: 0.2px;
        }
        .title-cell .sub-title {
            font-size: 6.2pt;
            font-weight: bold;
            color: #f1f5f9;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }

        /* Table Bordereau */
        .bordereau-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            margin-bottom: 6px;
        }
        .bordereau-table th {
            background-color: #f1f5f9;
            color: #581c1c;
            font-size: 6.4pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border: 1px solid #cbd5e1;
            padding: 3px 5px;
        }
        .bordereau-table td {
            border: 1px solid #e2e8f0;
            padding: 3px 5px;
            font-size: 6.8pt;
            vertical-align: middle;
        }

        /* Bento Grid Candidat */
        .dossier-box {
            border: 1.2px solid #cbd5e1;
            border-radius: 3px;
            background: #ffffff;
            margin-bottom: 5px;
        }
        .dossier-header-strip {
            background-color: #f1f5f9;
            border-bottom: 1px solid #cbd5e1;
            padding: 2px 7px;
            font-size: 6.2pt;
            font-weight: bold;
            color: #581c1c;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .dossier-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .dossier-cell {
            border-right: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            padding: 3px 7px;
            vertical-align: middle;
            background: #ffffff;
        }
        .dossier-cell:last-child {
            border-right: none;
        }
        .tile-label {
            font-size: 5.2pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            display: block;
            margin-bottom: 1px;
        }
        .tile-value-fr {
            font-size: 8.8pt;
            font-weight: bold;
            color: #0f172a;
            letter-spacing: 0.2px;
        }
        .tile-value-ar {
            font-size: 10pt;
            font-weight: bold;
            color: #581c1c;
            text-align: right;
            display: block;
        }
        .tile-val {
            font-size: 7.6pt;
            font-weight: bold;
            color: #1e293b;
        }
        .tile-val-mono {
            font-family: 'DejaVu Sans Mono', monospace, sans-serif;
            font-size: 8pt;
            font-weight: bold;
            color: #0f172a;
        }

        /* Section Bars & Content */
        .section-box {
            border: 1.2px solid #cbd5e1;
            border-radius: 3px;
            background-color: #ffffff;
            margin-bottom: 5px;
        }
        .section-header-strip {
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 2.5px 7px;
            font-size: 7pt;
            font-weight: bold;
            color: #581c1c;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .section-table {
            width: 100%;
            border-collapse: collapse;
        }
        .section-table td {
            padding: 2.5px 7px;
            font-size: 7.2pt;
            vertical-align: top;
            border-bottom: 1px solid #f1f5f9;
        }
        .section-table tr:last-child td {
            border-bottom: none;
        }
        .lbl-col {
            width: 27%;
            font-weight: bold;
            color: #475569;
        }
        .val-col {
            width: 73%;
            color: #0f172a;
        }

        /* Badges */
        .pill-infraction {
            background-color: #fef2f2;
            color: #991b1b;
            border: 1px solid #fecdd3;
            border-radius: 2px;
            padding: 1px 5px;
            font-weight: bold;
            font-size: 7.2pt;
            display: inline-block;
        }
        .pill-scelle {
            background-color: #fefce8;
            color: #854d0e;
            border: 1px solid #fef08a;
            border-radius: 2px;
            padding: 1px 4px;
            font-weight: bold;
            font-size: 6.5pt;
            display: inline-block;
        }

        /* Section 2 : Convocation Solennelle */
        .hearing-box {
            border: 1.5px solid #881337;
            border-left: 4px solid #881337;
            background-color: #fffbfb;
            border-radius: 3px;
            margin-bottom: 5px;
        }
        .hearing-header-strip {
            background-color: #fee2e2;
            border-bottom: 1px solid #fecdd3;
            padding: 3px 7px;
            font-size: 7.2pt;
            font-weight: bold;
            color: #881337;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .hearing-grid-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }
        .hearing-grid-cell {
            padding: 3.5px 7px;
            vertical-align: middle;
            border-right: 1px solid #fed7aa;
            border-bottom: 1px solid #fecdd3;
            background: #ffffff;
        }
        .hearing-grid-cell:last-child {
            border-right: none;
        }
        .hearing-metric-lbl {
            font-size: 5.2pt;
            font-weight: bold;
            color: #881337;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            display: block;
            margin-bottom: 1px;
        }
        .hearing-metric-val {
            font-size: 8.2pt;
            font-weight: bold;
            color: #450a0a;
        }
        .hearing-directive {
            padding: 3.5px 7px;
            font-size: 6.7pt;
            color: #334155;
            line-height: 1.28;
            background: #fff8f8;
        }

        /* Section 3 : Droits du Candidat */
        .legal-box {
            border: 1px solid #cbd5e1;
            border-left: 3.5px solid #581c1c;
            background-color: #f8fafc;
            border-radius: 2px;
            padding: 3.5px 7px;
            margin-bottom: 4px;
        }
        .legal-header {
            font-size: 6.6pt;
            font-weight: bold;
            color: #581c1c;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 2px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 1.5px;
        }
        .legal-content {
            font-size: 6.2pt;
            color: #334155;
            line-height: 1.25;
            text-align: justify;
        }
        .legal-content ul {
            margin: 1.5px 0 2px 11px;
            padding: 0;
        }
        .legal-content li {
            margin-bottom: 1px;
        }

        /* Signatures */
        .signatures-section {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1px;
            margin-bottom: 3px;
        }
        .signatures-section td {
            width: 50%;
            vertical-align: top;
            padding: 0 8px;
            text-align: center;
        }
        .date-city-line {
            text-align: right;
            font-size: 6.6pt;
            font-weight: bold;
            color: #475569;
            margin-bottom: 2px;
            padding-right: 6px;
        }
        .sign-role-title {
            font-size: 7.2pt;
            font-weight: bold;
            color: #581c1c;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 0.5px;
        }
        .sign-role-sub {
            font-size: 5.8pt;
            color: #64748b;
            margin-bottom: 1px;
        }
        .sign-image-wrapper {
            height: 38px;
            margin: 1px auto;
        }
        .sign-image-wrapper img {
            max-height: 36px;
            max-width: 100%;
            display: block;
            margin: 0 auto;
        }
        .sign-status-badge {
            font-size: 5.8pt;
            font-weight: bold;
            color: #475569;
            border-top: 1px dashed #cbd5e1;
            padding-top: 1.5px;
            display: inline-block;
            min-width: 130px;
        }

        /* Pied de Page Sécurisé & Sceau */
        .footer-seal-table {
            width: 100%;
            border-collapse: collapse;
            border-top: 1px solid #cbd5e1;
            padding-top: 3px;
            margin-top: 2px;
        }
        .footer-seal-table td {
            vertical-align: middle;
        }
        .hash-code {
            font-family: 'DejaVu Sans Mono', monospace, sans-serif;
            font-size: 5.2pt;
            color: #475569;
            line-height: 1.2;
        }
    </style>
</head>
<body>

    <!-- ========================================================= -->
    <!-- PAGE 1 : BORDEREAU D'ÉMARGEMENT ET DE REMISE OFFICIEL      -->
    <!-- ========================================================= -->
    <div class="page-container">

        <!-- En-tête Officiel -->
        <table class="header-table">
            <tr>
                <td style="width: 22%; text-align: left;">
                    @if(!empty($logoBase64))
                        <img src="{{ $logoBase64 }}" style="max-height: 50px; max-width: 100%; width: auto;" alt="Logo ENCG Fès">
                    @else
                        <strong style="color:#581c1c; font-size: 11pt;">ENCG FÈS</strong>
                    @endif
                </td>
                <td style="width: 53%; text-align: center;">
                    <div class="hdr-kingdom">ROYAUME DU MAROC</div>
                    <div class="hdr-ar-kingdom">{{ $arKingdom ?? 'المملكة المغربية' }}</div>
                    <div class="hdr-univ">Université Sidi Mohamed Ben Abdellah de Fès</div>
                    <div class="hdr-ar-univ">{{ $arUniv ?? 'جامعة سيدي محمد بن عبد الله - فاس' }}</div>
                    <div class="hdr-school">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                    <div class="hdr-ar-school">{{ $arSchool ?? 'المدرسة الوطنية للتجارة والتسيير بفاس' }}</div>
                    <div class="hdr-council">INSTANCE DISCIPLINAIRE DU CONSEIL DE DISCIPLINE</div>
                </td>
                <td style="width: 25%; text-align: right;">
                    <table class="ref-badge-table">
                        <tr>
                            <td class="ref-title" colspan="2">BORDEREAU OFFICIEL</td>
                        </tr>
                        <tr>
                            <td class="ref-code" colspan="2">ENCG/BR-CD-2026</td>
                        </tr>
                        <tr>
                            <td class="ref-meta"><strong>Date :</strong> {{ date('d/m/Y') }}</td>
                            <td class="ref-meta" style="text-align: right;"><strong>Total :</strong> {{ count($items) }}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="text-align: center; padding: 1.5px 3px;">
                                <span class="badge-convoc">ÉMARGEMENT</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="royal-divider"></div>

        <!-- Titre -->
        <table class="title-table">
            <tr>
                <td class="title-cell">
                    <h1>BORDEREAU RÉCAPITULATIF DES CONVOCATIONS &amp; ÉMARGEMENT</h1>
                    @if(!empty($arBatchTitle))
                        <div class="ar-title">{{ $arBatchTitle }}</div>
                    @endif
                    <div class="sub-title">Registre Officiel de Notification &amp; Remise des Convocations Disciplinaires</div>
                </td>
            </tr>
        </table>

        <div style="font-size: 6.8pt; color: #475569; margin-bottom: 4px; line-height: 1.25;">
            Le présent bordereau récapitule l'ensemble des convocations émises par le Conseil de Discipline. Les étudiants convoqués ou leurs représentants sont tenus d'émarger ci-dessous pour valoir notification légale conforme aux dispositions des articles 24 &amp; 25 de la Loi n° 01-00.
        </div>

        <!-- Tableau des Convocations du Lot -->
        <table class="bordereau-table">
            <thead>
                <tr>
                    <th style="width: 12%; text-align: center;">N° Dossier</th>
                    <th style="width: 28%;">Étudiant Poursuivi</th>
                    <th style="width: 18%;">CNE / Filière</th>
                    <th style="width: 22%;">Motif &amp; Épreuve</th>
                    <th style="width: 20%; text-align: center;">Émargement Réception</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                <tr>
                    <td style="text-align: center; font-family: monospace; font-weight: bold; color: #581c1c;">
                        CD-2026/{{ str_pad($item['incident']->id, 4, '0', STR_PAD_LEFT) }}
                    </td>
                    <td>
                        <strong>{{ strtoupper($item['fullNameFr']) }}</strong>
                        @if(!empty($item['fullNameAr']))
                            <div style="font-size: 7.2pt; color: #581c1c;">{{ $item['fullNameAr'] }}</div>
                        @endif
                    </td>
                    <td>
                        <div style="font-family: monospace; font-weight: bold;">{{ $item['cne'] }}</div>
                        <div style="font-size: 6pt; color: #64748b;">{{ $item['filiere'] }}</div>
                    </td>
                    <td>
                        <div style="color: #991b1b; font-weight: bold;">{{ $item['typeLabel'] }}</div>
                        <div style="font-size: 6pt; color: #475569;">{{ $item['module'] }}</div>
                    </td>
                    <td style="text-align: center; height: 26px; color: #94a3b8; font-style: italic; font-size: 6pt;">
                        _______________________
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Signatures Responsables -->
        <table class="signatures-section" style="margin-top: 6px;">
            <tr>
                <td>
                    <div class="sign-role-title">Le Secrétaire Général</div>
                    <div class="sign-role-sub">Secrétariat de Séance — ENCG Fès</div>
                    <div class="sign-image-wrapper">
                        @if(!empty($secretaireSignature))
                            <img src="{{ $secretaireSignature }}" alt="Visa SG">
                        @endif
                    </div>
                    <div class="sign-status-badge">Visa de Contrôle &amp; Remise</div>
                </td>
                <td>
                    <div class="sign-role-title">Le Directeur de l'ENCG de Fès</div>
                    <div class="sign-role-sub">Président du Conseil de Discipline</div>
                    <div class="sign-image-wrapper">
                        @if(!empty($directorSignature))
                            <img src="{{ $directorSignature }}" alt="Cachet et Signature Direction">
                        @endif
                    </div>
                    <div class="sign-status-badge">Approbation Institutionnelle</div>
                </td>
            </tr>
        </table>

        <!-- Footer Bordereau -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 3px; margin-top: 4px; font-size: 5.4pt; font-family: monospace; color: #64748b; text-align: center;">
            Sceau du Lot : {{ $batchSealHash ?? 'ENCG-BATCH-CD-2026' }} &bull; Généré le {{ $generatedAt ?? date('d/m/Y à H:i') }} &bull; Page 1 sur {{ count($items) + 1 }}
        </div>
    </div>

    <!-- ========================================================= -->
    <!-- PAGES 2..N : CONVOCATIONS INDIVIDUELLES A4 DE CHAQUE ÉTUDIANT -->
    <!-- ========================================================= -->
    @foreach($items as $idx => $item)
    <div class="page-break"></div>
    <div class="page-container">

        <!-- En-tête Officiel -->
        <table class="header-table">
            <tr>
                <td style="width: 22%; text-align: left;">
                    @if(!empty($logoBase64))
                        <img src="{{ $logoBase64 }}" style="max-height: 50px; max-width: 100%; width: auto;" alt="Logo ENCG Fès">
                    @else
                        <strong style="color:#581c1c; font-size: 11pt;">ENCG FÈS</strong>
                    @endif
                </td>
                <td style="width: 53%; text-align: center;">
                    <div class="hdr-kingdom">ROYAUME DU MAROC</div>
                    <div class="hdr-ar-kingdom">{{ $arKingdom ?? 'المملكة المغربية' }}</div>
                    <div class="hdr-univ">Université Sidi Mohamed Ben Abdellah de Fès</div>
                    <div class="hdr-ar-univ">{{ $arUniv ?? 'جامعة سيدي محمد بن عبد الله - فاس' }}</div>
                    <div class="hdr-school">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                    <div class="hdr-ar-school">{{ $arSchool ?? 'المدرسة الوطنية للتجارة والتسيير بفاس' }}</div>
                    <div class="hdr-council">INSTANCE DISCIPLINAIRE DU CONSEIL DE DISCIPLINE</div>
                </td>
                <td style="width: 25%; text-align: right;">
                    <table class="ref-badge-table">
                        <tr>
                            <td class="ref-title" colspan="2">RÉFÉRENCE OFFICIELLE</td>
                        </tr>
                        <tr>
                            <td class="ref-code" colspan="2">ENCG/CD-2026/{{ str_pad($item['incident']->id ?? 1, 4, '0', STR_PAD_LEFT) }}</td>
                        </tr>
                        <tr>
                            <td class="ref-meta"><strong>Date :</strong> {{ date('d/m/Y') }}</td>
                            <td class="ref-meta" style="text-align: right;"><strong>Dossier :</strong> #{{ $item['incident']->id ?? 1 }}</td>
                        </tr>
                        <tr>
                            <td colspan="2" style="text-align: center; padding: 1.5px 3px;">
                                <span class="badge-convoc">CONVOCATION</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>

        <div class="royal-divider"></div>

        <!-- Titre Officiel -->
        <table class="title-table">
            <tr>
                <td class="title-cell">
                    <h1>CONVOCATION DEVANT LE CONSEIL DE DISCIPLINE</h1>
                    @if(!empty($arDocTitle))
                        <div class="ar-title">{{ $arDocTitle }}</div>
                    @endif
                    <div class="sub-title">AUDITION CONTRADICTOIRE SOLENNELLE — APPLICATION DES ARTICLES 24 &amp; 25 DE LA LOI N° 01-00</div>
                </td>
            </tr>
        </table>

        <!-- Dossier Candidat -->
        <div class="dossier-box">
            <div class="dossier-header-strip">
                DOSSIER DU CANDIDAT CONVOQUÉ
            </div>
            <table class="dossier-table">
                <tr>
                    <td class="dossier-cell" style="width: 50%;">
                        <span class="tile-label">Nom &amp; Prénom du Candidat (Français)</span>
                        <span class="tile-value-fr">{{ strtoupper($item['fullNameFr']) }}</span>
                    </td>
                    <td class="dossier-cell" style="width: 50%; text-align: right;">
                        <span class="tile-label" style="text-align: right;">Nom &amp; Prénom (Arabe)</span>
                        <span class="tile-value-ar">{{ !empty($item['fullNameAr']) ? $item['fullNameAr'] : 'غير مسجل' }}</span>
                    </td>
                </tr>
            </table>
            <table class="dossier-table">
                <tr>
                    <td class="dossier-cell" style="width: 32%;">
                        <span class="tile-label">Code Massar / CNE</span>
                        <span class="tile-val-mono">{{ $item['cne'] }}</span>
                    </td>
                    <td class="dossier-cell" style="width: 38%;">
                        <span class="tile-label">Filière &amp; Niveau Académique</span>
                        <span class="tile-val" style="color: #854d0e;">{{ $item['filiere'] }}</span>
                    </td>
                    <td class="dossier-cell" style="width: 30%;">
                        <span class="tile-label">Année Universitaire</span>
                        <span class="tile-val">2025 / 2026</span>
                    </td>
                </tr>
                <tr>
                    <td class="dossier-cell" colspan="3" style="background: #fafaf9; border-bottom: none;">
                        <span class="tile-label">Statut de la Procédure</span>
                        <span class="tile-val" style="color: #991b1b; font-size: 7.2pt;">
                            ● Instance Ouverte — Convocation en Première Séance d'Audition Contradictoire
                        </span>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Section 1 : Constatations Préliminaires & Griefs -->
        <div class="section-box">
            <div class="section-header-strip">
                ■ 1. CONSTATATIONS PRÉLIMINAIRES &amp; GRIEFS RETENUS
            </div>
            <table class="section-table">
                <tr>
                    <td class="lbl-col">Épreuve / Module Concerné :</td>
                    <td class="val-col">
                        <strong>{{ $item['module'] }}</strong> &nbsp;
                        <span style="font-weight: normal; color: #64748b; font-size: 6.8pt;">(Session d'examen du {{ $item['examDate'] }})</span>
                    </td>
                </tr>
                <tr>
                    <td class="lbl-col">Nature du Grief Retenu :</td>
                    <td class="val-col">
                        <span class="pill-infraction">{{ $item['typeLabel'] }}</span>
                    </td>
                </tr>
                <tr>
                    <td class="lbl-col">Circonstances des Faits :</td>
                    <td class="val-col" style="text-align: justify; line-height: 1.26;">
                        {{ $item['description'] ?? 'Faits dûment constatés et consignés par les surveillants au Procès-Verbal officiel de surveillance de la salle d\'examen.' }}
                    </td>
                </tr>
                @if(!empty($item['confiscated']))
                <tr>
                    <td class="lbl-col">Saisie Matérielle &amp; Scellé :</td>
                    <td class="val-col">
                        <span class="pill-scelle">SCELLÉ N° CD-{{ str_pad($item['incident']->id, 4, '0', STR_PAD_LEFT) }}</span> &nbsp;
                        <strong style="color: #854d0e;">{{ $item['confiscated'] }}</strong> &nbsp;
                        <span style="font-size: 6.5pt; color: #64748b;">(Consigné au Secrétariat Général)</span>
                    </td>
                </tr>
                @endif
            </table>
        </div>

        <!-- Section 2 : Convocation Solennelle -->
        <div class="hearing-box">
            <div class="hearing-header-strip">
                ■ 2. DATE, HEURE ET LIEU DE COMPARUTION OBLIGATOIRE
            </div>
            <table class="hearing-grid-table">
                <tr>
                    <td class="hearing-grid-cell" style="width: 35%;">
                        <span class="hearing-metric-lbl">DATE &amp; HEURE DE SÉANCE</span>
                        <span class="hearing-metric-val">{{ $item['hearingDate'] }}</span>
                    </td>
                    <td class="hearing-grid-cell" style="width: 37%;">
                        <span class="hearing-metric-lbl">LIEU DE RÉUNION</span>
                        <span class="hearing-metric-val">{{ $item['hearingRoom'] }}</span>
                    </td>
                    <td class="hearing-grid-cell" style="width: 28%;">
                        <span class="hearing-metric-lbl">MODALITÉ DE SÉANCE</span>
                        <span class="hearing-metric-val" style="color: #881337; font-size: 7.6pt;">Présentielle Obligatoire</span>
                    </td>
                </tr>
            </table>
            <div class="hearing-directive">
                <strong>Ordre de comparution solennelle :</strong> Le candidat susnommé est formellement convoqué à comparaître en personne devant les membres du Conseil de Discipline statuant en formation juridictionnelle. Il devra se munir obligatoirement de la présente convocation ainsi que de sa carte d'étudiant ou de sa Carte Nationale d'Identité (CNIE).
            </div>
        </div>

        <!-- Section 3 : Droits du Candidat -->
        <div class="legal-box">
            <div class="legal-header">
                ■ 3. DROITS DU CANDIDAT &amp; DISPOSITIONS PROCÉDURALES RÉGLEMENTAIRES (LOI N° 01-00)
            </div>
            <div class="legal-content">
                En application des <strong>articles 24 et 25 de la Loi n° 01-00</strong> portant organisation de l'enseignement supérieur et du règlement intérieur des études de l'ENCG de Fès :
                <ul>
                    <li><strong>Droit d'accès au dossier :</strong> Possibilité de prendre connaissance de l'ensemble des pièces du dossier d'instruction auprès du Secrétariat Général avant la séance.</li>
                    <li><strong>Droit à l'assistance :</strong> Faculté de se faire assister par un représentant étudiant de votre choix issu de l'établissement ou par un tiers dûment mandaté.</li>
                    <li><strong>Débats contradictoires :</strong> Vous serez entendu(e) en vos explications et observations orales, et pourrez déposer tout mémoire écrit ou justificatif utile.</li>
                </ul>
                <strong style="color: #881337;">Avertissement solennel :</strong> En cas de non-comparution sans motif légitime d'empêchement dûment notifié et justifié au préalable, le Conseil de Discipline passera outre et délibérera valablement par décision réputée contradictoire.
            </div>
        </div>

        <div class="date-city-line">
            Fait à Fès, le {{ date('d/m/Y') }}
        </div>

        <!-- Signatures Officielles -->
        <table class="signatures-section">
            <tr>
                <td>
                    <div class="sign-role-title">Le Secrétaire Général</div>
                    <div class="sign-role-sub">Secrétariat de Séance — ENCG Fès</div>
                    <div class="sign-image-wrapper">
                        @if(!empty($secretaireSignature))
                            <img src="{{ $secretaireSignature }}" alt="Visa Secrétariat Général">
                        @endif
                    </div>
                    <div class="sign-status-badge">Visa &amp; Enregistrement au Registre</div>
                </td>
                <td>
                    <div class="sign-role-title">Le Directeur de l'ENCG de Fès</div>
                    <div class="sign-role-sub">Président du Conseil de Discipline</div>
                    <div class="sign-image-wrapper">
                        @if(!empty($directorSignature))
                            <img src="{{ $directorSignature }}" alt="Cachet et Signature Direction">
                        @endif
                    </div>
                    <div class="sign-status-badge">Cachet Officiel &amp; Signature Institutionnels</div>
                </td>
            </tr>
        </table>

        <!-- Pied de Page Sécurisé & Sceau -->
        <table class="footer-seal-table">
            <tr>
                <td style="width: 10%; text-align: left;">
                    @if(!empty($item['qrBase64']))
                        <img src="{{ $item['qrBase64'] }}" style="width: 38px; height: 38px; display: block; border: 1px solid #cbd5e1; padding: 1px;" alt="QR Code">
                    @endif
                </td>
                <td style="width: 90%; padding-left: 6px;">
                    <div class="hash-code">
                        <strong style="color: #581c1c;">AUTHENTIFICATION NUMÉRIQUE &amp; SCELLÉ DE SÉCURITÉ (SHA-256) :</strong><br>
                        {{ $item['sealHash'] ?? hash('sha256', 'ENCG-DISCIPLINE-'.($item['incident']->id ?? 1)) }}<br>
                        <span style="color: #64748b;">
                            Document disciplinaire officiel délivré par le Système Centralisé ENCG ERP • Page {{ $idx + 2 }} sur {{ count($items) + 1 }}.
                        </span>
                    </div>
                </td>
            </tr>
        </table>

    </div>
    @endforeach

</body>
</html>

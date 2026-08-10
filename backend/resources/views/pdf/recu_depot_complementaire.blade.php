<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>REÇU DE DÉPÔT COMPLÉMENTAIRE — ENCG FÈS</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 4mm 6mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #1e293b;
            background: #ffffff;
            font-size: 8.5pt;
            line-height: 1.2;
        }

        /* ── Page Outer Frame ── */
        .page-frame {
            width: 100%;
            height: 284mm;
            border: 2px solid #0f2863;
            border-collapse: collapse;
        }

        /* ── Half Container (Exemplaire) ── */
        .exemplaire-td {
            vertical-align: top;
            padding: 6px 10px 4px 10px;
            height: 137mm;
        }

        /* ── Cut Row Separator ── */
        .cut-td {
            height: 8mm;
            vertical-align: middle;
            background-color: #fafafa;
        }
        .cut-line-container {
            border-top: 1.5px dashed #94a3b8;
            border-bottom: 1.5px dashed #94a3b8;
            padding: 2px 0;
            text-align: center;
            background-color: #f1f5f9;
        }
        .cut-text {
            font-size: 6.5pt;
            font-weight: bold;
            color: #475569;
            letter-spacing: 2.5px;
            text-transform: uppercase;
        }

        /* ── Header Table ── */
        .hdr-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }
        .hdr-table td {
            vertical-align: middle;
        }
        .hdr-left {
            width: 35%;
            font-size: 6.5pt;
            font-weight: bold;
            color: #334155;
            line-height: 1.25;
        }
        .hdr-center {
            width: 30%;
            text-align: center;
        }
        .hdr-center .encg-brand {
            font-size: 9.5pt;
            font-weight: 900;
            color: #990000;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .hdr-right {
            width: 35%;
            text-align: right;
            font-size: 6.5pt;
            font-weight: bold;
            color: #0f2863;
            line-height: 1.25;
        }

        /* ── Title Box ── */
        .title-box {
            background-color: #0f2863;
            color: #ffffff;
            text-align: center;
            padding: 3px 6px;
            border-radius: 3px;
            margin-bottom: 4px;
        }
        .title-box h2 {
            font-size: 10.5pt;
            font-weight: 900;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            margin: 0;
        }
        .title-box .sub {
            font-size: 6pt;
            color: #cbd5e1;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            margin-top: 1px;
        }

        /* ── Meta Bar Table ── */
        .meta-table {
            width: 100%;
            border-collapse: collapse;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            margin-bottom: 4px;
        }
        .meta-table td {
            padding: 2.5px 6px;
            font-size: 7pt;
            border-right: 1px solid #e2e8f0;
        }
        .meta-table td:last-child {
            border-right: none;
        }
        .meta-lbl {
            color: #64748b;
            font-weight: bold;
            font-size: 6pt;
            text-transform: uppercase;
            display: block;
        }
        .meta-val {
            font-weight: 900;
            color: #0f2863;
            font-size: 7.5pt;
        }
        .meta-rec {
            font-family: monospace;
            color: #059669;
            font-size: 8pt;
            font-weight: 900;
        }

        /* ── Content Grid Table (2 Columns) ── */
        .grid-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }
        .grid-table td.col-cell {
            width: 49.5%;
            vertical-align: top;
        }
        .grid-table td.spacer-cell {
            width: 1%;
        }

        /* ── Card Box ── */
        .card-box {
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 4px;
            background-color: #ffffff;
            min-height: 54pt;
        }
        .card-box.blue-card { border-color: #93c5fd; }
        .card-box.green-card { border-color: #6ee7b7; }

        .card-header {
            padding: 2px 6px;
            font-size: 6.5pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .card-header.blue-hdr { background-color: #0f2863; color: #ffffff; }
        .card-header.green-hdr { background-color: #065f46; color: #ffffff; }

        .card-body {
            padding: 4px 6px;
        }

        /* ── Key-Value Data Rows ── */
        .kv-table {
            width: 100%;
            border-collapse: collapse;
        }
        .kv-table td {
            padding: 1.5px 0;
            font-size: 7pt;
        }
        .kv-label {
            color: #475569;
            font-weight: bold;
            width: 38%;
        }
        .kv-value {
            font-weight: 900;
            color: #0f2863;
            text-align: right;
        }
        .kv-value.cne-val { color: #059669; font-family: monospace; font-size: 7.5pt; }
        .kv-value.cin-val { color: #1e293b; font-family: monospace; }
        .kv-value.filiere-val { color: #6d28d9; font-size: 6.5pt; }

        /* ── Document Table ── */
        .doc-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7pt;
        }
        .doc-table thead td {
            background-color: #065f46;
            color: #ffffff;
            padding: 2.5px 5px;
            font-weight: bold;
            font-size: 6.5pt;
            text-transform: uppercase;
        }
        .doc-table tbody td {
            padding: 3.5px 5px;
            background-color: #f0fdf4;
            border-bottom: 1px solid #d1fae5;
        }
        .badge-remis {
            display: inline-block;
            background-color: #d1fae5;
            color: #065f46;
            font-size: 6.5pt;
            font-weight: 900;
            padding: 1.5px 6px;
            border-radius: 3px;
            border: 1px solid #a7f3d0;
            text-transform: uppercase;
        }

        /* ── Notices ── */
        .notice-box {
            background-color: #fffbeb;
            border: 1px dashed #f59e0b;
            border-radius: 3px;
            padding: 3px 6px;
            font-size: 6.5pt;
            color: #78350f;
            line-height: 1.35;
            min-height: 28pt;
        }
        .archive-box {
            background-color: #fef3c7;
            border: 1px dashed #d97706;
            border-radius: 3px;
            padding: 3px 6px;
            font-size: 6.5pt;
            color: #92400e;
            line-height: 1.35;
            min-height: 28pt;
        }

        /* ── Signatures Table ── */
        .sig-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 2px;
        }
        .sig-table td {
            width: 50%;
            vertical-align: top;
            padding: 0 4px;
            text-align: center;
        }
        .sig-box {
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            height: 19mm;
            background-color: #f8fafc;
            position: relative;
            margin-top: 2px;
        }
        .sig-label {
            position: absolute;
            bottom: 2px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 5.5pt;
            color: #94a3b8;
            font-style: italic;
        }
        .copy-badge {
            display: inline-block;
            font-size: 6pt;
            font-weight: 900;
            padding: 1px 7px;
            border-radius: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .copy-etud { background-color: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
        .copy-scol { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

        /* ── ENCG Footer Bar ── */
        .encg-footer-info {
            font-size: 5.5pt;
            color: #475569;
            text-align: center;
            border-top: 1px solid #cbd5e1;
            padding-top: 2px;
            margin-top: 3px;
            line-height: 1.25;
        }
    </style>
</head>
<body>

@php
    $logoB64  = $logoBase64 ?? '';
    $qrB64    = $qrBase64 ?? '';
    $sName    = strtoupper($studentName ?? 'ABEN HSSAIN SIHAM');
    $sCne     = $cne ?? 'M145092428';
    $sCin     = $cin ?? 'UB121643';
    $sFiliere = strtoupper($filiereName ?? 'DEUX ANNÉES PRÉPARATOIRES (TRONC COMMUN)');
    $docLbl   = $documentLabel ?? 'Extrait d\'Acte de Naissance Récent';
    $confNote = $conformiteNote ?? 'Original conforme — validité vérifiée';
    $obs      = $observations ?? 'Pièce reçue et enregistrée dans le dossier physique de l\'étudiant.';
    $recNum   = 'REC-' . date('Y') . '-' . strtoupper(substr($sCne, 0, 8));
    $today    = date('d/m/Y');
    $heure    = date('H:i');
@endphp

<table class="page-frame">

    {{-- ════════════════════════════════════════════════════════════════
         EXEMPLAIRE 1 — COPIE ÉTUDIANT(E)
         ════════════════════════════════════════════════════════════════ --}}
    <tr>
        <td class="exemplaire-td">

            <!-- Header Official Logos -->
            <table class="hdr-table">
                <tr>
                    <td class="hdr-left">
                        ROYAUME DU MAROC<br>
                        Ministère de l'Enseignement Supérieur,<br>
                        de la Recherche Scientifique et de l'Innovation
                    </td>
                    <td class="hdr-center">
                        @if(!empty($logoB64))
                            <img src="{{ $logoB64 }}" alt="Logo ENCG" style="height:32px; display:block; margin:0 auto 1px auto;">
                        @endif
                        <div class="encg-brand">ENCG FÈS</div>
                    </td>
                    <td class="hdr-right">
                        UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH DE FÈS<br>
                        ÉCOLE NATIONALE DE COMMERCE<br>ET DE GESTION DE FÈS
                    </td>
                </tr>
            </table>

            <!-- Title Banner -->
            <div class="title-box">
                <h2>REÇU DE DÉPÔT COMPLÉMENTAIRE</h2>
                <div class="sub">Document Officiel Certifié — Service des Affaires Estudiantines — Année 2026-2027</div>
            </div>

            <!-- Metadata Bar -->
            <table class="meta-table">
                <tr>
                    <td style="width:33%;">
                        <span class="meta-lbl">N° Reçu Officiel</span>
                        <span class="meta-rec">{{ $recNum }}</span>
                    </td>
                    <td style="width:34%; text-align:center;">
                        <span class="meta-lbl">Date &amp; Heure de Dépôt</span>
                        <span class="meta-val">{{ $today }} &nbsp;à&nbsp; {{ $heure }}</span>
                    </td>
                    <td style="width:33%; text-align:right;">
                        <span class="meta-lbl">Guichet Émission</span>
                        <span class="meta-val">Scolarité — ENCG Fès</span>
                    </td>
                </tr>
            </table>

            <!-- Content 2 Columns -->
            <table class="grid-table">
                <tr>
                    <!-- Left: Identity & Notice -->
                    <td class="col-cell">
                        <div class="card-box blue-card">
                            <div class="card-header blue-hdr">I. Identité de l'Étudiant(e)</div>
                            <div class="card-body">
                                <table class="kv-table">
                                    <tr>
                                        <td class="kv-label">Nom &amp; Prénom :</td>
                                        <td class="kv-value">{{ $sName }}</td>
                                    </tr>
                                    <tr>
                                        <td class="kv-label">CNE / Massar :</td>
                                        <td class="kv-value cne-val">{{ $sCne }}</td>
                                    </tr>
                                    <tr>
                                        <td class="kv-label">CNIE :</td>
                                        <td class="kv-value cin-val">{{ $sCin }}</td>
                                    </tr>
                                    <tr>
                                        <td class="kv-label">Filière :</td>
                                        <td class="kv-value filiere-val">{{ $sFiliere }}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>

                        <div class="notice-box">
                            <strong>Notice :</strong> Ce reçu atteste la remise physique du document au Service de Scolarité. Il est valable en complément du récépissé d'inscription initial. Conservez-le précieusement.
                        </div>
                    </td>

                    <td class="spacer-cell"></td>

                    <!-- Right: Document Deposit Details -->
                    <td class="col-cell">
                        <div class="card-box green-card">
                            <div class="card-header green-hdr">II. Pièce Remise en Complément</div>
                            <div class="card-body" style="padding: 3px 5px;">
                                <table class="doc-table">
                                    <thead>
                                        <tr>
                                            <td style="width: 56%;">Intitulé du Document</td>
                                            <td style="width: 22%; text-align: center;">Statut</td>
                                            <td style="width: 22%; text-align: center;">Conformité</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style="font-weight: bold; color: #1e293b;">{{ $docLbl }}</td>
                                            <td style="text-align: center;"><span class="badge-remis">REMIS</span></td>
                                            <td style="text-align: center; color: #059669; font-weight: bold; font-size: 6pt;">{{ $confNote }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div style="margin-top: 4px; font-size: 6.5pt; color: #065f46; font-weight: bold; padding-top: 2px; border-top: 1px dashed #a7f3d0;">
                                    Obs. : {{ $obs }}
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Signatures Section -->
            <table class="sig-table">
                <tr>
                    <td style="text-align: left; padding-bottom: 2px;">
                        <span class="copy-badge copy-etud">VOLET ÉTUDIANT(E)</span>
                    </td>
                    <td style="text-align: right; padding-bottom: 2px;">
                        <span style="font-size: 6.5pt; font-weight: bold; color: #475569;">Fait à Fès, le {{ $today }}</span>
                    </td>
                </tr>
                <tr>
                    <td style="vertical-align: top; padding-right: 4px;">
                        <strong style="font-size: 7.5pt; color: #0f2863; display: block; text-align: center; height: 12pt;">Signature &amp; Empreinte de l'Étudiant(e)</strong>
                        <div class="sig-box">
                            <div class="sig-label">Lu et approuvé — Signature manuscrite obligatoire</div>
                        </div>
                    </td>
                    <td style="vertical-align: top; padding-left: 4px;">
                        <strong style="font-size: 7.5pt; color: #0f2863; display: block; text-align: center; height: 12pt;">Cachet &amp; Signature Agent Scolarité</strong>
                        <div class="sig-box">
                            <div class="sig-label">Cachet officiel du Service de Scolarité — ENCG Fès</div>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- ENCG Institutional Footer -->
            <div class="encg-footer-info">
                École Nationale de Commerce et de Gestion de Fès - Route d'Imouzzer, B.P. 1255, Fès - Maroc<br>
                Tél: +212 5 35 64 49 20 | Email: contact@encg-fes.ac.ma | Web: www.encg-fes.ac.ma
            </div>

        </td>
    </tr>

    {{-- ════════════════════════════════════════════════════════════════
         CUT LINE SEPARATOR
         ════════════════════════════════════════════════════════════════ --}}
    <tr>
        <td class="cut-td">
            <div class="cut-line-container">
                <span class="cut-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.47" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
                    COUPER ICI &mdash; EXEMPLAIRE RÉSERVÉ AU SERVICE DE SCOLARITÉ
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-left: 4px;"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.47" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
                </span>
            </div>
        </td>
    </tr>

    {{-- ════════════════════════════════════════════════════════════════
         EXEMPLAIRE 2 — COPIE SERVICE SCOLARITÉ
         ════════════════════════════════════════════════════════════════ --}}
    <tr>
        <td class="exemplaire-td">

            <!-- Header Official Logos -->
            <table class="hdr-table">
                <tr>
                    <td class="hdr-left">
                        ROYAUME DU MAROC<br>
                        Ministère de l'Enseignement Supérieur,<br>
                        de la Recherche Scientifique et de l'Innovation
                    </td>
                    <td class="hdr-center">
                        @if(!empty($logoB64))
                            <img src="{{ $logoB64 }}" alt="Logo ENCG" style="height:32px; display:block; margin:0 auto 1px auto;">
                        @endif
                        <div class="encg-brand">ENCG FÈS</div>
                    </td>
                    <td class="hdr-right">
                        UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH DE FÈS<br>
                        ÉCOLE NATIONALE DE COMMERCE<br>ET DE GESTION DE FÈS
                    </td>
                </tr>
            </table>

            <!-- Title Banner -->
            <div class="title-box">
                <h2>REÇU DE DÉPÔT COMPLÉMENTAIRE</h2>
                <div class="sub">Copie Service Scolarité — À Conserver au Dossier Physique — Année 2026-2027</div>
            </div>

            <!-- Metadata Bar -->
            <table class="meta-table">
                <tr>
                    <td style="width:33%;">
                        <span class="meta-lbl">N° Reçu Officiel</span>
                        <span class="meta-rec">{{ $recNum }}</span>
                    </td>
                    <td style="width:34%; text-align:center;">
                        <span class="meta-lbl">Date &amp; Heure de Dépôt</span>
                        <span class="meta-val">{{ $today }} &nbsp;à&nbsp; {{ $heure }}</span>
                    </td>
                    <td style="width:33%; text-align:right;">
                        <span class="meta-lbl">Code CNE / Massar</span>
                        <span class="meta-rec">{{ $sCne }}</span>
                    </td>
                </tr>
            </table>

            <!-- Content 2 Columns -->
            <table class="grid-table">
                <tr>
                    <!-- Left: Identity & QR Anti-Fraude -->
                    <td class="col-cell">
                        <div class="card-box blue-card">
                            <div class="card-header blue-hdr">I. Identité de l'Étudiant(e)</div>
                            <div class="card-body">
                                <table class="kv-table">
                                    <tr>
                                        <td class="kv-label">Nom &amp; Prénom :</td>
                                        <td class="kv-value">{{ $sName }}</td>
                                    </tr>
                                    <tr>
                                        <td class="kv-label">CNE / Massar :</td>
                                        <td class="kv-value cne-val">{{ $sCne }}</td>
                                    </tr>
                                    <tr>
                                        <td class="kv-label">CNIE :</td>
                                        <td class="kv-value cin-val">{{ $sCin }}</td>
                                    </tr>
                                    <tr>
                                        <td class="kv-label">Filière :</td>
                                        <td class="kv-value filiere-val">{{ $sFiliere }}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>

                        @if(!empty($qrB64))
                        <div style="border: 1px solid #e2e8f0; border-radius: 3px; padding: 2px 4px; background-color: #f8fafc; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="35%" style="text-align: center; vertical-align: middle;">
                                        <img src="{{ $qrB64 }}" style="width:36px; height:36px; display:inline-block;">
                                    </td>
                                    <td width="65%" style="text-align: left; vertical-align: middle; font-size: 6pt; color: #475569;">
                                        <strong style="color: #0f2863; font-size: 6.5pt;">Vérification Anti-Fraude</strong><br>
                                        Généré par l'ERP ENCG Fès<br>
                                        Réf: {{ $recNum }}-{{ date('YmdHi') }}
                                    </td>
                                </tr>
                            </table>
                        </div>
                        @endif
                    </td>

                    <td class="spacer-cell"></td>

                    <!-- Right: Document Deposit Details & Archive Note -->
                    <td class="col-cell">
                        <div class="card-box green-card">
                            <div class="card-header green-hdr">II. Pièce Remise en Complément</div>
                            <div class="card-body" style="padding: 3px 5px;">
                                <table class="doc-table">
                                    <thead>
                                        <tr>
                                            <td style="width: 56%;">Intitulé du Document</td>
                                            <td style="width: 22%; text-align: center;">Statut</td>
                                            <td style="width: 22%; text-align: center;">Conformité</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style="font-weight: bold; color: #1e293b;">{{ $docLbl }}</td>
                                            <td style="text-align: center;"><span class="badge-remis">REMIS</span></td>
                                            <td style="text-align: center; color: #059669; font-weight: bold; font-size: 6pt;">{{ $confNote }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div style="margin-top: 4px; font-size: 6.5pt; color: #065f46; font-weight: bold; padding-top: 2px; border-top: 1px dashed #a7f3d0;">
                                    Obs. : {{ $obs }}
                                </div>
                            </div>
                        </div>

                        <div class="archive-box">
                            <strong style="color: #0f2863;">Usage interne :</strong> Ce volet doit être obligatoirement classé dans le dossier physique de l'étudiant aux archives du Service de Scolarité de l'ENCG Fès.
                        </div>
                    </td>
                </tr>
            </table>

            <!-- Signatures Section -->
            <table class="sig-table">
                <tr>
                    <td style="text-align: left; padding-bottom: 2px;">
                        <span class="copy-badge copy-scol">VOLET SCOLARITÉ</span>
                    </td>
                    <td style="text-align: right; padding-bottom: 2px;">
                        <span style="font-size: 6.5pt; font-weight: bold; color: #475569;">Fait à Fès, le {{ $today }}</span>
                    </td>
                </tr>
                <tr>
                    <td style="vertical-align: top; padding-right: 4px;">
                        <strong style="font-size: 7.5pt; color: #0f2863; display: block; text-align: center; height: 12pt;">Signature de l'Étudiant(e) (Reconnaissance)</strong>
                        <div class="sig-box">
                            <div class="sig-label">Lu et approuvé — Signature manuscrite obligatoire</div>
                        </div>
                    </td>
                    <td style="vertical-align: top; padding-left: 4px;">
                        <strong style="font-size: 7.5pt; color: #0f2863; display: block; text-align: center; height: 12pt;">Cachet &amp; Signature Agent Scolarité (Archivage)</strong>
                        <div class="sig-box">
                            <div class="sig-label">Pour le Directeur — Chef du Service de Scolarité — ENCG Fès</div>
                        </div>
                    </td>
                </tr>
            </table>

            <!-- ENCG Institutional Footer -->
            <div class="encg-footer-info">
                École Nationale de Commerce et de Gestion de Fès - Route d'Imouzzer, B.P. 1255, Fès - Maroc<br>
                Tél: +212 5 35 64 49 20 | Email: contact@encg-fes.ac.ma | Web: www.encg-fes.ac.ma
            </div>

        </td>
    </tr>

</table>

</body>
</html>

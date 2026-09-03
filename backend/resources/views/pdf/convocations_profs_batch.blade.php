<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta charset="UTF-8">
    <title>Ordre de Mission & Convocation de Surveillance — ENCG Fès</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
        }

        body {
            font-family: 'DejaVu Sans', Arial, Helvetica, sans-serif;
            font-size: 8.5pt;
            color: #1e293b;
            background: #fff;
            line-height: 1.4;
        }

        .page-break { page-break-after: always; }

        .page-frame {
            border: 2px solid #0f2863;
            outline: 1px solid #94a3b8;
            outline-offset: -4px;
            padding: 7mm 7mm 6mm 7mm;
            min-height: 275mm;
            position: relative;
        }

        .page-shell {
            width: 100%;
            border-collapse: collapse;
        }
        .page-shell td { vertical-align: top; }

        /* ── BANNER TITLE ── */
        .title-banner {
            background: #0f2863;
            color: #ffffff;
            text-align: center;
            padding: 8px 12px;
            margin: 6px 0 8px 0;
            border-radius: 3px;
        }
        .title-main {
            font-size: 11.5pt;
            font-weight: bold;
            letter-spacing: 1.2px;
            text-transform: uppercase;
        }
        .title-sub {
            font-size: 8pt;
            margin-top: 3px;
            color: #cbd5e1;
            font-weight: 500;
        }
        .session-badge {
            display: inline-block;
            margin-top: 4px;
            background: #b45309;
            color: #ffffff;
            font-size: 7pt;
            font-weight: bold;
            padding: 2px 10px;
            letter-spacing: 0.8px;
            text-transform: uppercase;
            border-radius: 2px;
        }

        /* ── PROFESSOR INFO CARD ── */
        .info-card {
            border: 1.5px solid #cbd5e1;
            background: #ffffff;
            margin-bottom: 8px;
            width: 100%;
            border-collapse: collapse;
        }
        .info-card-header {
            background: #f1f5f9;
            border-bottom: 1.5px solid #cbd5e1;
            padding: 4px 10px;
            font-size: 7.5pt;
            font-weight: bold;
            color: #0f2863;
            text-transform: uppercase;
            letter-spacing: 0.6px;
        }
        .info-card-body {
            width: 100%;
            border-collapse: collapse;
        }
        .info-card-body td {
            vertical-align: top;
            width: 50%;
            padding: 6px 10px;
        }
        .info-card-body td:first-child {
            border-right: 1px solid #e2e8f0;
        }
        .info-row {
            margin-bottom: 5px;
        }
        .info-label {
            font-size: 6.5pt;
            color: #64748b;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.4px;
            display: block;
            margin-bottom: 1px;
        }
        .info-val {
            font-size: 8.5pt;
            font-weight: bold;
            color: #0f172a;
        }
        .info-val.highlight {
            font-size: 10.5pt;
            color: #0f2863;
            text-transform: uppercase;
        }

        /* ── MISSION MANDATE ── */
        .mission-mandate {
            background: #f8fafc;
            border-left: 3px solid #0f2863;
            border-right: 1px solid #e2e8f0;
            border-top: 1px solid #e2e8f0;
            border-bottom: 1px solid #e2e8f0;
            padding: 6px 10px;
            font-size: 7.5pt;
            color: #1e293b;
            line-height: 1.45;
            margin-bottom: 8px;
            text-align: justify;
        }

        /* ── SECTION HEADINGS ── */
        .section-heading {
            font-size: 8pt;
            font-weight: bold;
            color: #0f2863;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin: 6px 0 3px 0;
            padding-left: 6px;
            border-left: 3px solid #b45309;
        }

        /* ── TIMETABLE ── */
        table.exam-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 8pt;
            table-layout: fixed;
        }
        .exam-table thead tr {
            background: #0f2863;
            color: #ffffff;
        }
        .exam-table th {
            padding: 5px 6px;
            text-align: center;
            font-size: 7.5pt;
            font-weight: bold;
            text-transform: uppercase;
            border: 1px solid #0f2863;
            letter-spacing: 0.4px;
        }
        .exam-table td {
            padding: 6px 6px;
            border: 1px solid #cbd5e1;
            text-align: center;
            vertical-align: middle;
        }
        .exam-table tbody tr:nth-child(even) {
            background: #f8fafc;
        }
        .exam-table td.date-cell {
            font-weight: bold;
            color: #0f2863;
            font-size: 8pt;
        }
        .exam-table td.time-cell {
            background: #eff6ff;
            font-weight: bold;
            color: #1d4ed8;
            font-size: 8pt;
        }
        .exam-table td.module-cell {
            text-align: left;
            font-weight: bold;
            color: #0f172a;
            font-size: 8.5pt;
            padding-left: 8px;
        }
        .exam-table td.room-cell {
            font-weight: bold;
            color: #0f2863;
            font-size: 8.5pt;
        }
        .exam-table th.col-role {
            width: 21%;
            font-size: 6.8pt;
            padding: 4px 2px;
            line-height: 1.2;
        }
        .exam-table td.role-cell {
            padding: 3px 2px;
            text-align: center;
            vertical-align: middle;
        }
        .role-stack {
            width: 100%;
            margin: 0 auto;
            border-collapse: collapse;
        }
        .role-stack td {
            border: none;
            padding: 0;
            text-align: center;
            vertical-align: middle;
        }
        .role-kind {
            font-size: 5.4pt;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.25px;
            line-height: 1.1;
            padding-bottom: 1px;
        }
        .role-title {
            display: inline-block;
            font-size: 6.2pt;
            font-weight: bold;
            padding: 1px 4px;
            border-radius: 2px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            line-height: 1.2;
        }
        .role-title.principal {
            background: #0f2863;
            color: #ffffff;
        }
        .role-title.secondaire {
            background: #f8fafc;
            color: #334155;
            border: 1px solid #94a3b8;
        }

        /* ── CHARTE DE SURVEILLANCE BOX ── */
        .charte-box {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            padding: 6px 10px 6px 10px;
            margin-bottom: 8px;
            border-radius: 2px;
        }
        .charte-item {
            font-size: 7pt;
            color: #334155;
            line-height: 1.45;
            margin-bottom: 3px;
            text-align: justify;
        }
        .charte-item:last-child {
            margin-bottom: 0;
        }
        .charte-num {
            font-weight: bold;
            color: #0f2863;
        }

        /* ── SIGNATURE & FOOTER BLOCK ── */
        .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            border-top: 1.5px solid #0f2863;
            padding-top: 6px;
        }
        .footer-table td {
            vertical-align: top;
        }
        .footer-left {
            width: 58%;
            padding-right: 12px;
        }
        .footer-right {
            width: 42%;
            text-align: center;
        }

        .meta-text {
            font-size: 6.5pt;
            color: #64748b;
            line-height: 1.5;
        }
        .meta-bold {
            font-weight: bold;
            color: #334155;
        }
        .auth-stamp {
            display: inline-block;
            border: 1px solid #16a34a;
            color: #15803d;
            background: #f0fdf4;
            font-size: 6.5pt;
            font-weight: bold;
            padding: 2px 8px;
            text-transform: uppercase;
            margin-top: 4px;
            letter-spacing: 0.5px;
            border-radius: 2px;
        }

        .sign-title {
            font-size: 8pt;
            font-weight: bold;
            color: #0f2863;
        }
        .sign-subtitle {
            font-size: 6.5pt;
            color: #64748b;
            font-style: italic;
            margin-bottom: 6px;
        }
        .sign-placeholder {
            height: 38px;
            margin: 4px auto;
            border-bottom: 1px dashed #94a3b8;
            width: 80%;
        }
        .sign-mention {
            font-size: 6pt;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .qr-section {
            margin-top: 4px;
            text-align: left;
        }
        .qr-section img {
            border: 1px solid #0f2863;
            padding: 2px;
            background: #fff;
            width: 50px;
            height: 50px;
            display: inline-block;
            vertical-align: middle;
        }
        .qr-caption {
            display: inline-block;
            vertical-align: middle;
            font-size: 6pt;
            color: #64748b;
            margin-left: 6px;
            line-height: 1.35;
        }

        .bottom-bar {
            border-top: 0.5px solid #cbd5e1;
            margin-top: 8px;
            padding-top: 3px;
            text-align: center;
            font-size: 6pt;
            color: #64748b;
        }
    </style>
</head>
<body>
@foreach($professorsData as $index => $data)
@php
    $academicYear = $data['academic_year'] ?? '2025 — 2026';
    $generatedAt = $data['generated_at'] ?? now()->format('d/m/Y à H:i');
@endphp

<div class="page-frame">
<table class="page-shell" cellpadding="0" cellspacing="0">
<tr>
<td>

    {{-- HEADER OFFICIEL --}}
    @include('pdf.encg-header')

    {{-- BANNER TITLE --}}
    <div class="title-banner">
        <div class="title-main">Ordre de Mission & Convocation de Surveillance</div>
        <div class="title-sub">{{ $data['session_name'] ?? 'Session d\'Examens Universitaires' }}</div>
        <span class="session-badge">Session : {{ strtoupper($data['session_type'] ?? 'Normale') }}</span>
    </div>

    {{-- PROFESSOR DETAILS CARD --}}
    <table class="info-card" cellpadding="0" cellspacing="0">
        <tr>
            <td class="info-card-header">
                Identification de l'Enseignant-Chercheur / Surveillant
            </td>
        </tr>
        <tr>
            <td>
                <table class="info-card-body" cellpadding="0" cellspacing="0">
                    <tr>
                        <td>
                            <div class="info-row">
                                <span class="info-label">Nom et Prénom de l'Enseignant</span>
                                <span class="info-val highlight">Pr. {{ strtoupper($data['person_name'] ?? '') }}</span>
                            </div>
                            <div class="info-row" style="margin-bottom:0;">
                                <span class="info-label">Identifiant National / CIN</span>
                                <span class="info-val">{{ strtoupper($data['person_id'] ?? 'ENCG-ENS') }}</span>
                            </div>
                        </td>
                        <td>
                            <div class="info-row">
                                <span class="info-label">Département & Établissement</span>
                                <span class="info-val">{{ $data['department_label'] ?? ($data['filiere_name'] ?? 'Corps Professoral — ENCG Fès') }}</span>
                            </div>
                            <div class="info-row" style="margin-bottom:0;">
                                <span class="info-label">Année Universitaire</span>
                                <span class="info-val">{{ $academicYear }}</span>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- MISSION MANDATE --}}
    <div class="mission-mandate">
        Conformément aux dispositions régissant l'organisation des examens et le contrôle des connaissances à l'École Nationale de Commerce et de Gestion de Fès, vous êtes officiellement chargé(e) d'assurer la surveillance et le bon déroulement des épreuves d'examens selon le planning ci-après :
    </div>

    {{-- PLANNING DES SÉANCES --}}
    <div class="section-heading">Planning Officiel des Séances de Surveillance</div>
    <table class="exam-table" cellpadding="0" cellspacing="0">
        <colgroup>
            <col style="width:15%">
            <col style="width:14%">
            <col style="width:32%">
            <col style="width:18%">
            <col style="width:21%">
        </colgroup>
        <thead>
            <tr>
                <th style="width:15%">Date</th>
                <th style="width:14%">Horaire</th>
                <th style="width:32%">Matière / Épreuve</th>
                <th style="width:18%">Lieu / Salle</th>
                <th class="col-role" style="width:21%">Rôle / Mission</th>
            </tr>
        </thead>
        <tbody>
            @forelse($data['exams'] as $exam)
                @php
                    $roleStr = (string) ($exam['role'] ?? 'Surveillant');
                    $isPrincipal = stripos($roleStr, 'Principal') !== false;
                @endphp
                <tr>
                    <td class="date-cell">{{ $exam['date'] ?? '—' }}</td>
                    <td class="time-cell">{{ $exam['time'] ?? '—' }}</td>
                    <td class="module-cell">{{ $exam['module'] ?? '—' }}</td>
                    <td class="room-cell">{{ $exam['room'] ?? '—' }}</td>
                    <td class="role-cell">
                        <table class="role-stack" cellpadding="0" cellspacing="0">
                            <tr>
                                <td class="role-kind">Surveillant</td>
                            </tr>
                            <tr>
                                <td>
                                    @if($isPrincipal)
                                        <span class="role-title principal">Principal</span>
                                    @else
                                        <span class="role-title secondaire">Adjoint</span>
                                    @endif
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="padding: 10px; color: #64748b; font-style: italic;">
                        Aucune séance de surveillance n'est programmée pour cette session.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    {{-- CHARTE OFFICIELLE DE SURVEILLANCE --}}
    <div class="section-heading">Consignes et Charte de Surveillance des Examens</div>
    <div class="charte-box">
        <div class="charte-item">
            <span class="charte-num">1. Ponctualité & Installation :</span> La présence en salle est impérative <strong>15 minutes avant</strong> le début de l'épreuve pour vérifier l'état des lieux, faire asseoir les candidats selon le plan d'affichage et distribuer les sujets.
        </div>
        <div class="charte-item">
            <span class="charte-num">2. Contrôle de Présence & Émargement :</span> Le contrôle rigoureux de la Carte d'Étudiant ou de la CIN est obligatoire. Chaque étudiant doit émarger individuellement sur la feuille d'émargement officielle de la salle.
        </div>
        <div class="charte-item">
            <span class="charte-num">3. Appareils Électroniques :</span> L'usage des smartphones, montres connectées et écouteurs est strictement prohibé. Ils doivent être éteints et déposés à l'estrade dès l'entrée en salle.
        </div>
        <div class="charte-item">
            <span class="charte-num">4. Gestion des Fraudes :</span> En cas de tentative ou de flagrant délit de fraude, le surveillant principal dresse immédiatement un Procès-Verbal (PV) signé par les surveillants avec saisie des éléments matériels.
        </div>
        <div class="charte-item">
            <span class="charte-num">5. Clôture & Remise des Copies :</span> À la fin de l'épreuve, les copies sont comptées, classées et remises sous pli fermé au Bureau des Examens contre décharge dûment signée.
        </div>
    </div>

    {{-- FOOTER / SIGNATURES & VERIFICATION ELECTRONIQUE --}}
    <table class="footer-table" cellpadding="0" cellspacing="0" style="width: 100%; border-top: 1.5px solid #0f2863; padding-top: 6px; margin-top: 6px;">
        <tr>
            <td style="width: 58%; vertical-align: top;">
                <table cellpadding="0" cellspacing="0" style="width: 100%;">
                    <tr>
                        <td style="width: 72px; vertical-align: middle;">
                            @if(!empty($data['qrCodeBase64']))
                                <img src="{{ $data['qrCodeBase64'] }}" alt="QR Code" style="width: 65px; height: 65px; border: 1.5px solid #0f2863; padding: 2px; background: #ffffff; border-radius: 3px;">
                            @endif
                        </td>
                        <td style="padding-left: 8px; vertical-align: middle;">
                            <div style="font-size: 7pt; color: #0f2863; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                                Vérification Électronique Officielle
                            </div>
                            <div style="font-size: 6pt; color: #64748b; margin-top: 2px; line-height: 1.35;">
                                Fait à Fès, le <strong style="color: #1e293b;">{{ now()->format('d/m/Y') }}</strong><br>
                                Réf. Sécurité : <span style="font-family: monospace; font-weight: bold; color: #0f2863;">{{ substr(md5(($data['qr_token'] ?? $data['id'] ?? 'ENCG').$academicYear), 0, 16) }}</span><br>
                                Scannez le QR Code pour valider l'authenticité sur le portail ENCG.
                            </div>
                            <div style="margin-top: 4px;">
                                <span style="border: 1px solid #16a34a; color: #15803d; background: #f0fdf4; font-size: 5.8pt; font-weight: bold; padding: 1.5px 6px; text-transform: uppercase; border-radius: 2px;">
                                    ✓ Document Certifié Conforme — ENCG Fès
                                </span>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
            <td style="width: 42%; vertical-align: top; text-align: center;">
                <div style="font-size: 7.8pt; font-weight: bold; color: #0f2863;">Pour le Directeur de l'ENCG Fès</div>
                <div style="font-size: 6.2pt; color: #64748b; font-style: italic; margin-top: 1px;">Le Directeur Adjoint chargé des Affaires Pédagogiques</div>
                <div style="height: 38px; margin: 4px auto; border-bottom: 1px dashed #94a3b8; width: 75%;"></div>
                <div style="font-size: 5.8pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;">Cachet Officiel et Signature Numérique</div>
            </td>
        </tr>
    </table>

    {{-- BOTTOM LEGAL BAR --}}
    <div class="bottom-bar">
        École Nationale de Commerce et de Gestion de Fès — Route d'Imouzzer, B.P. 1255, Fès — Tél : +212 5 35 64 49 20 | https://encg-fes.ac.ma
    </div>

</td>
</tr>
</table>
</div>

@if(!$loop->last)
    <div class="page-break"></div>
@endif
@endforeach

</body>
</html>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>PV de Délibération - {{ $module->code }}</title>
    @php
        $rowCount = count($students);
        if ($rowCount <= 20) {
            $tbPad = '3.5px 5px';
            $tbFont = '8.2px';
            $thFont = '8px';
            $sigH = '42px';
            $sigImgH = '38px';
            $pageMargin = '5mm 6mm 4mm 6mm';
        } elseif ($rowCount <= 26) {
            $tbPad = '2.2px 3.5px';
            $tbFont = '7.8px';
            $thFont = '7.5px';
            $sigH = '34px';
            $sigImgH = '30px';
            $pageMargin = '4mm 6mm 3mm 6mm';
        } elseif ($rowCount <= 32) {
            $tbPad = '1.8px 3px';
            $tbFont = '7.2px';
            $thFont = '7px';
            $sigH = '28px';
            $sigImgH = '24px';
            $pageMargin = '3mm 5mm 3mm 5mm';
        } else {
            $tbPad = '3.5px 5px';
            $tbFont = '8px';
            $thFont = '7.5px';
            $sigH = '36px';
            $sigImgH = '32px';
            $pageMargin = '5mm 6mm 4mm 6mm';
        }
    @endphp
    <style>
        @page {
            size: A4 portrait;
            margin: {{ $pageMargin }};
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', 'Helvetica', 'Arial', sans-serif;
            font-size: 8px;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            line-height: 1.15;
        }
        .institution-header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 3px;
        }
        .institution-header-table td {
            vertical-align: middle;
        }
        .inst-logo-cell {
            width: 28%;
            text-align: left;
            vertical-align: middle;
        }
        .inst-logo-img {
            max-height: 38px;
            max-width: 160px;
            width: auto;
            display: block;
        }
        .inst-center-cell {
            width: 46%;
            text-align: center;
            vertical-align: middle;
            line-height: 1.15;
        }
        .state-kingdom {
            font-size: 9.5pt;
            font-weight: 900;
            color: #001A4B;
            letter-spacing: 0.8px;
            text-transform: uppercase;
        }
        .state-ministry {
            font-size: 6.5pt;
            color: #475569;
            margin-top: 1px;
        }
        .state-univ {
            font-size: 7.5pt;
            font-weight: 700;
            color: #1e293b;
            margin-top: 1px;
        }
        .state-school {
            font-size: 8pt;
            font-weight: 900;
            color: #001A4B;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            margin-top: 1px;
        }
        .state-service {
            font-size: 6.8pt;
            font-weight: bold;
            color: #b45309;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            margin-top: 1px;
        }
        .inst-security-cell {
            width: 26%;
            text-align: right;
            vertical-align: middle;
        }
        .apogee-seal-card {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            border-radius: 3px;
        }
        .seal-card-header {
            background-color: #001A4B;
            color: #ffffff;
            font-size: 6pt;
            font-weight: 900;
            letter-spacing: 0.4px;
            text-align: center;
            padding: 1.5px 3px;
            text-transform: uppercase;
        }
        .seal-card-body {
            padding: 2px 4px;
            vertical-align: middle;
        }
        .seal-info-text {
            font-size: 6.5pt;
            color: #334155;
            line-height: 1.25;
            text-align: left;
        }
        .seal-qr-wrapper {
            width: 34px;
            text-align: right;
            vertical-align: middle;
            padding-left: 2px;
        }
        .seal-qr-wrapper img {
            width: 30px;
            height: 30px;
            border: 1px solid #cbd5e1;
            padding: 1px;
            background: #ffffff;
            border-radius: 2px;
            display: block;
        }
        .sovereign-ribbon {
            width: 100%;
            height: 2px;
            border-top: 1.5px solid #001A4B;
            border-bottom: 1px solid #d97706;
            margin-bottom: 3px;
            clear: both;
        }
        .pv-hero-banner {
            background-color: #001A4B;
            border-radius: 3px;
            padding: 4px 8px;
            margin-bottom: 3px;
            color: #ffffff;
        }
        .hero-banner-table {
            width: 100%;
            border-collapse: collapse;
        }
        .hero-banner-table td {
            vertical-align: middle;
        }
        .hero-title-main {
            font-size: 11pt;
            font-weight: 900;
            color: #ffffff;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            line-height: 1.1;
        }
        .hero-module-subtitle {
            font-size: 8.5pt;
            font-weight: 800;
            color: #fef08a;
            text-transform: uppercase;
            margin-top: 1px;
            letter-spacing: 0.2px;
        }
        .hero-session-pill {
            background-color: #f59e0b;
            color: #001A4B;
            font-weight: 900;
            font-size: 7.5pt;
            padding: 2.5px 8px;
            border-radius: 3px;
            display: inline-block;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            text-align: center;
            white-space: nowrap;
        }
        .meta-governance-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
        }
        .meta-gov-col {
            padding: 2.5px 6px;
            border-right: 1px solid #e2e8f0;
            vertical-align: middle;
            font-size: 7pt;
        }
        .meta-gov-col:last-child {
            border-right: none;
        }
        .meta-gov-lbl {
            font-size: 6pt;
            font-weight: 900;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            display: block;
            margin-bottom: 0px;
        }
        .meta-gov-val {
            font-size: 7.8pt;
            font-weight: 800;
            color: #001A4B;
        }
        .meta-gov-badge {
            display: inline-block;
            padding: 1px 5px;
            border-radius: 2px;
            font-weight: 900;
            font-size: 6.8pt;
            text-transform: uppercase;
            background-color: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
        }
        thead { display: table-header-group; }
        tfoot { display: table-footer-group; }
        tr { page-break-inside: avoid; }
        .pv-table {
            width: 100%;
            border-collapse: collapse;
            font-size: {{ $tbFont }};
            margin-bottom: 5px;
        }
        .pv-table th, .pv-table td {
            border: 1px solid #334155;
            padding: {{ $tbPad }};
            text-align: center;
        }
        .pv-table th {
            background-color: #f1f5f9;
            color: #0f2863;
            font-weight: bold;
            text-transform: uppercase;
            font-size: {{ $thFont }};
        }
        .pv-table tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .apogee-col {
            text-align: left !important;
            font-weight: bold;
            color: #64748b;
        }
        .name-col {
            text-align: left !important;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
        }
        .moyenne-col {
            font-weight: bold;
            font-size: {{ $tbFont }};
            color: #0f2863;
            background-color: #f1f5f9;
        }
        .badge {
            display: inline-block;
            padding: 1.5px 5px;
            border-radius: 3px;
            font-weight: bold;
            font-size: 7.5px;
            text-transform: uppercase;
        }
        .badge-v { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .badge-r { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
        .badge-nv { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
        
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
        }
        .signatures-table td {
            width: 50%;
            vertical-align: top;
            padding: 4px 8px;
            border: 1px solid #e2e8f0;
            background-color: #fafafa;
            border-radius: 4px;
        }
        .sig-title {
            font-size: 7.8pt;
            font-weight: bold;
            color: #0f2863;
            text-transform: uppercase;
            margin-bottom: 3px;
        }
        .sig-box {
            text-align: center;
        }
        .security-footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            border-top: 1.5px solid #0f2863;
            padding-top: 3px;
        }
        .footer-banner {
            margin-top: 3px;
            border-top: 1px solid #cbd5e1;
            padding-top: 2px;
            text-align: center;
            font-size: 6.8pt;
            color: #64748b;
        }
    </style>
</head>
<body>
    @php
        $pvLogo = $logoBase64 ?? null;
        if (empty($pvLogo)) {
            foreach (['logo-encg.png', 'images/encg_logo.png', 'images/logo-encg.png', 'images/logo.png'] as $candidate) {
                $path = public_path($candidate);
                if (file_exists($path)) {
                    $mime = str_ends_with($candidate, '.png') ? 'image/png' : 'image/jpeg';
                    $pvLogo = 'data:' . $mime . ';base64,' . base64_encode((string) file_get_contents($path));
                    break;
                }
            }
        }
    @endphp

    <!-- ======================================================== -->
    <!-- PRESTIGIOUS ACADEMIC EN-TÊTE D'ÉTAT (A4 LANDSCAPE)       -->
    <!-- ======================================================== -->
    <table class="institution-header-table" cellpadding="0" cellspacing="0">
        <tr>
            <!-- Left: Official Institutional Logo -->
            <td class="inst-logo-cell">
                @if(!empty($pvLogo))
                    <img src="{{ $pvLogo }}" class="inst-logo-img" alt="ENCG Fès">
                @endif
            </td>

            <!-- Center: Institutional Hierarchy -->
            <td class="inst-center-cell">
                <div class="state-kingdom">ROYAUME DU MAROC</div>
                <div class="state-ministry">Ministère de l'Enseignement Supérieur, de la Recherche Scientifique et de l'Innovation</div>
                <div class="state-univ">Université Sidi Mohamed Ben Abdellah &bull; Fès</div>
                <div class="state-school">École Nationale de Commerce et de Gestion</div>
                <div class="state-service">Service Central des Examens &amp; Délibérations</div>
            </td>

            <!-- Right: Apogée Security & Integrity Seal Card -->
            <td class="inst-security-cell">
                <table class="apogee-seal-card" cellpadding="0" cellspacing="0">
                    <tr>
                        <td colspan="2" class="seal-card-header">
                            CONTRÔLE APOGÉE &bull; DOCUMENT SCELLÉ
                        </td>
                    </tr>
                    <tr>
                        <td class="seal-card-body">
                            <div class="seal-info-text">
                                <div><strong style="color: #64748b;">RÉF :</strong> <span style="font-family: monospace; font-weight: bold; color: #001A4B;">PV-{{ $module->code }}-{{ date('Y') }}</span></div>
                                <div><strong style="color: #64748b;">STATUT :</strong> <span style="color: #059669; font-weight: bold;">CERTIFIÉ SCELLÉ</span></div>
                                <div><strong style="color: #64748b;">ÉDITÉ LE :</strong> <strong>{{ $date ?? date('d/m/Y H:i') }}</strong></div>
                            </div>
                        </td>
                        <td class="seal-qr-wrapper">
                            @if(!empty($qrBase64))
                                <img src="{{ $qrBase64 }}" alt="QR Verification">
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <!-- Sovereign Dual Accent Ribbon (Navy 2px + Imperial Gold 1px) -->
    <div class="sovereign-ribbon"></div>

    <!-- Major PV Title Banner -->
    <div class="pv-hero-banner">
        <table class="hero-banner-table" cellpadding="0" cellspacing="0">
            <tr>
                <td style="width: 70%; text-align: left; vertical-align: middle;">
                    <div class="hero-title-main">
                        PROCÈS-VERBAL DE DÉLIBÉRATION DU MODULE
                    </div>
                    <div class="hero-module-subtitle">
                        MODULE : [{{ $module->code }}] &mdash; {{ $module->name }}
                    </div>
                </td>
                <td style="width: 30%; text-align: right; vertical-align: middle;">
                    <span class="hero-session-pill">
                        SESSION {{ $session === 'normale' ? 'ORDINAIRE (NORMALE)' : ($session === 'rattrapage' ? 'DE RATTRAPAGE' : 'BILAN COMPLET') }}
                    </span>
                </td>
            </tr>
        </table>
    </div>

    <!-- Consolidated Academic Governance Grid -->
    <table class="meta-governance-grid" cellpadding="0" cellspacing="0">
        <tr>
            <td class="meta-gov-col" style="width: 20%;">
                <span class="meta-gov-lbl">Année Universitaire</span>
                <span class="meta-gov-val">{{ $academicYear ?? '2026/2027' }}</span>
            </td>
            <td class="meta-gov-col" style="width: 32%;">
                <span class="meta-gov-lbl">Filière d'Études</span>
                <span class="meta-gov-val">{{ $module->filiere->name ?? 'Tronc Commun ENCG' }}</span>
            </td>
            <td class="meta-gov-col" style="width: 28%;">
                <span class="meta-gov-lbl">Semestre &amp; Périmètre</span>
                <span class="meta-gov-val">{{ $semester ?? 'S'.($module->semester_number ?? 1) }} &bull; {{ $perimetre }}</span>
            </td>
            <td class="meta-gov-col" style="width: 20%; text-align: center; border-right: none;">
                <span class="meta-gov-lbl">Authenticité Juridique</span>
                <span class="meta-gov-badge">DOCUMENT OFFICIEL</span>
            </td>
        </tr>
    </table>

    <!-- Student Grades Table -->
    <table class="pv-table">
        <thead>
            <tr>
                <th style="width: {{ $session === 'rattrapage' ? '68px' : '75px' }}; text-align: left;">Code Apogée</th>
                <th style="text-align: left;">Nom & Prénom</th>
                @foreach($normaleAssessments as $a)
                    <th style="width: {{ $session === 'rattrapage' ? '44px' : '52px' }};">
                        {{ $a->type }}<br>
                        <span style="font-size: 6.8px; color: #64748b;">({{ $a->weight }}%)</span>
                    </th>
                @endforeach
                <th style="width: {{ $session === 'rattrapage' ? '48px' : '55px' }}; background: #e2e8f0;">Moy. Normale</th>
                <th style="width: {{ $session === 'rattrapage' ? '40px' : '48px' }}; background: #e2e8f0;">Dés. Normale</th>

                @if($session === 'rattrapage' || $session === 'totale' || $session === 'complet')
                    <th style="width: 50px; background: #fef3c7;">Rattrapage</th>
                    <th style="width: 48px; background: #dbeafe;">Moy. Finale</th>
                    <th style="width: 40px; background: #dbeafe;">Dés. Finale</th>
                @endif
            </tr>
        </thead>
        <tbody>
            @foreach($students as $student)
                @php
                    $rowGrades = $student['grades_detail'] ?? [];
                @endphp
                <tr>
                    <td class="apogee-col">{{ $student['apogee'] }}</td>
                    <td class="name-col">{{ $student['last_name'] }} {{ $student['first_name'] }}</td>
                    
                    @foreach($normaleAssessments as $a)
                        @php
                            $info = $rowGrades[$a->id] ?? $rowGrades[$a->type] ?? null;
                            $val = $info ? $info['value'] : null;
                            $abs = $info ? $info['is_absent'] : false;
                            $isFraudCell = $info ? ($info['is_fraud'] ?? false) : false;
                        @endphp
                        <td>
                            @if($isFraudCell)
                                <span style="color: #b91c1c; font-weight: bold;">0.00 (FRAUDE)</span>
                            @elseif($abs)
                                <span style="color: #dc2626; font-weight: bold;">ABI</span>
                            @elseif($val !== null)
                                {{ number_format((float)$val, 2, '.', '') }}
                            @else
                                -
                            @endif
                        </td>
                    @endforeach

                    <td class="moyenne-col">
                        @if(!empty($student['is_fraud']) || ($student['decision_normale'] ?? '') === 'FRAUDE')
                            <span style="color: #b91c1c; font-weight: bold;">0.00</span>
                        @else
                            {{ isset($student['moyenne_normale']) && $student['moyenne_normale'] !== null ? number_format((float)$student['moyenne_normale'], 2, '.', '') : '-' }}
                        @endif
                    </td>

                    <td>
                        @php $dec = $student['decision_normale'] ?? ''; @endphp
                        @if(!empty($student['is_fraud']) || $dec === 'FRAUDE')
                            <span class="badge badge-nv" style="background-color: #b91c1c; color: #fff; font-weight: bold;">FRAUDE</span>
                        @elseif($dec === 'V')
                            <span class="badge badge-v">V</span>
                        @elseif($dec === 'R')
                            <span class="badge badge-r">R</span>
                        @elseif($dec === 'NV')
                            <span class="badge badge-nv">NV</span>
                        @else
                            -
                        @endif
                    </td>

                    @if($session === 'rattrapage' || $session === 'totale' || $session === 'complet')
                        <td>
                            @if(!empty($student['rattrapage_absent']))
                                <span style="color: #dc2626; font-weight: bold;">ABI</span>
                            @elseif(isset($student['rattrapage_note']) && $student['rattrapage_note'] !== null && $student['rattrapage_note'] !== '')
                                {{ number_format((float)$student['rattrapage_note'], 2, '.', '') }}
                            @else
                                -
                            @endif
                        </td>
                        <td class="moyenne-col">
                            @if(!empty($student['is_fraud']) || ($student['decision_finale'] ?? '') === 'FRAUDE')
                                <span style="color: #b91c1c; font-weight: bold;">0.00</span>
                            @else
                                {{ isset($student['moyenne_finale']) && $student['moyenne_finale'] !== null ? number_format((float)$student['moyenne_finale'], 2, '.', '') : '-' }}
                            @endif
                        </td>
                        <td>
                            @php $decF = $student['decision_finale'] ?? ''; @endphp
                            @if(!empty($student['is_fraud']) || $decF === 'FRAUDE')
                                <span class="badge badge-nv" style="background-color: #b91c1c; color: #fff; font-weight: bold;">FRAUDE</span>
                            @elseif($decF === 'V' || $decF === 'VAR')
                                <span class="badge badge-v">{{ $decF }}</span>
                            @elseif($decF === 'NV')
                                <span class="badge badge-nv">NV</span>
                            @elseif($decF === 'R')
                                <span class="badge badge-r">R</span>
                            @else
                                -
                            @endif
                        </td>
                    @endif
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- ======================================================== -->
    <!-- PV CLOSING BLOCK (Signatures + Security Seal + Banner)   -->
    <!-- All wrapped with page-break-inside: avoid to stay intact -->
    <!-- ======================================================== -->
    <div style="page-break-inside: avoid; margin-top: 4px;">
        <!-- Signatures Table -->
        <table class="signatures-table">
            <tr>
                <td style="text-align: center;">
                    <div class="sig-title">
                        Signature de l'Enseignant Responsable du Module
                        <div style="font-size: 5.8pt; color: #64748b; font-weight: normal; text-transform: uppercase; margin-top: 1px;">
                            ({{ $session === 'rattrapage' ? 'Session Rattrapage' : ($session === 'totale' || $session === 'complet' ? 'Bilan Complet' : 'Session Ordinaire') }})
                        </div>
                    </div>
                    <div class="sig-box" style="height: {{ $sigH }};">
                        @if(!empty($signature['signature_data']))
                            <img src="{{ $signature['signature_data'] }}" style="max-height: {{ $sigImgH }};" alt="Signature">
                            <div style="font-size: 6.8pt; color: #475569; margin-top: 2px;">
                                Signé par {{ $signature['signed_by'] ?? 'Enseignant' }} le {{ $signature['signed_at'] ?? '' }} (IP: {{ $signature['ip_address'] ?? 'N/A' }})
                            </div>
                        @else
                            <div style="font-size: 7.2pt; color: #94a3b8; margin-top: 12px;">(Signature non encore apposée — {{ $session === 'rattrapage' ? 'Rattrapage' : ($session === 'totale' || $session === 'complet' ? 'Bilan Complet' : 'Ordinaire') }})</div>
                        @endif
                    </div>
                </td>
                <td style="text-align: center;">
                    <div class="sig-title">Signature du Président du Jury & Cachet</div>
                    <div class="sig-box" style="height: {{ $sigH }};">
                        <div style="font-size: 7.2pt; color: #94a3b8; margin-top: 12px;">(Cachet Officiel ENCG Fès)</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Official Document Verification & Anti-Fraud Security Footer -->
        <table class="security-footer-table">
            <tr>
                <td style="width: 40px; vertical-align: middle;">
                    @if(!empty($qrBase64))
                        <img src="{{ $qrBase64 }}" style="width: 34px; height: 34px; border: 1px solid #cbd5e1; padding: 1px; background: #ffffff; border-radius: 3px;" alt="QR Code Sécurité">
                    @endif
                </td>
                <td style="vertical-align: middle; padding-left: 6px; font-size: 6.8pt; color: #334155; line-height: 1.2;">
                    <strong style="color: #0f2863; font-size: 7.5pt; text-transform: uppercase;">Document Numérique Officiel Sécurisé — ENCG Fès</strong><br>
                    Généré automatiquement par le système ERP d'Évaluation &amp; Délibération Académique.<br>
                    <span style="color: #059669; font-weight: bold;">Contrôle d'Intégrité :</span> Scannez le code QR ou visitez <span style="font-family: monospace; font-weight: bold;">{{ $verifyUrl ?? url('/') }}</span> pour vérifier l'authenticité de ce PV.
                    @if(!empty($signature['digital_seal']))
                        <br><span style="font-family: monospace; font-size: 6.2pt; color: #64748b;">Empreinte Cryptographique (SHA-256) : {{ $signature['digital_seal'] }}</span>
                    @endif
                </td>
                <td style="width: 28%; text-align: right; vertical-align: middle; font-size: 6.8pt; color: #64748b; font-weight: bold;">
                    CERTIFICATION NUMÉRIQUE<br>
                    <span style="color: #0f2863; font-size: 7.8pt; font-family: monospace;">ENCG-PV-{{ $module->code }}-2026</span>
                </td>
            </tr>
        </table>

        <!-- Footer Banner -->
        <div class="footer-banner">
            <strong>École Nationale de Commerce et de Gestion de Fès (ENCG-Fès)</strong> &mdash; Université Sidi Mohamed Ben Abdellah<br>
            B.P. 26A Allal Ben Abdellah, Fès, Maroc | Tél: +212 (0)5 35 60 03 54 | Web: encg.usmba.ac.ma
        </div>
    </div>

</body>
</html>

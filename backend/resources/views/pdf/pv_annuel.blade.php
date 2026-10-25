<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>PV Officiel de Délibération Annuelle Consolidée (14 Modules) — ENCG Fès</title>
    @php
        $studentsList = $students ?? $matrix ?? [];
        $rowCount = count($studentsList);
        
        // Calibrage aéré et grand sur exactement 2 pages (Page 1 = S1, Page 2 = S2 + Synthèse Annuelle + Signatures)
        if ($rowCount <= 15) {
            $tbPad = '3.5px 2px';
            $numFont = '9.5pt';
            $moyFont = '10.5pt';
            $tbFont = '9.0pt';
            $thFont = '9.0pt';
            $subThFont = '8.0pt';
            $sigH = '28px';
        } elseif ($rowCount <= 28) {
            $tbPad = '1.8px 1.5px';
            $numFont = '8.8pt';
            $moyFont = '9.6pt';
            $tbFont = '8.2pt';
            $thFont = '8.2pt';
            $subThFont = '7.2pt';
            $sigH = '22px';
        } else {
            $tbPad = '1.2px 1px';
            $numFont = '8.0pt';
            $moyFont = '8.8pt';
            $tbFont = '7.5pt';
            $thFont = '7.5pt';
            $subThFont = '6.5pt';
            $sigH = '18px';
        }

        $filiereName = $filiere->name ?? 'Tronc Commun ENCG';
        $filiereCode = $filiere->code ?? 'TC';
        $acadName = $academicYear->name ?? date('Y').'/'.(date('Y')+1);
        $totalStudents = $rowCount;
        $valCount = collect($studentsList)->filter(fn($r) => in_array($r['decision'] ?? '', ['V', 'V.Comp', 'PASS_DETTES']))->count();
        $successRate = $totalStudents > 0 ? round(($valCount / $totalStudents) * 100, 1) : 0;
        $yearLevel = $yearLevel ?? 1;
        $yearLabel = ($yearLevel == 1) ? '1ère Année' : ($yearLevel.'ème Année');

        $oddMods = collect($modules)->filter(fn($m) => (is_array($m) ? ($m['semester_number'] ?? 1) : ($m->semester_number ?? 1)) % 2 !== 0)->values();
        $evenMods = collect($modules)->filter(fn($m) => (is_array($m) ? ($m['semester_number'] ?? 2) : ($m->semester_number ?? 2)) % 2 === 0)->values();

        $oddModIds = $oddMods->map(fn($m) => is_array($m) ? ($m['id'] ?? 0) : ($m->id ?? 0))->toArray();
        $evenModIds = $evenMods->map(fn($m) => is_array($m) ? ($m['id'] ?? 0) : ($m->id ?? 0))->toArray();

        $allJuries = collect($juries ?? []);
        $s1Juries = $allJuries->filter(fn($j) => in_array($j['module_id'] ?? 0, $oddModIds))->values();
        if ($s1Juries->isEmpty()) {
            $s1Juries = $allJuries->take(7)->values();
        }

        $s2Juries = $allJuries->filter(fn($j) => in_array($j['module_id'] ?? 0, $evenModIds) || ($j['role'] ?? '') === 'chef_filiere')->values();
        if ($s2Juries->isEmpty()) {
            $s2Juries = $allJuries->slice(7)->values();
        }
    @endphp
    <style>
        @page {
            size: A3 landscape;
            margin: 2.5mm 4mm 2mm 4mm;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: {{ $tbFont }};
            color: #0f172a;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            line-height: 1.1;
        }

        .page-break {
            page-break-after: always;
        }

        /* ─── Institutional Header ─── */
        .inst-header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5px;
            border-bottom: 1.5px solid #1a3673;
            padding-bottom: 1px;
        }
        .inst-header-table td {
            vertical-align: middle;
        }
        .inst-logo-cell {
            width: 25%;
            text-align: left;
        }
        .inst-logo-cell img {
            max-height: 34px;
            max-width: 140px;
            height: auto;
            display: block;
        }
        .inst-center-cell {
            width: 50%;
            text-align: center;
        }
        .state-kingdom {
            font-size: 9pt;
            font-weight: 900;
            color: #1a3673;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .state-univ {
            font-size: 7.8pt;
            font-weight: 700;
            color: #334155;
            margin-top: 1px;
        }
        .state-school {
            font-size: 8.8pt;
            font-weight: 900;
            color: #1a3673;
            text-transform: uppercase;
            margin-top: 1px;
        }
        .inst-qr-cell {
            width: 25%;
            text-align: right;
        }
        .qr-table {
            float: right;
            border-collapse: collapse;
        }
        .qr-table td {
            vertical-align: middle;
            padding: 0 4px;
        }
        .qr-img {
            max-height: 40px;
            max-width: 40px;
        }
        .qr-meta {
            font-size: 6.2pt;
            color: #64748b;
            text-align: right;
            line-height: 1.15;
        }
        .qr-meta strong {
            color: #1a3673;
        }

        /* ─── Title Banner ─── */
        .title-banner {
            background-color: #1a3673;
            color: #ffffff;
            text-align: center;
            padding: 3px 6px;
            border-radius: 3px;
            margin-bottom: 3px;
        }
        .title-banner h1 {
            margin: 0;
            font-size: 9.5pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #ffffff;
        }
        .title-banner p {
            margin: 1px 0 0 0;
            font-size: 6.8pt;
            color: #fde047;
            font-weight: 700;
            letter-spacing: 0.2px;
        }

        /* ─── Metadata Bar ─── */
        .meta-bar {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 3px;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
        }
        .meta-bar td {
            padding: 2px 6px;
            font-size: 6.8pt;
            border-right: 1px solid #e2e8f0;
        }
        .meta-bar td:last-child {
            border-right: none;
        }
        .meta-label {
            font-weight: 900;
            color: #1a3673;
            text-transform: uppercase;
            font-size: 6.5pt;
        }
        .meta-val {
            font-weight: 800;
            color: #1e293b;
        }

        /* ─── Clean Excel-Style Matrix Table ─── */
        .matrix-table {
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            margin-bottom: 3px;
        }
        .matrix-table th, .matrix-table td {
            border: 0.6px solid #cbd5e1;
            padding: {{ $tbPad }};
            text-align: center;
            font-size: {{ $tbFont }};
            line-height: 1.08;
        }
        .matrix-table thead th {
            font-weight: 900;
            text-transform: uppercase;
            font-size: {{ $thFont }};
        }
        .matrix-table thead th.main-info-head {
            background-color: #1a3673;
            color: #ffffff;
            border-bottom: 1.5px solid #1a3673;
        }
        .matrix-table thead th.sem-head {
            background-color: #1e1b4b;
            color: #ffffff;
            border-right: 2px solid #1a3673 !important;
            padding: 3px 2px;
            font-size: {{ $thFont }};
            letter-spacing: 0.3px;
        }
        .matrix-table thead th.res-head {
            background-color: #1a3673;
            color: #ffffff;
            border-right: 1.5px solid #1a3673 !important;
        }
        .matrix-table thead th.mod-code-head {
            background-color: #1a3673;
            color: #ffffff;
            font-size: {{ $thFont }};
            font-weight: 900;
            padding: 2px 1px;
            letter-spacing: -0.1px;
            border-bottom: 0.6px solid #94a3b8;
        }
        .matrix-table thead th.sub-col-head {
            background-color: #f1f5f9;
            color: #334155;
            font-size: {{ $subThFont }};
            font-weight: 900;
            padding: 1.5px 1px;
            text-transform: lowercase;
            letter-spacing: 0;
            border-bottom: 1.5px solid #1a3673;
        }

        .matrix-table tr:nth-child(even) td {
            background-color: #fbfcfe;
        }

        /* Section Separators */
        .sec-sep {
            border-right: 2px solid #1a3673 !important;
        }
        .mod-sep {
            border-right: 1px solid #94a3b8 !important;
        }

        /* Student Identity Cells */
        .idx-cell {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 800;
            font-size: {{ $numFont }};
            color: #64748b;
            background-color: #f8fafc;
        }
        .id-num-cell {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 900;
            font-size: {{ $numFont }};
            color: #1a3673;
            white-space: nowrap;
        }
        .cin-cell {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 900;
            font-size: {{ $numFont }};
            color: #1e293b;
            white-space: nowrap;
        }
        .student-name {
            text-align: left !important;
            font-weight: 900;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding-left: 4px !important;
            padding-right: 2px !important;
            font-size: {{ $tbFont }};
        }

        /* Excel-Style Module Cells */
        .cell-note {
            padding: 1px 0.5px !important;
            text-align: center;
        }
        .cell-dec {
            padding: 1px 0.5px !important;
            text-align: center;
        }
        .cell-year {
            padding: 1px 0.5px !important;
            text-align: center;
        }

        .val-bold {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 900;
            font-size: {{ $numFont }};
            letter-spacing: -0.2px;
        }
        .note-pass {
            color: #15803d;
        }
        .note-weak {
            color: #b45309;
        }
        .note-elim {
            color: #dc2626;
            font-weight: 900;
        }
        .bg-elim {
            background-color: #fee2e2 !important;
        }

        .dec-bold {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 900;
            font-size: {{ $numFont }};
            letter-spacing: -0.2px;
        }
        .dec-v {
            color: #15803d;
        }
        .dec-var {
            color: #0284c7;
        }
        .dec-vpc {
            color: #4338ca;
        }
        .dec-nv, .dec-aj, .dec-r {
            color: #dc2626;
        }

        .year-bold {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 800;
            font-size: {{ $subThFont }};
            color: #475569;
            letter-spacing: -0.2px;
        }
        .year-hist {
            color: #6b21a8;
            font-weight: 900;
        }

        /* Semester & Annual Results */
        .moy-s1 {
            background-color: #e0e7ff !important;
            color: #1e1b4b;
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 900;
            font-size: {{ $moyFont }};
        }
        .moy-s2 {
            background-color: #dbeafe !important;
            color: #1e3a8a;
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 900;
            font-size: {{ $moyFont }};
        }
        .moy-ann {
            background-color: #fef3c7 !important;
            color: #78350f;
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 900;
            font-size: {{ $moyFont }};
            letter-spacing: -0.2px;
        }

        .badge-s {
            font-weight: 900;
            font-size: {{ $numFont }};
        }

        /* Annual Decision Badges */
        .decision-cell {
            text-align: center !important;
            vertical-align: middle !important;
            padding: 1.5px 2px !important;
        }
        .badge-annual {
            display: block;
            width: 98%;
            margin: 0 auto;
            padding: 2.2px 1px;
            border-radius: 3px;
            font-size: {{ $thFont }};
            font-weight: 900;
            text-transform: uppercase;
            text-align: center;
            letter-spacing: 0.1px;
            line-height: 1.05;
        }
        .badge-v {
            background-color: #dcfce7;
            color: #15803d;
            border: 1px solid #86efac;
        }
        .badge-vpc {
            background-color: #e0e7ff;
            color: #3730a3;
            border: 1px solid #a5b4fc;
        }
        .badge-dettes {
            background-color: #fef3c7;
            color: #b45309;
            border: 1px solid #fcd34d;
        }
        .badge-aj {
            background-color: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fca5a5;
        }
        .badge-fraude {
            background-color: #450a0a;
            color: #ffffff;
            border: 1px solid #000000;
        }
        .decision-subtext {
            font-size: 6.0pt;
            font-weight: 800;
            text-align: center;
            display: block;
            margin-top: 1px;
            line-height: 1;
            white-space: nowrap;
        }
        .text-emerald { color: #15803d; }
        .text-indigo { color: #3730a3; }
        .text-amber { color: #b45309; }
        .text-rose { color: #b91c1c; }

        /* ─── Signatures Section ─── */
        .signatures-section {
            margin-top: 3px;
            page-break-inside: avoid;
        }
        .signatures-title {
            font-size: 7.2pt;
            font-weight: 900;
            color: #1a3673;
            margin-bottom: 2px;
            text-transform: uppercase;
            border-bottom: 1.5px solid #1a3673;
            padding-bottom: 1.5px;
            letter-spacing: 0.3px;
        }
        .sig-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2px;
        }
        .sig-box {
            border: 1px solid #1a3673;
            border-radius: 2px;
            padding: 2px 2px;
            text-align: center;
            background-color: #ffffff;
            height: {{ $sigH }};
            vertical-align: top;
        }
        .sig-header {
            font-size: 6.0pt;
            font-weight: 900;
            color: #1a3673;
            text-transform: uppercase;
            border-bottom: 0.5px solid #cbd5e1;
            padding-bottom: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .sig-name {
            font-size: 6.0pt;
            color: #0f172a;
            font-weight: 800;
            margin-top: 0.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .sig-role {
            font-size: 5.2pt;
            font-weight: 700;
            color: #64748b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .sig-status-badge {
            display: inline-block;
            font-size: 4.8pt;
            font-weight: 900;
            padding: 0.5px 3px;
            border-radius: 2px;
            text-transform: uppercase;
            letter-spacing: 0.2px;
        }
        .sig-status-ok {
            background-color: #dcfce7;
            color: #15803d;
            border: 0.5px solid #86efac;
        }
        .sig-status-wait {
            background-color: #fef3c7;
            color: #b45309;
            border: 0.5px solid #fcd34d;
        }
        .sig-img {
            max-height: 12px;
            max-width: 60px;
            display: block;
            margin: 0.5px auto 0 auto;
        }
        .sig-seal {
            font-size: 4.4pt;
            color: #15803d;
            font-family: monospace;
            font-weight: 700;
            margin-top: 0.5px;
        }
        .sig-line-pending {
            margin-top: 2px;
            border-bottom: 0.5px dashed #cbd5e1;
            width: 70%;
            margin-left: auto;
            margin-right: auto;
        }

        /* ─── Footer Legal ─── */
        .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 2px;
            border-top: 1px solid #cbd5e1;
            padding-top: 2px;
        }
        .footer-table td {
            font-size: 5.6pt;
            color: #64748b;
            font-weight: 700;
        }
    </style>
</head>
<body>

    {{-- ========================================================================= --}}
    {{-- PAGE 1 : SEMESTRE IMPAIR (S1) — 7 MODULES + MOYENNE & DÉCISION S1         --}}
    {{-- ========================================================================= --}}

    {{-- Institutional Header (Page 1) --}}
    <table class="inst-header-table">
        <tr>
            <td class="inst-logo-cell">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo ENCG Fès">
                @else
                    <div style="font-size: 13pt; font-weight: 900; color: #1a3673;">ENCG FÈS</div>
                @endif
            </td>
            <td class="inst-center-cell">
                <div class="state-kingdom">Royaume du Maroc</div>
                <div class="state-univ">Université Sidi Mohamed Ben Abdellah</div>
                <div class="state-school">École Nationale de Commerce et de Gestion de Fès</div>
            </td>
            <td class="inst-qr-cell">
                <table class="qr-table">
                    <tr>
                        <td class="qr-meta">
                            <strong>DOCUMENT OFFICIEL</strong><br>
                            Certifié conforme APOGEE<br>
                            Scellé Numérique SHA-256
                        </td>
                        <td>
                            @if(!empty($qrBase64))
                                <img src="{{ $qrBase64 }}" class="qr-img" alt="QR Code">
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- Title Banner (Page 1) --}}
    <div class="title-banner">
        <h1>Procès-Verbal Officiel de Délibération Annuelle — Semestre {{ $odd_semester_label }} (7 Modules)</h1>
        <p>Filière : {{ $filiereName }} &bull; Niveau : {{ $yearLabel }} &bull; Session Ordinaire Normale &bull; <strong>Page 1 / 2</strong></p>
    </div>

    {{-- Metadata Bar (Page 1) --}}
    <table class="meta-bar">
        <tr>
            <td style="width: 22%;"><span class="meta-label">Filière :</span> <span class="meta-val">{{ $filiereName }} ({{ $filiereCode }})</span></td>
            <td style="width: 17%;"><span class="meta-label">Niveau :</span> <span class="meta-val">{{ $yearLabel }} (Semestre {{ $odd_semester_label }})</span></td>
            <td style="width: 17%;"><span class="meta-label">Année Académique :</span> <span class="meta-val">{{ $acadName }}</span></td>
            <td style="width: 14%;"><span class="meta-label">Effectif :</span> <span class="meta-val">{{ $totalStudents }} Étudiants</span></td>
            <td style="width: 15%;"><span class="meta-label">Session :</span> <span class="meta-val">Normale &amp; Rattrapage</span></td>
            <td style="width: 15%;"><span class="meta-label">Édité le :</span> <span class="meta-val">{{ $date }}</span></td>
        </tr>
    </table>

    {{-- Table Semestre 1 (Grande Largeur & Excellente Lisibilité) --}}
    <table class="matrix-table">
        <thead>
            {{-- Level 1 --}}
            <tr>
                <th rowspan="3" class="main-info-head sec-sep" style="width: 2.0%;">N°</th>
                <th rowspan="3" class="main-info-head sec-sep" style="width: 6.5%;">APOGÉE / CNE</th>
                <th rowspan="3" class="main-info-head sec-sep" style="width: 5.5%;">CIN</th>
                <th rowspan="3" class="main-info-head sec-sep" style="width: 14.0%;">NOM &amp; PRÉNOM ÉTUDIANT</th>

                {{-- Header Semestre 1 --}}
                <th colspan="{{ $oddMods->count() * 3 }}" class="sem-head sec-sep">
                    MODULES SEMESTRE {{ $odd_semester_label }} ({{ $oddMods->count() }} MODULES)
                </th>

                <th rowspan="3" class="res-head sec-sep" style="width: 5.4%;">MOY {{ $odd_semester_label }}</th>
                <th rowspan="3" class="res-head" style="width: 5.0%;">DÉC {{ $odd_semester_label }}</th>
            </tr>

            {{-- Level 2: Module Codes --}}
            <tr>
                @foreach($oddMods as $m)
                    @php $mCode = is_array($m) ? ($m['code'] ?? '') : ($m->code ?? ''); @endphp
                    <th colspan="3" class="mod-code-head {{ $loop->last ? 'sec-sep' : 'mod-sep' }}" title="{{ is_array($m) ? ($m['name'] ?? '') : ($m->name ?? '') }}">
                        {{ $mCode }}
                    </th>
                @endforeach
            </tr>

            {{-- Level 3: Excel Sub-Columns: note | decision | anne --}}
            <tr>
                @foreach($oddMods as $m)
                    <th class="sub-col-head" style="width: 3.6%;">note</th>
                    <th class="sub-col-head" style="width: 2.6%;">déc.</th>
                    <th class="sub-col-head {{ $loop->last ? 'sec-sep' : 'mod-sep' }}" style="width: 2.6%;">année</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($studentsList as $index => $s)
                <tr>
                    <td class="idx-cell sec-sep">{{ $index + 1 }}</td>
                    <td class="id-num-cell sec-sep">{{ $s['cne'] ?? $s['student_id'] ?? '-' }}</td>
                    <td class="cin-cell sec-sep">{{ $s['cin'] ?? '-' }}</td>
                    <td class="student-name sec-sep">{{ $s['student_name'] ?? '-' }}</td>

                    {{-- S1 Modules --}}
                    @foreach($oddMods as $m)
                        @php
                            $modId = is_array($m) ? ($m['id'] ?? 0) : ($m->id ?? 0);
                            $mInfo = $s['modules_map'][$modId] ?? null;
                            $note = $mInfo ? $mInfo['final_grade'] : null;
                            $rawDec = $mInfo ? ($mInfo['decision'] ?? '') : '';
                            $decCode = ($rawDec === 'V.Comp' || $rawDec === 'VPC') ? 'VPC' : ($rawDec ?: (is_numeric($note) && floatval($note) >= 10.0 ? 'V' : 'NV'));
                            $isElim = is_numeric($note) && floatval($note) < 6.0;
                            $valYear = $mInfo['validation_year'] ?? '';
                            $isHist = !empty($mInfo['is_historical']) || (!empty($valYear) && str_replace('-', '/', $valYear) !== str_replace('-', '/', $acadName));
                            
                            $shortYear = '-';
                            if (!empty($valYear)) {
                                if (preg_match('/(\d{2,4})[\/\-](\d{2,4})/', $valYear, $ym)) {
                                    $shortYear = substr($ym[1], -2) . '-' . substr($ym[2], -2);
                                } else {
                                    $shortYear = $valYear;
                                }
                            }

                            $noteClass = 'val-bold';
                            if ($isElim) {
                                $noteClass .= ' note-elim';
                            } elseif (is_numeric($note) && floatval($note) >= 10.0) {
                                $noteClass .= ' note-pass';
                            } elseif (is_numeric($note)) {
                                $noteClass .= ' note-weak';
                            }
                        @endphp
                        {{-- Note --}}
                        <td class="cell-note {{ $isElim ? 'bg-elim' : '' }}">
                            <span class="{{ $noteClass }}">
                                {{ is_numeric($note) ? number_format((float)$note, 2) : '-' }}
                            </span>
                        </td>
                        {{-- Décision --}}
                        <td class="cell-dec {{ $isElim ? 'bg-elim' : '' }}">
                            <span class="dec-bold dec-{{ strtolower($decCode) }}">
                                {{ $decCode ?: '-' }}
                            </span>
                        </td>
                        {{-- Année --}}
                        <td class="cell-year {{ $isElim ? 'bg-elim' : '' }} {{ $loop->last ? 'sec-sep' : 'mod-sep' }}">
                            <span class="year-bold {{ $isHist ? 'year-hist' : '' }}">
                                {{ $shortYear }}
                            </span>
                        </td>
                    @endforeach

                    {{-- S1 Moyenne & Décision --}}
                    <td class="moy-s1">
                        {{ is_numeric($s['odd_semester_avg'] ?? null) ? number_format((float)$s['odd_semester_avg'], 2) : ($s['odd_semester_avg'] ?? '-') }}
                    </td>
                    <td class="moy-s1">
                        @php $s1Dec = $s['odd_semester_decision'] ?? 'NV'; @endphp
                        <span class="badge-s dec-{{ strtolower($s1Dec === 'V.Comp' ? 'vpc' : $s1Dec) }}">
                            {{ $s1Dec === 'V.Comp' ? 'VPC' : $s1Dec }}
                        </span>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Signatures Section Semestre 1 (7 Professeurs de Module) --}}
    <div class="signatures-section">
        <div class="signatures-title">
            Scellé Numérique &amp; Signatures des Enseignants du Semestre {{ $odd_semester_label }} ({{ count($s1Juries) }} Signataires Officiels)
        </div>
        <table class="sig-grid">
            <tr>
                @php $s1BoxW = count($s1Juries) > 0 ? round(100 / count($s1Juries), 2) : 14.28; @endphp
                @foreach($s1Juries as $j)
                    <td class="sig-box" style="width: {{ $s1BoxW }}%;">
                        <div class="sig-header">
                            {{ $j['module_code'] ?? 'MODULE' }}
                        </div>
                        <div class="sig-name">{{ $j['user_name'] ?? 'Enseignant ENCG' }}</div>
                        <div class="sig-role">
                            {{ $j['module_name'] ?? 'Professeur Responsable' }}
                        </div>
                        <div style="margin-top: 0.5px;">
                            @if(($j['status'] ?? '') === 'signed')
                                <span class="sig-status-badge sig-status-ok">SIGNÉ</span>
                                @if(!empty($j['signature_image']))
                                    <br><img src="{{ $j['signature_image'] }}" class="sig-img" alt="Signature">
                                @endif
                                @if(!empty($j['digital_seal']))
                                    <div class="sig-seal">SCELLÉ: {{ substr($j['digital_seal'], 0, 8) }}...</div>
                                @endif
                            @else
                                <span class="sig-status-badge sig-status-wait">EN ATTENTE</span>
                                <div class="sig-line-pending"></div>
                            @endif
                        </div>
                    </td>
                @endforeach
            </tr>
        </table>
    </div>

    {{-- Legal Footer (Page 1) --}}
    <table class="footer-table">
        <tr>
            <td style="text-align: left; width: 70%;">
                Document officiel certifié généré par l'ERP ENCG Fès — Toute rature ou falsification annule la validité du présent procès-verbal.
            </td>
            <td style="text-align: right; width: 30%;">
                <strong>Page 1 / 2</strong> &bull; ENCG-PV-ANNUEL-{{ $filiereCode }}-{{ str_replace('/', '', $acadName) }}
            </td>
        </tr>
    </table>


    {{-- ========================================================================= --}}
    {{-- SAUT DE PAGE OBLIGATOIRE                                                 --}}
    {{-- ========================================================================= --}}
    <div class="page-break"></div>


    {{-- ========================================================================= --}}
    {{-- PAGE 2 : SEMESTRE PAIR (S2) & SYNTHÈSE ANNUELLE + 15 SIGNATURES DU JURY  --}}
    {{-- ========================================================================= --}}

    {{-- Institutional Header (Page 2) --}}
    <table class="inst-header-table">
        <tr>
            <td class="inst-logo-cell">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo ENCG Fès">
                @else
                    <div style="font-size: 13pt; font-weight: 900; color: #1a3673;">ENCG FÈS</div>
                @endif
            </td>
            <td class="inst-center-cell">
                <div class="state-kingdom">Royaume du Maroc</div>
                <div class="state-univ">Université Sidi Mohamed Ben Abdellah</div>
                <div class="state-school">École Nationale de Commerce et de Gestion de Fès</div>
            </td>
            <td class="inst-qr-cell">
                <table class="qr-table">
                    <tr>
                        <td class="qr-meta">
                            <strong>DOCUMENT OFFICIEL</strong><br>
                            Certifié conforme APOGEE<br>
                            Scellé Numérique SHA-256
                        </td>
                        <td>
                            @if(!empty($qrBase64))
                                <img src="{{ $qrBase64 }}" class="qr-img" alt="QR Code">
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    {{-- Title Banner (Page 2) --}}
    <div class="title-banner">
        <h1>Procès-Verbal Officiel de Délibération Annuelle — Semestre {{ $even_semester_label }} &amp; Bilan Consolidé (14 Modules)</h1>
        <p>Filière : {{ $filiereName }} &bull; Niveau : {{ $yearLabel }} &bull; Session Ordinaire Normale &bull; <strong>Page 2 / 2</strong></p>
    </div>

    {{-- Metadata Bar (Page 2) --}}
    <table class="meta-bar">
        <tr>
            <td style="width: 22%;"><span class="meta-label">Filière :</span> <span class="meta-val">{{ $filiereName }} ({{ $filiereCode }})</span></td>
            <td style="width: 17%;"><span class="meta-label">Niveau :</span> <span class="meta-val">{{ $yearLabel }} (Semestre {{ $even_semester_label }} &amp; Bilan)</span></td>
            <td style="width: 17%;"><span class="meta-label">Année Académique :</span> <span class="meta-val">{{ $acadName }}</span></td>
            <td style="width: 14%;"><span class="meta-label">Effectif :</span> <span class="meta-val">{{ $totalStudents }} Étudiants</span></td>
            <td style="width: 15%;"><span class="meta-label">Taux Réussite :</span> <span class="meta-val" style="color: #15803d; font-weight: 900;">{{ $successRate }}% Admis</span></td>
            <td style="width: 15%;"><span class="meta-label">Édité le :</span> <span class="meta-val">{{ $date }}</span></td>
        </tr>
    </table>

    {{-- Table Semestre 2 & Bilan Annuel (Grande Largeur & Excellente Lisibilité) --}}
    <table class="matrix-table">
        <thead>
            {{-- Level 1 --}}
            <tr>
                <th rowspan="3" class="main-info-head sec-sep" style="width: 2.0%;">N°</th>
                <th rowspan="3" class="main-info-head sec-sep" style="width: 6.5%;">APOGÉE / CNE</th>
                <th rowspan="3" class="main-info-head sec-sep" style="width: 5.5%;">CIN</th>
                <th rowspan="3" class="main-info-head sec-sep" style="width: 14.0%;">NOM &amp; PRÉNOM ÉTUDIANT</th>

                {{-- Header Semestre 2 --}}
                <th colspan="{{ $evenMods->count() * 3 }}" class="sem-head sec-sep">
                    MODULES SEMESTRE {{ $even_semester_label }} ({{ $evenMods->count() }} MODULES)
                </th>

                <th rowspan="3" class="res-head" style="width: 3.5%;">MOY {{ $odd_semester_label }}</th>
                <th rowspan="3" class="res-head sec-sep" style="width: 3.5%;">MOY {{ $even_semester_label }}</th>
                <th rowspan="3" class="res-head sec-sep" style="width: 4.3%;">MOY. ANN.</th>
                <th rowspan="3" class="res-head" style="width: 7.5%;">DÉCISION FINALE (ANNÉE)</th>
            </tr>

            {{-- Level 2: Module Codes --}}
            <tr>
                @foreach($evenMods as $m)
                    @php $mCode = is_array($m) ? ($m['code'] ?? '') : ($m->code ?? ''); @endphp
                    <th colspan="3" class="mod-code-head {{ $loop->last ? 'sec-sep' : 'mod-sep' }}" title="{{ is_array($m) ? ($m['name'] ?? '') : ($m->name ?? '') }}">
                        {{ $mCode }}
                    </th>
                @endforeach
            </tr>

            {{-- Level 3: Excel Sub-Columns: note | decision | anne --}}
            <tr>
                @foreach($evenMods as $m)
                    <th class="sub-col-head" style="width: 3.2%;">note</th>
                    <th class="sub-col-head" style="width: 2.2%;">déc.</th>
                    <th class="sub-col-head {{ $loop->last ? 'sec-sep' : 'mod-sep' }}" style="width: 2.2%;">année</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($studentsList as $index => $s)
                <tr>
                    <td class="idx-cell sec-sep">{{ $index + 1 }}</td>
                    <td class="id-num-cell sec-sep">{{ $s['cne'] ?? $s['student_id'] ?? '-' }}</td>
                    <td class="cin-cell sec-sep">{{ $s['cin'] ?? '-' }}</td>
                    <td class="student-name sec-sep">{{ $s['student_name'] ?? '-' }}</td>

                    {{-- S2 Modules --}}
                    @foreach($evenMods as $m)
                        @php
                            $modId = is_array($m) ? ($m['id'] ?? 0) : ($m->id ?? 0);
                            $mInfo = $s['modules_map'][$modId] ?? null;
                            $note = $mInfo ? $mInfo['final_grade'] : null;
                            $rawDec = $mInfo ? ($mInfo['decision'] ?? '') : '';
                            $decCode = ($rawDec === 'V.Comp' || $rawDec === 'VPC') ? 'VPC' : ($rawDec ?: (is_numeric($note) && floatval($note) >= 10.0 ? 'V' : 'NV'));
                            $isElim = is_numeric($note) && floatval($note) < 6.0;
                            $valYear = $mInfo['validation_year'] ?? '';
                            $isHist = !empty($mInfo['is_historical']) || (!empty($valYear) && str_replace('-', '/', $valYear) !== str_replace('-', '/', $acadName));
                            
                            $shortYear = '-';
                            if (!empty($valYear)) {
                                if (preg_match('/(\d{2,4})[\/\-](\d{2,4})/', $valYear, $ym)) {
                                    $shortYear = substr($ym[1], -2) . '-' . substr($ym[2], -2);
                                } else {
                                    $shortYear = $valYear;
                                }
                            }

                            $noteClass = 'val-bold';
                            if ($isElim) {
                                $noteClass .= ' note-elim';
                            } elseif (is_numeric($note) && floatval($note) >= 10.0) {
                                $noteClass .= ' note-pass';
                            } elseif (is_numeric($note)) {
                                $noteClass .= ' note-weak';
                            }
                        @endphp
                        {{-- Note --}}
                        <td class="cell-note {{ $isElim ? 'bg-elim' : '' }}">
                            <span class="{{ $noteClass }}">
                                {{ is_numeric($note) ? number_format((float)$note, 2) : '-' }}
                            </span>
                        </td>
                        {{-- Décision --}}
                        <td class="cell-dec {{ $isElim ? 'bg-elim' : '' }}">
                            <span class="dec-bold dec-{{ strtolower($decCode) }}">
                                {{ $decCode ?: '-' }}
                            </span>
                        </td>
                        {{-- Année --}}
                        <td class="cell-year {{ $isElim ? 'bg-elim' : '' }} {{ $loop->last ? 'sec-sep' : 'mod-sep' }}">
                            <span class="year-bold {{ $isHist ? 'year-hist' : '' }}">
                                {{ $shortYear }}
                            </span>
                        </td>
                    @endforeach

                    {{-- Moyenne S1 --}}
                    <td class="moy-s1">
                        {{ is_numeric($s['odd_semester_avg'] ?? null) ? number_format((float)$s['odd_semester_avg'], 2) : ($s['odd_semester_avg'] ?? '-') }}
                    </td>

                    {{-- Moyenne S2 --}}
                    <td class="moy-s2 sec-sep">
                        {{ is_numeric($s['even_semester_avg'] ?? null) ? number_format((float)$s['even_semester_avg'], 2) : ($s['even_semester_avg'] ?? '-') }}
                    </td>

                    {{-- Moyenne Annuelle --}}
                    <td class="moy-ann sec-sep">
                        {{ is_numeric($s['annual_average'] ?? null) ? number_format((float)$s['annual_average'], 2) : ($s['annual_average'] ?? '-') }}
                    </td>

                    {{-- Décision Finale de l'Année --}}
                    <td class="decision-cell">
                        @php $dec = $s['decision'] ?? 'AJ'; @endphp
                        @if($dec === 'V')
                            <div class="badge-annual badge-v">VALIDÉ DIRECT</div>
                            <span class="decision-subtext text-emerald">Admis Année Sup.</span>
                        @elseif($dec === 'V.Comp' || $dec === 'VPC')
                            <div class="badge-annual badge-vpc">VALIDÉ PAR COMP.</div>
                            <span class="decision-subtext text-indigo">Admis par Comp.</span>
                        @elseif($dec === 'PASS_DETTES')
                            <div class="badge-annual badge-dettes">PASSAGE DETTES</div>
                            <span class="decision-subtext text-amber">Admis (1 dette)</span>
                        @elseif($dec === 'FRAUDE' || ($s['has_fraud'] ?? false))
                            <div class="badge-annual badge-fraude">FRAUDE</div>
                            <span class="decision-subtext text-rose">Disciplinaire</span>
                        @elseif($dec === 'REDOUBLE' || (is_numeric($s['annual_average'] ?? null) && floatval($s['annual_average']) < 6.0))
                            <div class="badge-annual badge-aj">REDOUBLEMENT</div>
                            <span class="decision-subtext text-rose">Moyenne &lt; 6.00</span>
                        @else
                            <div class="badge-annual badge-aj">AJOURNÉ</div>
                            <span class="decision-subtext text-rose">Non Admis (NV)</span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Signatures Section: Semestre 2 & Président du Jury (8 Signataires Officiels) --}}
    <div class="signatures-section">
        <div class="signatures-title">
            Scellé Numérique &amp; Signatures des Enseignants du Semestre {{ $even_semester_label }} &amp; Président du Jury ({{ count($s2Juries) }} Signataires Officiels)
        </div>
        <table class="sig-grid">
            <tr>
                @php $s2BoxW = count($s2Juries) > 0 ? round(100 / count($s2Juries), 2) : 12.5; @endphp
                @foreach($s2Juries as $j)
                    <td class="sig-box" style="width: {{ $s2BoxW }}%;">
                        <div class="sig-header">
                            {{ $j['module_code'] ?? ($j['role'] === 'chef_filiere' ? 'CHEF DE FILIÈRE' : 'MODULE') }}
                        </div>
                        <div class="sig-name">{{ $j['user_name'] ?? 'Enseignant ENCG' }}</div>
                        <div class="sig-role">
                            {{ $j['role'] === 'chef_filiere' ? 'Président / Chef de Filière' : ($j['module_name'] ?? 'Professeur Responsable') }}
                        </div>
                        <div style="margin-top: 0.5px;">
                            @if(($j['status'] ?? '') === 'signed')
                                <span class="sig-status-badge sig-status-ok">SIGNÉ</span>
                                @if(!empty($j['signature_image']))
                                    <br><img src="{{ $j['signature_image'] }}" class="sig-img" alt="Signature">
                                @endif
                                @if(!empty($j['digital_seal']))
                                    <div class="sig-seal">SCELLÉ: {{ substr($j['digital_seal'], 0, 8) }}...</div>
                                @endif
                            @else
                                <span class="sig-status-badge sig-status-wait">EN ATTENTE</span>
                                <div class="sig-line-pending"></div>
                            @endif
                        </div>
                    </td>
                @endforeach
            </tr>
        </table>
    </div>

    {{-- Legal Footer (Page 2) --}}
    <table class="footer-table">
        <tr>
            <td style="text-align: left; width: 70%;">
                Document officiel certifié généré par l'ERP ENCG Fès — Toute rature ou falsification annule la validité du présent procès-verbal.
            </td>
            <td style="text-align: right; width: 30%;">
                <strong>Page 2 / 2</strong> &bull; ENCG-PV-ANNUEL-{{ $filiereCode }}-{{ str_replace('/', '', $acadName) }}
            </td>
        </tr>
    </table>

</body>
</html>

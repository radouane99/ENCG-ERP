<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>PV Officiel de Délibération Annuelle Consolidée (14 Modules) — ENCG Fès</title>
    @php
        $studentsList = $students ?? $matrix ?? [];
        $rowCount = count($studentsList);
        
        // Calibrage dynamique pour un rendu parfait sur 1 seule page A3 Paysage (Single Page Fit)
        if ($rowCount <= 15) {
            $tbPad = '2.2px 2px';
            $numFont = '8.0pt';
            $moyFont = '8.5pt';
            $tbFont = '7.2pt';
            $thFont = '7.0pt';
            $sigH = '30px';
        } elseif ($rowCount <= 28) {
            $tbPad = '0.5px 1.2px';
            $numFont = '6.8pt';
            $moyFont = '7.4pt';
            $tbFont = '6.0pt';
            $thFont = '6.0pt';
            $sigH = '16px';
        } else {
            $tbPad = '0.7px 1.2px';
            $numFont = '6.6pt';
            $moyFont = '7.0pt';
            $tbFont = '6.0pt';
            $thFont = '5.8pt';
            $sigH = '17px';
        }

        $filiereName = $filiere->name ?? 'Tronc Commun ENCG';
        $filiereCode = $filiere->code ?? 'TC';
        $acadName = $academicYear->name ?? date('Y').'/'.(date('Y')+1);
        $totalStudents = $rowCount;
        $valCount = collect($studentsList)->filter(fn($r) => in_array($r['decision'] ?? '', ['V', 'V.Comp', 'PASS_DETTES']))->count();
        $successRate = $totalStudents > 0 ? round(($valCount / $totalStudents) * 100, 1) : 0;

        $oddMods = collect($modules)->filter(fn($m) => (is_array($m) ? ($m['semester_number'] ?? 1) : ($m->semester_number ?? 1)) % 2 !== 0)->values();
        $evenMods = collect($modules)->filter(fn($m) => (is_array($m) ? ($m['semester_number'] ?? 2) : ($m->semester_number ?? 2)) % 2 === 0)->values();
    @endphp
    <style>
        @page {
            size: A3 landscape;
            margin: 3.5mm 5mm 3mm 5mm;
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
            line-height: 1.08;
        }

        /* ─── Institutional Header ─── */
        .inst-header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2px;
            border-bottom: 1.5px solid #001A4B;
            padding-bottom: 1.5px;
        }
        .inst-header-table td {
            vertical-align: middle;
        }
        .inst-logo-cell {
            width: 25%;
            text-align: left;
        }
        .inst-logo-cell img {
            max-height: 42px;
            max-width: 160px;
            height: auto;
            display: block;
        }
        .inst-center-cell {
            width: 50%;
            text-align: center;
        }
        .state-kingdom {
            font-size: 8.5pt;
            font-weight: 900;
            color: #001A4B;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .state-univ {
            font-size: 7.2pt;
            font-weight: 700;
            color: #334155;
            margin-top: 1px;
        }
        .state-school {
            font-size: 8pt;
            font-weight: 900;
            color: #001A4B;
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
            max-height: 38px;
            max-width: 38px;
        }
        .qr-meta {
            font-size: 5.8pt;
            color: #64748b;
            text-align: right;
            line-height: 1.12;
        }
        .qr-meta strong {
            color: #001A4B;
        }

        /* ─── Title Banner ─── */
        .title-banner {
            background-color: #001A4B;
            color: #ffffff;
            text-align: center;
            padding: 2.5px 5px;
            border-radius: 2px;
            margin-bottom: 2px;
        }
        .title-banner h1 {
            margin: 0;
            font-size: 8.5pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: #ffffff;
        }
        .title-banner p {
            margin: 0.5px 0 0 0;
            font-size: 6.2pt;
            color: #fde047;
            font-weight: 700;
            letter-spacing: 0.2px;
        }

        /* ─── Metadata Bar ─── */
        .meta-bar {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2px;
            background-color: #f8fafc;
            border: 0.75px solid #cbd5e1;
            border-radius: 2px;
        }
        .meta-bar td {
            padding: 1.5px 5px;
            font-size: 6.2pt;
            border-right: 0.75px solid #e2e8f0;
        }
        .meta-bar td:last-child {
            border-right: none;
        }
        .meta-label {
            font-weight: 900;
            color: #001A4B;
            text-transform: uppercase;
            font-size: 6pt;
        }
        .meta-val {
            font-weight: 800;
            color: #1e293b;
        }

        /* ─── Main Matrix Table ─── */
        .matrix-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2.5px;
        }
        .matrix-table th, .matrix-table td {
            border: 0.6px solid #94a3b8;
            padding: {{ $tbPad }};
            text-align: center;
            font-size: {{ $tbFont }};
            line-height: 1.05;
        }
        .matrix-table thead th {
            background-color: #001A4B;
            color: #ffffff;
            font-weight: 900;
            text-transform: uppercase;
            font-size: {{ $thFont }};
        }
        .matrix-table thead th.s1-head {
            background-color: #1e1b4b;
            color: #ffffff;
            border-right: 2px solid #001A4B !important;
        }
        .matrix-table thead th.s2-head {
            background-color: #1e3a8a;
            color: #ffffff;
            border-right: 2px solid #001A4B !important;
        }
        .matrix-table thead th.sub-head {
            background-color: #0f2863;
            color: #e2e8f0;
            font-size: 6.2pt;
            font-weight: 800;
            padding: 2px 1px;
        }
        .matrix-table thead th.sub-head-res {
            background-color: #172554;
            color: #fef08a;
            font-size: 6.2pt;
            font-weight: 900;
        }
        .matrix-table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        /* Column Specifics */
        .border-sep {
            border-right: 2px solid #001A4B !important;
        }
        .idx-cell {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 800;
            font-size: {{ $numFont }};
            color: #64748b;
            background-color: #f8fafc;
        }
        .id-num-cell {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 800;
            font-size: {{ $numFont }};
            color: #001A4B;
            white-space: nowrap;
        }
        .cin-cell {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 800;
            font-size: {{ $numFont }};
            color: #1e293b;
            white-space: nowrap;
        }
        .student-name {
            text-align: left !important;
            font-weight: 800;
            color: #0f172a;
            white-space: nowrap;
            padding-left: 5px !important;
            font-size: {{ $tbFont }};
        }

        /* Grades & Moyennes */
        .note-num {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 800;
            font-size: {{ $numFont }};
            color: #000000;
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
            background-color: #fef2f2 !important;
            font-weight: 900;
        }

        .moy-s1 {
            background-color: #e0e7ff;
            color: #1e1b4b;
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 900;
            font-size: {{ $numFont }};
        }
        .moy-s2 {
            background-color: #dbeafe;
            color: #1e3a8a;
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 900;
            font-size: {{ $numFont }};
        }
        .moy-ann {
            background-color: #fef3c7;
            color: #78350f;
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 900;
            font-size: {{ $moyFont }};
            letter-spacing: -0.2px;
        }

        /* Badges strictly V, VAR, VPC, NV */
        .badge {
            display: inline-block;
            padding: 1px 3px;
            border-radius: 2px;
            font-size: 5.8pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            line-height: 1;
            margin-top: 1px;
        }
        .badge-v {
            background-color: #dcfce7;
            color: #15803d;
            border: 0.5px solid #86efac;
        }
        .badge-vpc {
            background-color: #e0e7ff;
            color: #3730a3;
            border: 0.5px solid #a5b4fc;
        }
        .badge-var {
            background-color: #e0f2fe;
            color: #0369a1;
            border: 0.5px solid #7dd3fc;
        }
        .badge-dettes {
            background-color: #fef3c7;
            color: #b45309;
            border: 0.5px solid #fcd34d;
        }
        .badge-aj {
            background-color: #fee2e2;
            color: #b91c1c;
            border: 0.5px solid #fca5a5;
        }
        .badge-fraude {
            background-color: #450a0a;
            color: #ffffff;
            border: 0.5px solid #000000;
        }
        
        .hist-year {
            font-size: 5pt;
            color: #6b21a8;
            font-weight: 900;
            display: block;
            margin-top: 1px;
        }
        .reason-text {
            font-size: 5.2pt;
            color: #475569;
            font-weight: 700;
            display: block;
            margin-top: 1px;
            line-height: 1.0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 135px;
        }

        /* ─── Signatures Section (15 Members: 14 Modules + 1 Chef de Filière) ─── */
        .signatures-section {
            margin-top: 3px;
            page-break-inside: avoid;
        }
        .signatures-title {
            font-size: 7.2pt;
            font-weight: 900;
            color: #001A4B;
            margin-bottom: 2.5px;
            text-transform: uppercase;
            border-bottom: 1.5px solid #001A4B;
            padding-bottom: 1.5px;
            letter-spacing: 0.4px;
        }
        .sig-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2px;
        }
        .sig-box {
            border: 1px solid #001A4B;
            border-radius: 2px;
            padding: 2px 3px;
            text-align: center;
            background-color: #ffffff;
            height: {{ $sigH }};
            vertical-align: top;
        }
        .sig-header {
            font-size: 6.2pt;
            font-weight: 900;
            color: #001A4B;
            text-transform: uppercase;
            border-bottom: 0.5px solid #cbd5e1;
            padding-bottom: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .sig-name {
            font-size: 6.2pt;
            color: #0f172a;
            font-weight: 800;
            margin-top: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .sig-role {
            font-size: 5.5pt;
            font-weight: 700;
            color: #64748b;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .sig-status-badge {
            display: inline-block;
            font-size: 5.2pt;
            font-weight: 900;
            padding: 0.8px 3px;
            border-radius: 1.5px;
            text-transform: uppercase;
            margin-top: 1px;
        }
        .sig-status-ok {
            background-color: #15803d;
            color: #ffffff;
        }
        .sig-status-wait {
            background-color: #d97706;
            color: #ffffff;
        }
        .sig-seal {
            font-size: 5pt;
            font-family: monospace;
            color: #047857;
            font-weight: bold;
            margin-top: 1px;
        }
        .sig-img {
            max-height: 14px;
            max-width: 75px;
            margin-top: 1px;
        }
        .sig-line-pending {
            border-bottom: 0.5px dashed #94a3b8;
            height: 10px;
            margin-top: 2px;
        }

        /* ─── Footer ─── */
        .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 2px;
            border-top: 0.5px solid #cbd5e1;
            padding-top: 1.5px;
        }
        .footer-table td {
            font-size: 5.5pt;
            color: #64748b;
            font-weight: 700;
        }
    </style>
</head>
<body>

    {{-- Institutional Header --}}
    <table class="inst-header-table">
        <tr>
            <td class="inst-logo-cell">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo ENCG Fès">
                @else
                    <div style="font-size: 13pt; font-weight: 900; color: #001A4B;">ENCG FÈS</div>
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

    {{-- Title Banner --}}
    <div class="title-banner">
        <h1>Procès-Verbal Officiel de Délibération Annuelle Consolidée — 14 Modules</h1>
        <p>Filière : {{ $filiereName }} &bull; Niveau : {{ $yearLevel }}ère/ème Année ({{ $odd_semester_label }} + {{ $even_semester_label }}) &bull; Session Ordinaire Normale</p>
    </div>

    {{-- Metadata Bar --}}
    <table class="meta-bar">
        <tr>
            <td><span class="meta-label">Filière :</span> <span class="meta-val">{{ $filiereName }} ({{ $filiereCode }})</span></td>
            <td><span class="meta-label">Niveau :</span> <span class="meta-val">{{ $yearLevel }}ème Année ({{ $odd_semester_label }} + {{ $even_semester_label }})</span></td>
            <td><span class="meta-label">Année Académique :</span> <span class="meta-val">{{ $acadName }}</span></td>
            <td><span class="meta-label">Effectif :</span> <span class="meta-val">{{ $totalStudents }} Étudiants</span></td>
            <td><span class="meta-label">Taux Réussite :</span> <span class="meta-val">{{ $successRate }}% Admis</span></td>
            <td><span class="meta-label">Édité le :</span> <span class="meta-val">{{ $date }}</span></td>
        </tr>
    </table>

    {{-- Master 14 Modules Table --}}
    <table class="matrix-table">
        <thead>
            <tr>
                <th rowspan="2" class="border-sep" style="width: 2.2%;">N°</th>
                <th rowspan="2" class="border-sep" style="width: 5.5%;">APOGÉE / CNE</th>
                <th rowspan="2" class="border-sep" style="width: 4.5%;">CIN</th>
                <th rowspan="2" class="border-sep" style="width: 11%;">NOM & PRÉNOM ÉTUDIANT</th>

                {{-- Header Semestre Impair (ex: S1/S3/S5) --}}
                <th colspan="{{ $oddMods->count() + 2 }}" class="s1-head border-sep">
                    MODULES {{ $odd_semester_label }} ({{ $oddMods->count() }} MODULES)
                </th>

                {{-- Header Semestre Pair (ex: S2/S4/S6) --}}
                <th colspan="{{ $evenMods->count() + 2 }}" class="s2-head border-sep">
                    MODULES {{ $even_semester_label }} ({{ $evenMods->count() }} MODULES)
                </th>

                <th rowspan="2" class="border-sep" style="width: 4.2%;">MOY. ANN.</th>
                <th rowspan="2" style="width: 11.6%;">DÉCISION DU JURY</th>
            </tr>
            <tr>
                {{-- S1 Subheaders --}}
                @foreach($oddMods as $m)
                    @php $mCode = is_array($m) ? ($m['code'] ?? '') : ($m->code ?? ''); @endphp
                    <th class="sub-head" title="{{ is_array($m) ? ($m['name'] ?? '') : ($m->name ?? '') }}">
                        {{ $mCode }}
                    </th>
                @endforeach
                <th class="sub-head sub-head-res" style="width: 3.5%;">MOY {{ $odd_semester_label }}</th>
                <th class="sub-head sub-head-res border-sep" style="width: 3.2%;">DÉC. {{ $odd_semester_label }}</th>

                {{-- S2 Subheaders --}}
                @foreach($evenMods as $m)
                    @php $mCode = is_array($m) ? ($m['code'] ?? '') : ($m->code ?? ''); @endphp
                    <th class="sub-head" title="{{ is_array($m) ? ($m['name'] ?? '') : ($m->name ?? '') }}">
                        {{ $mCode }}
                    </th>
                @endforeach
                <th class="sub-head sub-head-res" style="width: 3.5%;">MOY {{ $even_semester_label }}</th>
                <th class="sub-head sub-head-res border-sep" style="width: 3.2%;">DÉC. {{ $even_semester_label }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($studentsList as $index => $s)
                <tr>
                    <td class="idx-cell border-sep">{{ $index + 1 }}</td>
                    <td class="id-num-cell border-sep">{{ $s['cne'] ?? $s['student_id'] ?? '-' }}</td>
                    <td class="cin-cell border-sep">{{ $s['cin'] ?? '-' }}</td>
                    <td class="student-name border-sep">{{ $s['student_name'] ?? '-' }}</td>

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
                            
                            $noteClass = 'note-num';
                            if ($isElim) {
                                $noteClass .= ' note-elim';
                            } elseif (is_numeric($note) && floatval($note) >= 10.0) {
                                $noteClass .= ' note-pass';
                            } elseif (is_numeric($note)) {
                                $noteClass .= ' note-weak';
                            }
                        @endphp
                        <td style="{{ $isElim ? 'background-color: #fef2f2;' : '' }}">
                            <div class="{{ $noteClass }}">
                                {{ is_numeric($note) ? number_format((float)$note, 2) : '-' }}
                            </div>
                            @if($decCode)
                                <span class="badge {{ $decCode === 'V' ? 'badge-v' : ($decCode === 'VAR' ? 'badge-var' : ($decCode === 'VPC' ? 'badge-vpc' : 'badge-aj')) }}">
                                    {{ $decCode }}
                                </span>
                            @endif
                            @if($isHist)
                                <span class="hist-year">({{ $valYear }})</span>
                            @endif
                        </td>
                    @endforeach

                    {{-- S1 Moyenne & Décision --}}
                    <td class="moy-s1">
                        {{ is_numeric($s['odd_semester_avg'] ?? null) ? number_format((float)$s['odd_semester_avg'], 2) : ($s['odd_semester_avg'] ?? '-') }}
                    </td>
                    <td class="moy-s1 border-sep">
                        @php $s1Dec = $s['odd_semester_decision'] ?? 'NV'; @endphp
                        <span class="badge {{ $s1Dec === 'V' ? 'badge-v' : ($s1Dec === 'V.Comp' || $s1Dec === 'VPC' ? 'badge-vpc' : 'badge-aj') }}">
                            {{ $s1Dec === 'V.Comp' ? 'VPC' : $s1Dec }}
                        </span>
                    </td>

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
                            
                            $noteClass = 'note-num';
                            if ($isElim) {
                                $noteClass .= ' note-elim';
                            } elseif (is_numeric($note) && floatval($note) >= 10.0) {
                                $noteClass .= ' note-pass';
                            } elseif (is_numeric($note)) {
                                $noteClass .= ' note-weak';
                            }
                        @endphp
                        <td style="{{ $isElim ? 'background-color: #fef2f2;' : '' }}">
                            <div class="{{ $noteClass }}">
                                {{ is_numeric($note) ? number_format((float)$note, 2) : '-' }}
                            </div>
                            @if($decCode)
                                <span class="badge {{ $decCode === 'V' ? 'badge-v' : ($decCode === 'VAR' ? 'badge-var' : ($decCode === 'VPC' ? 'badge-vpc' : 'badge-aj')) }}">
                                    {{ $decCode }}
                                </span>
                            @endif
                            @if($isHist)
                                <span class="hist-year">({{ $valYear }})</span>
                            @endif
                        </td>
                    @endforeach

                    {{-- S2 Moyenne & Décision --}}
                    <td class="moy-s2">
                        {{ is_numeric($s['even_semester_avg'] ?? null) ? number_format((float)$s['even_semester_avg'], 2) : ($s['even_semester_avg'] ?? '-') }}
                    </td>
                    <td class="moy-s2 border-sep">
                        @php $s2Dec = $s['even_semester_decision'] ?? 'NV'; @endphp
                        <span class="badge {{ $s2Dec === 'V' ? 'badge-v' : ($s2Dec === 'V.Comp' || $s2Dec === 'VPC' ? 'badge-vpc' : 'badge-aj') }}">
                            {{ $s2Dec === 'V.Comp' ? 'VPC' : $s2Dec }}
                        </span>
                    </td>

                    {{-- Moyenne Annuelle --}}
                    <td class="moy-ann border-sep">
                        {{ is_numeric($s['annual_average'] ?? null) ? number_format((float)$s['annual_average'], 2) : ($s['annual_average'] ?? '-') }}
                    </td>

                    {{-- Décision Finale du Jury --}}
                    <td style="text-align: right; padding-right: 4px;">
                        @php $dec = $s['decision'] ?? 'AJ'; @endphp
                        @if($dec === 'V')
                            <span class="badge badge-v">VALIDÉ DIRECT</span>
                        @elseif($dec === 'V.Comp' || $dec === 'VPC')
                            <span class="badge badge-vpc">VALIDÉ P. COMP</span>
                        @elseif($dec === 'PASS_DETTES')
                            <span class="badge badge-dettes">PASSAGE AVEC DETTES</span>
                        @elseif($dec === 'FRAUDE' || ($s['has_fraud'] ?? false))
                            <span class="badge badge-fraude">FRAUDE</span>
                        @else
                            <span class="badge badge-aj">AJOURNÉ / REDOUBLEMENT</span>
                        @endif

                        @if(!empty($s['decision_reason']) && $dec !== 'V')
                            <span class="reason-text">{{ $s['decision_reason'] }}</span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Signatures Section: Complete Grid of ALL 15 Jury Members (14 Module Professors + Chef de Filière) --}}
    <div class="signatures-section">
        <div class="signatures-title">
            Scellé Numérique & Signatures des Membres du Jury de Délibération Annuelle ({{ count($juries ?? []) }} Signataires Officiels)
        </div>

        @php
            $juryList = collect($juries ?? []);
            $chunkedJuries = $juryList->chunk(5); // 5 columns per row for clean landscape alignment (3 rows of 5)
        @endphp

        @foreach($chunkedJuries as $row)
            <table class="sig-grid">
                <tr>
                    @foreach($row as $j)
                        <td class="sig-box" style="width: 20%;">
                            <div class="sig-header">
                                {{ $j['module_code'] ?? ($j['role'] === 'chef_filiere' ? 'CHEF DE FILIÈRE' : 'MODULE') }}
                            </div>
                            <div class="sig-name">{{ $j['user_name'] ?? 'Enseignant ENCG' }}</div>
                            <div class="sig-role">
                                {{ $j['role'] === 'chef_filiere' ? 'Président / Chef de Filière' : ($j['module_name'] ?? 'Professeur Responsable') }}
                            </div>
                            <div style="margin-top: 1px;">
                                @if(($j['status'] ?? '') === 'signed')
                                    <span class="sig-status-badge sig-status-ok">SIGNÉ</span>
                                    @if(!empty($j['signature_image']))
                                        <br><img src="{{ $j['signature_image'] }}" class="sig-img" alt="Signature">
                                    @endif
                                    @if(!empty($j['digital_seal']))
                                        <div class="sig-seal">SCELLÉ: {{ substr($j['digital_seal'], 0, 10) }}...</div>
                                    @endif
                                @else
                                    <span class="sig-status-badge sig-status-wait">EN ATTENTE</span>
                                    <div class="sig-line-pending"></div>
                                @endif
                            </div>
                        </td>
                    @endforeach

                    {{-- Fill empty cells if row has fewer than 5 members --}}
                    @for($i = count($row); $i < 5; $i++)
                        <td style="width: 20%; border: none; background: transparent;"></td>
                    @endfor
                </tr>
            </table>
        @endforeach
    </div>

    {{-- Legal Footer --}}
    <table class="footer-table">
        <tr>
            <td style="text-align: left; width: 70%;">
                Document officiel certifié généré par l'ERP ENCG Fès — Toute rature ou falsification annule la validité du présent procès-verbal.
            </td>
            <td style="text-align: right; width: 30%;">
                Page 1 / 1 &bull; Code Délibération : ENCG-PV-ANNUEL-{{ $filiereCode }}-{{ str_replace('/', '', $acadName) }}
            </td>
        </tr>
    </table>

</body>
</html>

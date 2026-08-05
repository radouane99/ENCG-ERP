<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>PV Annuel Consolidé - ENCG Fès</title>
    <style>
        @page {
            size: a3 landscape;
            margin: 8mm;
        }
        body {
            font-family: 'DejaVu Sans', 'Helvetica', 'Arial', sans-serif;
            font-size: 8.5pt;
            color: #000000;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            border-bottom: 3px solid #0f2863;
            padding-bottom: 6px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .logo-title {
            font-size: 14pt;
            font-weight: 900;
            color: #0f2863;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .subtitle {
            font-size: 9pt;
            color: #000000;
            font-weight: bold;
            margin-top: 2px;
        }
        .badge-year {
            display: inline-block;
            background-color: #e2e8f0;
            color: #000000;
            padding: 3px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 8pt;
            border: 1.5px solid #64748b;
        }
        
        /* Master Matrix Table */
        .matrix-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 8pt;
            color: #000000;
        }
        .matrix-table th, .matrix-table td {
            border: 2px solid #000000;
            padding: 4px 3px;
            text-align: center;
        }
        .matrix-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 900;
            font-size: 7.5pt;
            text-transform: uppercase;
        }
        .matrix-table th.sub-head {
            background-color: #1e293b;
            color: #ffffff;
            font-size: 7pt;
            font-weight: 900;
        }
        .matrix-table th.s1-head {
            background-color: #1e1b4b;
            color: #ffffff;
        }
        .matrix-table th.s2-head {
            background-color: #1e3a8a;
            color: #ffffff;
        }

        /* Bold Separator Lines */
        .border-s1-separator {
            border-right: 5px solid #000000 !important;
        }

        .student-name {
            text-align: left !important;
            font-weight: 900;
            color: #000000;
            white-space: nowrap;
            padding-left: 6px !important;
        }
        .cne-col {
            font-family: monospace;
            font-weight: 900;
            color: #000000;
        }
        .moy-s1 {
            background-color: #e0e7ff;
            color: #000000;
            font-weight: 900;
            font-size: 8.5pt;
        }
        .moy-s2 {
            background-color: #dbeafe;
            color: #000000;
            font-weight: 900;
            font-size: 8.5pt;
        }
        .moy-ann {
            background-color: #fef3c7;
            color: #000000;
            font-weight: 900;
            font-size: 9pt;
        }
        
        /* Badges strictly V, VAR, VPC, NV */
        .badge {
            display: inline-block;
            padding: 1.5px 5px;
            border-radius: 3px;
            font-size: 7pt;
            font-weight: 900;
            text-transform: uppercase;
        }
        .badge-v { background-color: #dcfce7; color: #14532d; border: 1px solid #16a34a; }
        .badge-var { background-color: #dbeafe; color: #1e3a8a; border: 1px solid #2563eb; }
        .badge-vpc { background-color: #e0e7ff; color: #3730a3; border: 1px solid #6366f1; }
        .badge-dettes { background-color: #fef3c7; color: #78350f; border: 1.5px solid #d97706; }
        .badge-aj { background-color: #ffe4e6; color: #881337; border: 1.5px solid #e11d48; }
        .badge-fraude { background-color: #881337; color: #ffffff; border: 1px solid #000000; }
        
        .hist-year {
            font-size: 6.5pt;
            color: #581c87;
            font-weight: 900;
            display: block;
            margin-top: 1px;
        }
        
        /* Decision Reason */
        .reason-text {
            font-size: 6.5pt;
            color: #000000;
            font-weight: bold;
            display: block;
            margin-top: 1.5px;
        }

        /* Signatures Grid */
        .signatures-section {
            margin-top: 15px;
            page-break-inside: avoid;
        }
        .signatures-title {
            font-size: 9.5pt;
            font-weight: 900;
            color: #0f2863;
            margin-bottom: 6px;
            text-transform: uppercase;
            border-bottom: 2px solid #0f2863;
            padding-bottom: 3px;
        }
        .sig-grid {
            width: 100%;
            border-collapse: collapse;
        }
        .sig-box {
            border: 1.5px solid #475569;
            border-radius: 6px;
            padding: 6px;
            text-align: center;
            background-color: #f8fafc;
            height: 65px;
            vertical-align: top;
        }
        .sig-role {
            font-size: 8pt;
            font-weight: 900;
            color: #000000;
        }
        .sig-name {
            font-size: 7.5pt;
            color: #334155;
            font-weight: bold;
            margin-top: 2px;
        }
        .sig-seal {
            font-size: 6.5pt;
            font-family: monospace;
            color: #047857;
            font-weight: bold;
            margin-top: 4px;
        }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 70%;">
                <div class="logo-title">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                <div class="subtitle">Procès-Verbal Officiel de Délibération Annuelle Fusionnée (14 Modules)</div>
                <div style="margin-top: 4px;">
                    <span class="badge-year">Filière : {{ $filiere->name ?? 'Tronc Commun ENCG' }}</span>
                    <span class="badge-year">Niveau : {{ $yearLevel }}ème Année ({{ $odd_semester_label }} + {{ $even_semester_label }})</span>
                    <span class="badge-year">Année Académique : {{ $academicYear->name ?? '2026/2027' }}</span>
                </div>
            </td>
            <td style="width: 30%; text-align: right;">
                <div style="font-size: 8.5pt; font-weight: 900; color: #000000;">ROYAUME DU MAROC</div>
                <div style="font-size: 8pt; color: #000000; font-weight: bold;">Université Sidi Mohamed Ben Abdellah</div>
                <div style="font-size: 7.5pt; color: #334155; font-weight: bold; margin-top: 4px;">Édité le {{ $date }}</div>
            </td>
        </tr>
    </table>

    <table class="matrix-table">
        <thead>
            <tr>
                <th rowspan="2" class="border-s1-separator" style="width: 7%;">CNE / APOGÉE</th>
                <th rowspan="2" class="border-s1-separator" style="width: 14%;">NOM & PRÉNOM ÉTUDIANT</th>
                @php
                    $oddMods = collect($modules)->filter(fn($m) => ($m['semester_number'] ?? $m->semester_number) % 2 !== 0);
                    $evenMods = collect($modules)->filter(fn($m) => ($m['semester_number'] ?? $m->semester_number) % 2 === 0);
                @endphp
                <th colspan="{{ $oddMods->count() + 2 }}" class="s1-head border-s1-separator">MODULES {{ $odd_semester_label }} ({{ $oddMods->count() }} MODULES)</th>
                <th colspan="{{ $evenMods->count() + 2 }}" class="s2-head border-s1-separator">MODULES {{ $even_semester_label }} ({{ $evenMods->count() }} MODULES)</th>
                <th rowspan="2" class="border-s1-separator" style="width: 5%;">MOY. ANN.</th>
                <th rowspan="2" style="width: 14%;">DÉCISION FINALE DU JURY</th>
            </tr>
            <tr>
                @foreach($oddMods as $m)
                    <th class="sub-head" title="{{ $m['name'] ?? $m->name }}">{{ $m['code'] ?? $m->code }}</th>
                @endforeach
                <th class="sub-head" style="width: 4%;">MOY {{ $odd_semester_label }}</th>
                <th class="sub-head border-s1-separator" style="width: 4.5%;">DÉC. {{ $odd_semester_label }}</th>

                @foreach($evenMods as $m)
                    <th class="sub-head" title="{{ $m['name'] ?? $m->name }}">{{ $m['code'] ?? $m->code }}</th>
                @endforeach
                <th class="sub-head" style="width: 4%;">MOY {{ $even_semester_label }}</th>
                <th class="sub-head border-s1-separator" style="width: 4.5%;">DÉC. {{ $even_semester_label }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($students as $s)
                <tr>
                    <td class="cne-col border-s1-separator">{{ $s['cne'] ?? $s['student_id'] }}</td>
                    <td class="student-name border-s1-separator">{{ $s['student_name'] }}</td>
                    
                    {{-- S1 Modules --}}
                    @foreach($oddMods as $m)
                        @php
                            $modId = $m['id'] ?? $m->id;
                            $mInfo = $s['modules_map'][$modId] ?? null;
                            $note = $mInfo ? $mInfo['final_grade'] : '-';
                            $rawDec = $mInfo ? $mInfo['decision'] : '';
                            $decCode = ($rawDec === 'V.Comp' || $rawDec === 'VPC') ? 'VPC' : ($rawDec ?: 'NV');
                            $isElim = $mInfo && floatval($mInfo['final_grade']) < 5.0;
                            $valYear = $mInfo['validation_year'] ?? '2026/2027';
                            $isHist = $mInfo['is_historical'] ?? false;
                        @endphp
                        <td style="{{ $isElim ? 'background-color: #ffe4e6;' : '' }}">
                            <div style="font-weight: 900; color: #000000; font-size: 8.5pt;">{{ $note }}</div>
                            @if($decCode)
                                <span class="badge {{ $decCode === 'V' ? 'badge-v' : ($decCode === 'VAR' ? 'badge-var' : ($decCode === 'VPC' ? 'badge-vpc' : 'badge-aj')) }}">
                                    {{ $decCode }}
                                </span>
                            @endif
                            @if($isHist || $valYear !== '2026/2027')
                                <span class="hist-year">🏛️ {{ $valYear }}</span>
                            @endif
                        </td>
                    @endforeach
                    <td class="moy-s1">{{ $s['odd_semester_avg'] }}</td>
                    <td class="moy-s1 border-s1-separator">
                        <span class="badge {{ ($s['odd_semester_decision'] ?? '') === 'V' ? 'badge-v' : (($s['odd_semester_decision'] ?? '') === 'V.Comp' ? 'badge-vpc' : 'badge-aj') }}">
                            {{ $s['odd_semester_decision'] ?? 'NV' }}
                        </span>
                    </td>

                    {{-- S2 Modules --}}
                    @foreach($evenMods as $m)
                        @php
                            $modId = $m['id'] ?? $m->id;
                            $mInfo = $s['modules_map'][$modId] ?? null;
                            $note = $mInfo ? $mInfo['final_grade'] : '-';
                            $rawDec = $mInfo ? $mInfo['decision'] : '';
                            $decCode = ($rawDec === 'V.Comp' || $rawDec === 'VPC') ? 'VPC' : ($rawDec ?: 'NV');
                            $isElim = $mInfo && floatval($mInfo['final_grade']) < 5.0;
                            $valYear = $mInfo['validation_year'] ?? '2026/2027';
                            $isHist = $mInfo['is_historical'] ?? false;
                        @endphp
                        <td style="{{ $isElim ? 'background-color: #ffe4e6;' : '' }}">
                            <div style="font-weight: 900; color: #000000; font-size: 8.5pt;">{{ $note }}</div>
                            @if($decCode)
                                <span class="badge {{ $decCode === 'V' ? 'badge-v' : ($decCode === 'VAR' ? 'badge-var' : ($decCode === 'VPC' ? 'badge-vpc' : 'badge-aj')) }}">
                                    {{ $decCode }}
                                </span>
                            @endif
                            @if($isHist || $valYear !== '2026/2027')
                                <span class="hist-year">🏛️ {{ $valYear }}</span>
                            @endif
                        </td>
                    @endforeach
                    <td class="moy-s2">{{ $s['even_semester_avg'] }}</td>
                    <td class="moy-s2 border-s1-separator">
                        <span class="badge {{ ($s['even_semester_decision'] ?? '') === 'V' ? 'badge-v' : (($s['even_semester_decision'] ?? '') === 'V.Comp' ? 'badge-vpc' : 'badge-aj') }}">
                            {{ $s['even_semester_decision'] ?? 'NV' }}
                        </span>
                    </td>

                    <td class="moy-ann border-s1-separator">{{ $s['annual_average'] }} /20</td>
                    <td style="text-align: right; padding-right: 6px;">
                        @if($s['decision'] === 'V')
                            <span class="badge badge-v">✓ Validé ({{ $odd_semester_label }}+{{ $even_semester_label }})</span>
                        @elseif($s['decision'] === 'V.Comp')
                            <span class="badge badge-var">⚖️ Validé p. Comp ({{ $odd_semester_label }}+{{ $even_semester_label }})</span>
                        @elseif($s['decision'] === 'PASS_DETTES')
                            <span class="badge badge-dettes">🎒 Passage avec Dettes</span>
                        @elseif($s['decision'] === 'FRAUDE' || ($s['has_fraud'] ?? false))
                            <span class="badge badge-fraude">🚫 FRAUDE (Disciplinaire)</span>
                        @else
                            <span class="badge badge-aj">❌ Redoublement / Ajourné</span>
                        @endif
                        @if(!empty($s['decision_reason']) && $s['decision'] !== 'V')
                            <span class="reason-text">{{ $s['decision_reason'] }}</span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="signatures-section">
        <div class="signatures-title">Scellé Numérique & Signatures des Membres du Jury de Délibération Annuelle</div>
        <table class="sig-grid">
            <tr>
                @foreach(array_slice($juries ?? [], 0, 4) as $j)
                    <td class="sig-box" style="width: 25%;">
                        <div class="sig-role">{{ $j['role'] === 'chef_filiere' ? 'Chef de Filière / Présidence Jury' : ($j['module_name'] ?? 'Professeur Module') }}</div>
                        <div class="sig-name">{{ $j['user_name'] ?? 'Enseignant ENCG' }}</div>
                        <div style="margin-top: 6px;">
                            <span class="badge {{ ($j['status'] ?? '') === 'signed' ? 'badge-v' : 'badge-dettes' }}">
                                {{ ($j['status'] ?? '') === 'signed' ? '✓ Signé' : 'En Attente' }}
                            </span>
                        </div>
                        @if(!empty($j['digital_seal']))
                            <div class="sig-seal">SCELLÉ: {{ substr($j['digital_seal'], 0, 14) }}...</div>
                        @endif
                    </td>
                @endforeach
            </tr>
        </table>
    </div>

</body>
</html>

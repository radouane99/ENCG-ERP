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
            font-family: 'DejaVu Sans', 'Helvetica Neue', 'Arial', sans-serif;
            font-size: 8pt;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        /* Top Header Table */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            border-bottom: 3.5px solid #0f2863;
            padding-bottom: 6px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .logo-img {
            max-height: 60px;
            max-width: 160px;
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
            color: #1e293b;
            font-weight: 900;
            margin-top: 3px;
        }
        .badge-year {
            display: inline-block;
            background-color: #f1f5f9;
            color: #0f172a;
            padding: 3px 8px;
            border-radius: 5px;
            font-weight: 800;
            font-size: 8pt;
            border: 1px solid #64748b;
            margin-right: 4px;
        }
        
        /* Master Matrix Table */
        .matrix-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 7.5pt;
            color: #0f172a;
        }
        .matrix-table th, .matrix-table td {
            border: 1.5px solid #0f172a;
            padding: 4px 3px;
            text-align: center;
        }
        .matrix-table th {
            background-color: #0f2863;
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
            border-right: 3.5px solid #0f172a !important;
        }

        .student-name {
            text-align: left !important;
            font-weight: 900;
            color: #0f172a;
            white-space: nowrap;
            padding-left: 6px !important;
        }
        .cne-col {
            font-family: monospace;
            font-weight: 900;
            color: #0f172a;
        }
        .moy-s1 {
            background-color: #e0e7ff;
            color: #0f172a;
            font-weight: 900;
            font-size: 8pt;
        }
        .moy-s2 {
            background-color: #dbeafe;
            color: #0f172a;
            font-weight: 900;
            font-size: 8pt;
        }
        .moy-ann {
            background-color: #fef3c7;
            color: #0f172a;
            font-weight: 900;
            font-size: 8.5pt;
        }
        
        /* Badges strictly V, VAR, VPC, NV */
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 7pt;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .badge-v { background-color: #15803d; color: #ffffff; border: 1px solid #14532d; }
        .badge-var { background-color: #4338ca; color: #ffffff; border: 1px solid #3730a3; }
        .badge-vpc { background-color: #3730a3; color: #ffffff; border: 1px solid #312e81; }
        .badge-dettes { background-color: #d97706; color: #ffffff; border: 1px solid #b45309; }
        .badge-aj { background-color: #be123c; color: #ffffff; border: 1px solid #881337; }
        .badge-fraude { background-color: #4c0519; color: #ffffff; border: 1px solid #000000; }
        
        .hist-year {
            font-size: 6pt;
            color: #581c87;
            font-weight: 900;
            display: block;
            margin-top: 1px;
        }
        
        /* Decision Reason */
        .reason-text {
            font-size: 6.5pt;
            color: #334155;
            font-weight: bold;
            display: block;
            margin-top: 2px;
        }

        /* Signatures Section */
        .signatures-section {
            margin-top: 16px;
            page-break-inside: avoid;
        }
        .signatures-title {
            font-size: 9.5pt;
            font-weight: 900;
            color: #0f2863;
            margin-bottom: 8px;
            text-transform: uppercase;
            border-bottom: 2.5px solid #0f2863;
            padding-bottom: 4px;
        }
        .sig-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }
        .sig-box {
            border: 1.5px solid #0f172a;
            border-radius: 5px;
            padding: 5px;
            text-align: center;
            background-color: #f8fafc;
            height: 65px;
            vertical-align: top;
        }
        .sig-header {
            font-size: 7pt;
            font-weight: 900;
            color: #0f2863;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 2px;
            margin-bottom: 3px;
        }
        .sig-role {
            font-size: 7pt;
            font-weight: 900;
            color: #0f172a;
        }
        .sig-name {
            font-size: 7.5pt;
            color: #334155;
            font-weight: bold;
            margin-top: 1px;
        }
        .sig-seal {
            font-size: 5.5pt;
            font-family: monospace;
            color: #047857;
            font-weight: bold;
            margin-top: 2px;
        }
        .sig-img {
            max-height: 30px;
            max-width: 130px;
            margin-top: 2px;
        }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td style="width: 15%;">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" class="logo-img" alt="Logo ENCG Fès">
                @else
                    <div style="font-weight: 900; color: #0f2863; font-size: 12pt;">ENCG FÈS</div>
                @endif
            </td>
            <td style="width: 60%; text-align: center;">
                <div class="logo-title">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                <div class="subtitle">Procès-Verbal Officiel de Délibération Annuelle Fusionnée (14 Modules)</div>
                <div style="margin-top: 5px;">
                    <span class="badge-year">Filière : {{ $filiere->name ?? 'Tronc Commun ENCG' }}</span>
                    <span class="badge-year">Niveau : {{ $yearLevel }}ème Année ({{ $odd_semester_label }} + {{ $even_semester_label }})</span>
                    <span class="badge-year">Année Académique : {{ $academicYear->name ?? '2026/2027' }}</span>
                </div>
            </td>
            <td style="width: 25%; text-align: right;">
                <div style="font-size: 8.5pt; font-weight: 900; color: #0f172a;">ROYAUME DU MAROC</div>
                <div style="font-size: 8pt; color: #1e293b; font-weight: bold;">Université Sidi Mohamed Ben Abdellah</div>
                <div style="font-size: 7.5pt; color: #475569; font-weight: bold; margin-top: 2px;">Édité le {{ $date }}</div>
                @if(!empty($qrBase64))
                    <div style="margin-top: 4px;">
                        <img src="{{ $qrBase64 }}" style="max-height: 50px; max-width: 50px;" alt="QR Code">
                        <div style="font-size: 5.5pt; font-family: monospace; color: #0f2863; font-weight: 900;">DOCUMENT CERTIFIÉ & VÉRIFIABLE</div>
                    </div>
                @endif
            </td>
        </tr>
    </table>

    <table class="matrix-table">
        <thead>
            <tr>
                <th rowspan="2" class="border-s1-separator" style="width: 5.5%;">CNE / APOGÉE</th>
                <th rowspan="2" class="border-s1-separator" style="width: 4.5%;">CIN</th>
                <th rowspan="2" class="border-s1-separator" style="width: 13%;">NOM & PRÉNOM ÉTUDIANT</th>
                @php
                    $oddMods = collect($modules)->filter(fn($m) => ($m['semester_number'] ?? $m->semester_number) % 2 !== 0);
                    $evenMods = collect($modules)->filter(fn($m) => ($m['semester_number'] ?? $m->semester_number) % 2 === 0);
                @endphp
                <th colspan="{{ $oddMods->count() + 2 }}" class="s1-head border-s1-separator">MODULES {{ $odd_semester_label }} ({{ $oddMods->count() }} MODULES)</th>
                <th colspan="{{ $evenMods->count() + 2 }}" class="s2-head border-s1-separator">MODULES {{ $even_semester_label }} ({{ $evenMods->count() }} MODULES)</th>
                <th rowspan="2" class="border-s1-separator" style="width: 4.5%;">MOY. ANN.</th>
                <th rowspan="2" style="width: 15%;">DÉCISION FINALE DU JURY</th>
            </tr>
            <tr>
                @foreach($oddMods as $m)
                    <th class="sub-head" title="{{ $m['name'] ?? $m->name }}">{{ $m['code'] ?? $m->code }}</th>
                @endforeach
                <th class="sub-head" style="width: 3.5%;">MOY {{ $odd_semester_label }}</th>
                <th class="sub-head border-s1-separator" style="width: 4%;">DÉC. {{ $odd_semester_label }}</th>

                @foreach($evenMods as $m)
                    <th class="sub-head" title="{{ $m['name'] ?? $m->name }}">{{ $m['code'] ?? $m->code }}</th>
                @endforeach
                <th class="sub-head" style="width: 3.5%;">MOY {{ $even_semester_label }}</th>
                <th class="sub-head border-s1-separator" style="width: 4%;">DÉC. {{ $even_semester_label }}</th>
            </tr>
        </thead>
        <tbody>
            @foreach($students as $s)
                <tr>
                    <td class="cne-col border-s1-separator">{{ $s['cne'] ?? $s['student_id'] }}</td>
                    <td class="cne-col border-s1-separator" style="font-weight: 800; font-size: 7.5pt; color: #1e293b;">{{ $s['cin'] ?? '-' }}</td>
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
                            <div style="font-weight: 900; color: #000000; font-size: 8pt;">{{ $note }}</div>
                            @if($decCode)
                                <span class="badge {{ $decCode === 'V' ? 'badge-v' : ($decCode === 'VAR' ? 'badge-var' : ($decCode === 'VPC' ? 'badge-vpc' : 'badge-aj')) }}">
                                    {{ $decCode }}
                                </span>
                            @endif
                            @if($isHist || $valYear !== '2026/2027')
                                <span class="hist-year">({{ $valYear }})</span>
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
                            <div style="font-weight: 900; color: #000000; font-size: 8pt;">{{ $note }}</div>
                            @if($decCode)
                                <span class="badge {{ $decCode === 'V' ? 'badge-v' : ($decCode === 'VAR' ? 'badge-var' : ($decCode === 'VPC' ? 'badge-vpc' : 'badge-aj')) }}">
                                    {{ $decCode }}
                                </span>
                            @endif
                            @if($isHist || $valYear !== '2026/2027')
                                <span class="hist-year">({{ $valYear }})</span>
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
                    <td style="text-align: right; padding-right: 5px;">
                        @if($s['decision'] === 'V')
                            <span class="badge badge-v">VALIDÉ DIRECT ({{ $odd_semester_label }}+{{ $even_semester_label }})</span>
                        @elseif($s['decision'] === 'V.Comp')
                            <span class="badge badge-vpc">VALIDÉ P. COMP ({{ $odd_semester_label }}+{{ $even_semester_label }})</span>
                        @elseif($s['decision'] === 'PASS_DETTES')
                            <span class="badge badge-dettes">PASSAGE AVEC DETTES</span>
                        @elseif($s['decision'] === 'FRAUDE' || ($s['has_fraud'] ?? false))
                            <span class="badge badge-fraude">FRAUDE (DISCIPLINAIRE)</span>
                        @else
                            <span class="badge badge-aj">REDOUBLEMENT / AJOURNÉ</span>
                        @endif
                        @if(!empty($s['decision_reason']) && $s['decision'] !== 'V')
                            <span class="reason-text">{{ $s['decision_reason'] }}</span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    {{-- Signatures Section: Complete Grid of ALL Module Professors + Chef de Filière --}}
    <div class="signatures-section">
        <div class="signatures-title">
            Scellé Numérique & Signatures des Membres du Jury de Délibération Annuelle 
            ({{ count($juries ?? []) }} Signataires Officiels)
        </div>

        @php
            $juryList = collect($juries ?? []);
            $chunkedJuries = $juryList->chunk(5); // 5 columns per row for clean landscape alignment
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
                            <div style="margin-top: 3px;">
                                @if(($j['status'] ?? '') === 'signed')
                                    <span class="badge badge-v">SIGNÉ</span>
                                    @if(!empty($j['signature_image']))
                                        <br><img src="{{ $j['signature_image'] }}" class="sig-img" alt="Signature">
                                    @endif
                                    @if(!empty($j['digital_seal']))
                                        <div class="sig-seal">SCELLÉ: {{ substr($j['digital_seal'], 0, 12) }}...</div>
                                    @endif
                                @else
                                    <span class="badge badge-dettes">EN ATTENTE</span>
                                    <div style="height: 18px;"></div>
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

</body>
</html>

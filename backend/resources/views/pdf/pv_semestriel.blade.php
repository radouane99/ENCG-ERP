<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>PV Officiel de Délibération Semestrielle — S{{ $semesterNumber }} — ENCG Fès</title>
    @php
        $rowCount = count($matrix ?? []);
        // Calibrage dynamique pour un rendu parfait, net et professionnel (Single Page Fit)
        if ($rowCount <= 15) {
            $tbPad = '2.2px 2px';
            $numFont = '8.2pt';
            $moyFont = '8.6pt';
            $tbFont = '7.5pt';
            $thFont = '7.2pt';
            $sigH = '30px';
        } elseif ($rowCount <= 28) {
            $tbPad = '1.2px 1.5px';
            $numFont = '7.6pt';
            $moyFont = '8.2pt';
            $tbFont = '7pt';
            $thFont = '6.8pt';
            $sigH = '23px';
        } else {
            $tbPad = '0.9px 1.2px';
            $numFont = '6.8pt';
            $moyFont = '7.2pt';
            $tbFont = '6.2pt';
            $thFont = '6pt';
            $sigH = '19px';
        }

        $filiereName = $filiere->name ?? 'Commerce et Gestion';
        $filiereCode = $filiere->code ?? 'ENCG';
        $acadName = $academicYear->name ?? date('Y').'/'.(date('Y')+1);
        $totalStudents = count($matrix ?? []);
        $valCount = collect($matrix ?? [])->filter(fn($r) => in_array($r['decision'], ['V', 'VAR', 'VPC']))->count();
        $successRate = $totalStudents > 0 ? round(($valCount / $totalStudents) * 100, 1) : 0;
    @endphp
    <style>
        @page {
            size: A4 landscape;
            margin: 4mm 5mm 3mm 5mm;
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
            line-height: 1.12;
        }

        /* ─── Institutional Header ─── */
        .inst-header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2.5px;
            border-bottom: 1.5px solid #001A4B;
            padding-bottom: 2px;
        }
        .inst-header-table td {
            vertical-align: middle;
        }
        .inst-logo-cell {
            width: 28%;
            text-align: left;
        }
        .inst-logo-cell img {
            max-height: 48px;
            max-width: 170px;
            height: auto;
            display: block;
        }
        .inst-center-cell {
            width: 44%;
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
            width: 28%;
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
            max-height: 42px;
            max-width: 42px;
        }
        .qr-meta {
            font-size: 6pt;
            color: #64748b;
            text-align: right;
            line-height: 1.15;
        }
        .qr-meta strong {
            color: #001A4B;
        }

        /* ─── Title Banner ─── */
        .title-banner {
            background-color: #001A4B;
            color: #ffffff;
            text-align: center;
            padding: 3px 6px;
            border-radius: 2px;
            margin-bottom: 2.5px;
        }
        .title-banner h1 {
            margin: 0;
            font-size: 8.5pt;
            font-weight: 900;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            color: #ffffff;
        }
        .title-banner p {
            margin: 1px 0 0 0;
            font-size: 6.2pt;
            color: #fde047;
            font-weight: 700;
            letter-spacing: 0.2px;
        }

        /* ─── Metadata Bar ─── */
        .meta-bar {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2.5px;
            background-color: #f8fafc;
            border: 0.75px solid #cbd5e1;
            border-radius: 2px;
        }
        .meta-bar td {
            padding: 2px 6px;
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
            font-size: 5.8pt;
        }
        .meta-val {
            font-weight: 800;
            color: #1e293b;
        }

        /* ─── Main Matrix Table ─── */
        .table-pv {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2.5px;
        }
        .table-pv th, .table-pv td {
            border: 0.6px solid #94a3b8;
            padding: {{ $tbPad }};
            text-align: center;
            font-size: {{ $tbFont }};
            line-height: 1.05;
        }
        .table-pv thead th {
            background-color: #001A4B;
            color: #ffffff;
            font-weight: 900;
            text-transform: uppercase;
            font-size: {{ $thFont }};
        }
        .table-pv thead th.sub-th {
            background-color: #0f2863;
            color: #e2e8f0;
            font-size: 6.2pt;
            font-weight: 800;
            padding: 2px 1px;
        }
        .table-pv thead th.sub-th-note {
            color: #fef08a;
        }
        .table-pv tr:nth-child(even) {
            background-color: #f8fafc;
        }

        /* Grades & Numbers styling */
        .note-cell {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 800;
            font-size: {{ $numFont }};
            letter-spacing: -0.2px;
        }
        .moyenne-cell {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 900;
            font-size: {{ $moyFont }};
            color: #001A4B;
            background-color: #f1f5f9;
            letter-spacing: -0.2px;
        }
        .id-num-cell {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 800;
            font-size: {{ $numFont }};
            color: #001A4B;
        }
        .cin-cell {
            font-family: 'DejaVu Sans', sans-serif;
            font-weight: 800;
            font-size: {{ $numFont }};
            color: #1e293b;
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

        /* Badges */
        .badge {
            padding: 1.5px 3.5px;
            border-radius: 2px;
            font-weight: 900;
            font-size: 6.2pt;
            text-transform: uppercase;
            display: inline-block;
            letter-spacing: 0.2px;
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
        .badge-nv {
            background-color: #fee2e2;
            color: #b91c1c;
            border: 0.5px solid #fca5a5;
        }

        /* ─── Signatures Section: Complete Grid of ALL Module Professors + Chef de Filière ─── */
        .signatures-section {
            margin-top: 4px;
            page-break-inside: avoid;
        }
        .signatures-title {
            font-size: 7.2pt;
            font-weight: 900;
            color: #001A4B;
            margin-bottom: 3px;
            text-transform: uppercase;
            border-bottom: 1.5px solid #001A4B;
            padding-bottom: 2px;
            letter-spacing: 0.4px;
        }
        .sig-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2.5px;
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
            margin-bottom: 2px;
        }
        .sig-name {
            font-size: 6.8pt;
            font-weight: 800;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
        }
        .sig-role {
            font-size: 5.5pt;
            color: #475569;
            font-weight: 600;
            line-height: 1.1;
            white-space: nowrap;
            overflow: hidden;
        }
        .badge-attente {
            background-color: #d97706;
            color: #ffffff;
            font-size: 5.2pt;
            padding: 1px 4px;
            border-radius: 2px;
            font-weight: 900;
            display: inline-block;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .badge-signed {
            background-color: #15803d;
            color: #ffffff;
            font-size: 5.2pt;
            padding: 1px 4px;
            border-radius: 2px;
            font-weight: 900;
            display: inline-block;
            text-transform: uppercase;
            letter-spacing: 0.3px;
        }
        .sig-seal {
            font-size: 4.8pt;
            font-family: 'DejaVu Sans Mono', monospace;
            color: #059669;
            font-weight: bold;
            margin-top: 1px;
        }
        .sig-img {
            max-height: 18px;
            max-width: 60px;
            margin-top: 1px;
        }

        /* ─── Footer Stamp ─── */
        .footer-stamp {
            margin-top: 4px;
            display: table;
            width: 100%;
            font-size: 5.8pt;
            color: #64748b;
            border-top: 0.5px solid #e2e8f0;
            padding-top: 2px;
        }
        .footer-stamp-left {
            display: table-cell;
            text-align: left;
        }
        .footer-stamp-right {
            display: table-cell;
            text-align: right;
            font-weight: 700;
        }
    </style>
</head>
<body>

    <!-- 🏛️ Official Institutional Header -->
    <table class="inst-header-table">
        <tr>
            <td class="inst-logo-cell">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo ENCG Fès">
                @else
                    <div style="font-size: 9pt; font-weight: 900; color: #001A4B;">
                        ENCG FÈS
                        <div style="font-size: 6.5pt; font-weight: normal; color: #475569;">
                            École Nationale de Commerce et de Gestion
                        </div>
                    </div>
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

    <!-- 🎓 Title Banner -->
    <div class="title-banner">
        <h1>Procès-Verbal Officiel de Délibération Semestrielle — 7 Modules</h1>
        <p>Filière : {{ $filiereName }} ({{ $filiereCode }}) • Semestre {{ $semesterNumber }} • Session Ordinaire Normale</p>
    </div>

    <!-- 📋 Metadata Bar -->
    <table class="meta-bar">
        <tr>
            <td>
                <span class="meta-label">Filière :</span>
                <span class="meta-val">{{ $filiereName }}</span>
            </td>
            <td>
                <span class="meta-label">Semestre :</span>
                <span class="meta-val">Semestre {{ $semesterNumber }} (7 Modules)</span>
            </td>
            <td>
                <span class="meta-label">Année Académique :</span>
                <span class="meta-val">{{ $acadName }}</span>
            </td>
            <td>
                <span class="meta-label">Effectif :</span>
                <span class="meta-val">{{ $totalStudents }} Étudiants ({{ $successRate }}% Admis)</span>
            </td>
            <td style="border-right: none;">
                <span class="meta-label">Édition :</span>
                <span class="meta-val">{{ $date ?? date('d/m/Y H:i') }}</span>
            </td>
        </tr>
    </table>

    <!-- 📊 Grand Matrix Table (7 Modules) -->
    <table class="table-pv">
        <thead>
            <tr>
                <th rowspan="2" style="width: 2.5%;">N°</th>
                <th rowspan="2" style="width: 6.5%;">Apogée</th>
                <th rowspan="2" style="width: 6.5%;">CIN</th>
                <th rowspan="2" style="width: 14%; text-align: left; padding-left: 4px;">Nom & Prénom</th>
                @foreach($modules as $m)
                    <th colspan="2" style="padding: 2px;">
                        {{ $m->code }}
                        <div style="font-size: 5.5pt; font-weight: normal; color: #cbd5e1; text-transform: none; overflow: hidden; white-space: nowrap;">
                            {{ \Illuminate\Support\Str::limit($m->name, 16) }}
                        </div>
                    </th>
                @endforeach
                <th rowspan="2" style="width: 6.5%;">Moyenne</th>
                <th rowspan="2" style="width: 11%;">Décision Semestre</th>
            </tr>
            <tr>
                @foreach($modules as $m)
                    <th class="sub-th sub-th-note" style="width: 4%;">Note</th>
                    <th class="sub-th" style="width: 3.5%;">Déc.</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse($matrix as $idx => $row)
            <tr>
                <td style="font-weight: 800; color: #64748b; font-size: {{ $numFont }};">{{ $idx + 1 }}</td>
                <td class="id-num-cell">
                    {{ $row['cne'] ?? '-' }}
                </td>
                <td class="cin-cell">
                    {{ $row['cin'] ?? '-' }}
                </td>
                <td style="text-align: left; font-weight: 800; padding-left: 4px; color: #0f172a; white-space: nowrap; font-size: {{ $tbFont }};">
                    {{ $row['student'] }}
                </td>

                @foreach($modules as $m)
                    @php
                        $mRes = $row['modules'][$m->id] ?? null;
                        $grade = $mRes['grade'] ?? null;
                        $decMod = $mRes['decision'] ?? 'NV';
                        $class = $grade !== null ? ($grade >= 10.0 ? 'note-pass' : ($grade >= 6.0 ? 'note-weak' : 'note-elim')) : '';
                    @endphp
                    @if($grade !== null && $grade !== '')
                        <td class="note-cell {{ $class }}">
                            {{ number_format((float)$grade, 2) }}
                        </td>
                        <td style="padding: 1px;">
                            @if($decMod === 'V')
                                <span class="badge badge-v">V</span>
                            @elseif($decMod === 'VAR')
                                <span class="badge badge-var">VAR</span>
                            @elseif($decMod === 'VPC' || $decMod === 'VC')
                                <span class="badge badge-vpc">VPC</span>
                            @else
                                <span class="badge badge-nv">NV</span>
                            @endif
                        </td>
                    @else
                        <td style="color: #94a3b8; font-size: {{ $numFont }};">–</td>
                        <td style="color: #94a3b8;">–</td>
                    @endif
                @endforeach

                <!-- Moyenne Semestrielle -->
                <td class="moyenne-cell">
                    {{ $row['semester_average'] !== null ? number_format((float)$row['semester_average'], 2) : '–' }}
                </td>

                <!-- Décision Globale Semestre -->
                <td style="padding: 1px 2px;">
                    @php $dec = $row['decision'] ?? 'NV'; @endphp
                    @if($dec === 'V')
                        <span class="badge badge-v" style="font-size: 6.8pt; padding: 2px 4px;">Validé (V)</span>
                    @elseif($dec === 'VPC' || $dec === 'VC')
                        <span class="badge badge-vpc" style="font-size: 6.8pt; padding: 2px 4px;">Val. Comp. (VPC)</span>
                    @elseif($dec === 'VAR')
                        <span class="badge badge-var" style="font-size: 6.8pt; padding: 2px 4px;">Val. Ratt. (VAR)</span>
                    @else
                        <span class="badge badge-nv" style="font-size: 6.8pt; padding: 2px 4px;">Non Validé (NV)</span>
                    @endif
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="{{ 4 + (count($modules) * 2) + 2 }}" style="padding: 15px; color: #94a3b8; font-style: italic;">
                    Aucun étudiant inscrit trouvé pour ce semestre.
                </td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <!-- 🖋️ Scellé Numérique & Signatures des Membres du Jury -->
    <div class="signatures-section">
        <div class="signatures-title">
            Scellé Numérique & Signatures des Membres du Jury de Délibération Semestrielle 
            ({{ count($juries ?? []) }} Signataires Officiels)
        </div>

        @php
            $juryList = collect($juries ?? []);
            $chunkedJuries = $juryList->chunk(5); // 5 colonnes par ligne pour alignement paysage
        @endphp

        @foreach($chunkedJuries as $row)
            <table class="sig-grid">
                <tr>
                    @foreach($row as $j)
                        <td class="sig-box" style="width: 20%;">
                            <div class="sig-header">
                                {{ $j['module_code'] ?? ($j['role'] === 'chef_filiere' ? 'CHEF' : 'MODULE') }}
                            </div>
                            <div class="sig-name">{{ $j['user_name'] ?? 'Enseignant ENCG' }}</div>
                            <div class="sig-role">
                                {{ $j['role'] === 'chef_filiere' ? 'Président / Chef de Filière' : ($j['module_name'] ?? 'Professeur Responsable') }}
                            </div>
                            <div style="margin-top: 2px;">
                                @if(($j['status'] ?? '') === 'signed')
                                    <span class="badge-signed">SIGNÉ</span>
                                    @if(!empty($j['signature_image']))
                                        <br><img src="{{ $j['signature_image'] }}" class="sig-img" alt="Signature">
                                    @elseif(!empty($j['signature_data']))
                                        <br><img src="{{ $j['signature_data'] }}" class="sig-img" alt="Signature">
                                    @endif
                                    @if(!empty($j['digital_seal']))
                                        <div class="sig-seal">SCELLÉ: {{ substr($j['digital_seal'], 0, 16) }}...</div>
                                    @endif
                                @else
                                    <span class="badge-attente">EN ATTENTE</span>
                                    <div style="height: 10px;"></div>
                                @endif
                            </div>
                        </td>
                    @endforeach

                    {{-- Compléter les cellules vides pour que chaque ligne fasse 5 colonnes --}}
                    @for($i = count($row); $i < 5; $i++)
                        <td style="width: 20%; border: none; background: transparent;"></td>
                    @endfor
                </tr>
            </table>
        @endforeach
    </div>

    <!-- 🔒 Security Footer -->
    <div class="footer-stamp">
        <div class="footer-stamp-left">
            🔒 Document officiel certifié généré par l'ERP ENCG Fès — Toute rature ou falsification annule la validité du présent procès-verbal.
        </div>
        <div class="footer-stamp-right">
            Page 1 / 1 • Code Délibération : ENCG-PV-S{{ $semesterNumber }}-{{ date('Ymd') }}
        </div>
    </div>

</body>
</html>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>PV de Délibération - {{ $module->code }}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 8mm 10mm 10mm 10mm;
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #0f2863;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .header-table td {
            vertical-align: middle;
        }
        .institution-title {
            font-size: 9px;
            font-weight: bold;
            color: #0f2863;
            line-height: 1.3;
            text-transform: uppercase;
        }
        .banner-box {
            text-align: center;
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            margin-bottom: 12px;
            border-radius: 6px;
        }
        .banner-title {
            font-size: 14px;
            font-weight: 900;
            color: #0f2863;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin: 0;
        }
        .banner-subtitle {
            font-size: 10px;
            font-weight: bold;
            color: #475569;
            margin-top: 3px;
        }
        .pv-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
            margin-bottom: 15px;
        }
        .pv-table th, .pv-table td {
            border: 1px solid #334155;
            padding: 5px 6px;
            text-align: center;
        }
        .pv-table th {
            background-color: #f1f5f9;
            color: #0f2863;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
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
            font-size: 10px;
            color: #0f2863;
            background-color: #f1f5f9;
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 8.5px;
            text-transform: uppercase;
        }
        .badge-v { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .badge-r { background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
        .badge-nv { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
        
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            page-break-inside: avoid;
        }
        .signatures-table td {
            width: 50%;
            vertical-align: top;
            padding: 10px;
            border: 1px solid #e2e8f0;
            background-color: #fafafa;
            border-radius: 6px;
        }
        .sig-title {
            font-size: 9px;
            font-weight: bold;
            color: #0f2863;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .sig-box {
            height: 60px;
            text-align: center;
        }
        .footer-banner {
            margin-top: 15px;
            border-top: 1px solid #cbd5e1;
            padding-top: 6px;
            text-align: center;
            font-size: 8px;
            color: #64748b;
        }
    </style>
</head>
<body>

    <!-- Header Table -->
    <table class="header-table">
        <tr>
            <td style="width: 40%;">
                <table style="width: 100%;">
                    <tr>
                        @if(!empty($logoBase64))
                            <td style="width: 55px; vertical-align: top;">
                                <img src="{{ $logoBase64 }}" style="height: 48px;" alt="Logo ENCG">
                            </td>
                        @endif
                        <td style="vertical-align: top;">
                            <div class="institution-title">
                                ROYAUME DU MAROC<br>
                                Université Sidi Mohamed Ben Abdellah de Fès<br>
                                École Nationale de Commerce et de Gestion
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
            <td style="width: 20%; text-align: center;">
                <div style="font-size: 8px; font-weight: bold; background: #0f2863; color: #fff; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                    DOCUMENT OFFICIEL
                </div>
                <div style="font-size: 8px; color: #475569; margin-top: 4px; font-weight: bold;">
                    Session : {{ $session === 'normale' ? 'Ordinaire (Normale)' : 'de Rattrapage' }}
                </div>
            </td>
            <td style="width: 40%; text-align: right; font-size: 9px; color: #334155; font-weight: bold; line-height: 1.4;">
                Année Universitaire : {{ $academicYear ?? '2026/2027' }}<br>
                Semestre : {{ $semester ?? 'S5' }} | Périmètre : {{ $perimetre }}<br>
                Date d'édition : {{ $date ?? date('d/m/Y H:i') }}
            </td>
        </tr>
    </table>

    <!-- Banner Title -->
    <div class="banner-box">
        <div class="banner-title">
            PROCES-VERBAL DE DELIBERATION - SESSION {{ $session === 'normale' ? 'ORDINAIRE' : 'DE RATTRAPAGE' }}
        </div>
        <div class="banner-subtitle">
            MODULE : {{ $module->code }} - {{ $module->name }}
        </div>
    </div>

    <!-- Student Grades Table -->
    <table class="pv-table">
        <thead>
            <tr>
                <th style="width: 110px; text-align: left;">Code Apogée</th>
                <th style="text-align: left;">Nom & Prénom</th>
                @foreach($normaleAssessments as $a)
                    <th style="width: 75px;">
                        {{ $a->type }}<br>
                        <span style="font-size: 7.5px; color: #64748b;">({{ $a->weight }}%)</span>
                    </th>
                @endforeach
                <th style="width: 85px; background: #e2e8f0;">Moy. Normale</th>
                <th style="width: 75px; background: #e2e8f0;">Dés. Normale</th>

                @if($session === 'rattrapage')
                    <th style="width: 85px; background: #fef3c7;">Rattrapage</th>
                    <th style="width: 85px; background: #dbeafe;">Moy. Finale</th>
                    <th style="width: 75px; background: #dbeafe;">Dés. Finale</th>
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
                        @endphp
                        <td>
                            @if($abs)
                                <span style="color: #dc2626; font-weight: bold;">ABI</span>
                            @elseif($val !== null)
                                {{ number_format((float)$val, 2, '.', '') }}
                            @else
                                -
                            @endif
                        </td>
                    @endforeach

                    <td class="moyenne-col">
                        {{ $student['moyenne_normale'] !== null ? number_format((float)$student['moyenne_normale'], 2, '.', '') : '-' }}
                    </td>

                    <td>
                        @php $dec = $student['decision_normale']; @endphp
                        @if($dec === 'V')
                            <span class="badge badge-v">V</span>
                        @elseif($dec === 'R')
                            <span class="badge badge-r">R</span>
                        @elseif($dec === 'NV')
                            <span class="badge badge-nv">NV</span>
                        @else
                            -
                        @endif
                    </td>

                    @if($session === 'rattrapage')
                        <td>
                            @if($student['rattrapage_absent'])
                                <span style="color: #dc2626; font-weight: bold;">ABI</span>
                            @elseif($student['rattrapage_note'] !== null)
                                {{ number_format((float)$student['rattrapage_note'], 2, '.', '') }}
                            @else
                                -
                            @endif
                        </td>
                        <td class="moyenne-col">
                            {{ $student['moyenne_finale'] !== null ? number_format((float)$student['moyenne_finale'], 2, '.', '') : '-' }}
                        </td>
                        <td>
                            @php $decF = $student['decision_finale']; @endphp
                            @if($decF === 'V' || $decF === 'VAR')
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

    <!-- Signatures Table -->
    <table class="signatures-table">
        <tr>
            <td style="text-align: center;">
                <div class="sig-title">Signature de l'Enseignant Responsable du Module</div>
                <div class="sig-box">
                    @if(!empty($signature['signature_data']))
                        <img src="{{ $signature['signature_data'] }}" style="max-height: 50px;" alt="Signature">
                        <div style="font-size: 8px; color: #475569; margin-top: 3px;">
                            Signé par {{ $signature['signed_by'] }} le {{ $signature['signed_at'] }} (IP: {{ $signature['ip_address'] }})
                        </div>
                    @else
                        <div style="font-size: 8px; color: #94a3b8; margin-top: 30px;">(Signature manuscrite / numérique)</div>
                    @endif
                </div>
            </td>
            <td style="text-align: center;">
                <div class="sig-title">Signature du Président du Jury & Cachet</div>
                <div class="sig-box">
                    <div style="font-size: 8px; color: #94a3b8; margin-top: 30px;">(Cachet Officiel ENCG Fès)</div>
                </div>
            </td>
        </tr>
    </table>

    @if(!empty($signature['digital_seal']))
        <div style="margin-top: 10px; font-family: monospace; font-size: 7.5px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 4px;">
            EMPREINTE CRYPTOGRAPHIQUE DE SÉCURITÉ (SHA-256) : {{ $signature['digital_seal'] }}
        </div>
    @endif

    <!-- Footer Banner -->
    <div class="footer-banner">
        <strong>École Nationale de Commerce et de Gestion de Fès (ENCG-Fès)</strong> — Université Sidi Mohamed Ben Abdellah<br>
        B.P. 26A Allal Ben Abdellah, Fès, Maroc | Tél: +212 (0)5 35 60 03 54 | Web: encg.usmba.ac.ma
    </div>

</body>
</html>

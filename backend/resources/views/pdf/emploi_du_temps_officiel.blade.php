<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Emploi du temps — ENCG Fès</title>
    <style>
        @page { size: A4 landscape; margin: 3.5mm 5mm 3.5mm 5mm; }
        * { box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
        }
        .frame {
            border: 1.8px solid #0f2863;
            padding: 4px 6px 3px 6px;
        }
        .gold-line {
            height: 2px;
            background: #c9a227;
            margin: 2px 0 3px 0;
        }
        h1 {
            text-align: center;
            font-size: 11.5pt;
            margin: 1px 0 0 0;
            letter-spacing: 1px;
            color: #0f2863;
            text-transform: uppercase;
            line-height: 1.1;
        }
        .sub {
            text-align: center;
            font-size: 7.5pt;
            margin: 1px 0 3px 0;
            color: #334155;
            font-weight: bold;
        }
        table.edt { 
            width: 100%; 
            border-collapse: collapse; 
            table-layout: fixed;
            page-break-inside: avoid;
        }
        table.edt th, table.edt td {
            border: 0.5px solid #1e3a5f;
            vertical-align: middle;
            overflow: hidden;
            word-wrap: break-word;
            line-height: 1.15;
        }
        table.edt th {
            background: #0f2863;
            color: #ffffff;
            font-size: 7pt;
            text-align: center;
            font-weight: bold;
            padding: 3px 2px;
        }
        .module { font-weight: bold; text-align: center; background: #f8fafc; }
        .prof { font-weight: bold; }
        .day { text-align: center; vertical-align: middle; }
        .salle { text-align: center; font-weight: bold; }
        .foot {
            width: 100%;
            border-collapse: collapse;
            margin-top: 3px;
        }
        .foot td { border: none; padding: 0 2px; vertical-align: middle; }
        .qr img { width: 34px; height: 34px; }
        .meta {
            font-size: 5.8pt;
            color: #475569;
            line-height: 1.25;
        }
        .section { 
            page-break-after: always; 
            page-break-inside: avoid; 
        }
        .section:last-child { page-break-after: auto; }
        .badge {
            display: inline-block;
            background: #e8eef5;
            color: #0f2863;
            font-size: 6.5pt;
            font-weight: bold;
            padding: 1px 6px;
            border: 0.5px solid #0f2863;
            border-radius: 2px;
        }
    </style>
</head>
<body>
@php
    $sections = $catalog['sections'] ?? (isset($matrix) ? [$matrix] : []);
    $year = $catalog['academic_year'] ?? ($sections[0]['academic_year'] ?? '');
    $days = $catalog['days'] ?? ($sections[0]['days'] ?? [1=>'Lundi',2=>'Mardi',3=>'Mercredi',4=>'Jeudi',5=>'Vendredi']);
@endphp
@forelse($sections as $section)
    @php
        $rowCount = max(1, count($section['rows'] ?? []));
        if ($rowCount <= 7) {
            $tdPadding = '7.5px 4px';
            $mainFontSize = '8.0pt';
            $slotFontSize = '7.2pt';
        } elseif ($rowCount <= 10) {
            $tdPadding = '5.8px 3px';
            $mainFontSize = '7.5pt';
            $slotFontSize = '6.8pt';
        } elseif ($rowCount <= 14) {
            $tdPadding = '4.0px 2.5px';
            $mainFontSize = '6.8pt';
            $slotFontSize = '6.3pt';
        } else {
            $tdPadding = '3.0px 2.0px';
            $mainFontSize = '6.3pt';
            $slotFontSize = '5.8pt';
        }
    @endphp
    <div class="section">
        <div class="frame">
            @include('pdf.encg-header', ['academic_year' => $section['academic_year'] ?? $year])
            <div class="gold-line"></div>
            <h1>{{ $section['title'] ?? 'EMPLOI DU TEMPS' }}</h1>
            <div class="sub">
                {{ $section['filiere_code'] ?? '' }} {{ $section['filiere_name'] ?? '' }}
                — Année universitaire {{ $section['academic_year'] ?? $year }}
                &nbsp;<span class="badge">Document officiel</span>
            </div>

            <table class="edt">
                <colgroup>
                    <col style="width: 7.5%;">
                    <col style="width: 14%;">
                    <col style="width: 16%;">
                    <col style="width: 14.5%;">
                    <col style="width: 8%;">
                    <col style="width: 8%;">
                    <col style="width: 8%;">
                    <col style="width: 8%;">
                    <col style="width: 8%;">
                    <col style="width: 8%;">
                </colgroup>
                <thead>
                    <tr>
                        <th>Semestre</th>
                        <th>Modules</th>
                        <th>Éléments de modules</th>
                        <th>Intervenants</th>
                        @foreach($days as $dayName)
                            <th>{{ $dayName }}</th>
                        @endforeach
                        <th>Salles</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($section['rows'] ?? [] as $row)
                        <tr>
                            @if($loop->first)
                                <td class="module" rowspan="{{ $rowCount }}" style="padding: {{ $tdPadding }}; font-size: {{ $mainFontSize }};">{{ $section['semester_label'] ?? '' }}</td>
                            @endif
                            @if(!empty($row['show_module']))
                                <td class="module" rowspan="{{ $row['module_rowspan'] }}" style="padding: {{ $tdPadding }}; font-size: {{ $mainFontSize }};">{{ $row['module_label'] }}</td>
                            @endif
                            <td class="element" style="padding: {{ $tdPadding }}; font-size: {{ $mainFontSize }};">{{ $row['element_name'] }}</td>
                            <td class="prof" style="color: {{ $row['color'] }}; padding: {{ $tdPadding }}; font-size: {{ $mainFontSize }};">{{ $row['professor_name'] }}</td>
                            @foreach($days as $dayId => $dayName)
                                <td class="day" style="color: {{ $row['color'] }}; padding: {{ $tdPadding }};">
                                    @foreach($row['days'][$dayId] ?? [] as $slot)
                                        <span style="display:inline-block; font-size: {{ $slotFontSize }}; font-weight:bold;">{{ $slot }}</span>@if(!$loop->last)<br>@endif
                                    @endforeach
                                </td>
                            @endforeach
                            <td class="salle" style="padding: {{ $tdPadding }}; font-size: {{ $mainFontSize }};">{{ $row['room_label'] }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="10" style="text-align:center;padding:24px;font-size:9pt;">Aucune séance à afficher.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>

            <table class="foot">
                <tr>
                    <td class="qr" style="width:50px;">
                        @if(!empty($qrBase64))
                            <img src="{{ $qrBase64 }}" alt="QR authentification">
                        @endif
                    </td>
                    <td class="meta">
                        @if(!empty($section['footer']['cours']))
                            <strong>Calendrier académique :</strong> Début des cours le {{ $section['footer']['cours'] }} — Début des TD/TP le {{ $section['footer']['td_tp'] }}.<br>
                        @endif
                        Document officiel certifié par l'administration pédagogique de l'ENCG Fès. Généré le {{ $date ?? now()->format('d/m/Y') }}.
                    </td>
                    <td style="text-align:right;font-weight:bold;color:#0f2863;font-size:7.5pt;width:220px;">
                        {{ $section['footer']['school'] ?? 'ENCG FÈS' }} — {{ $section['academic_year'] ?? $year }}<br>
                        <span style="font-size:6.2pt;font-weight:normal;color:#64748b;">Direction des Études & Affaires Pédagogiques</span>
                    </td>
                </tr>
            </table>
        </div>
    </div>
@empty
    <div class="frame">
        @include('pdf.encg-header', ['academic_year' => $year])
        <p style="text-align:center;padding:24px;">Aucune séance à afficher pour ce périmètre (filières / semestres).</p>
    </div>
@endforelse
</body>
</html>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Emploi du temps — ENCG Fès</title>
    <style>
        @page { 
            size: A4 landscape; 
            margin: 2mm 3.5mm 2mm 3.5mm; 
        }
        * { box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
        }
        .frame {
            border: 1.2px solid #0f2863;
        }
        .gold-line {
            background: #c9a227;
        }
        h1 {
            text-align: center;
            letter-spacing: 0.5px;
            color: #0f2863;
            text-transform: uppercase;
        }
        .sub {
            text-align: center;
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
            line-height: 1.05;
        }
        table.edt th {
            background: #0f2863;
            color: #ffffff;
            text-align: center;
            font-weight: bold;
        }
        .module { font-weight: bold; text-align: center; background: #f8fafc; }
        .prof { font-weight: bold; }
        .day { text-align: center; vertical-align: middle; }
        .salle { text-align: center; font-weight: bold; }
        .foot {
            width: 100%;
            border-collapse: collapse;
        }
        .foot td { border: none; padding: 0 2px; vertical-align: middle; }
        .section { 
            page-break-after: always; 
            page-break-inside: avoid; 
        }
        .section:last-child { 
            page-break-after: avoid !important; 
        }
        .badge {
            display: inline-block;
            background: #e8eef5;
            color: #0f2863;
            font-size: 5.8pt;
            font-weight: bold;
            padding: 0.5px 5px;
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
        
        if ($rowCount <= 8) {
            $tdPadding = '6.5px 3.5px';
            $mainFontSize = '8.0pt';
            $slotFontSize = '7.5pt';
            $thPadding = '3.5px 2px';
            $thFontSize = '7.2pt';
            $logoMaxHeight = '46px';
            $h1FontSize = '11.5pt';
            $subFontSize = '7.5pt';
            $dateFontSize = '6.8pt';
            $qrSize = '30px';
            $footFontSize = '6.0pt';
            $framePadding = '4px 6px';
            $headerCompact = false;
        } elseif ($rowCount <= 12) {
            $tdPadding = '4.5px 2.5px';
            $mainFontSize = '7.2pt';
            $slotFontSize = '6.8pt';
            $thPadding = '2.5px 2px';
            $thFontSize = '6.8pt';
            $logoMaxHeight = '38px';
            $h1FontSize = '10.5pt';
            $subFontSize = '7.0pt';
            $dateFontSize = '6.4pt';
            $qrSize = '26px';
            $footFontSize = '5.8pt';
            $framePadding = '3px 5px';
            $headerCompact = false;
        } elseif ($rowCount <= 16) {
            $tdPadding = '3.0px 2.0px';
            $mainFontSize = '6.5pt';
            $slotFontSize = '6.0pt';
            $thPadding = '2.0px 1.5px';
            $thFontSize = '6.2pt';
            $logoMaxHeight = '32px';
            $h1FontSize = '9.8pt';
            $subFontSize = '6.5pt';
            $dateFontSize = '6.0pt';
            $qrSize = '24px';
            $footFontSize = '5.5pt';
            $framePadding = '2.5px 4px';
            $headerCompact = true;
        } elseif ($rowCount <= 20) {
            $tdPadding = '1.8px 1.5px';
            $mainFontSize = '5.8pt';
            $slotFontSize = '5.4pt';
            $thPadding = '1.5px 1.0px';
            $thFontSize = '5.8pt';
            $logoMaxHeight = '28px';
            $h1FontSize = '9.0pt';
            $subFontSize = '6.0pt';
            $dateFontSize = '5.6pt';
            $qrSize = '20px';
            $footFontSize = '5.2pt';
            $framePadding = '2px 4px';
            $headerCompact = true;
        } else { // 21 à 28+ lignes (cas de S5 GFC avec 24 lignes)
            $tdPadding = '0.8px 1.0px';
            $mainFontSize = '5.1pt';
            $slotFontSize = '4.8pt';
            $thPadding = '1.0px 0.8px';
            $thFontSize = '5.2pt';
            $logoMaxHeight = '23px';
            $h1FontSize = '8.5pt';
            $subFontSize = '5.5pt';
            $dateFontSize = '5.1pt';
            $qrSize = '17px';
            $footFontSize = '4.7pt';
            $framePadding = '1.5px 3px';
            $headerCompact = true;
        }
    @endphp
    <div class="section">
        <div class="frame" style="padding: {{ $framePadding }};">
            @include('pdf.encg-header', [
                'academic_year' => $section['academic_year'] ?? $year,
                'logoHeight' => $logoMaxHeight,
                'compact' => $headerCompact
            ])
            <div class="gold-line" style="height: {{ $rowCount > 16 ? '1px' : '1.8px' }}; margin: {{ $rowCount > 16 ? '1px 0' : '2px 0 3px 0' }};"></div>
            <h1 style="font-size: {{ $h1FontSize }}; margin: 0; line-height: 1.05;">{{ $section['title'] ?? 'EMPLOI DU TEMPS' }}</h1>
            <div class="sub" style="font-size: {{ $subFontSize }}; margin: {{ $rowCount > 16 ? '1px 0' : '1px 0 2px 0' }};">
                {{ $section['filiere_code'] ?? '' }} {{ $section['filiere_name'] ?? '' }}
                — Année universitaire {{ $section['academic_year'] ?? $year }}
                &nbsp;<span class="badge">Document officiel</span>
                @php
                    $cStart = $section['footer']['cours_start'] ?? ($catalog['cours_start'] ?? null);
                    $tVal = $section['footer']['td_tp_start'] ?? ($catalog['td_tp_start'] ?? null);
                    $tDisplay = $tVal ? (\Illuminate\Support\Str::startsWith($tVal, 'la semaine du') ? $tVal : 'la semaine du ' . $tVal) : null;
                @endphp
                @if(!empty($cStart) || !empty($tVal))
                    <div style="margin-top:1px; font-size: {{ $dateFontSize }}; color:#0f2863; font-weight:bold;">
                        @if(!empty($cStart))
                            Démarrage des cours le {{ $cStart }}
                        @endif
                        @if(!empty($cStart) && !empty($tDisplay))
                            &nbsp;—&nbsp;
                        @endif
                        @if(!empty($tDisplay))
                            Démarrage des TD/TP : {{ $tDisplay }}
                        @endif
                    </div>
                @endif
            </div>

            <table class="edt" style="margin-top: {{ $rowCount > 16 ? '1px' : '2px' }};">
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
                        <th style="padding: {{ $thPadding }}; font-size: {{ $thFontSize }};">Semestre</th>
                        <th style="padding: {{ $thPadding }}; font-size: {{ $thFontSize }};">Modules</th>
                        <th style="padding: {{ $thPadding }}; font-size: {{ $thFontSize }};">Éléments de modules</th>
                        <th style="padding: {{ $thPadding }}; font-size: {{ $thFontSize }};">Intervenants</th>
                        @foreach($days as $dayName)
                            <th style="padding: {{ $thPadding }}; font-size: {{ $thFontSize }};">{{ $dayName }}</th>
                        @endforeach
                        <th style="padding: {{ $thPadding }}; font-size: {{ $thFontSize }};">Salles</th>
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
                            <td class="element" style="padding: {{ $tdPadding }}; font-size: {{ $mainFontSize }}; line-height: 1.05;">{{ $row['element_name'] }}</td>
                            <td class="prof" style="color: {{ $row['color'] }}; padding: {{ $tdPadding }}; font-size: {{ $mainFontSize }}; white-space: nowrap;">{{ $row['professor_name'] }}</td>
                            @foreach($days as $dayId => $dayName)
                                <td class="day" style="color: {{ $row['color'] }}; padding: {{ $tdPadding }};">
                                    @foreach($row['days'][$dayId] ?? [] as $slot)
                                        <span style="display:inline-block; font-size: {{ $slotFontSize }}; font-weight:bold; white-space: nowrap; line-height: 1.0;">{{ $slot }}</span>@if(!$loop->last)<br>@endif
                                    @endforeach
                                </td>
                            @endforeach
                            <td class="salle" style="padding: {{ $tdPadding }}; font-size: {{ $mainFontSize }}; white-space: nowrap;">{{ $row['room_label'] }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="10" style="text-align:center;padding:12px;font-size:8pt;">Aucune séance à afficher.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>

            <table class="foot" style="margin-top: {{ $rowCount > 16 ? '1.5px' : '3px' }};">
                <tr>
                    <td class="qr" style="width: {{ $qrSize }}; padding: 0;">
                        @if(!empty($qrBase64))
                            <img src="{{ $qrBase64 }}" alt="QR" style="width: {{ $qrSize }}; height: {{ $qrSize }}; display: block;">
                        @endif
                    </td>
                    <td class="meta" style="font-size: {{ $footFontSize }}; line-height: 1.08; padding: 0 4px;">
                        @if(!empty($section['footer']['cours']))
                            <strong>Calendrier académique :</strong> Début des cours le {{ $section['footer']['cours'] }} — Début des TD/TP le {{ $section['footer']['td_tp'] }}.<br>
                        @endif
                        Document officiel certifié par l'administration pédagogique de l'ENCG Fès. Généré le {{ $date ?? now()->format('d/m/Y') }}.
                    </td>
                    <td style="text-align:right;font-weight:bold;color:#0f2863;font-size: {{ $footFontSize }};width:190px;line-height:1.08;padding:0;">
                        {{ $section['footer']['school'] ?? 'ENCG FÈS' }} — {{ $section['academic_year'] ?? $year }}<br>
                        <span style="font-size: {{ $footFontSize }};font-weight:normal;color:#64748b;">Direction des Études & Affaires Pédagogiques</span>
                    </td>
                </tr>
            </table>
        </div>
    </div>
@empty
    <div class="frame" style="padding: 10px;">
        @include('pdf.encg-header', ['academic_year' => $year])
        <p style="text-align:center;padding:24px;">Aucune séance à afficher pour ce périmètre (filières / semestres).</p>
    </div>
@endforelse
</body>
</html>

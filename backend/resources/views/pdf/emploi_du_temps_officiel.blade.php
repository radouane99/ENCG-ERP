<!DOCTYPE html>
<html lang="fr">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Emploi du temps — ENCG Fès</title>
    <style>
        @page { size: A4 landscape; margin: 7mm 8mm 8mm 8mm; }
        * { box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 7.5pt;
            color: #0f172a;
            margin: 0;
        }
        .frame {
            border: 2.2px solid #0f2863;
            padding: 8px 10px 6px 10px;
        }
        .gold-line {
            height: 3px;
            background: #c9a227;
            margin: 4px 0 8px 0;
        }
        h1 {
            text-align: center;
            font-size: 13pt;
            margin: 2px 0 0 0;
            letter-spacing: 1.2px;
            color: #0f2863;
            text-transform: uppercase;
        }
        .sub {
            text-align: center;
            font-size: 8.5pt;
            margin: 2px 0 8px 0;
            color: #334155;
            font-weight: bold;
        }
        table.edt { width: 100%; border-collapse: collapse; }
        table.edt th, table.edt td {
            border: 0.6px solid #1e3a5f;
            padding: 3px 4px;
            vertical-align: top;
        }
        table.edt th {
            background: #0f2863;
            color: #ffffff;
            font-size: 7.5pt;
            text-align: center;
            font-weight: bold;
        }
        .module { font-weight: bold; text-align: center; width: 88px; background: #f8fafc; }
        .element { width: 108px; }
        .prof { width: 118px; font-weight: bold; }
        .day { width: 12.5%; font-size: 7pt; line-height: 1.35; }
        .salle { width: 78px; text-align: center; font-weight: bold; }
        .foot {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }
        .foot td { border: none; padding: 0 2px; vertical-align: middle; }
        .qr img { width: 52px; height: 52px; }
        .meta {
            font-size: 6.8pt;
            color: #475569;
            line-height: 1.35;
        }
        .section { page-break-after: always; }
        .section:last-child { page-break-after: auto; }
        .badge {
            display: inline-block;
            background: #e8eef5;
            color: #0f2863;
            font-size: 7pt;
            font-weight: bold;
            padding: 2px 8px;
            border: 0.6px solid #0f2863;
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
                                <td class="module" rowspan="{{ max(1, count($section['rows'])) }}">{{ $section['semester_label'] ?? '' }}</td>
                            @endif
                            @if(!empty($row['show_module']))
                                <td class="module" rowspan="{{ $row['module_rowspan'] }}">{{ $row['module_label'] }}</td>
                            @endif
                            <td class="element">{{ $row['element_name'] }}</td>
                            <td class="prof" style="color: {{ $row['color'] }};">{{ $row['professor_name'] }}</td>
                            @foreach($days as $dayId => $dayName)
                                <td class="day" style="color: {{ $row['color'] }};">
                                    @foreach($row['days'][$dayId] ?? [] as $slot)
                                        {{ $slot }}@if(!$loop->last)<br>@endif
                                    @endforeach
                                </td>
                            @endforeach
                            <td class="salle">{{ $row['room_label'] }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="10" style="text-align:center;padding:16px;">Aucune séance à afficher.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>

            <table class="foot">
                <tr>
                    <td class="qr" style="width:60px;">
                        @if(!empty($qrBase64))
                            <img src="{{ $qrBase64 }}" alt="QR authentification">
                        @endif
                    </td>
                    <td class="meta">
                        @if(!empty($section['footer']['cours']))
                            Les cours commencent le {{ $section['footer']['cours'] }}.
                            Les TD/TP commencent le {{ $section['footer']['td_tp'] }}.<br>
                        @endif
                        Scanner le QR pour vérifier l’authenticité de cet emploi du temps.
                        Document généré par l’ERP ENCG Fès le {{ $date ?? now()->format('d/m/Y') }}.
                    </td>
                    <td style="text-align:right;font-weight:bold;color:#0f2863;font-size:8pt;width:210px;">
                        {{ $section['footer']['school'] ?? 'ENCG-FES' }} {{ $section['academic_year'] ?? $year }}<br>
                        <span style="font-size:6.5pt;font-weight:normal;color:#64748b;">Route d’Imouzzer, B.P. 1255, Fès</span>
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

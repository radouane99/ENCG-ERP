<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Emploi du temps — ENCG Fès</title>
    <style>
        @page { size: A4 landscape; margin: 8mm 8mm 10mm 8mm; }
        body { font-family: Times, "Times New Roman", serif; font-size: 8pt; color: #111; margin: 0; }
        h1 { text-align: center; font-size: 14pt; margin: 0 0 2px 0; letter-spacing: 1px; }
        .sub { text-align: center; font-size: 9pt; margin-bottom: 8px; }
        table.edt { width: 100%; border-collapse: collapse; }
        table.edt th, table.edt td { border: 1px solid #222; padding: 3px 4px; vertical-align: top; }
        table.edt th { background: #e8eef5; font-size: 8pt; text-align: center; }
        .module { font-weight: bold; text-align: center; width: 90px; }
        .element { width: 110px; }
        .prof { width: 120px; font-weight: bold; }
        .day { width: 13%; font-size: 7.5pt; line-height: 1.35; }
        .salle { width: 70px; text-align: center; font-weight: bold; }
        .foot { margin-top: 8px; font-size: 8pt; }
        .foot td { border: none; padding: 0 4px; }
        .section { page-break-after: always; }
        .section:last-child { page-break-after: auto; }
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
        @include('pdf.encg-header', ['academic_year' => $section['academic_year'] ?? $year])
        <h1>{{ $section['title'] ?? 'EMPLOI DU TEMPS' }}</h1>
        <div class="sub">
            {{ $section['filiere_code'] ?? '' }} {{ $section['filiere_name'] ?? '' }}
            — Année universitaire {{ $section['academic_year'] ?? $year }}
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

        <table class="foot" width="100%">
            <tr>
                <td>
                    @if(!empty($section['footer']['cours']))
                        Les cours commencent le {{ $section['footer']['cours'] }}.
                        Les TD/TP commencent le {{ $section['footer']['td_tp'] }}.
                    @endif
                </td>
                <td style="text-align:right;font-weight:bold;">
                    {{ $section['footer']['school'] ?? 'ENCG-FES' }} {{ $section['academic_year'] ?? $year }}
                </td>
            </tr>
        </table>
    </div>
@empty
    @include('pdf.encg-header', ['academic_year' => $year])
    <p style="text-align:center;padding:24px;">Aucune séance à afficher pour ce périmètre (filières / semestres).</p>
@endforelse
</body>
</html>

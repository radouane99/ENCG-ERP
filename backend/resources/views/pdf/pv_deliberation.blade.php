<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Procès-Verbal de Délibération</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #333; margin: 0; padding: 0; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0f2863; padding-bottom: 10px; }
        .logo { max-width: 150px; margin-bottom: 10px; }
        h1 { color: #0f2863; font-size: 16px; margin: 0 0 5px 0; text-transform: uppercase; }
        h2 { font-size: 12px; margin: 0; color: #555; }
        .info-box { display: table; width: 100%; margin-bottom: 20px; font-size: 11px; }
        .info-box > div { display: table-cell; width: 33.33%; }
        table.matrix { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        table.matrix th, table.matrix td { border: 1px solid #ccc; padding: 4px; text-align: center; }
        table.matrix th { background-color: #f8fafc; color: #0f2863; font-weight: bold; font-size: 9px; }
        table.matrix td.student-name { text-align: left; font-weight: bold; }
        table.matrix td.grade { font-family: monospace; }
        .status-V { color: #16a34a; font-weight: bold; }
        .status-VC { color: #d97706; font-weight: bold; }
        .status-NV { color: #dc2626; font-weight: bold; }
        .status-RAT { color: #dc2626; font-weight: bold; }
        .status-DISCIPLINE { color: #991b1b; font-weight: bold; background-color: #fef2f2; }
        .signatures { margin-top: 40px; display: table; width: 100%; }
        .signatures > div { display: table-cell; text-align: center; width: 33.33%; font-weight: bold; font-size: 12px; }
        .signatures > div > p { margin-top: 50px; font-weight: normal; font-size: 10px; border-top: 1px solid #000; width: 80%; margin-left: auto; margin-right: auto; padding-top: 5px; }
        .footer { text-align: center; margin-top: 30px; font-size: 8px; color: #888; border-top: 1px solid #eee; padding-top: 10px; }
        @page { margin: 20px 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Procès-Verbal de Délibération du Jury</h1>
        <h2>Université Sidi Mohamed Ben Abdellah - ENCG Fès</h2>
    </div>

    <div class="info-box">
        <div>
            <strong>Filière :</strong> {{ $delib->filiere->name ?? 'N/A' }}<br>
            <strong>Niveau :</strong> {{ $delib->semester->name ?? 'N/A' }}
        </div>
        <div style="text-align: center;">
            <strong>Année Universitaire :</strong> {{ $delib->academicYear->name ?? 'N/A' }}<br>
            <strong>Session :</strong> {{ strtoupper($delib->session_type ?? 'Normale') }}
        </div>
        <div style="text-align: right;">
            <strong>Date du Jury :</strong> {{ $delib->deliberation_date ? $delib->deliberation_date->format('d/m/Y') : date('d/m/Y') }}<br>
            <strong>Généré le :</strong> {{ date('d/m/Y à H:i') }}
        </div>
    </div>

    <table class="matrix">
        <thead>
            <tr>
                <th rowspan="2" style="width: 3%">N°</th>
                <th rowspan="2" style="width: 20%">Nom & Prénom</th>
                <th rowspan="2" style="width: 10%">CNE</th>
                <th colspan="{{ count($modules) }}">Modules du Semestre</th>
                <th rowspan="2" style="width: 8%">Moy. Semestre</th>
                <th rowspan="2" style="width: 15%">Décision Finale</th>
            </tr>
            <tr>
                @foreach($modules as $module)
                    <th style="font-size: 8px;">{{ substr($module->name, 0, 15) }}...<br><small>(Coef: {{ $module->coefficient }})</small></th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($matrix as $index => $row)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td class="student-name">{{ $row['student'] }}</td>
                <td>{{ $row['cne'] }}</td>
                @foreach($modules as $module)
                    @php 
                        $modRes = $row['modules'][$module->id] ?? null; 
                        $class = $modRes ? 'status-' . $modRes['status'] : '';
                    @endphp
                    <td class="grade {{ $class }}">
                        @if($modRes)
                            {{ number_format($modRes['average'], 2) }}
                            <br><small>({{ $modRes['status'] }})</small>
                        @else
                            -
                        @endif
                    </td>
                @endforeach
                <td class="grade">
                    <strong>{{ number_format($row['semester_average'], 2) }}</strong>
                </td>
                <td class="grade {{ $row['decision'] === 'ADMIS (SEMESTRE VALIDÉ)' ? 'status-V' : 'status-NV' }}">
                    {{ $row['decision'] }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="signatures">
        <div>
            Le Président du Jury
            <p>Nom, Prénom & Signature</p>
        </div>
        <div>
            Les Membres du Jury
            <p>Noms & Signatures</p>
        </div>
        <div>
            La Direction (ENCG)
            <p>Cachet & Signature</p>
        </div>
    </div>

    <div class="footer">
        Document officiel généré par le système d'information de l'ENCG Fès.<br>
        Toute falsification de ce document est passible de poursuites judiciaires.
    </div>
</body>
</html>

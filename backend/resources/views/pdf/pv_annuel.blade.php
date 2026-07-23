<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>PV de Délibération Annuel Global - ENCG</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #1e293b; margin: 0; padding: 15px; }
        .header { text-align: center; border-bottom: 2px solid #0f2863; padding-bottom: 10px; margin-bottom: 15px; }
        .header h1 { margin: 0; color: #0f2863; font-size: 18px; font-weight: 900; text-transform: uppercase; }
        .header p { margin: 3px 0 0 0; color: #64748b; font-size: 11px; font-weight: bold; }
        .meta-info { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
        .meta-info td { padding: 5px 8px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 10px; }
        .meta-title { font-weight: bold; color: #0f2863; width: 15%; uppercase; }
        .table-pv { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .table-pv th, .table-pv td { border: 1px solid #cbd5e1; padding: 6px; text-align: center; }
        .table-pv th { background-color: #0f2863; color: #ffffff; font-size: 9px; uppercase; font-weight: bold; }
        .table-pv tr:nth-child(even) { background-color: #f8fafc; }
        .badge-v { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .badge-vc { background: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .badge-r { background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .badge-aj { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .signatures-section { margin-top: 20px; page-break-inside: avoid; }
        .signatures-grid { width: 100%; border-collapse: collapse; margin-top: 8px; }
        .signatures-grid td { width: 20%; border: 1px solid #cbd5e1; padding: 6px; text-align: center; vertical-align: top; height: 70px; }
        .sig-role { font-size: 8px; color: #64748b; font-weight: bold; text-transform: uppercase; }
        .sig-name { font-size: 10px; font-weight: bold; color: #0f2863; margin-top: 3px; }
        .seal-code { font-family: monospace; font-size: 7px; color: #059669; margin-top: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>École Nationale de Commerce et de Gestion</h1>
        <p>PROCES-VERBAL GLOBAL ANNUEL DE DELIBERATION (14 MODULES & COMPENSATION)</p>
    </div>

    <table class="meta-info">
        <tr>
            <td class="meta-title">Filière :</td>
            <td><strong>{{ $filiere->name ?? 'ENCG' }}</strong> ({{ $filiere->code ?? 'ENCG' }})</td>
            <td class="meta-title">Année Académique :</td>
            <td><strong>{{ $academicYear->name ?? date('Y').'/'.(date('Y')+1) }}</strong></td>
        </tr>
    </table>

    <table class="table-pv">
        <thead>
            <tr>
                <th style="width: 15%;">CNE / Apogée</th>
                <th style="width: 30%;">Nom & Prénom Étudiant</th>
                <th>Moyenne S. Impair</th>
                <th>Moyenne S. Pair</th>
                <th>Moyenne Annuelle</th>
                <th>Décision Annuelle</th>
            </tr>
        </thead>
        <tbody>
            @foreach($matrix as $row)
            <tr>
                <td style="font-family: monospace; font-weight: bold;">{{ $row['cne'] }}</td>
                <td style="text-align: left; font-weight: bold;">{{ $row['student_name'] }}</td>
                <td style="font-weight: bold; color: #4338ca;">{{ number_format($row['odd_semester_avg'], 2) }}</td>
                <td style="font-weight: bold; color: #4338ca;">{{ number_format($row['even_semester_avg'], 2) }}</td>
                <td style="font-weight: bold; font-size: 11px; color: #0f2863;">{{ number_format($row['annual_average'], 2) }}</td>
                <td>
                    @if($row['decision'] === 'V')
                        <span class="badge-v">Validé</span>
                    @elseif($row['decision'] === 'V.Comp')
                        <span class="badge-vc">Validé p. Comp</span>
                    @elseif($row['decision'] === 'R')
                        <span class="badge-r">Rattrapage</span>
                    @else
                        <span class="badge-aj">Ajourné</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="signatures-section">
        <h3 style="color: #0f2863; text-transform: uppercase; font-size: 11px; margin-bottom: 6px;">Empreintes & Signatures du Grand Jury Annuel (14 Modules + Coordination)</h3>
        <table class="signatures-grid">
            <tr>
            @foreach($juries as $index => $jury)
                @if($index > 0 && $index % 5 == 0)
                </tr><tr>
                @endif
                <td>
                    <div class="sig-role">{{ $jury['role'] === 'chef_filiere' ? 'Président (Chef Filière)' : $jury['module_code'] }}</div>
                    <div class="sig-name">{{ $jury['user_name'] }}</div>
                    @if($jury['status'] === 'signed')
                        <div style="color: #059669; font-weight: bold; margin-top: 4px;">[SIGNÉ ÉLECTRONIQUEMENT]</div>
                        <div class="seal-code">Empreinte: {{ substr($jury['digital_seal'], 0, 10) }}...</div>
                    @else
                        <div style="color: #94a3b8; font-style: italic; margin-top: 10px;">(En attente)</div>
                    @endif
                </td>
            @endforeach
            </tr>
        </table>
    </div>
</body>
</html>

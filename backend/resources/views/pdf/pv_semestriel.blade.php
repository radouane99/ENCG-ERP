<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>PV de Délibération Semestriel - ENCG</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #0f2863; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #0f2863; font-size: 20px; font-weight: 900; text-transform: uppercase; }
        .header p { margin: 4px 0 0 0; color: #64748b; font-size: 12px; font-weight: bold; }
        .meta-info { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
        .meta-info td { padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 11px; }
        .meta-title { font-weight: bold; color: #0f2863; width: 15%; uppercase; }
        .table-pv { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
        .table-pv th, .table-pv td { border: 1px solid #cbd5e1; padding: 8px; text-align: center; }
        .table-pv th { background-color: #0f2863; color: #ffffff; font-size: 10px; uppercase; font-weight: bold; }
        .table-pv tr:nth-child(even) { background-color: #f8fafc; }
        .badge-v { background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .badge-r { background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .badge-aj { background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 4px; font-weight: bold; }
        .signatures-section { margin-top: 30px; page-break-inside: avoid; }
        .signatures-grid { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .signatures-grid td { width: 25%; border: 1px solid #cbd5e1; padding: 10px; text-align: center; vertical-align: top; height: 90px; }
        .sig-role { font-size: 9px; color: #64748b; font-weight: bold; text-transform: uppercase; }
        .sig-name { font-size: 11px; font-weight: bold; color: #0f2863; margin-top: 4px; }
        .seal-code { font-family: monospace; font-size: 8px; color: #059669; margin-top: 6px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>École Nationale de Commerce et de Gestion</h1>
        <p>PROCES-VERBAL OFFICIEL DE DELIBERATION SEMESTRIEL — SEMESTRE {{ $semesterNumber }}</p>
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
                <th style="width: 12%;">Apogée / CNE</th>
                <th style="width: 25%;">Nom & Prénom</th>
                @foreach($modules as $m)
                    <th>{{ $m->code }}</th>
                @endforeach
                <th>Moyenne</th>
                <th>Décision</th>
            </tr>
        </thead>
        <tbody>
            @foreach($matrix as $row)
            <tr style="{{ !empty($row['is_reserviste']) ? 'background-color: #f0f9ff;' : '' }}">
                <td style="font-family: monospace; font-weight: bold;">{{ $row['cne'] }}</td>
                <td style="text-align: left; font-weight: bold;">
                    {{ $row['student'] }}
                    @if(!empty($row['is_reserviste']))
                        <span style="font-size: 8px; background: #e0f2fe; color: #0369a1; padding: 2px 4px; border-radius: 3px; margin-left: 4px;">RÉSERVISTE (DETTE)</span>
                    @endif
                </td>
                @foreach($modules as $m)
                    @php $mRes = $row['modules'][$m->id] ?? null; @endphp
                    <td>
                        @if($mRes)
                            @if(!empty($mRes['is_historical']))
                                <span style="color: #0369a1; font-weight: bold;" title="Validé l'année précédente">{{ number_format($mRes['grade'], 2) }}*</span>
                            @else
                                {{ number_format($mRes['grade'], 2) }}
                            @endif
                        @else
                            –
                        @endif
                    </td>
                @endforeach
                <td style="font-weight: bold; color: #0f2863;">{{ number_format($row['semester_average'], 2) }}</td>
                <td>
                    @if($row['decision'] === 'V')
                        <span class="badge-v">Validé</span>
                    @elseif($row['decision'] === 'RAT' || $row['decision'] === 'R')
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
        <h3 style="color: #0f2863; text-transform: uppercase; font-size: 12px; margin-bottom: 8px;">Empreintes & Signatures de la Commission du Jury (7 Modules)</h3>
        <table class="signatures-grid">
            <tr>
            @foreach($juries as $index => $jury)
                @if($index > 0 && $index % 4 == 0)
                </tr><tr>
                @endif
                <td>
                    <div class="sig-role">{{ $jury['role'] === 'chef_filiere' ? 'Président (Chef Filière)' : $jury['module_code'] }}</div>
                    <div class="sig-name">{{ $jury['user_name'] }}</div>
                    @if($jury['status'] === 'signed')
                        <div style="color: #059669; font-weight: bold; margin-top: 8px;">[SIGNÉ ÉLECTRONIQUEMENT]</div>
                        <div class="seal-code">Empreinte: {{ substr($jury['digital_seal'], 0, 12) }}...</div>
                    @else
                        <div style="color: #94a3b8; font-style: italic; margin-top: 15px;">(En attente de signature)</div>
                    @endif
                </td>
            @endforeach
            </tr>
        </table>
    </div>
</body>
</html>

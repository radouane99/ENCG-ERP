<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>PV de Délibération Semestriel - ENCG</title>
    <style>
        @page { margin: 12mm; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: #0f172a; margin: 0; padding: 0; }
        
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; border-bottom: 2px solid #0f2863; padding-bottom: 8px; }
        .header-logo { width: 120px; text-align: left; vertical-align: middle; }
        .header-logo img { max-width: 110px; max-height: 55px; }
        .header-center { text-align: center; vertical-align: middle; }
        .header-center h1 { margin: 0; color: #0f2863; font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
        .header-center h2 { margin: 3px 0 0 0; color: #1e3a8a; font-size: 12px; font-weight: 800; text-transform: uppercase; }
        .header-center p { margin: 3px 0 0 0; color: #64748b; font-size: 9.5px; font-weight: bold; }
        .header-qr { width: 80px; text-align: right; vertical-align: middle; }
        .header-qr img { max-width: 65px; }

        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; }
        .meta-table td { padding: 5px 10px; font-size: 9.5px; border-right: 1px solid #e2e8f0; }
        .meta-label { font-weight: bold; color: #0f2863; text-transform: uppercase; font-size: 8.5px; }
        .meta-val { font-weight: 800; color: #1e293b; }

        .table-pv { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .table-pv th, .table-pv td { border: 1px solid #94a3b8; padding: 3px 2px; text-align: center; font-size: 8.5px; }
        .table-pv th { background-color: #0f2863; color: #ffffff; font-size: 8px; text-transform: uppercase; font-weight: 900; }
        .table-pv tr:nth-child(even) { background-color: #f8fafc; }

        .note-pass { color: #15803d; font-weight: bold; }
        .note-weak { color: #b45309; font-weight: bold; }
        .note-elim { color: #b91c1c; font-weight: bold; background-color: #fee2e2; }

        .badge { padding: 1px 3px; border-radius: 2px; font-weight: 900; font-size: 7.5px; text-transform: uppercase; display: inline-block; }
        .badge-v { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
        .badge-var { background: #fef3c7; color: #b45309; border: 1px solid #fcd34d; }
        .badge-vpc { background: #e0e7ff; color: #3730a3; border: 1px solid #a5b4fc; }
        .badge-rat { background: #fff7ed; color: #c2410c; border: 1px solid #fdba74; }
        .badge-nv { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }

        .signatures-section { margin-top: 10px; page-break-inside: avoid; }
        .signatures-title { color: #0f2863; font-size: 9px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; border-left: 3px solid #0f2863; padding-left: 6px; }
        .signatures-grid { width: 100%; border-collapse: collapse; }
        .signatures-grid td { width: 25%; border: 1px solid #cbd5e1; padding: 4px; text-align: center; vertical-align: top; height: 48px; background: #ffffff; }
        .sig-role { font-size: 7.5px; color: #475569; font-weight: 900; text-transform: uppercase; }
        .sig-name { font-size: 8.5px; font-weight: 800; color: #0f2863; margin-top: 1px; }
        .seal-code { font-family: monospace; font-size: 6.5px; color: #059669; margin-top: 2px; }
        .footer-stamp { margin-top: 6px; text-align: right; font-size: 7px; color: #94a3b8; font-style: italic; }

    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td class="header-logo">
                @if(!empty($logoBase64))
                    <img src="{{ $logoBase64 }}" alt="Logo ENCG">
                @endif
            </td>
            <td class="header-center">
                <h1>Royaume du Maroc</h1>
                <h2>École Nationale de Commerce et de Gestion</h2>
                <p>PROCES-VERBAL OFFICIEL DE DELIBERATION SEMESTRIEL — SEMESTRE {{ $semesterNumber }}</p>
            </td>
            <td class="header-qr">
                @if(!empty($qrBase64))
                    <img src="{{ $qrBase64 }}" alt="QR Code Verif">
                @endif
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td><span class="meta-label">Filière :</span> <span class="meta-val">{{ $filiere->name ?? 'Tronc Commun ENCG' }} ({{ $filiere->code ?? 'ENCG' }})</span></td>
            <td><span class="meta-label">Semestre :</span> <span class="meta-val">Semestre {{ $semesterNumber }}</span></td>
            <td><span class="meta-label">Année Académique :</span> <span class="meta-val">{{ $academicYear->name ?? date('Y').'/'.(date('Y')+1) }}</span></td>
            <td style="border-right: none;"><span class="meta-label">Date d'Édition :</span> <span class="meta-val">{{ $date ?? date('d/m/Y H:i') }}</span></td>
        </tr>
    </table>

    <table class="table-pv">
        <thead>
            <tr>
                <th rowspan="2" style="width: 8%;">Apogée</th>
                <th rowspan="2" style="width: 14%; text-align: left; padding-left: 4px;">Nom & Prénom</th>
                @foreach($modules as $m)
                    <th colspan="3" style="font-size: 7.5px; background-color: #0f2863; color: #ffffff; padding: 2px;">
                        {{ $m->name }} <span style="font-size: 6px; opacity: 0.8;">({{ $m->code }})</span>
                    </th>
                @endforeach
                <th rowspan="2" style="width: 6.5%;">Moyenne</th>
                <th rowspan="2" style="width: 6.5%;">Décision</th>
            </tr>
            <tr>
                @foreach($modules as $m)
                    <th style="font-size: 6.5px; background-color: #1e3a8a; color: #fef08a; padding: 1px;">Note module</th>
                    <th style="font-size: 6.5px; background-color: #1e3a8a; color: #fef08a; padding: 1px;">Décision</th>
                    <th style="font-size: 6.5px; background-color: #1e3a8a; color: #fef08a; padding: 1px;">Année univ.</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($matrix as $row)
            <tr>
                <td style="font-family: monospace; font-weight: bold; font-size: 8px;">{{ $row['cne'] }}</td>
                <td style="text-align: left; font-weight: bold; padding-left: 4px; font-size: 8px;">
                    {{ $row['student'] }}
                </td>
                @foreach($modules as $m)
                    @php 
                        $mRes = $row['modules'][$m->id] ?? null; 
                        $grade = $mRes['grade'] ?? null;
                        $decMod = $mRes['decision'] ?? 'NV';
                        $yearMod = $mRes['validation_year'] ?? '2026/2027';
                        $isHist = !empty($mRes['is_historical']);
                        $shortYear = str_replace(['20', '/20'], ['', '/'], $yearMod);
                    @endphp
                    @if($grade !== null && $grade !== '')
                        @php
                            $class = $grade >= 10.0 ? 'note-pass' : ($grade >= 6.0 ? 'note-weak' : 'note-elim');
                        @endphp
                        <td class="{{ $class }}" style="font-size: 8.5px; font-family: monospace;">{{ number_format($grade, 2) }}</td>
                        <td style="padding: 1px;">
                            @if($decMod === 'V') <span class="badge badge-v">V</span>
                            @elseif($decMod === 'VAR') <span class="badge badge-var">VAR</span>
                            @elseif($decMod === 'VPC' || $decMod === 'VC') <span class="badge badge-vpc">VPC</span>
                            @elseif($decMod === 'RAT') <span class="badge badge-rat">RAT</span>
                            @else <span class="badge badge-nv">NV</span>
                            @endif
                        </td>
                        <td style="font-size: 6.5px; font-family: monospace; font-weight: bold; color: {{ $isHist ? '#0369a1' : '#475569' }}; padding: 1px;">
                            {{ $isHist ? '*'.$shortYear : $shortYear }}
                        </td>
                    @else
                        <td>–</td><td>–</td><td>–</td>
                    @endif
                @endforeach

                <td style="font-weight: 900; color: #0f2863; font-size: 9px; background-color: #f1f5f9;">
                    {{ number_format($row['semester_average'], 2) }}
                </td>
                <td style="padding: 1px;">
                    @php $dec = $row['decision']; @endphp
                    @if($dec === 'V') <span class="badge badge-v">Validé</span>
                    @elseif($dec === 'VAR') <span class="badge badge-var">Val.AR</span>
                    @elseif($dec === 'VPC' || $dec === 'VC') <span class="badge badge-vpc">Val.Comp</span>
                    @elseif($dec === 'RAT' || $dec === 'R') <span class="badge badge-rat">Rattrapage</span>
                    @else <span class="badge badge-nv">Non Validé</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>


    <div class="signatures-section">
        <div class="signatures-title">Émargements et Signatures de la Commission du Jury</div>
        <table class="signatures-grid">
            <tr>
            @foreach($juries as $index => $jury)
                @if($index > 0 && $index % 4 == 0)
                </tr><tr>
                @endif
                <td>
                    <div class="sig-role">
                        {{ $jury['role'] === 'chef_filiere' ? 'Président du Jury / Chef Filière' : ($jury['module_name'] ?? $jury['module_code'] ?? 'Module') }}
                    </div>
                    <div class="sig-name">{{ $jury['user_name'] }}</div>
                    @if(!empty($jury['signature_data']))
                        <div style="margin-top: 2px;">
                            <img src="{{ $jury['signature_data'] }}" style="max-height: 35px; max-width: 125px;" alt="Signature">
                        </div>
                        <div class="seal-code">Scellé SHA-256 Appliqué</div>
                    @else
                        <div style="color: #94a3b8; font-style: italic; margin-top: 8px; font-size: 7px; border-bottom: 1px dashed #cbd5e1; width: 75%; margin-left: auto; margin-right: auto; padding-bottom: 3px;">
                            (Signature manuscrite / numérique)
                        </div>
                    @endif
                </td>



            @endforeach
            </tr>
        </table>
    </div>

    <div class="footer-stamp">
        🔒 Document Officiel Certifié ENCG ERP — Empreinte Cryptographique d'Authenticité.
    </div>
</body>
</html>


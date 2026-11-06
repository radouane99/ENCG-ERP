<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $title }} — ENCG Fès</title>
    <style>
        @page { margin: 35px; }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            color: #172b46;
            font-size: 10px;
            line-height: 1.5;
        }
        h1 {
            font-size: 18px;
            color: #1a3673;
            margin: 8px 0;
        }
        .brand {
            color: #52647b;
            font-size: 9px;
            margin-top: 2px;
        }
        .facts {
            margin: 14px 0;
            padding: 8px 12px;
            background: #f8fafc;
            border-left: 3px solid #1a3673;
        }
        .label {
            color: #52647b;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 10px;
        }
        th, td {
            padding: 7px;
            border: 1px solid #d8e1ec;
            text-align: left;
        }
        th {
            background: #1a3673;
            color: #ffffff;
        }
        .notice {
            margin-top: 18px;
            padding: 10px 12px;
            background: #f1f5f9;
            border-left: 3px solid #4a6b8a;
            color: #475569;
        }
    </style>
</head>
<body>
    @include('pdf.encg-header')
    <div class="brand">École Nationale de Commerce et de Gestion — Fès · Université Sidi Mohamed Ben Abdellah</div>
    <h1>{{ $title }}</h1>

    <div class="facts">
        @foreach($facts as $label => $value)
            <div><span class="label">{{ $label }} :</span> <strong>{{ $value ?? 'Non renseigné' }}</strong></div>
        @endforeach
    </div>

    @if($headers)
        <table>
            <thead>
                <tr>
                    @foreach($headers as $header)
                        <th>{{ $header }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach($rows as $row)
                    <tr>
                        @foreach($row as $cell)
                            <td>{{ $cell ?? '—' }}</td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    @if($notice)
        <p class="notice">{{ $notice }}</p>
    @endif

    <p class="label">Édité le {{ now()->format('d/m/Y H:i') }}. Les références correspondent aux enregistrements du portail.</p>
</body>
</html>

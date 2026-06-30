<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $type }}</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #A80A0B;
            padding-bottom: 10px;
        }
        .university-name {
            font-size: 18px;
            font-weight: bold;
            color: #1F3A5F;
        }
        .report-title {
            font-size: 16px;
            font-weight: bold;
            margin-top: 20px;
            color: #A80A0B;
            text-transform: uppercase;
        }
        .meta-info {
            margin-bottom: 20px;
        }
        .meta-info table {
            width: 100%;
        }
        .meta-info td {
            padding: 5px 0;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table.data-table th, table.data-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        table.data-table th {
            background-color: #f2f2f2;
            color: #1F3A5F;
            font-weight: bold;
        }
        .footer {
            margin-top: 50px;
            text-align: right;
            font-size: 11px;
            color: #777;
        }
        .signature-box {
            margin-top: 50px;
            width: 100%;
        }
        .signature-box td {
            text-align: center;
            width: 50%;
            font-weight: bold;
        }
    </style>
</head>
<body>

    <div class="header">
        <div class="university-name">Université Sidi Mohamed Ben Abdellah</div>
        <div class="university-name">{{ $institution }}</div>
        <div class="report-title">{{ $type }}</div>
    </div>

    <div class="meta-info">
        <table>
            <tr>
                <td><strong>Année Universitaire:</strong> {{ $academic_year }}</td>
                <td style="text-align: right;"><strong>Date d'édition:</strong> {{ $date }}</td>
            </tr>
            <tr>
                <td><strong>Semestre:</strong> {{ $semester }}</td>
                <td style="text-align: right;"><strong>Session:</strong> {{ $session }}</td>
            </tr>
        </table>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th>CNE / Massar</th>
                <th>Nom & Prénom</th>
                <th>Moyenne</th>
                <th>Résultat / Détail</th>
            </tr>
        </thead>
        <tbody>
            @foreach($records as $record)
            <tr>
                <td>{{ $record['cne'] }}</td>
                <td>{{ $record['student'] }}</td>
                <td>{{ $record['average'] }}</td>
                <td>{{ $record['detail'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="signature-box">
        <tr>
            <td>Le Chef de Filière</td>
            <td>Le Directeur Adjoint Chargé des Affaires Pédagogiques</td>
        </tr>
        <tr>
            <td style="padding-top: 60px;">_________________________</td>
            <td style="padding-top: 60px;">_________________________</td>
        </tr>
    </table>

    <div class="footer">
        Généré automatiquement par le Système APOGEE ENCG ERP.
    </div>

</body>
</html>

<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $title }} — ENCG Fès</title>
    <style>
        @page { margin: 12mm 14mm; }
        body {
            font-family: 'DejaVu Sans', Arial, Helvetica, sans-serif;
            font-size: 10.5px;
            color: #1e293b;
            line-height: 1.4;
        }
        .service-tag {
            font-size: 9.5px;
            font-weight: bold;
            color: #4a6b8a;
            text-transform: uppercase;
            margin: 6px 0 2px 0;
        }
        h1 {
            font-size: 18px;
            color: #1a3673;
            margin: 4px 0 6px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
        }
        th, td {
            padding: 7px 8px;
            border-bottom: 1px solid #cbd5e1;
            text-align: left;
        }
        th {
            background: #1a3673;
            color: #ffffff;
            font-size: 9.5px;
            text-transform: uppercase;
        }
        small {
            color: #475569;
        }
        .footer {
            margin-top: 22px;
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
            font-size: 9px;
            color: #475569;
        }
    </style>
</head>
<body>
    @include('pdf.encg-header')

    <p class="service-tag">ENCG · Service des admissions</p>
    <h1>{{ $title }}</h1>
    <p><strong>{{ $campaign->name }}</strong> · Campagne {{ $campaign->id }}</p>

    <table>
        <thead>
            <tr>
                <th>Référence</th>
                <th>Nom et prénom</th>
                <th>CNE</th>
                <th>Rang officiel</th>
                <th>Score officiel</th>
                <th>État du dossier</th>
            </tr>
        </thead>
        <tbody>
            @foreach($applications as $a)
                <tr>
                    <td>{{ $a->reference_number }}</td>
                    <td>{{ $a->last_name }} {{ $a->first_name }}</td>
                    <td>{{ $a->cne }}</td>
                    <td>{{ $a->ranking ?? 'Non renseigné' }}</td>
                    <td>{{ $a->selection_score ?? 'Non renseigné' }}</td>
                    <td>{{ $a->dossier_status }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if($receipt)
        <p style="margin-top: 14px;">Ce récépissé confirme le dépôt du dossier. Il ne remplace pas la décision administrative ni une inscription pédagogique définitive.</p>
    @endif

    <p class="footer">
        Généré le {{ now()->format('d/m/Y H:i') }}. Les rangs et scores proviennent de la source importée ; aucun résultat n’est calculé par l’IA. Le statut actualisé est disponible dans l’espace personnel.
    </p>
</body>
</html>

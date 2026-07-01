<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PV d'Examen</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        h1 { color: #2c3e50; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
    </style>
</head>
<body>
    <h1>Procès-Verbal d'Examen (#{{ $exam_id }})</h1>
    <table>
        <thead>
            <tr>
                <th>CNE</th>
                <th>Nom & Prénom</th>
                <th>Note</th>
                <th>Signature</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td colspan="4" style="text-align: center; color: #777;">Données dynamiques à insérer ici</td>
            </tr>
        </tbody>
    </table>
</body>
</html>

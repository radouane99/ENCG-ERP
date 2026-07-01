<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Attestation de Réussite</title>
    <style>
        body { font-family: sans-serif; padding: 40px; text-align: center; }
        .border { border: 4px double #2c3e50; padding: 40px; }
        h1 { color: #2c3e50; font-size: 36px; margin-bottom: 40px; }
        .text { font-size: 18px; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="border">
        <h1>Attestation de Réussite</h1>
        <div class="text">
            <p>Le directeur de l'établissement atteste que l'étudiant (ID: {{ $student_id }})</p>
            <p>a réussi son année universitaire <strong>{{ $year }}</strong> avec succès.</p>
            <br><br><br>
            <p>Fait pour valoir et servir ce que de droit.</p>
        </div>
    </div>
</body>
</html>

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Rapport</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        h1 { color: #2c3e50; text-align: center; }
        .content { margin-top: 30px; }
    </style>
</head>
<body>
    <h1>{{ $title ?? 'Document Administratif' }}</h1>
    <div class="content">
        <p>Ce document a été généré automatiquement par le système ENCG ERP.</p>
        <p>Date d'édition : {{ date('d/m/Y H:i') }}</p>
    </div>
</body>
</html>

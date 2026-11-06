<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Reçu de mouvement d’un original — ENCG Fès</title>
    <style>
        @page { margin: 12mm 14mm; }
        body {
            font-family: 'DejaVu Sans', Arial, Helvetica, sans-serif;
            color: #1e293b;
            font-size: 11.5px;
            line-height: 1.45;
        }
        .institution-subtitle {
            font-size: 10px;
            color: #475569;
            margin-top: 4px;
        }
        h1 {
            font-size: 19px;
            color: #1a3673;
            border-bottom: 2.5px solid #1a3673;
            padding-bottom: 10px;
            margin: 12px 0 16px 0;
            text-transform: uppercase;
        }
        p {
            margin: 12px 0;
        }
        .note {
            border: 1px solid #cbd5e1;
            border-left: 3.5px solid #1a3673;
            background: #f8fafc;
            padding: 14px 16px;
            margin-top: 24px;
        }
        .footer-bar {
            margin-top: 28px;
            padding-top: 8px;
            border-top: 1px solid #cbd5e1;
            font-size: 8.5px;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>
<body>
    @include('pdf.encg-header')

    <div class="institution-subtitle">
        <strong>{{ $app->campaign->institution?->name ?? 'ENCG Fès — Université Sidi Mohamed Ben Abdellah' }}</strong>
    </div>

    <h1>Reçu de mouvement d’un original</h1>

    <p><strong>Référence du mouvement :</strong> ORI-{{ $record->id }}</p>
    <p><strong>Dossier :</strong> {{ $app->reference_number }} · {{ $app->last_name }} {{ $app->first_name }}</p>
    <p><strong>Massar / CNE :</strong> {{ $app->cne }}</p>
    <p><strong>Pièce :</strong> {{ ['bac'=>'Baccalauréat','releve_notes'=>'Relevé de notes','attestation_admission'=>'Attestation d’admission','releve_parcours'=>'Relevé du parcours','diplome_bac2'=>'Diplôme Bac+2'][$record->document_type] }}</p>
    <p><strong>Opération :</strong> {{ ['received'=>'Réception','relocated'=>'Changement de rangement','returned'=>'Restitution au titulaire'][$record->event] }}</p>
    <p><strong>Enregistrée le</strong> {{ \Carbon\Carbon::parse($record->created_at)->timezone(config('admissions.timezone'))->format('d/m/Y H:i') }} <strong>par</strong> {{ $agent }}</p>

    <div class="note">
        Ce reçu constate l’opération enregistrée au guichet. Il ne certifie pas l’authenticité de la pièce et ne remplace pas la décision d’inscription.
        <p>Visa de l’agent : __________________</p>
        <p>Signature du titulaire : __________________</p>
    </div>

    <div class="footer-bar">
        École Nationale de Commerce et de Gestion de Fès — Université Sidi Mohamed Ben Abdellah (USMBA) · Service de la Scolarité
    </div>
</body>
</html>

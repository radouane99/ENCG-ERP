<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Rendez-vous · {{ $campaign->name }} — ENCG Fès</title>
    <style>
        @page { margin: 12mm 14mm; }
        body {
            font-family: 'DejaVu Sans', Arial, Helvetica, sans-serif;
            font-size: 10.5px;
            color: #1e293b;
            line-height: 1.4;
        }
        .doc-title-banner {
            background: #f8fafc;
            border-left: 4px solid #1a3673;
            border-bottom: 1px solid #cbd5e1;
            padding: 8px 12px;
            margin: 8px 0 14px 0;
        }
        h1 {
            font-size: 16px;
            color: #1a3673;
            margin: 0;
            text-transform: uppercase;
        }
        h2 {
            font-size: 14px;
            color: #1a3673;
            margin: 0 0 6px 0;
        }
        .label {
            border: 1px solid #94a3b8;
            border-left: 3.5px solid #1a3673;
            padding: 14px 16px;
            margin-bottom: 12px;
            background: #ffffff;
            page-break-inside: avoid;
        }
        .label p {
            margin: 4px 0;
        }
        .token {
            font-size: 9px;
            font-family: 'DejaVu Sans Mono', monospace;
            color: #334155;
            background: #f1f5f9;
            padding: 3px 6px;
        }
        .footer-note {
            margin-top: 14px;
            padding-top: 6px;
            border-top: 1px solid #cbd5e1;
            font-size: 8.5px;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>
<body>
    @include('pdf.encg-header')

    <div class="doc-title-banner">
        <h1>Rendez-vous · {{ $campaign->name }}</h1>
    </div>

    @foreach($labels as $label)
        <section class="label">
            <h2>{{ $label->last_name }} {{ $label->first_name }}</h2>
            <p><strong>{{ $label->reference_number }}</strong> · CNE {{ $label->cne }}</p>
            <p>{{ $slot->desk }} · {{ \Carbon\Carbon::parse($slot->starts_at, 'UTC')->tz(config('admissions.timezone'))->format('d/m/Y H:i') }} · Heure du Maroc</p>
            <p class="token">Jeton d’entrée personnel : {{ $label->entry_token }}</p>
            <p style="font-size: 9.5px; color: #475569;">Ce rendez-vous ne vaut pas inscription définitive.</p>
        </section>
    @endforeach

    <div class="footer-note">
        École Nationale de Commerce et de Gestion de Fès — Université Sidi Mohamed Ben Abdellah (USMBA) · Service des Admissions
    </div>
</body>
</html>

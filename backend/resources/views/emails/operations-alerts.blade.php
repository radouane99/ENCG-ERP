<!doctype html>
<html lang="fr"><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#17243a;background:#f8fafc;padding:24px">
<main style="max-width:640px;margin:auto;background:white;padding:24px;border-top:4px solid #1a3673">
    <h1 style="font-size:20px;color:#1a3673">Surveillance technique — ENCG ERP</h1>
    <p>{{ now()->timezone('Africa/Casablanca')->format('d/m/Y H:i') }}</p>
    @if($newAlerts)
        <h2 style="font-size:16px">Nouveaux incidents</h2>
        @foreach($newAlerts as $alert)
            <p><strong>{{ $alert['name'] }} · {{ $alert['severity'] }}</strong><br>{{ $alert['summary'] }}</p>
        @endforeach
    @endif
    @if($resolvedAlerts)
        <h2 style="font-size:16px">Incidents résolus</h2>
        @foreach($resolvedAlerts as $alert)
            <p><strong>{{ $alert['name'] }}</strong><br>{{ $alert['summary'] }}</p>
        @endforeach
    @endif
    <p style="font-size:12px;color:#64748b">Consulter les règles et les procédures du guide d'exploitation avant toute relance. Un incident inchangé ne déclenche pas un nouveau message.</p>
</main></body></html>

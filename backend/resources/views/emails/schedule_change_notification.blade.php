<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Notification Modification Emploi du Temps - ENCG Fès</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="background-color: #002e5b; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 18px;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</h2>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Modification d'Emploi du Temps / Séance de Rattrapage</p>
        </div>
        
        <div style="padding: 25px;">
            <p>Bonjour,</p>
            
            <p>Nous vous informons qu'une modification officielle de l'emploi du temps a été validée par la Direction Académique :</p>
            
            <div style="background-color: #f8fafc; border: 1.5px solid #002e5b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #002e5b;">Module : {{ $moduleName }}</p>
                <p style="margin: 0 0 5px 0; font-size: 13px;"><strong>Enseignant :</strong> {{ $professorName }}</p>
                <p style="margin: 0 0 5px 0; font-size: 13px;"><strong>Nouveau Créneau :</strong> {{ $newDate }} de {{ $newStartTime }} à {{ $newEndTime }}</p>
                <p style="margin: 0; font-size: 13px;"><strong>Salle Assignée :</strong> {{ $roomName }}</p>
            </div>
            
            <p style="font-size: 12px; color: #64748b;">
                <em>Motif : {{ $reason ?? 'Demande d\'ajustement pédagogique ou rattrapage' }}</em>
            </p>
            
            <p style="margin-top: 30px; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 15px; color: #94a3b8;">
                École Nationale de Commerce et de Gestion de Fès — ERP Officiel<br>
                Route d'Imouzzer, B.P. 1255, Fès - Maroc
            </p>
        </div>
    </div>
</body>
</html>

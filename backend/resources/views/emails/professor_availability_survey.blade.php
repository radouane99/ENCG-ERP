<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Disponibilités de Surveillance - ENCG Fès</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="background-color: #002e5b; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 18px;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</h2>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Saisie des Disponibilités de Surveillance d'Examens</p>
        </div>
        
        <div style="padding: 25px;">
            <p>Bonjour Professeur <strong>{{ $professorName }}</strong>,</p>
            
            <p>L'Administration Académique de l'ENCG Fès prépare la planification intelligente des surveillances d'examens pour la <strong>{{ $sessionName }}</strong> ({{ $sessionType }}).</p>
            
            <p>Afin d'optimiser l'affectation équitable par Intelligence Artificielle et de respecter au mieux vos contraintes horaires, nous vous invitons à saisir vos créneaux de disponibilité sur le Portail Enseignant :</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{{ $surveyUrl }}" style="background-color: #002e5b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                    📅 Accéder à ma Fiche de Disponibilités
                </a>
            </div>
            
            <p style="font-size: 12px; color: #64748b;">
                <strong>Date limite de saisie :</strong> {{ $deadline ?? 'Sous 48 heures' }}<br>
                <em>Remarque : L'algorithme d'IA veillera à une répartition parfaitement équitable des heures de surveillance entre tous les membres du corps professoral.</em>
            </p>
            
            <p style="margin-top: 30px; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 15px; color: #94a3b8;">
                École Nationale de Commerce et de Gestion de Fès — ERP Intelligente<br>
                Route d'Imouzzer, B.P. 1255, Fès - Maroc
            </p>
        </div>
    </div>
</body>
</html>

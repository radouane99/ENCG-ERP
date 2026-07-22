<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Convocation aux Examens</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #002e5b;">Convocation aux Examens - ENCG Fès</h2>
    </div>

    <p>Bonjour Professeur <strong>{{ $emailData['professorName'] }}</strong>,</p>

    <p>Veuillez trouver ci-joint votre convocation officielle (planning de surveillance) pour la session <strong>{{ $emailData['sessionName'] ?? 'principale' }}</strong>.</p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0f2863;">Détails de vos affectations :</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
                <tr style="background-color: #0f2863; color: white;">
                    <th style="padding: 8px; text-align: left; border: 1px solid #cbd5e1;">Date & Heure</th>
                    <th style="padding: 8px; text-align: left; border: 1px solid #cbd5e1;">Module</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #cbd5e1;">Salle</th>
                    <th style="padding: 8px; text-align: center; border: 1px solid #cbd5e1;">Rôle</th>
                </tr>
            </thead>
            <tbody>
                @foreach($emailData['exams'] as $exam)
                <tr>
                    <td style="padding: 8px; border: 1px solid #cbd5e1;">{{ $exam['examDate'] }} à {{ substr($exam['examTime'], 0, 5) }}</td>
                    <td style="padding: 8px; border: 1px solid #cbd5e1;">{{ $exam['moduleName'] }}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #cbd5e1;">{{ $exam['roomName'] }}</td>
                    <td style="padding: 8px; text-align: center; border: 1px solid #cbd5e1;">{{ ucfirst($exam['role']) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <p><strong>Note importante :</strong> L'accès aux salles d'examen nécessite la présentation de la version électronique ou imprimée de ce document (incluant votre QR Code unique pour l'émargement).</p>
    
    @if(isset($emailData['confirmUrl']))
    <div style="text-align: center; margin: 30px 0;">
        <p style="margin-bottom: 10px;">Veuillez confirmer la réception de cet ordre de mission :</p>
        <a href="{{ $emailData['confirmUrl'] }}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Je confirme ma présence
        </a>
    </div>
    @endif

    <p style="margin-top: 30px;">Cordialement,<br>
    <strong>Administration ENCG Fès</strong></p>
    
    <div style="margin-top: 40px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px;">
        Ce message est généré automatiquement. Merci de ne pas y répondre.
    </div>
</body>
</html>

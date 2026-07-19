<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Relevé de Notes Officiel - ENCG Fès</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background-color: #003a8c; color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">École Nationale de Commerce et de Gestion</h1>
            <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.85;">Université Sidi Mohamed Ben Abdellah - Fès</p>
        </div>
        
        <div style="padding: 24px;">
            <p style="font-size: 15px; line-height: 1.5; color: #1e293b;">Bonjour <strong>{{ $studentName }}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.5; color: #475569;">
                Veuillez trouver ci-joint votre relevé de notes officiel pour la session académique <strong>{{ $sessionName }}</strong>.
            </p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #003a8c; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 13px; color: #334155;">
                    📌 <strong>Document Officiel Téléchargeable :</strong><br>
                    Ce document contient une empreinte numérique vérifiable via QR Code sur le portail institutionnel.
                </p>
            </div>

            <p style="font-size: 13px; color: #64748b; line-height: 1.4;">
                Pour toute réclamation administrative, veuillez soumettre votre demande via votre espace étudiant.
            </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-t: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            © {{ date('Y') }} ENCG Fès — Service de la Scolarité & des Examens. Tous droits réservés.
        </div>
    </div>
</body>
</html>

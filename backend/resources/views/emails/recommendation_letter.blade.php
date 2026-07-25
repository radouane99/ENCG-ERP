<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Lettre de Recommandation Officielle</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333;">
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #0f2863; padding: 30px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</h1>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #93c5fd;">Portail Officiel des Recommandations Académiques</p>
        </div>

        <!-- Content Body -->
        <div style="padding: 30px; line-height: 1.6; font-size: 14px;">
            <p style="font-weight: bold; color: #0f2863;">Bonjour {{ $studentName }},</p>
            
            <p>Nous avons le plaisir de vous informer que votre demande de lettre de recommandation pour <strong>{{ $purpose }}</strong> a été <strong>approuvée et signée électroniquement</strong> par <strong>Pr. {{ $professorName }}</strong>.</p>
            
            <div style="background-color: #f8fafc; border-left: 4px solid #0f2863; padding: 20px; margin: 20px 0; border-radius: 4px; font-family: 'Times New Roman', serif; font-size: 15px; color: #1e293b;">
                {!! nl2br(e($letterContent)) !!}
            </div>

            <p style="font-size: 12px; color: #64748b;">
                🔒 <strong>Vérification Numérique :</strong> Ce document comporte un filigrane numérique et un QR Code de vérification authentifié par la Direction des Études de l'ENCG Fès.
            </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0;">© {{ date('Y') }} ENCG Fès — Université Sidi Mohamed Ben Abdellah</p>
            <p style="margin: 5px 0 0 0;">Route d'Imouzzer, BP 81, Fès, Maroc</p>
        </div>
    </div>
</body>
</html>

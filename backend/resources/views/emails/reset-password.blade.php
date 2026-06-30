<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: 'Inter', sans-serif; background-color: #f5f7fa; margin: 0; padding: 40px 20px; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .header { background: linear-gradient(135deg, #1F3A5F, #0f172a); padding: 30px; text-align: center; color: white; }
  .header h1 { margin: 0; font-size: 24px; }
  .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
  .btn { display: inline-block; background-color: #A80A0B; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
  .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ENCG Fès ERP</h1>
    </div>
    <div class="content">
      <h2>Réinitialisation de votre mot de passe</h2>
      <p>Bonjour,</p>
      <p>Vous recevez cet email car nous avons reçu une demande de réinitialisation de mot de passe pour votre compte.</p>
      <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
      <div style="text-align: center;">
        <a href="{{ $resetUrl }}" class="btn" style="color: #ffffff;">Réinitialiser mon mot de passe</a>
      </div>
      <p style="margin-top: 30px; font-size: 13px; color: #64748b;">Ce lien expirera dans 60 minutes.<br>Si vous n'avez pas demandé de réinitialisation, aucune action n'est requise.</p>
    </div>
    <div class="footer">
      <p>© {{ date('Y') }} ENCG Fès ERP. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>

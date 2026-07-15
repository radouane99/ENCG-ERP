<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f1f5f9; padding: 40px 20px; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #0f2863 0%, #1a387e 100%); padding: 36px 32px; text-align: center; }
  .header-badge { display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 50px; padding: 6px 16px; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; color: #93c5fd; text-transform: uppercase; margin-bottom: 14px; }
  .header h1 { color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.3px; }
  .header p { color: rgba(255,255,255,0.6); font-size: 13px; margin-top: 4px; }
  .alert-strip { background: linear-gradient(90deg, #f59e0b, #fbbf24); padding: 14px 32px; display: flex; align-items: center; gap: 10px; }
  .alert-strip-icon { font-size: 20px; }
  .alert-strip-text { font-size: 13px; font-weight: 700; color: #78350f; }
  .content { padding: 36px 32px; color: #334155; line-height: 1.7; }
  .greeting { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
  .body-text { font-size: 14px; color: #475569; margin-bottom: 16px; }
  .deadline-card { background: #fef3c7; border: 1.5px solid #fbbf24; border-radius: 12px; padding: 20px 24px; margin: 24px 0; display: flex; gap: 16px; align-items: flex-start; }
  .deadline-icon { font-size: 28px; flex-shrink: 0; }
  .deadline-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #92400e; margin-bottom: 4px; }
  .deadline-date { font-size: 20px; font-weight: 800; color: #92400e; }
  .deadline-session { font-size: 12px; color: #b45309; margin-top: 2px; }
  .action-note { background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 0 8px 8px 0; padding: 14px 18px; margin: 20px 0; font-size: 13px; color: #166534; }
  .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
  .footer-logo { font-size: 13px; font-weight: 800; color: #0f2863; letter-spacing: -0.3px; }
  .footer-address { font-size: 11px; color: #94a3b8; margin-top: 6px; }
  .footer-copy { font-size: 11px; color: #cbd5e1; margin-top: 10px; }
</style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-badge">ENCG Fès — Système ERP</div>
      <h1>Notification Académique</h1>
      <p>Portail de Gestion des Notes</p>
    </div>

    <!-- Alert strip -->
    <div class="alert-strip">
      <div class="alert-strip-icon">⏰</div>
      <div class="alert-strip-text">Clôture imminente de la période de saisie des notes</div>
    </div>

    <!-- Main content -->
    <div class="content">
      <p class="greeting">Bonjour {{ $professorName }},</p>

      <p class="body-text">
        Nous vous informons que la période de saisie des notes pour la session
        <strong>{{ $sessionLabel }}</strong> se clôturera dans moins de <strong>24 heures</strong>.
      </p>

      <!-- Deadline card -->
      <div class="deadline-card">
        <div class="deadline-icon">📅</div>
        <div>
          <div class="deadline-label">Date limite de saisie</div>
          <div class="deadline-date">{{ \Carbon\Carbon::parse($endDate)->translatedFormat('l d F Y') }}</div>
          <div class="deadline-session">Session : {{ $sessionLabel }}</div>
        </div>
      </div>

      <p class="body-text">
        Passé ce délai, l'accès à la saisie sera automatiquement <strong>verrouillé</strong> par le système.
        Aucune modification ne pourra être effectuée sans intervention de l'administration.
      </p>

      <div class="action-note">
        ✅ <strong>Action requise :</strong> Veuillez vous connecter au portail ERP et compléter la saisie
        de toutes les notes avant la date limite indiquée ci-dessus.
      </div>

      <p class="body-text" style="font-size: 13px; color: #94a3b8; margin-top: 24px;">
        Si vous avez déjà soumis toutes vos notes, vous pouvez ignorer ce message.<br>
        Pour toute difficulté, contactez le service de la scolarité.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">ENCG Fès</div>
      <div class="footer-address">Route d'Imouzzer, Fès 30000, Maroc</div>
      <div class="footer-copy">© {{ date('Y') }} ENCG Fès ERP. Notification automatique — ne pas répondre à cet email.</div>
    </div>
  </div>
</body>
</html>

<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mise à jour statut inscription — ENCG Fès</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2863 0%,#1a387e 100%);padding:32px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:#fbbf24;font-size:11px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">ROYAUME DU MAROC — USMBA</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:1px;">ÉCOLE NATIONALE DE COMMERCE<br>ET DE GESTION DE FÈS</h1>
              <p style="margin:8px 0 0;color:#93c5fd;font-size:12px;">Portail Scolarité — Gestion des Inscriptions</p>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding:32px 40px 0;text-align:center;">
              <div style="display:inline-block;background-color:{{ $statusColor }};color:#ffffff;padding:10px 28px;border-radius:50px;font-size:15px;font-weight:900;letter-spacing:1px;">
                {{ $statusLabel }}
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 40px;">
              <p style="margin:0 0 16px;font-size:15px;color:#1e293b;">Madame / Monsieur,</p>
              <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.7;">
                Nous vous informons que le statut de votre dossier d'inscription à l'<strong>ENCG Fès</strong> a été mis à jour.
              </p>

              <!-- Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:45%;">Étudiant(e)</td>
                        <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:900;">{{ $studentName }}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;">CNE</td>
                        <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:700;">{{ $cne }}</td>
                      </tr>
                      @if($studentNumber)
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;">N° Inscription</td>
                        <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:900;font-family:monospace;">{{ $studentNumber }}</td>
                      </tr>
                      @endif
                      <tr>
                        <td style="padding:6px 0;font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Nouveau Statut</td>
                        <td style="padding:6px 0;">
                          <span style="background-color:{{ $statusColor }};color:#fff;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:900;">{{ $statusLabel }}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              @if($newStatus === 'dossier_incomplet')
              <!-- Missing docs warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#92400e;font-weight:900;">⚠️ Action Requise — Documents Manquants</p>
                    <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">
                      Votre dossier est incomplet. Veuillez vous connecter au portail d'inscription pour téléverser les documents manquants dans les plus brefs délais.
                    </p>
                  </td>
                </tr>
              </table>
              @endif

              @if($newStatus === 'inscrit')
              <!-- Congratulations card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%);border:1px solid #6ee7b7;border-radius:12px;margin-bottom:20px;">
                <tr>
                  <td style="padding:20px 24px;text-align:center;">
                    <p style="margin:0 0 6px;font-size:22px;">🎓</p>
                    <p style="margin:0 0 8px;font-size:15px;color:#064e3b;font-weight:900;">Félicitations ! Votre inscription est officiellement confirmée.</p>
                    <p style="margin:0;font-size:13px;color:#065f46;">Votre carte étudiant et votre attestation d'inscription seront disponibles auprès de la Scolarité.</p>
                  </td>
                </tr>
              </table>
              @endif

              <!-- CTA Button -->
              <div style="text-align:center;margin-top:24px;">
                <a href="{{ url('/mon-inscription?cne=' . $cne) }}"
                   style="display:inline-block;background:linear-gradient(135deg,#0f2863,#1a387e);color:#ffffff;padding:14px 32px;border-radius:12px;font-weight:900;font-size:13px;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">
                  Suivre mon Dossier d'Inscription →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                Cet email est envoyé automatiquement par le Portail Scolarité ENCG Fès.<br>
                Pour toute question, contactez la Division des Affaires Estudiantines — Tél : 0535 xx xx xx<br>
                <strong>no-reply@benadadarentcar.com</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>

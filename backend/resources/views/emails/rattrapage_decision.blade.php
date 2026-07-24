<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Décision Rattrapage — ENCG Fès</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,40,99,0.10);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2863 0%,#1a387e 60%,#0d4d8c 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 8px;color:#a8c4ff;font-size:12px;letter-spacing:2px;font-weight:600;text-transform:uppercase;">École Nationale de Commerce et de Gestion de Fès</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">ENCG Portail Académique</h1>
              <p style="margin:10px 0 0;color:#cbd5e1;font-size:13px;">Notification officielle — Session Rattrapage</p>
            </td>
          </tr>

          <!-- Decision Banner -->
          @if($decision === 'Accordé')
          <tr>
            <td style="background:#f0fdf4;border-bottom:3px solid #22c55e;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:32px;">✅</p>
              <p style="margin:8px 0 0;color:#15803d;font-size:18px;font-weight:800;">Rattrapage ACCORDÉ</p>
              <p style="margin:4px 0 0;color:#16a34a;font-size:13px;">Vous êtes autorisé(e) à passer l'examen de rattrapage</p>
            </td>
          </tr>
          @else
          <tr>
            <td style="background:#fef2f2;border-bottom:3px solid #ef4444;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:32px;">❌</p>
              <p style="margin:8px 0 0;color:#b91c1c;font-size:18px;font-weight:800;">Rattrapage REFUSÉ</p>
              <p style="margin:4px 0 0;color:#dc2626;font-size:13px;">Votre dossier ne satisfait pas les conditions d'accès au rattrapage</p>
            </td>
          </tr>
          @endif

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:15px;">Bonjour <strong style="color:#0f2863;">{{ $studentName }}</strong>,</p>

              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.7;">
                Suite à la délibération du jury académique, nous vous informons de la décision concernant votre dossier de rattrapage pour le module suivant :
              </p>

              <!-- Module Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%">
                      <tr>
                        <td style="padding-bottom:12px;border-bottom:1px solid #e2e8f0;">
                          <p style="margin:0;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Module</p>
                          <p style="margin:4px 0 0;color:#0f2863;font-size:16px;font-weight:700;">{{ $moduleName }}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:12px;">
                          <p style="margin:0;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Filière</p>
                          <p style="margin:4px 0 0;color:#1e40af;font-size:14px;font-weight:600;">{{ $filiereName }}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Raison -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 20px;">
                    <p style="margin:0;color:#92400e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Motif</p>
                    <p style="margin:6px 0 0;color:#78350f;font-size:13px;">{{ $reason }}</p>
                    @if($decisionNote)
                    <p style="margin:8px 0 0;color:#92400e;font-size:12px;font-style:italic;">Note de l'administration : {{ $decisionNote }}</p>
                    @endif
                  </td>
                </tr>
              </table>

              @if($decision === 'Accordé')
              <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.7;">
                Veuillez consulter votre emploi du temps pour les informations relatives à la date, l'heure et la salle de votre examen de rattrapage.
              </p>
              @else
              <p style="margin:0 0 12px;color:#374151;font-size:14px;line-height:1.7;">
                Pour toute contestation de cette décision, veuillez vous rapprocher du secrétariat académique dans un délai de <strong>5 jours ouvrables</strong> à compter de la réception de ce message.
              </p>
              @endif
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;">École Nationale de Commerce et de Gestion de Fès (ENCG-Fès)</p>
              <p style="margin:0;color:#9ca3af;font-size:11px;">Université Sidi Mohamed Ben Abdellah · BP 24 Aïn Smen, Fès, Maroc</p>
              <p style="margin:8px 0 0;color:#cbd5e1;font-size:10px;">Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>

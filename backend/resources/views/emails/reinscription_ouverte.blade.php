<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Réinscription {{ $academicYear }} — ENCG Fès</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2863 0%,#1a387e 100%);padding:32px 40px;text-align:center;">
              <p style="margin:0 0 4px;color:#fbbf24;font-size:11px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">ROYAUME DU MAROC — USMBA</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:900;">ENCG FÈS</h1>
              <p style="margin:8px 0 0;color:#93c5fd;font-size:13px;">Division des Affaires Estudiantines</p>
            </td>
          </tr>

          <!-- Emoji Banner -->
          <tr>
            <td style="padding:32px 40px 8px;text-align:center;">
              <p style="font-size:40px;margin:0;">{{ $isReminder ? '⏰' : '🔁' }}</p>
              <h2 style="color:#0f2863;font-size:20px;font-weight:900;margin:12px 0 4px;">
                {{ $isReminder ? 'Rappel — Réinscription' : 'Réinscription' }} {{ $academicYear }}
              </h2>
              <p style="color:#64748b;font-size:13px;margin:0;">
                {{ $isReminder ? 'Vous avez jusqu\'au 31 Août pour confirmer votre réinscription.' : 'La période de réinscription est maintenant ouverte.' }}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 40px;">
              <p style="font-size:15px;color:#1e293b;margin:0 0 16px;">Madame / Monsieur <strong>{{ $studentName }}</strong>,</p>

              @if($isReminder)
              <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 20px;">
                Nous vous rappelons que la période de réinscription pour l'année académique <strong>{{ $academicYear }}</strong> se termine le <strong>31 Août {{ explode('-', $academicYear)[1] }}</strong>.
                Veuillez confirmer votre réinscription dès que possible pour éviter la perte de votre place.
              </p>
              @else
              <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 20px;">
                Nous avons le plaisir de vous informer que la réinscription pour l'année académique <strong>{{ $academicYear }}</strong>
                est maintenant <strong>ouverte</strong>. Vous êtes éligible à la réinscription en tant qu'étudiant(e) actif(ve) de l'ENCG Fès.
              </p>
              @endif

              <!-- Conditions Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 10px;font-size:13px;font-weight:900;color:#1e40af;">📋 Documents requis pour la réinscription :</p>
                    <ul style="margin:0;padding-left:20px;font-size:13px;color:#1e3a8a;line-height:2;">
                      <li>Attestation de réussite ou relevé de notes annuel</li>
                      <li>Certificat médical d'aptitude (renouvelé)</li>
                      <li>Copie CNIE valide</li>
                      <li>2 Photos d'identité récentes</li>
                      <li>Preuve de règlement des frais de scolarité</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:20px;">
                <tr>
                  <td style="padding:16px 24px;">
                    <table width="100%">
                      <tr>
                        <td style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;width:40%;padding:5px 0;">CNE</td>
                        <td style="font-size:13px;color:#0f172a;font-weight:900;padding:5px 0;">{{ $cne }}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:5px 0;">Année Cible</td>
                        <td style="font-size:13px;color:#0f172a;font-weight:900;padding:5px 0;">{{ $academicYear }}</td>
                      </tr>
                      <tr>
                        <td style="font-size:12px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:5px 0;">Date Limite</td>
                        <td style="font-size:13px;color:#dc2626;font-weight:900;padding:5px 0;">31 Août {{ explode('-', $academicYear)[1] }}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align:center;margin-top:24px;">
                <a href="{{ url('/mon-inscription?cne=' . $cne) }}"
                   style="display:inline-block;background:linear-gradient(135deg,#0f2863,#1a387e);color:#ffffff;padding:14px 32px;border-radius:12px;font-weight:900;font-size:13px;text-decoration:none;letter-spacing:1px;text-transform:uppercase;">
                  {{ $isReminder ? 'Confirmer ma Réinscription →' : 'Démarrer ma Réinscription →' }}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                ENCG Fès — Route d'Imouzzer, Fès 30000, Maroc<br>
                Tél : 0535 xx xx xx | scolarite@encg-fes.ac.ma<br>
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

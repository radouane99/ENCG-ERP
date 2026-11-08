<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Code de connexion ENCG Fès</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
                    <tr>
                        <td style="background-color:#0f2863;padding:24px 32px;color:#ffffff;">
                            <div style="font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#93c5fd;">
                                Portail Officiel • ENCG Fès — USMBA
                            </div>
                            <h1 style="margin:8px 0 0 0;font-size:20px;font-weight:bold;">
                                Code de Connexion Instantanée (OTP)
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px 32px;">
                            <p style="margin:0 0 16px 0;font-size:14px;line-height:1.6;">
                                Bonjour <strong>{{ $userName }}</strong>,
                            </p>
                            <p style="margin:0 0 20px 0;font-size:14px;line-height:1.6;color:#334155;">
                                Voici votre code de vérification à usage unique pour accéder à votre espace numérique ENCG Fès sans mot de passe :
                            </p>
                            <div style="text-align:center;margin:24px 0;padding:20px;background-color:#f1f5f9;border-radius:12px;border:1px dashed #94a3b8;">
                                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0f2863;font-family:monospace;">
                                    {{ $otpCode }}
                                </span>
                            </div>
                            <p style="margin:0 0 12px 0;font-size:12px;color:#64748b;">
                                ⏳ Ce code est valable pendant <strong>{{ $ttlMinutes }} minutes</strong> (IP : {{ $ipAddress }}).
                            </p>
                            <p style="margin:0;font-size:12px;color:#64748b;">
                                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>


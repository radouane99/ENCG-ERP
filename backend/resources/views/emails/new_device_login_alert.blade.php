<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Alerte de Sécurité — Nouvel Appareil Détecté</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="580" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;border:1px solid #fecaca;overflow:hidden;">
                    <tr>
                        <td style="background-color:#7f1d1d;padding:24px 32px;text-align:center;">
                            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#fca5a5;font-weight:bold;">
                                ENCG FÈS · USMBA — CELLULE CYBERSÉCURITÉ (DGSSI / CNDP)
                            </div>
                            <h1 style="margin:8px 0 0;font-size:19px;color:#ffffff;">
                                Connexion depuis un nouvel appareil détectée
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px 32px;">
                            <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155;">
                                Bonjour <strong>{{ $recipientName }}</strong>,
                            </p>
                            <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#475569;">
                                Notre système de détection d'anomalies a enregistré une connexion à votre compte institutionnel ENCG Fès depuis un appareil ou une adresse IP non reconnue auparavant :
                            </p>
                            <table width="100%" cellpadding="10" cellspacing="0" style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:10px;font-size:13px;color:#1e293b;margin-bottom:20px;">
                                <tr>
                                    <td style="font-weight:bold;width:38%;color:#991b1b;">Appareil :</td>
                                    <td>{{ $deviceLabel }} ({{ $browserAndOs }})</td>
                                </tr>
                                <tr>
                                    <td style="font-weight:bold;color:#991b1b;">Adresse IP :</td>
                                    <td>{{ $ipAddress }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight:bold;color:#991b1b;">Méthode d'authentification :</td>
                                    <td>{{ $authMethod }}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight:bold;color:#991b1b;">Date &amp; Heure :</td>
                                    <td>{{ $loggedInAt }}</td>
                                </tr>
                            </table>
                            <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#475569;">
                                <strong>Si c'était bien vous :</strong> cet appareil a été ajouté à votre liste d'appareils connus.
                            </p>
                            <p style="margin:0;font-size:13px;line-height:1.6;color:#b91c1c;font-weight:bold;">
                                Si vous ne reconnaissez pas cette activité : rendez-vous immédiatement dans « Mon Profil &rarr; Sécurité &amp; Sessions » pour révoquer toutes les sessions actives et modifier votre mot de passe.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#f1f5f9;padding:16px 32px;text-align:center;font-size:11px;color:#64748b;">
                            École Nationale de Commerce et de Gestion de Fès (ENCG Fès) · Conformité Loi 09-08 CNDP &amp; DNSSI
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>


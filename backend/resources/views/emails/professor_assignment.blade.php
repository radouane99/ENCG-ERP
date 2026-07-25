<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Notification Officielle d'Affectation Pédagogique</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #1e293b;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
            <td style="background-color: #0f2863; padding: 25px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 20px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">
                    ROYAUME DU MAROC
                </h1>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #cbd5e1;">
                    Université Sidi Mohamed Ben Abdellah — Fès
                </p>
                <p style="margin: 3px 0 0 0; font-size: 14px; font-weight: bold; color: #f59e0b;">
                    ÉCOLE NATIONALE DE COMMERCE ET DE GESTION
                </p>
            </td>
        </tr>

        <!-- Body Content -->
        <tr>
            <td style="padding: 30px;">
                <div style="background-color: #f8fafc; border-left: 4px solid #0f2863; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                    <h2 style="margin: 0; font-size: 16px; color: #0f2863;">
                        ORDRE DE SERVICE & NOTIFICATION D'AFFECTATION
                    </h2>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">
                        Année Académique : <strong>{{ $academicYear }}</strong>
                    </p>
                </div>

                <p style="font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                    Chère / Cher Enseignant(e) <strong>{{ $profName }}</strong>,
                </p>

                <p style="font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
                    La Direction des Affaires Pédagogiques de l'ENCG Fès a le plaisir de vous notifier officiellement votre schéma d'affectation pour l'année académique <strong>{{ $academicYear }}</strong>. Vous trouverez ci-dessous le détail exhaustif des modules et groupes sous votre responsabilité :
                </p>

                <!-- Assignments Table -->
                <table width="100%" cellpadding="10" cellspacing="0" style="border-collapse: collapse; margin-bottom: 25px; font-size: 13px;">
                    <thead>
                        <tr style="background-color: #0f2863; color: #ffffff; text-align: left;">
                            <th style="border: 1px solid #0f2863; padding: 10px;">Code Module</th>
                            <th style="border: 1px solid #0f2863; padding: 10px;">Intitulé du Module</th>
                            <th style="border: 1px solid #0f2863; padding: 10px; text-align: center;">Groupe</th>
                            <th style="border: 1px solid #0f2863; padding: 10px; text-align: center;">Volume</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($assignments as $index => $item)
                        <tr style="background-color: {{ $index % 2 == 0 ? '#ffffff' : '#f8fafc' }};">
                            <td style="border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #0f2863;">
                                {{ strtok($item['module'] ?? 'MOD01', ' ') }}
                            </td>
                            <td style="border: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">
                                {{ substr(strstr($item['module'] ?? 'MOD01 Module', ' '), 1) ?: ($item['module'] ?? 'Module Académique') }}
                            </td>
                            <td style="border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #475569;">
                                {{ $item['group'] ?? 'TC-S1' }}
                            </td>
                            <td style="border: 1px solid #e2e8f0; text-align: center; font-family: monospace; color: #64748b;">
                                48h / Semestre
                            </td>
                        </tr>
                        @endforeach
                        <tr style="background-color: #e2e8f0; font-weight: bold; color: #0f2863;">
                            <td colSpan="3" style="border: 1px solid #cbd5e1; text-align: right; padding: 10px;">
                                TOTAL VOLUME HORAIRE CUMULÉ :
                            </td>
                            <td style="border: 1px solid #cbd5e1; text-align: center; font-family: monospace; padding: 10px;">
                                {{ $totalHours }}h / Semestre ({{ $weeklyHours }}h/sem)
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                    <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.5;">
                        📌 <strong>Rappel Pédagogique :</strong> Vous êtes invité(e) à télécharger votre Ordre de Service Officiel certifié depuis votre espace enseignant ou directement auprès du Secrétariat Général.
                    </p>
                </div>

                <p style="font-size: 13px; line-height: 1.6; color: #475569; margin-bottom: 30px;">
                    Cordialement,<br>
                    <strong>Direction des Affaires Pédagogiques</strong><br>
                    École Nationale de Commerce et de Gestion de Fès
                </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
                © 2026 ENCG ERP Fès — Université Sidi Mohamed Ben Abdellah.<br>
                Ceci est un email automatique officiel, merci de ne pas y répondre directement.
            </td>
        </tr>
    </table>
</body>
</html>

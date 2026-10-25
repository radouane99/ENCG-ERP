<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convocation Séance de Rattrapage</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #001A4B; padding: 28px 32px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</h1>
                            <p style="margin: 6px 0 0 0; color: #93c5fd; font-size: 13px; font-weight: 500;">ENCG Fès — Direction des Études & Affaires Pédagogiques</p>
                        </td>
                    </tr>

                    <!-- Alert Banner -->
                    <tr>
                        <td style="background-color: #f5f3ff; border-bottom: 2px solid #8b5cf6; padding: 14px 32px; text-align: center;">
                            <span style="display: inline-block; background-color: #7c3aed; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; padding: 4px 12px; border-radius: 9999px;">
                                Convocation Officielle de Rattrapage
                            </span>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px;">
                            <p style="font-size: 15px; line-height: 24px; margin: 0 0 16px 0;">
                                Bonjour <strong>{{ $studentName }}</strong>,
                            </p>

                            <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 20px 0;">
                                Vous avez été marqué(e) absent(e) lors de la séance principale <strong>{{ $seanceCode }}</strong> du module <strong>{{ $moduleName }}</strong>. Conformément aux dispositions pédagogiques de l'ENCG Fès, une séance de rattrapage a été planifiée par votre enseignant(e) afin de vous permettre de <strong>régulariser votre absence</strong>.
                            </p>

                            <!-- Session Details Box -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 0 24px 0;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="6">
                                            <tr>
                                                <td width="35%" style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Matière / Module :</td>
                                                <td style="font-size: 13px; font-weight: 700; color: #001A4B;">{{ $moduleName }} ({{ $moduleCode }})</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Séance d'origine :</td>
                                                <td style="font-size: 13px; font-weight: 600; color: #1e293b;">Séance {{ $seanceCode }}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Date du rattrapage :</td>
                                                <td style="font-size: 13px; font-weight: 800; color: #7c3aed;">{{ $date }}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Horaire :</td>
                                                <td style="font-size: 13px; font-weight: 700; color: #1e293b;">{{ $timeSlot }}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Salle / Lieu :</td>
                                                <td style="font-size: 13px; font-weight: 800; color: #059669;">{{ $room }}</td>
                                            </tr>
                                            <tr>
                                                <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Enseignant(e) :</td>
                                                <td style="font-size: 13px; font-weight: 600; color: #1e293b;">{{ $professorName }}</td>
                                            </tr>
                                            @if(!empty($notes))
                                            <tr>
                                                <td style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Consignes :</td>
                                                <td style="font-size: 13px; font-weight: 500; color: #334155;">{{ $notes }}</td>
                                            </tr>
                                            @endif
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Article 14 Warning Box -->
                            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 8px; margin: 0 0 24px 0;">
                                <p style="margin: 0; font-size: 12px; line-height: 18px; color: #92400e;">
                                    <strong>⚖️ Rappel Réglementaire (Article 14) :</strong><br>
                                    Tout étudiant cumulant 3 absences non justifiées ou non rattrapées dans un module est automatiquement exclu des examens de la session normale. Votre présence effective à ce rattrapage efface la pénalité d'absence sur cette séance.
                                </p>
                            </div>

                            <p style="font-size: 13px; line-height: 20px; color: #64748b; margin: 0;">
                                Merci de vous présenter à l'heure muni(e) de votre carte d'étudiant ou de votre application mobile ENCG pour le pointage de présence.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f1f5f9; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                            <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; font-weight: 600;">
                                École Nationale de Commerce et de Gestion de Fès (ENCG-Fès)
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                                Université Sidi Mohamed Ben Abdellah • BP 41 Fès-Gare
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

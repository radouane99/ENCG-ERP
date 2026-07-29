<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation de Pré-Inscription — ENCG Fès</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333333;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #0f2863 0%, #1a387e 100%); padding: 30px 25px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">École Nationale de Commerce et de Gestion de Fès</h1>
                <p style="margin: 6px 0 0 0; font-size: 13px; color: #cbd5e1;">Université Sidi Mohamed Ben Abdellah</p>
                <div style="display: inline-block; margin-top: 15px; background-color: rgba(255, 255, 255, 0.15); padding: 6px 16px; border-radius: 20px; font-size: 11px; font-weight: bold; color: #fde047;">
                    CONFIRMATION DE PRÉ-INSCRIPTION {{ $academicYear }}
                </div>
            </td>
        </tr>

        <!-- Content Body -->
        <tr>
            <td style="padding: 30px 25px;">
                <h2 style="font-size: 16px; color: #0f2863; margin-top: 0;">Félicitations, {{ $studentName }} !</h2>
                <p style="font-size: 13px; line-height: 1.6; color: #475569;">
                    Nous vous confirmons que votre pré-inscription en ligne auprès de l'École Nationale de Commerce et de Gestion de Fès a été enregistrée avec succès dans le portail académique.
                </p>

                <!-- Summary Box -->
                <table width="100%" cellspacing="0" cellpadding="10" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0; font-size: 12px;">
                    <tr>
                        <td width="40%" style="font-weight: bold; color: #64748b;">Code Massar / CNE :</td>
                        <td width="60%" style="font-weight: bold; color: #0f2863; font-family: monospace;">{{ $cne }}</td>
                    </tr>
                    <tr style="border-top: 1px solid #f1f5f9;">
                        <td style="font-weight: bold; color: #64748b;">CNIE :</td>
                        <td style="font-weight: bold; color: #1e293b; font-family: monospace;">{{ $cin }}</td>
                    </tr>
                    <tr style="border-top: 1px solid #f1f5f9;">
                        <td style="font-weight: bold; color: #64748b;">Filière Affectée :</td>
                        <td style="font-weight: bold; color: #1e293b;">{{ $filiere }}</td>
                    </tr>
                    <tr style="border-top: 1px solid #f1f5f9;">
                        <td style="font-weight: bold; color: #64748b;">Année Universitaire :</td>
                        <td style="font-weight: bold; color: #16a34a;">{{ $academicYear }}</td>
                    </tr>
                </table>

                <!-- Next Steps Instructions -->
                <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 13px; color: #15803d; text-transform: uppercase;">📋 Prochaines Étapes Obligatoires</h3>
                    <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #166534; line-height: 1.6;">
                        <li>Veuillez imprimer l'<strong>Attestation d'Inscription Officielle (PDF)</strong> ci-jointe à ce message.</li>
                        <li>Déposez votre enveloppe physique contenant l'original du Baccalauréat et les pièces requises au guichet de scolarité de l'ENCG Fès.</li>
                    </ul>
                </div>

                <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
                    Pour toute question concernant votre dossier, vous pouvez contacter le service informatique et de scolarité à <a href="mailto:scolarite@encg-fes.ac.ma" style="color: #2563eb; text-decoration: none;">scolarite@encg-fes.ac.ma</a>.
                </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
                <p style="margin: 0;">© {{ date('Y') }} ENCG Fès — Université Sidi Mohamed Ben Abdellah</p>
                <p style="margin: 4px 0 0 0;">Route d'Immuzzer, BP 81A Fès · Tél : 0535622932</p>
            </td>
        </tr>
    </table>
</body>
</html>

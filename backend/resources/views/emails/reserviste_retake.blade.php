<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Notification Examen des Dettes ENCG</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
        <!-- Header -->
        <tr>
            <td style="background-color: #0f2863; padding: 25px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; text-transform: uppercase;">École Nationale de Commerce et de Gestion</h1>
                <p style="color: #cbd5e1; margin: 5px 0 0 0; font-size: 12px;">AVIS CONCERNANT LES EXAMENS DE MODULES EN DETTE (RÉSERVISTES)</p>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding: 30px;">
                <p style="font-size: 14px; margin-top: 0;">Bonjour <strong>{{ $student['first_name'] }} {{ $student['last_name'] }}</strong> (CNE: {{ $student['cne'] }}),</p>
                <p style="font-size: 13px; line-height: 1.6; color: #475569;">
                    Nous vous informons que vous êtes inscrit(e) au titre de la session actuelle pour repasser les modules en dette suivants :
                </p>

                <!-- Debt Modules List -->
                <table width="100%" border="0" cellspacing="0" cellpadding="8" style="margin: 20px 0; border-collapse: collapse; border: 1px solid #cbd5e1;">
                    <thead>
                        <tr style="background-color: #f1f5f9; color: #0f2863; font-size: 11px; text-transform: uppercase;">
                            <th style="border: 1px solid #cbd5e1; text-align: left;">Code Module</th>
                            <th style="border: 1px solid #cbd5e1; text-align: left;">Intitulé du Module</th>
                            <th style="border: 1px solid #cbd5e1; text-align: center;">Semestre</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($debtModules as $m)
                        <tr style="font-size: 12px;">
                            <td style="border: 1px solid #cbd5e1; font-weight: bold; font-family: monospace;">{{ $m['module_code'] }}</td>
                            <td style="border: 1px solid #cbd5e1;">{{ $m['module_name'] }}</td>
                            <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">S{{ $m['semester_number'] }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>

                <p style="font-size: 13px; line-height: 1.6; color: #475569;">
                    Nous vous invitons à consulter votre <strong>Portail Étudiant ENCG</strong> pour télécharger votre convocation officielle et prendre connaissance des salles et horariats retenus.
                </p>

                <div style="margin-top: 25px; padding: 15px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
                    <p style="margin: 0; font-size: 12px; color: #166534; font-weight: bold;">
                        💡 Rappel Important : Munissez-vous impérativement de votre Carte d'Étudiant / Carte Numérique Pass lors des épreuves.
                    </p>
                </div>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
                © ENCG ERP — Service des Examens et de la Scolarité
            </td>
        </tr>
    </table>
</body>
</html>

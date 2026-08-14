<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Validation de votre demande de document</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 30px 15px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #0f2863; padding: 30px 40px; text-align: center;">
                            <h1 style="color: #ffffff; font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1px;">
                                ENCG FÈS • PORTAIL ENSEIGNANT
                            </h1>
                            <p style="color: #93c5fd; font-size: 12px; margin: 6px 0 0 0; font-weight: 600; text-transform: uppercase;">
                                Direction &amp; Secrétariat Général
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 40px 30px 40px;">
                            <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 20px; padding: 4px 14px; color: #047857; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 16px;">
                                ✓ Demande Accordée &amp; Signée
                            </div>

                            <h2 style="color: #0f2863; font-size: 18px; font-weight: 800; margin: 0 0 16px 0;">
                                Bonjour Pr. {{ $data['professor_name'] ?? 'Cher Enseignant' }},
                            </h2>

                            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                                Nous avons le plaisir de vous informer que votre demande de <strong>{{ $data['document_title'] ?? 'Document Officiel' }}</strong> (Réf: <code style="color: #0f2863; font-weight: bold;">{{ $data['tracking_code'] ?? 'DOC-2026-0041' }}</code>) a été officiellement validée et signée électroniquement par l'Administration de l'ENCG Fès.
                            </p>

                            <!-- Details Table -->
                            <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 25px; font-size: 13px;">
                                <tr>
                                    <td width="35%" style="color: #64748b; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Document :</td>
                                    <td style="color: #0f2863; font-weight: 800; border-bottom: 1px solid #e2e8f0;">{{ $data['document_title'] ?? 'Attestation de Travail' }}</td>
                                </tr>
                                <tr>
                                    <td style="color: #64748b; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Motif / Objet :</td>
                                    <td style="color: #1e293b; border-bottom: 1px solid #e2e8f0;">{{ $data['purpose'] ?? 'Formalités académiques' }}</td>
                                </tr>
                                <tr>
                                    <td style="color: #64748b; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Signataire :</td>
                                    <td style="color: #059669; font-weight: 800; border-bottom: 1px solid #e2e8f0;">{{ $data['signer'] ?? 'Le Secrétaire Général de l\'ENCG Fès' }}</td>
                                </tr>
                                <tr>
                                    <td style="color: #64748b; font-weight: bold;">Sécurité &amp; Traçabilité :</td>
                                    <td style="color: #047857; font-family: monospace; font-size: 11px;">[Empreinte SHA-256 + Code QR Anti-Fraude]</td>
                                </tr>
                            </table>

                            <!-- Action Options -->
                            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px; border-radius: 4px; margin-bottom: 30px; font-size: 12px; color: #1e40af; line-height: 1.5;">
                                <strong>Deux options de retrait s'offrent à vous :</strong><br>
                                1. <strong>Téléchargement Immédiat :</strong> Vous pouvez télécharger la version PDF certifiée directement depuis votre espace enseignant.<br>
                                2. <strong>Retrait Physique :</strong> Vous pouvez retirer l'exemplaire original portant le cachet humide au Secrétariat Général (Guichet N° 2).
                            </div>

                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $data['portal_url'] ?? 'http://localhost:5173/professor/documents' }}" style="display: inline-block; background-color: #0f2863; color: #ffffff; text-decoration: none; padding: 14px 30px; font-size: 13px; font-weight: 800; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(15, 40, 99, 0.3);">
                                            Accéder à Mon Espace Documents
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
                            École Nationale de Commerce et de Gestion de Fès (ENCG Fès) • Route d'Imouzzer, B.P. 1255, Fès - Maroc<br>
                            Cet email est généré automatiquement par l'ERP Universitaire. Merci de ne pas y répondre directement.
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convocation aux Examens - ENCG Fès</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:'Segoe UI',Arial,sans-serif;color:#1a202c;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f7;padding:30px 15px;">
    <tr>
        <td align="center">
            <table width="620" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.10);max-width:620px;">

                {{-- ===== EN-TÊTE OFFICIELLE ===== --}}
                <tr>
                    <td style="background:linear-gradient(135deg,#0f2863 0%,#1a3d8a 100%);padding:0;">
                        {{-- Bandeau supérieur --}}
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="padding:10px 28px;border-bottom:1px solid rgba(255,255,255,0.15);">
                                    <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.7);letter-spacing:1.5px;text-transform:uppercase;">
                                        Royaume du Maroc — Université Sidi Mohamed Ben Abdellah
                                    </p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:22px 28px 20px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                        <tr>
                                            {{-- Logo SVG ENCG --}}
                                            <td width="64" valign="middle">
                                                <div style="width:56px;height:56px;background:#ffffff;border-radius:10px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:56px;">
                                                    <span style="font-size:18px;font-weight:900;color:#0f2863;letter-spacing:-1px;display:block;width:56px;text-align:center;">ENCG</span>
                                                </div>
                                            </td>
                                            <td width="16"></td>
                                            <td valign="middle">
                                                <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;line-height:1.2;">
                                                    École Nationale de Commerce<br>et de Gestion — Fès
                                                </p>
                                                <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.65);">
                                                    Route d'Imouzzer, BP 42 — Fès 30000 | Tél : 0535 60 44 48
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            {{-- Titre du document --}}
                            <tr>
                                <td style="background:rgba(0,0,0,0.2);padding:12px 28px;text-align:center;">
                                    <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">
                                        Convocation Officielle aux Examens
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- ===== CORPS ===== --}}
                <tr>
                    <td style="padding:32px 36px 24px;">

                        {{-- Salutation --}}
                        <p style="margin:0 0 6px;font-size:15px;color:#374151;">
                            Bonjour Étudiant(e) <strong style="color:#0f2863;">{{ $emailData['studentName'] }}</strong>,
                        </p>
                        <p style="margin:0 0 24px;font-size:13.5px;color:#6b7280;line-height:1.7;">
                            Nous vous informons que vous êtes convoqué(e) aux examens de la session
                            <strong style="color:#1a202c;">{{ $emailData['sessionName'] }}</strong>.
                            Veuillez trouver ci-joint votre convocation officielle avec QR Code.
                        </p>

                        {{-- Tableau des examens --}}
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:24px;">
                            <thead>
                                <tr style="background:#0f2863;">
                                    <th style="padding:11px 14px;color:#fff;font-size:11px;font-weight:700;text-align:left;letter-spacing:0.5px;text-transform:uppercase;">Date &amp; Heure</th>
                                    <th style="padding:11px 14px;color:#fff;font-size:11px;font-weight:700;text-align:left;letter-spacing:0.5px;text-transform:uppercase;">Module</th>
                                    <th style="padding:11px 14px;color:#fff;font-size:11px;font-weight:700;text-align:center;letter-spacing:0.5px;text-transform:uppercase;">Salle</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($emailData['exams'] as $i => $exam)
                                <tr style="background:{{ $i % 2 === 0 ? '#f9fafb' : '#ffffff' }};">
                                    <td style="padding:11px 14px;font-size:13px;border-top:1px solid #f3f4f6;color:#374151;white-space:nowrap;">
                                        📅 {{ $exam['examDate'] }} à {{ $exam['examTime'] }}
                                    </td>
                                    <td style="padding:11px 14px;font-size:13px;border-top:1px solid #f3f4f6;font-weight:600;color:#1a202c;">
                                        {{ $exam['moduleName'] }}
                                    </td>
                                    <td style="padding:11px 14px;font-size:13px;border-top:1px solid #f3f4f6;text-align:center;color:#374151;">
                                        {{ $exam['roomName'] }}
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>

                        {{-- Encadré important --}}
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 6px 6px 0;margin-bottom:24px;">
                            <tr>
                                <td style="padding:14px 16px;">
                                    <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;">⚠️ Instructions importantes :</p>
                                    <ul style="margin:0;padding-left:18px;font-size:12.5px;color:#78350f;line-height:1.8;">
                                        <li>Présentez-vous <strong>15 minutes avant</strong> le début de l'épreuve.</li>
                                        <li>Munissez-vous de votre <strong>carte étudiant</strong> ou pièce d'identité.</li>
                                        <li>Le <strong>QR Code</strong> présent sur la convocation sera scanné à l'entrée de la salle.</li>
                                        <li>Tout retard non justifié peut entraîner un refus d'accès à la salle.</li>
                                    </ul>
                                </td>
                            </tr>
                        </table>

                        {{-- Signature --}}
                        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.7;">
                            Cordialement,<br>
                            <strong style="color:#0f2863;">Le Département des Examens — ENCG Fès</strong>
                        </p>
                    </td>
                </tr>

                {{-- ===== PIED DE PAGE ===== --}}
                <tr>
                    <td style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:16px 36px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="font-size:11px;color:#9ca3af;line-height:1.6;">
                                    <strong style="color:#6b7280;">ENCG Fès</strong> · Route d'Imouzzer, BP 42, Fès 30000<br>
                                    Tél : +212 535 60 44 48 · Site : <span style="color:#0f2863;">www.encg-fes.ac.ma</span>
                                </td>
                                <td align="right" style="font-size:10px;color:#d1d5db;">
                                    Généré automatiquement<br>ENCG Portail
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>
</body>
</html>

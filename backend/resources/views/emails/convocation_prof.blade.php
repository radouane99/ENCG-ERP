<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Planning de Surveillance - ENCG Fès</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:'Segoe UI',Arial,sans-serif;color:#1a202c;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f7;padding:30px 15px;">
    <tr>
        <td align="center">
            <table width="620" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.10);max-width:620px;">

                {{-- ===== EN-TÊTE OFFICIELLE ===== --}}
                <tr>
                    <td style="background:linear-gradient(135deg,#0f2863 0%,#1a3d8a 100%);padding:0;">
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
                                            <td width="64" valign="middle">
                                                <div style="width:56px;height:56px;background:#ffffff;border-radius:10px;text-align:center;line-height:56px;">
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
                            <tr>
                                <td style="background:rgba(0,0,0,0.2);padding:12px 28px;text-align:center;">
                                    <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;letter-spacing:2px;text-transform:uppercase;">
                                        Ordre de Mission — Planning de Surveillance
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- ===== CORPS ===== --}}
                <tr>
                    <td style="padding:32px 36px 24px;">

                        <p style="margin:0 0 6px;font-size:15px;color:#374151;">
                            Bonjour Professeur <strong style="color:#0f2863;">{{ $emailData['professorName'] }}</strong>,
                        </p>
                        <p style="margin:0 0 24px;font-size:13.5px;color:#6b7280;line-height:1.7;">
                            Veuillez trouver ci-joint votre convocation officielle (planning de surveillance) pour la session
                            <strong style="color:#1a202c;">{{ $emailData['sessionName'] ?? 'principale' }}</strong>.
                            Ce document constitue votre ordre de mission officiel.
                        </p>

                        {{-- Tableau des affectations --}}
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:24px;">
                            <thead>
                                <tr style="background:#0f2863;">
                                    <th style="padding:11px 12px;color:#fff;font-size:11px;font-weight:700;text-align:left;letter-spacing:0.5px;text-transform:uppercase;">Date &amp; Heure</th>
                                    <th style="padding:11px 12px;color:#fff;font-size:11px;font-weight:700;text-align:left;letter-spacing:0.5px;text-transform:uppercase;">Module</th>
                                    <th style="padding:11px 12px;color:#fff;font-size:11px;font-weight:700;text-align:center;letter-spacing:0.5px;text-transform:uppercase;">Salle</th>
                                    <th style="padding:11px 12px;color:#fff;font-size:11px;font-weight:700;text-align:center;letter-spacing:0.5px;text-transform:uppercase;">Rôle</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($emailData['exams'] as $i => $exam)
                                <tr style="background:{{ $i % 2 === 0 ? '#f9fafb' : '#ffffff' }};">
                                    <td style="padding:11px 12px;font-size:13px;border-top:1px solid #f3f4f6;color:#374151;white-space:nowrap;">
                                        📅 {{ $exam['examDate'] }} à {{ substr($exam['examTime'], 0, 5) }}
                                    </td>
                                    <td style="padding:11px 12px;font-size:13px;border-top:1px solid #f3f4f6;font-weight:600;color:#1a202c;">
                                        {{ $exam['moduleName'] }}
                                    </td>
                                    <td style="padding:11px 12px;font-size:13px;border-top:1px solid #f3f4f6;text-align:center;color:#374151;">
                                        {{ $exam['roomName'] }}
                                    </td>
                                    <td style="padding:11px 12px;font-size:13px;border-top:1px solid #f3f4f6;text-align:center;">
                                        <span style="background:#dbeafe;color:#1d4ed8;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;">
                                            {{ ucfirst($exam['role']) }}
                                        </span>
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>

                        {{-- Note QR --}}
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border-left:4px solid #22c55e;border-radius:0 6px 6px 0;margin-bottom:24px;">
                            <tr>
                                <td style="padding:14px 16px;">
                                    <p style="margin:0;font-size:13px;color:#166534;line-height:1.7;">
                                        🔒 <strong>Note importante :</strong> L'accès aux salles d'examen nécessite la présentation
                                        de la version électronique ou imprimée de ce document (incluant votre QR Code unique pour l'émargement).
                                    </p>
                                </td>
                            </tr>
                        </table>

                        {{-- Bouton confirmation --}}
                        @if(isset($emailData['confirmUrl']))
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                            <tr>
                                <td style="text-align:center;padding:8px 0;">
                                    <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Veuillez confirmer la réception de cet ordre de mission :</p>
                                    <a href="{{ $emailData['confirmUrl'] }}"
                                       style="background:#059669;color:#ffffff;padding:13px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;display:inline-block;letter-spacing:0.3px;">
                                        ✅ Je confirme ma présence
                                    </a>
                                </td>
                            </tr>
                        </table>
                        @endif

                        <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.7;">
                            Cordialement,<br>
                            <strong style="color:#0f2863;">La Direction des Examens — ENCG Fès</strong>
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

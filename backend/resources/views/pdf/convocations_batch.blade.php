<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Convocations en lot</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
        .page-break { page-break-after: always; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0f2863; padding-bottom: 10px; }
        .logo { max-height: 80px; }
        .title { color: #0f2863; font-size: 24px; font-weight: bold; margin: 10px 0; text-transform: uppercase; }
        .subtitle { color: #666; font-size: 14px; }
        .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .info-row { margin-bottom: 8px; font-size: 14px; }
        .info-label { font-weight: bold; color: #475569; display: inline-block; width: 150px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background-color: #0f2863; color: white; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; }
        td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        .qr-code { text-align: center; margin-top: 30px; }
        .signature { margin-top: 50px; text-align: right; padding-right: 50px; }
    </style>
</head>
<body>
    @foreach($studentsData as $index => $data)
        <div class="container">
            <div class="header">
                <img src="{{ public_path('logo-encg.png') }}" alt="Logo ENCG" class="logo" onerror="this.style.display='none'">
                <div class="title">Convocation aux Examens</div>
                <div class="subtitle">{{ $data['session_name'] }} ({{ $data['session_type'] }})</div>
            </div>

            <div class="info-box">
                <div class="info-row"><span class="info-label">Nom & Prénom:</span> {{ strtoupper($data['person_name']) }}</div>
                <div class="info-row"><span class="info-label">CNE / Apogée:</span> {{ $data['person_id'] }}</div>
                <div class="info-row"><span class="info-label">Filière:</span> {{ $data['filiere_name'] }}</div>
                <div class="info-row"><span class="info-label">Qualité:</span> Étudiant</div>
            </div>

            <p style="font-size: 14px; line-height: 1.5; color: #334155;">
                Il vous est demandé de vous présenter aux examens suivants muni de votre carte d'étudiant et de cette convocation.
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Heure</th>
                        <th>Module</th>
                        <th>Salle</th>
                        <th>N° Place</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data['exams'] as $exam)
                        <tr>
                            <td>{{ $exam['date'] }}</td>
                            <td>{{ $exam['time'] }}</td>
                            <td>{{ $exam['module'] }}</td>
                            <td><strong>{{ $exam['room'] }}</strong></td>
                            <td><span style="background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-weight: bold;">{{ $exam['seat'] }}</span></td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div style="display: table; width: 100%; margin-top: 40px;">
                <div style="display: table-cell; width: 50%; vertical-align: top;">
                    <h4 style="color: #0f2863; margin-bottom: 10px;">Consignes importantes:</h4>
                    <ul style="font-size: 12px; color: #475569; padding-left: 20px; line-height: 1.6;">
                        <li>Présence obligatoire 15 minutes avant le début de l'épreuve.</li>
                        <li>Les téléphones portables et montres connectées sont strictement interdits.</li>
                        <li>Aucune sortie n'est autorisée durant la première moitié de l'épreuve.</li>
                        <li>La présentation de la carte d'étudiant est obligatoire.</li>
                    </ul>
                </div>
                <div style="display: table-cell; width: 50%; text-align: center; vertical-align: middle;">
                    @if(!empty($data['qr_token']))
                        <div class="qr-code">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data={{ urlencode($data['qr_token']) }}" alt="QR Code" style="border: 4px solid white; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <div style="font-size: 10px; color: #94a3b8; margin-top: 5px;">QR de Vérification Officiel</div>
                        </div>
                    @endif
                </div>
            </div>

            <div class="signature">
                <p style="font-size: 14px; font-weight: bold; color: #334155;">La Direction des Études</p>
                <div style="width: 150px; border-bottom: 1px dashed #cbd5e1; margin-left: auto; margin-top: 40px;"></div>
            </div>

            <div class="footer">
                Document généré électroniquement par ENCG ERP - Ne nécessite pas de signature physique<br>
                Réf: {{ strtoupper(substr(md5($data['id'] . $data['created_at']), 0, 10)) }}
            </div>
        </div>
        
        @if(!$loop->last)
            <div class="page-break"></div>
        @endif
    @endforeach
</body>
</html>

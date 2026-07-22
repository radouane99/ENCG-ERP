<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Convocations Surveillants en lot</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; font-size: 11px; color: #000; }
        .page-break { page-break-after: always; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; padding: 15px; box-sizing: border-box; position: relative; }
        
        .header { margin-bottom: 10px; }
        .logo-container { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 1.5px solid #000; padding-bottom: 5px; }
        .logo { max-height: 45px; }
        
        .title-block { text-align: center; margin: 10px 0; border-bottom: 1px solid #000; padding-bottom: 10px; }
        .title-main { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
        .title-sub { font-size: 15px; font-weight: bold; }
        
        .student-info { margin-bottom: 10px; display: table; width: 100%; }
        .info-row { display: table-row; }
        .info-label { display: table-cell; font-weight: bold; width: 120px; padding: 2px 0; font-size: 11px; }
        .info-colon { display: table-cell; width: 10px; font-weight: bold; font-size: 11px; }
        .info-value { display: table-cell; font-weight: bold; font-size: 11px; text-transform: uppercase; }
        
        .instruction { font-size: 11px; font-weight: bold; margin: 10px 0 5px 0; }
        
        table.exams-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1.5px solid #000; }
        .exams-table th, .exams-table td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 10px; }
        .exams-table th { font-weight: bold; font-size: 11px; text-align: center; }
        .exams-table td.col-matiere { text-align: left; }
        
        .rules-title { font-weight: bold; font-size: 11px; text-decoration: underline; margin-bottom: 5px; }
        .rules-text { font-size: 8px; line-height: 1.2; text-align: justify; margin-bottom: 15px; }
        
        .signature-block { text-align: right; padding-right: 20px; }
        .signature-title { font-weight: bold; font-size: 11px; margin-bottom: 5px; }
        .qr-code { text-align: right; display: inline-block; }
    </style>
</head>
<body>
    @foreach($professorsData as $index => $data)
        <div class="container">
            <div class="header">
                <div class="logo-container" style="border-bottom: 1.5px solid #000; padding-bottom: 5px;">
                    <img src="{{ public_path('logo-encg.png') }}" alt="Logo ENCG" class="logo" onerror="this.style.display='none'">
                </div>
            </div>

            <div class="title-block">
                <div class="title-main">Planning de Surveillance</div>
                <div class="title-sub">{{ $data['session_name'] }} {{ $data['session_type'] }}</div>
            </div>

            <div class="student-info">
                <div class="info-row">
                    <div class="info-label">Identifiant</div>
                    <div class="info-colon">:</div>
                    <div class="info-value">{{ $data['person_id'] }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Professeur</div>
                    <div class="info-colon">:</div>
                    <div class="info-value">{{ $data['person_name'] }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Département</div>
                    <div class="info-colon">:</div>
                    <div class="info-value">{{ $data['filiere_name'] }}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Rôle</div>
                    <div class="info-colon">:</div>
                    <div class="info-value">
                        {{ $data['person_role'] }}
                    </div>
                </div>
            </div>

            <div class="instruction">
                Vous êtes prié(e) d'assurer la surveillance des épreuves aux dates et heures suivantes :
            </div>

            <table class="exams-table">
                <thead>
                    <tr>
                        <th style="width: 15%;">Date</th>
                        <th style="width: 15%;">Horaire</th>
                        <th style="width: 40%;">Matière</th>
                        <th style="width: 15%;">Salle</th>
                        <th style="width: 15%;">Rôle</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($data['exams'] as $exam)
                        <tr>
                            <td>{{ $exam['date'] }}</td>
                            <td>{{ str_replace(' - ', ' - ', $exam['time']) }}</td>
                            <td class="col-matiere">{{ $exam['module'] }}</td>
                            <td>{{ $exam['room'] }}</td>
                            <td>{{ ucfirst($exam['role']) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div class="rules-title">Règlement de surveillance</div>
            <div class="rules-text">
                - La présence en salle d'examen est requise 15 minutes avant le début de l'épreuve.<br>
                - La vérification de l'identité des étudiants (Carte d'étudiant ou CIN) est obligatoire lors de l'accès à la salle ou lors de la signature de la feuille de présence.<br>
                - Aucun étudiant n'est autorisé à quitter la salle d'examen durant les 30 premières minutes de l'épreuve.<br>
                - L'usage des téléphones portables et autres appareils connectés est strictement interdit pour les étudiants.<br>
                - En cas de fraude constatée, un rapport de fraude doit être rédigé et signé par les surveillants, accompagné des pièces justificatives éventuelles, et remis à l'administration dans un délai de 24 heures.<br>
                - Les copies d'examen et les feuilles de présence doivent être remises à l'administration immédiatement après la fin de l'épreuve par le surveillant principal.<br>
                - Le surveillant principal est responsable du bon déroulement de l'examen dans sa salle et de l'application de ce règlement.
            </div>

            <div style="display: table; width: 100%;">
                <div style="display: table-cell; width: 50%; vertical-align: top;">
                    <div style="font-size: 8px; color: #666; margin-top: 50px;">
                        Document généré électroniquement.<br>Réf: {{ strtoupper(substr(md5($data['id'] . $data['created_at']), 0, 10)) }}
                    </div>
                </div>
                <div style="display: table-cell; width: 50%; text-align: right; vertical-align: top;">
                    <div class="signature-title">Administration ENCG Fès</div>
                    <div style="text-align: right; margin-top: 15px;">
                        @if(!empty($data['qr_token']))
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data={{ urlencode($data['qr_token']) }}" alt="QR Code" style="border: 2px solid #000; padding: 2px; float: right; margin-left: 20px;">
                        @endif
                        <div style="float: right; margin-right: 20px; font-style: italic; font-size: 10px; color: #666; padding-top: 40px;">
                            Signature Cachetée
                        </div>
                        <div style="clear: both;"></div>
                    </div>
                </div>
            </div>
        </div>
        
        @if(!$loop->last)
            <div class="page-break"></div>
        @endif
    @endforeach
</body>
</html>

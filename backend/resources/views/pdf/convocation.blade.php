<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Convocation aux Examens - ENCG Fès</title>
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
        
        .info-right-col { display: table-cell; width: 100px; font-weight: bold; font-size: 11px; text-align: right; padding-right: 15px; }
        .info-right-val { display: table-cell; font-weight: bold; font-size: 11px; width: 100px; }

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
    <div class="container">
        <div class="header">
            @include('pdf.encg-header')
        </div>

        <div class="title-block">
            <div class="title-main">Convocation Examen</div>
            <div class="title-sub">{{ $session_name ?? 'Session Principale' }} {{ $session_type ?? 'ORDINAIRE' }}</div>
        </div>

        <div class="student-info">
            <div class="info-row">
                <div class="info-label">CNE / CIN</div>
                <div class="info-colon">:</div>
                <div class="info-value">
                    {{ $person_id ?? 'N/A' }}
                    @if(!empty($person_cin) && $person_cin !== 'N/A')
                        &nbsp;&nbsp;|&nbsp;&nbsp; CIN : {{ $person_cin }}
                    @endif
                </div>
            </div>
            <div class="info-row">
                <div class="info-label">Nom & prénom</div>
                <div class="info-colon">:</div>
                <div class="info-value">{{ $person_name ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Filière</div>
                <div class="info-colon">:</div>
                <div class="info-value">{{ $filiere_name ?? 'N/A' }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Niveau</div>
                <div class="info-colon">:</div>
                <div class="info-value">
                    {{ $niveau_name ?? 'Année en cours' }}
                    <span style="display:inline-block; margin-left: 100px;">Option &nbsp;:&nbsp; -</span>
                </div>
            </div>
        </div>

        <div class="instruction">
            Vous êtes priés(e) de vous présenter aux dates et heures suivantes pour les épreuves ci dessous.
        </div>

        <table class="exams-table">
            <thead>
                <tr>
                    <th style="width: 15%;">Date</th>
                    <th style="width: 15%;">Horaire</th>
                    <th style="width: 30%;">Matière</th>
                    <th style="width: 20%;">Enseignant</th>
                    <th style="width: 10%;">Salle</th>
                    <th style="width: 10%;">Place</th>
                </tr>
            </thead>
            <tbody>
                @forelse($exams ?? [] as $exam)
                    <tr>
                        <td>{{ $exam['date'] }}</td>
                        <td>{{ str_replace(' - ', ' - ', $exam['time']) }}</td>
                        <td class="col-matiere" style="font-weight: bold;">{{ $exam['module'] }}</td>
                        <td>{{ !empty($exam['enseignant']) && $exam['enseignant'] !== '-' ? $exam['enseignant'] : '—' }}</td>
                        <td>{{ $exam['room'] }}</td>
                        <td style="font-weight: bold;">{{ !empty($exam['seat']) && $exam['seat'] !== '-' && $exam['seat'] !== 'N/A' ? (str_contains(strtolower((string)$exam['seat']), 'n°') ? $exam['seat'] : 'N° ' . $exam['seat']) : '-' }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" style="padding: 12px; text-align: center; color: #64748b;">
                            Aucune épreuve programmée pour cette session.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div class="rules-title">Règlement des examens</div>
        <div class="rules-text">
            L'usage des téléphones portables, tablettes ou autres appareils électroniques est interdit en salle d'examen. Même lorsque l'usage des calculatrices est autorisé, les portables ne peuvent être utilisés à cet effet.<br>
            - L'usage des PC portables est interdit sauf autorisation explicite de l'enseignant responsable de l'épreuve.<br>
            - Chaque étudiant est tenu de se munir de tous les articles de bureau nécessaires pour l'épreuve (stylos, crayons, gomme, marqueurs, blanco, règle, etc.). L'échange de tels articles entre étudiants est interdit.<br>
            - Tout étudiant en retard de plus de 20 minutes après la distribution des sujets des contrôles ou des examens ne peut être admis dans la salle d'examen.<br>
            - S'il est accepté à l'examen, l'étudiant retardataire rendra sa copie à la fin du temps réglementaire et ne pourra bénéficier d'aucune rallonge.<br>
            - Quel que soit le cas, tout étudiant en retard de plus de 30 minutes après la distribution des sujets des contrôles n'est pas accepté.<br>
            - Aucun étudiant participant à un examen ne pourra quitter définitivement la salle même s'il doit rendre une copie blanche) que 30 minutes au moins après la distribution des sujets et sur autorisation de l'enseignant responsable de l'épreuve. Celui-ci l'informe qu'il ne pourra plus être réadmis dans la salle d'examen et qu'il doit remettre sa copie.<br>
            - Il est strictly interdit de quitter temporairement la salle d'examen pendant le déroulement de l'épreuve.<br>
            - Dans le cas où les documents ne sont pas autorisés, les étudiants déposent tous leurs documents et cartables sur le bureau des surveillants, avant la distribution des sujets d'examen.<br>
            - Tout document trouvé à proximité des étudiants pendant le déroulement d'une épreuve sans documents entraîne l'établissement d'un rapport de fraude.<br>
            - Tout type de communication entre étudiants pendant le déroulement d'une épreuve est prohibé.<br>
            - Toute fraude duly constatée lors du déroulement des épreuves ou à posteriori, ainsi que tout manquement grave à la discipline donne lieu à l'attribution d'un zéro au contrôle et à l'établissement d'un rapport précisant la sanction proposée, compte tenu de la gravité de la fraude. Le rapport doit parvenir à la Direction dans un délai de 48 heures suivant le constat.<br>
            - Toute copie non rendue à l'heure fixée par les surveillants n'est pas acceptée et est affectée d'un zéro.
        </div>

        <table style="width:100%;margin-top:18px;border:none;"><tr>
            <td style="width:55%;border:none;text-align:left;vertical-align:top;font-size:8px;color:#475569;">
                <strong>RÉFÉRENCE DE CONVOCATION</strong><br>
                Référence métier : {{ $digital_signature ?? 'Voir identifiant numérique en pied de page' }}<br>
                Édition : {{ $generated_at ?? date('d/m/Y H:i:s') }}.<br>
                Les visas requis restent à contrôler auprès de la scolarité.
            </td>
            <td style="width:45%;border:none;text-align:right;vertical-align:top;">
                <strong>Service de la Scolarité</strong><br>
                <span style="font-size:9px;color:#64748b;">Signature et cachet à apposer</span>
                @if(!empty($qrCodeBase64))
                    @php $convocationQrMime = str_contains(base64_decode($qrCodeBase64) ?: '', '<svg') ? 'image/svg+xml' : 'image/png'; @endphp
                    <br><img src="data:{{ $convocationQrMime }};base64,{{ $qrCodeBase64 }}" alt="QR de convocation" style="margin-top:8px;width:65px;height:65px;">
                @elseif(!empty($qr_token))
                    @php $localConvocationQr = 'data:image/svg+xml;base64,'.base64_encode((string) \SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')->size(120)->margin(2)->generate($qr_token)); @endphp
                    <br><img src="{{ $localConvocationQr }}" alt="QR de convocation" style="margin-top:8px;width:65px;height:65px;">
                @endif
            </td>
        </tr></table>
    </div>
</body>
</html>

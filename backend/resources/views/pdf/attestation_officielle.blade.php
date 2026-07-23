<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Attestation Officielle — ENCG Fès</title>
    <style>
        @page {
            margin: 15mm;
            size: A4 portrait;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.6;
        }
        .watermark {
            position: fixed;
            top: 35%;
            left: 10%;
            width: 80%;
            text-align: center;
            opacity: 0.05;
            font-size: 42px;
            font-weight: bold;
            color: #0f2863;
            transform: rotate(-35deg);
            z-index: -1000;
        }
        .header-table {
            width: 100%;
            border-bottom: 3px double #0f2863;
            padding-bottom: 12px;
            margin-bottom: 25px;
        }
        .title-box {
            text-align: center;
            margin: 30px 0;
        }
        .doc-title {
            font-size: 22px;
            font-weight: bold;
            color: #0f2863;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            border-bottom: 2px solid #0f2863;
            display: inline-block;
            padding-bottom: 4px;
        }
        .content {
            margin: 30px 20px;
            font-size: 13px;
            text-align: justify;
        }
        .highlight {
            font-weight: bold;
            color: #0f2863;
        }
        .stamp-box {
            margin-top: 40px;
            width: 100%;
        }
        .tampon-sec {
            width: 140px;
            height: 140px;
            border: 3px double #0f2863;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 10px;
            box-sizing: border-border;
            color: #0f2863;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            background-color: #f8fafc;
            margin-left: auto;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
        }
    </style>
</head>
<body>

    <div class="watermark">DOCUMENT OFFICIEL — SCOLARITÉ ENCG FÈS</div>

    <table class="header-table">
        <tr>
            <td style="width: 25%;">
                <img src="{{ public_path('logo-encg.png') }}" style="max-height: 60px;" alt="ENCG Fès">
            </td>
            <td style="width: 75%; text-align: center;">
                <div style="font-size: 15px; font-weight: bold; color: #0f2863;">ROYAUME DU MAROC</div>
                <div style="font-size: 12px; font-weight: bold; color: #334155;">Université Sidi Mohamed Ben Abdellah — Fès</div>
                <div style="font-size: 12px; color: #0f2863; font-weight: bold;">École Nationale de Commerce et de Gestion</div>
                <div style="font-size: 10px; color: #64748b;">Service des Affaires Académiques & de la Scolarité</div>
            </td>
        </tr>
    </table>

    <div class="title-box">
        <div class="doc-title">{{ strtoupper(str_replace('_', ' ', $type ?? 'ATTESTATION OFFICIELLE')) }}</div>
    </div>

    <div class="content">
        Le Directeur de l'École Nationale de Commerce et de Gestion de Fès (ENCG Fès) atteste par la présente que l'étudiant(e) :
        <br><br>
        <table style="width: 100%; margin: 15px 0; font-size: 13px;">
            <tr>
                <td style="width: 35%; font-weight: bold; color: #475569;">Nom & Prénom :</td>
                <td class="highlight">{{ strtoupper($student->last_name ?? '') }} {{ ucfirst($student->first_name ?? '') }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; color: #475569;">CNE / Massar :</td>
                <td class="highlight">{{ $student->cne ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; color: #475569;">CIN / Identité :</td>
                <td class="highlight">{{ $student->cin ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; color: #475569;">Filière / Spécialité :</td>
                <td class="highlight">{{ $student->filiere ?? 'Diplôme ENCG (Tronc Commun & Spécialités)' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; color: #475569;">Année Académique :</td>
                <td class="highlight">{{ $year ?? '2025/2026' }}</td>
            </tr>
        </table>
        <br>
        Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.
    </div>

    <table class="stamp-box">
        <tr>
            <td style="width: 40%; vertical-align: bottom;">
                @if(!empty($qrBase64))
                    <img src="{{ $qrBase64 }}" style="width: 100px; height: 100px;" alt="Vérification QR">
                @endif
                <div style="font-size: 9px; color: #64748b; margin-top: 4px;">
                    Scannez pour vérifier l'authenticité numérique.
                </div>
            </td>
            <td style="width: 60%; text-align: right;">
                <div style="font-size: 11px; font-weight: bold; color: #475569; margin-bottom: 10px;">
                    Fait à Fès, le {{ $date ?? date('d/m/Y') }}<br>
                    Pour le Directeur et par délégation,<br>
                    Le Chef du Service de la Scolarité
                </div>
                
                <!-- Tampon Sec Digital ENCG -->
                <table align="right" style="margin-left: auto;">
                    <tr>
                        <td>
                            <div class="tampon-sec">
                                📜 ENCG FÈS 📜<br>
                                CACHET OFFICIEL<br>
                                TAMPON SEC DIGITAL<br>
                                CERTIFIÉ
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <div class="footer">
        Document sécurisé certifié par le Système SI ENCG Fès — Clé de vérification : {{ $token ?? 'N/A' }} — {{ date('d/m/Y H:i') }}
    </div>

</body>
</html>

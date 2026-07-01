<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Relevé de Notes</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 30px;
            color: #1e293b;
        }
        .header {
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 2px solid #0f2863;
            padding-bottom: 15px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-left {
            font-size: 24px;
            font-weight: bold;
            color: #0f2863;
        }
        .header-left span { color: #c01844; }
        .header-left-sub { font-size: 9px; color: #c01844; margin-top: 5px; font-weight: bold; letter-spacing: 1px;}
        .header-right {
            text-align: right;
            font-size: 9px;
            color: #4a5568;
            line-height: 1.6;
        }
        
        .doc-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #0f2863;
            letter-spacing: 1px;
            margin: 20px 0 30px 0;
        }

        .student-info {
            width: 100%;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            background-color: #f8fafc;
            margin-bottom: 30px;
            font-size: 10px;
        }
        .student-info table { width: 100%; }
        .student-info td { padding: 4px; }
        .student-info .label { color: #64748b; font-weight: bold; width: 20%; }
        .student-info .val { font-weight: bold; color: #1e293b; }

        .grades-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9px;
            border: 1px solid #0f2863;
        }
        .grades-header {
            background-color: #0f2863;
            color: white;
        }
        .grades-header th {
            padding: 8px;
            text-align: left;
            font-size: 10px;
        }
        .grades-sub-header th {
            padding: 8px;
            background-color: #f1f5f9;
            color: #64748b;
            font-weight: bold;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        .grades-table td {
            padding: 8px;
            border-bottom: 1px solid #f1f5f9;
        }
        .text-center { text-align: center !important; }
        .text-right { text-align: right !important; }
        .text-green { color: #059669; font-weight: bold; }
        .text-red { color: #dc2626; font-weight: bold; }

        .result-box {
            border: 2px solid #0f2863;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            margin-bottom: 40px;
        }
        .result-main {
            font-size: 12px;
            font-weight: bold;
            color: #0f2863;
            margin-bottom: 5px;
        }
        .result-main span {
            color: #059669;
        }
        .result-sub {
            font-size: 10px;
            color: #64748b;
        }
        .result-sub span {
            color: #059669;
            font-weight: bold;
        }

        .footer-grid {
            width: 100%;
            margin-top: 40px;
        }
        .footer-grid td { vertical-align: top; }
        .footer-left { width: 50%; font-size: 9px; color: #64748b; }
        .footer-right { width: 50%; text-align: right; font-size: 10px; }
        
        .qr-placeholder {
            width: 60px;
            height: 60px;
            background-color: #f1f5f9;
            border: 1px dashed #cbd5e1;
            display: inline-block;
            margin-right: 10px;
            float: left;
        }
    </style>
</head>
<body>
    <div class="header">
        <table class="header-table">
            <tr>
                <td class="header-left">
                    UPF<br>
                    <div class="header-left-sub">UNIVERSITÉ PRIVÉE DE FÈS</div>
                </td>
                <td class="header-right">
                    Année Académique: <strong>2025/2026</strong><br>
                    Session: <strong>Principale</strong><br>
                    Date d'édition: <strong>01/07/2026</strong>
                </td>
            </tr>
        </table>
    </div>

    <div class="doc-title">
        RELEVÉ DE NOTES - SEMESTRE S1
    </div>

    <div class="student-info">
        <table>
            <tr>
                <td class="label">Nom & Prénom :</td>
                <td class="val">Aniss el alaoui</td>
                <td class="label">N° Étudiant :</td>
                <td class="val">STU-7207</td>
            </tr>
            <tr>
                <td class="label">Filière :</td>
                <td class="val">Génie Informatique</td>
                <td class="label"></td>
                <td class="val"></td>
            </tr>
        </table>
    </div>

    <table class="grades-table">
        <tr class="grades-header">
            <th colspan="2">📝 S1</th>
            <th colspan="2" class="text-right">Moyenne: 11.61 / 20</th>
        </tr>
        <tr class="grades-sub-header">
            <th>CODE MODULE</th>
            <th>INTITULÉ DU MODULE</th>
            <th class="text-center">NOTE / 20</th>
            <th class="text-center">RÉSULTAT</th>
        </tr>
        <tr>
            <td>INF-101</td>
            <td>Introduction - Génie Informatique</td>
            <td class="text-center text-green">16.10</td>
            <td class="text-center text-green">Validé</td>
        </tr>
        <tr>
            <td>INF-102</td>
            <td>Avancé - Génie Informatique</td>
            <td class="text-center text-red">7.00</td>
            <td class="text-center text-red">Rattrapage</td>
        </tr>
        <tr>
            <td>INF-103</td>
            <td>Développement mobile</td>
            <td class="text-center text-green">14.66</td>
            <td class="text-center text-green">Validé</td>
        </tr>
        <tr>
            <td>INF-104</td>
            <td>Développement mobile LARAVEL</td>
            <td class="text-center text-red">8.62</td>
            <td class="text-center text-red">Rattrapage</td>
        </tr>
        <tr>
            <td>INF-105</td>
            <td>Intelligent Artificiel</td>
            <td class="text-center text-green">11.74</td>
            <td class="text-center text-green">Validé</td>
        </tr>
        <tr>
            <td>INF-106</td>
            <td>SQL SERVER BASE DE DONNEE</td>
            <td class="text-center text-green">13.14</td>
            <td class="text-center text-green">Validé</td>
        </tr>
        <tr>
            <td>INF-107</td>
            <td>GAMING</td>
            <td class="text-center text-green">10.00</td>
            <td class="text-center text-green">Validé</td>
        </tr>
    </table>

    <div class="result-box">
        <div class="result-main">RÉSULTAT DU SEMESTRE : <span>MOYENNE GÉNÉRALE = 11.61 / 20</span></div>
        <div class="result-sub">Décision du Jury : <span>ADMIS(E) AU NIVEAU SUPÉRIEUR</span></div>
    </div>

    <table class="footer-grid">
        <tr>
            <td class="footer-left">
                <div class="qr-placeholder">
                    <!-- QR Code here -->
                    <div style="font-size: 6px; text-align:center; margin-top:25px;">[QR CODE]</div>
                </div>
                <strong style="color:#0f2863;">Document numérique officiel</strong><br>
                Généré par le portail universitaire de l'UPF.<br>
                Scannez le code QR ci-dessus pour vérifier l'authenticité de ce<br>
                relevé de notes en ligne.
            </td>
            <td class="footer-right">
                Fait à Fès, le 07/06/2026<br><br>
                <strong>LE DOYEN DE L'UNIVERSITÉ</strong><br><br>
                <div style="font-size:7px; color:#cbd5e1; border: 1px dashed #cbd5e1; padding: 5px; display:inline-block; margin-top:20px;">
                    Signé numériquement<br>par le Doyen UPF
                </div>
            </td>
        </tr>
    </table>

    <div style="text-align: center; font-size: 6px; color: #cbd5e1; margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 10px;">
        Université Privée de Fès - Route d'Imouzzer, Fès, Maroc - Tél: +212 535 600 800 - Email: contact@upf.ac.ma - www.upf.ac.ma
    </div>
</body>
</html>

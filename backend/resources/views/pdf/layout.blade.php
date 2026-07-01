<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>@yield('title', 'Document Officiel')</title>
    <style>
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #1a202c;
        }
        .outer-border {
            border: 3px solid #0f2863;
            padding: 4px;
            margin: 20px;
            height: 94%;
        }
        .inner-border {
            border: 1px solid #0f2863;
            padding: 30px;
            height: 98%;
            position: relative;
        }
        .header {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 2px solid #0f2863;
            padding-bottom: 10px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: top;
        }
        .header-left {
            width: 33%;
            font-size: 8px;
            font-weight: bold;
            color: #0f2863;
            line-height: 1.4;
        }
        .header-center {
            width: 34%;
            text-align: center;
        }
        .header-right {
            width: 33%;
            font-size: 8px;
            font-weight: bold;
            color: #c01844;
            text-align: right;
            line-height: 1.4;
        }
        .logo-box {
            display: inline-block;
            background-color: #0f2863;
            color: white;
            font-weight: bold;
            font-size: 24px;
            padding: 4px 10px;
            letter-spacing: 2px;
        }
        .logo-text {
            font-size: 10px;
            color: #0f2863;
            font-weight: bold;
            margin-top: 4px;
        }
        .meta-info {
            text-align: right;
            font-size: 9px;
            color: #4a5568;
            margin-bottom: 20px;
        }
        .document-title-container {
            border: 1px solid #e2e8f0;
            background-color: #f8fafc;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            margin: 20px 0 30px 0;
        }
        .document-subtitle {
            font-size: 9px;
            color: #0f2863;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 5px;
        }
        .document-title {
            font-size: 20px;
            color: #c01844;
            font-weight: bold;
            letter-spacing: 1px;
            margin: 0;
            text-transform: uppercase;
        }
        .document-title.blue {
            color: #0f2863;
        }
        .content {
            font-size: 12px;
            line-height: 1.6;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            margin-bottom: 20px;
        }
        .info-table th, .info-table td {
            border: 1px solid #e2e8f0;
            padding: 12px;
            font-size: 11px;
        }
        .info-table th {
            width: 30%;
            background-color: #f8fafc;
            color: #64748b;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 1px;
        }
        .info-table td {
            font-weight: bold;
            color: #1e293b;
        }
        .footer {
            position: absolute;
            bottom: 30px;
            left: 30px;
            right: 30px;
        }
        .signatures {
            width: 100%;
            margin-top: 50px;
        }
        .signatures td {
            width: 50%;
            text-align: center;
            font-size: 10px;
            font-weight: bold;
            color: #64748b;
        }
        .signature-name {
            color: #0f2863;
            font-size: 12px;
            margin-top: 40px;
        }
        .stamp {
            display: inline-block;
            border: 2px solid #0f2863;
            border-radius: 50%;
            width: 80px;
            height: 80px;
            text-align: center;
            font-size: 7px;
            color: #0f2863;
            font-weight: bold;
            line-height: 1.2;
            padding-top: 25px;
            box-sizing: border-box;
            position: relative;
            margin-top: 10px;
        }
        .qr-code {
            position: absolute;
            bottom: -10px;
            left: 0;
            font-size: 8px;
            color: #64748b;
        }
    </style>
    @yield('styles')
</head>
<body>
    <div class="outer-border">
        <div class="inner-border">
            
            <div class="header">
                <table class="header-table">
                    <tr>
                        <td class="header-left">
                            ROYAUME DU MAROC<br>
                            UNIVERSITÉ PRIVÉE DE FÈS<br>
                            École Supérieure d'Ingénierie<br>
                            et de Technologie de Fès
                        </td>
                        <td class="header-center">
                            <div class="logo-box">UPF</div>
                            <div class="logo-text">UNIVERSITÉ PRIVÉE DE FÈS</div>
                        </td>
                        <td class="header-right">
                            المملكة المغربية<br>
                            الجامعة الخاصة لفاس<br>
                            المدرسة العليا للهندسة<br>
                            والتكنولوجيا بفاس
                        </td>
                    </tr>
                </table>
            </div>

            <div class="meta-info">
                @yield('meta_info', 'Réf : 2026/DOC/0001 &nbsp;&nbsp;&nbsp; Émis le : ' . date('d/m/Y'))
            </div>

            <div class="document-title-container">
                <div class="document-subtitle">DOCUMENT ADMINISTRATIF OFFICIEL</div>
                <h1 class="document-title @yield('title_color', '')">@yield('document_title')</h1>
            </div>

            <div class="content">
                @yield('content')
            </div>

            <div class="footer">
                <table class="signatures">
                    <tr>
                        <td>
                            @yield('signature_left')
                        </td>
                        <td>
                            <div class="stamp">
                                ★ UPF ★<br>
                                ADMINISTRATION
                            </div>
                        </td>
                        <td>
                            @yield('signature_right')
                        </td>
                    </tr>
                </table>
            </div>

        </div>
    </div>
</body>
</html>

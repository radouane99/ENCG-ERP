<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>DIPLÔME DE L'ÉCOLE NATIONALE DE COMMERCE ET DE GESTION — ENCG FÈS</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 8mm 10mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: 'Times New Roman', Times, serif;
            color: #0f2863;
            background-color: #ffffff;
            line-height: 1.35;
        }
        
        /* Grand Double Cadre Ornemental de Diplôme d'État */
        .diploma-outer-frame {
            border: 4px double #0f2863;
            padding: 4px;
            height: 98%;
            position: relative;
        }
        .diploma-inner-frame {
            border: 1.5px solid #c5a059;
            padding: 16px 24px;
            height: 96%;
            position: relative;
            background: radial-gradient(circle at center, #ffffff 60%, #faf8f2 100%);
        }

        /* Filigrane discret */
        .diploma-watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-15deg);
            opacity: 0.04;
            font-size: 52pt;
            font-weight: 900;
            color: #0f2863;
            text-transform: uppercase;
            letter-spacing: 6px;
            pointer-events: none;
            text-align: center;
            width: 100%;
        }

        /* En-tête Bilingue Officiel */
        .diploma-header {
            width: 100%;
            border-bottom: 2px solid #c5a059;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-left {
            width: 38%;
            text-align: left;
            font-size: 8.5pt;
            font-family: 'Helvetica', Arial, sans-serif;
            color: #0f2863;
            font-weight: bold;
            line-height: 1.3;
        }
        .header-center {
            width: 24%;
            text-align: center;
        }
        .header-right {
            width: 38%;
            text-align: right;
            font-size: 8.5pt;
            font-family: 'Arial', sans-serif;
            color: #0f2863;
            font-weight: bold;
            line-height: 1.4;
            direction: rtl;
        }

        /* Titre Grand Diplôme */
        .diploma-title-box {
            text-align: center;
            margin: 10px 0 14px 0;
        }
        .diploma-title-ar {
            font-size: 16pt;
            font-weight: bold;
            color: #0f2863;
            margin-bottom: 2px;
        }
        .diploma-title-fr {
            font-size: 19pt;
            font-weight: 900;
            color: #0f2863;
            letter-spacing: 2px;
            text-transform: uppercase;
            text-shadow: 1px 1px 0px rgba(197, 160, 89, 0.3);
        }
        .diploma-subtitle {
            font-size: 10.5pt;
            font-weight: bold;
            color: #c5a059;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-top: 2px;
        }

        /* Corps du Diplôme */
        .diploma-body {
            text-align: center;
            font-size: 11pt;
            line-height: 1.6;
            color: #1e293b;
            margin-bottom: 12px;
        }
        .recipient-name {
            font-size: 20pt;
            font-weight: bold;
            color: #0f2863;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin: 6px 0;
            font-family: 'Georgia', serif;
        }
        .specialite-box {
            font-size: 14pt;
            font-weight: bold;
            color: #0f2863;
            text-transform: uppercase;
            margin: 4px 0;
        }
        .mention-badge {
            display: inline-block;
            background-color: #f8fafc;
            border: 1px solid #c5a059;
            padding: 2px 14px;
            border-radius: 20px;
            font-weight: bold;
            color: #b45309;
            font-size: 10.5pt;
            margin-top: 4px;
        }

        /* Signatures Tripartites */
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
        }
        .signatures-table td {
            width: 33.33%;
            text-align: center;
            vertical-align: top;
            font-size: 9pt;
        }
        .sig-title {
            font-weight: bold;
            color: #0f2863;
            text-transform: uppercase;
            font-size: 8.5pt;
            margin-bottom: 4px;
        }

        /* Pied de Page & QR */
        .diploma-footer {
            margin-top: 10px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 6px;
            width: 100%;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }
        .footer-table td {
            vertical-align: middle;
            font-size: 7pt;
            color: #64748b;
            font-family: 'Helvetica', Arial, sans-serif;
        }
    </style>
</head>
<body>

<div class="diploma-outer-frame">
    <div class="diploma-inner-frame">

        <!-- Filigrane -->
        <div class="diploma-watermark">ROYAUME DU MAROC • ENCG FÈS</div>

        <!-- En-tête Bilingue Officiel -->
        <div class="diploma-header">
            <table class="header-table">
                <tr>
                    <td class="header-left">
                        ROYAUME DU MAROC<br>
                        Ministère de l'Enseignement Supérieur,<br>
                        de la Recherche Scientifique et de l'Innovation<br>
                        <strong>UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH</strong>
                    </td>
                    <td class="header-center">
                        @if(!empty($logoBase64))
                            <img src="{{ $logoBase64 }}" alt="Logo ENCG Fès" style="max-height: 52px; max-width: 130px;">
                        @else
                            <strong style="color: #0f2863; font-size: 15pt; letter-spacing: 1px;">ENCG FÈS</strong>
                        @endif
                    </td>
                    <td class="header-right">
                        المملكة المغربية<br>
                        وزارة التعليم العالي والبحث العلمي والابتكار<br>
                        <strong>جامعة سيدي محمد بن عبد الله</strong><br>
                        المدرسة الوطنية للتجارة والتسيير بفاس
                    </td>
                </tr>
            </table>
        </div>

        <!-- Titre Officiel du Diplôme -->
        <div class="diploma-title-box">
            <div class="diploma-title-ar">دبلوم المدارس الوطنية للتجارة والتسيير</div>
            <div class="diploma-title-fr">DIPLÔME DE L'ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</div>
            <div class="diploma-subtitle">GRADE DE MASTER (BAC + 5)</div>
        </div>

        <!-- Corps du Diplôme -->
        <div class="diploma-body">
            <p style="font-size: 9pt; color: #475569; margin-bottom: 4px;">
                Vu le Dahir n° 1-00-199 du 19 Mai 2000 portant promulgation de la loi n° 01-00 portant organisation de l'enseignement supérieur ;<br>
                Vu les procès-verbaux de délibérations du jury en date du <strong>{{ $deliberationDate ?? date('d/m/Y') }}</strong> ;
            </p>

            <p style="font-size: 11pt; margin-top: 6px;">
                Le présent Diplôme d'État est décerné à :
            </p>

            <div class="recipient-name">
                {{ strtoupper($student->last_name ?? 'EL ALAOUI') }} {{ ucfirst(strtolower($student->first_name ?? 'Aniss')) }}
            </div>

            <p style="font-size: 9.5pt; color: #334155;">
                Né(e) le <strong>{{ $student->birth_date ?? '15/04/2002' }}</strong> à <strong>{{ strtoupper($student->birth_city ?? 'FÈS') }}</strong> &nbsp;|&nbsp; 
                Titulaire de la CNIE N° : <strong>{{ $student->cin ?? $student->user?->cin ?? 'CD728190' }}</strong> &nbsp;|&nbsp; 
                Code Massar / CNE : <strong>{{ $student->cne ?? $student->student_number ?? 'N138092144' }}</strong>
            </p>

            <p style="font-size: 11pt; margin-top: 6px;">
                Ayant satisfait au contrôle des connaissances et des compétences du cursus normalisé en 5 ans (Semestres S1 à S10), en filière :
            </p>

            <div class="specialite-box">
                {{ $filiereName ?? ($student->latestPathway?->filiere?->name ?? 'Gestion Financière et Comptable') }}
            </div>

            <p style="font-size: 10pt;">
                au titre de l'année universitaire <strong>{{ $academicYear ?? '2025-2026' }}</strong>
                @if(!empty($mention))
                    &nbsp;—&nbsp; <span class="mention-badge">Mention : {{ $mention }}</span>
                @else
                    &nbsp;—&nbsp; <span class="mention-badge">Mention : BIEN</span>
                @endif
            </p>
        </div>

        <!-- Signatures Officielles -->
        <table class="signatures-table">
            <tr>
                <td>
                    <div class="sig-title">Le Titulaire du Diplôme</div>
                    <div style="font-size: 7.5pt; color: #94a3b8; margin-top: 24px; font-style: italic;">
                        [Émargement du lauréat]
                    </div>
                </td>
                <td>
                    <div class="sig-title">Le Directeur de l'ENCG Fès</div>
                    <div style="font-size: 8pt; color: #0f2863; font-weight: bold; margin-top: 4px;">
                        Pr. Abderrazak EL HIRI
                    </div>
                    <div style="font-size: 7pt; color: #059669; font-weight: bold; margin-top: 14px;">
                        ✓ [Signature &amp; Sceau Officiel de l'Établissement]
                    </div>
                </td>
                <td>
                    <div class="sig-title">Le Président de l'Université USMBA</div>
                    <div style="font-size: 8pt; color: #0f2863; font-weight: bold; margin-top: 4px;">
                        Pr. Mustapha IJJAALI
                    </div>
                    <div style="font-size: 7pt; color: #059669; font-weight: bold; margin-top: 14px;">
                        ✓ [Signature &amp; Grand Sceau de l'Université]
                    </div>
                </td>
            </tr>
        </table>

        <!-- Pied de Page de Sécurité & QR Code Anti-Fraude -->
        <div class="diploma-footer">
            <table class="footer-table">
                <tr>
                    <td style="width: 12%; text-align: left;">
                        @if(!empty($qrBase64))
                            <img src="{{ $qrBase64 }}" style="width: 48px; height: 48px; border: 1px solid #c5a059; padding: 1px;" alt="QR Authentification">
                        @endif
                    </td>
                    <td style="width: 60%; text-align: left; padding-left: 6px;">
                        <strong style="color: #0f2863; font-size: 7.5pt;">REGISTRE NATIONAL DES DIPLÔMES D'ÉTAT — USMBA / ENCG FÈS</strong><br>
                        N° d'Enregistrement : <strong>DIP-ENCG-{{ date('Y') }}-{{ $student->id ?? 100 }}</strong> &nbsp;|&nbsp; 
                        Sceau SHA-256 : <span style="font-family: monospace; font-size: 6.5pt; color: #059669;">{{ $hashSignature ?? '7F8A2B9C0D1E3F4A5B6C7D8E9F0A1B2C3D4E5F6' }}</span><br>
                        Document officiel d'État délivré en exemplaire unique. Toute altération constitue un faux en écriture publique.
                    </td>
                    <td style="width: 28%; text-align: right;">
                        Fait à Fès, le {{ date('d/m/Y') }}<br>
                        <span style="font-size: 6.5pt; color: #94a3b8;">Portail de Vérification : https://encg-fes.ac.ma/verify</span>
                    </td>
                </tr>
            </table>
        </div>

    </div>
</div>

</body>
</html>

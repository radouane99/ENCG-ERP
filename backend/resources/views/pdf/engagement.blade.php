<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Engagement - {{ $studentName ?? 'Étudiant' }}</title>
    <style>
        @page { margin: 20mm 15mm 20mm 15mm; size: A4 portrait; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 13pt; color: #000; line-height: 1.6; }

        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .header-table td { vertical-align: top; padding: 0; }
        .header-left { text-align: left; width: 38%; font-size: 9pt; line-height: 1.5; }
        .header-center { text-align: center; width: 24%; }
        .header-right { text-align: right; width: 38%; font-size: 9pt; line-height: 1.5; direction: rtl; font-family: 'Traditional Arabic', 'Arial', serif; }
        .header-center img { width: 75px; height: auto; }

        .separator { border-top: 2px solid #000; margin: 8px 0 15px 0; }

        .doc-title {
            text-align: center;
            font-size: 22pt;
            font-weight: bold;
            text-decoration: underline;
            margin: 30px 0 35px 0;
            letter-spacing: 3px;
        }

        .body-text {
            font-size: 13pt;
            line-height: 2.4;
            text-align: justify;
            margin: 0 10px;
        }
        .body-text .dotted { 
            border-bottom: 1px dotted #333; 
            display: inline-block; 
            min-width: 180px; 
            text-align: center;
            font-weight: bold;
            padding: 0 5px;
        }
        .body-text .dotted-long {
            border-bottom: 1px dotted #333;
            display: inline-block;
            min-width: 300px;
            text-align: center;
            font-weight: bold;
            padding: 0 5px;
        }

        .signature-block {
            margin-top: 50px;
            text-align: right;
            padding-right: 30px;
        }
        .signature-block .date-line { margin-bottom: 30px; font-size: 12pt; }
        .signature-block .sig-label { font-size: 12pt; font-weight: bold; margin-bottom: 60px; }

        .footer-block {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1.5px solid #000;
            padding-top: 5px;
            font-size: 8pt;
            text-align: center;
            color: #333;
            line-height: 1.4;
        }
    </style>
</head>
<body>

    {{-- ═══════════ ENTÊTE OFFICIELLE USMBA / ENCG ═══════════ --}}
    <table class="header-table">
        <tr>
            <td class="header-left">
                <strong>جامعة سيدي محمد بن عبد الله</strong><br>
                <strong>UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH</strong><br>
                <span style="font-size:8pt;">المدرسة الوطنية للتجارة و التسيير بفاس</span><br>
                <span style="font-size:8pt;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FES</span>
            </td>
            <td class="header-center">
                @if($logoBase64)
                    <img src="{{ $logoBase64 }}" alt="Logo ENCG">
                @endif
            </td>
            <td class="header-right">
                <span style="font-size:8pt;">ⵜⴰⵙⴷⴰⵡⵉⵜ ⵙⵉⴷⵉ ⵎⵓⵃⴰⵎⴻⴷ ⴱⴻⵏ ⵄⴰⴱⴷⴻⵍⵍⴰⵀ</span><br>
                <span style="font-size:8pt;">ⵜⵉⵏⵎⴻⵍ ⵜⴰⵏⴰⵎⵓⵔⵜ ⵏ ⵜⵙⴱⴱⴰⴱⵜ ⴷ ⵓⵙⵡⵓⴷⴷⵓ</span><br>
                <span style="font-size:8pt;">ⵏ ⴼⴰⵙ</span>
            </td>
        </tr>
    </table>
    <div class="separator"></div>

    {{-- ═══════════ TITRE DU DOCUMENT ═══════════ --}}
    <div class="doc-title">ENGAGEMENT</div>

    {{-- ═══════════ CORPS DU DOCUMENT ═══════════ --}}
    <div class="body-text">
        Je soussigné(e) :<br><br>

        Nom & Prénom : <span class="dotted-long">{{ $studentName ?? '........................................................' }}</span><br>

        Né(e) le : <span class="dotted">{{ $birthDate ?? '....../....../...........' }}</span>
        &nbsp;&nbsp; à <span class="dotted">{{ $birthCity ?? '.................................' }}</span><br>

        CNI : <span class="dotted">{{ $cin ?? '.................................' }}</span><br>

        CNE (CODE MASSAR) : <span class="dotted">{{ $cne ?? '.................................' }}</span><br>

        Inscrit(e) en semestre <span class="dotted">{{ $semester ?? 'S1' }}</span> ({{ $semesterLabel ?? '1ère année' }}) à l'ENCG de Fès<br>

        Filière : <span class="dotted-long">{{ $filiere ?? '.................................................................' }}</span><br>

        Année Universitaire : <span class="dotted">{{ $academicYear ?? '2026 - 2027' }}</span><br><br>

        <strong>Je Déclare avoir lu le règlement interne de l'ENCG de Fès, et je m'engage à le respecter tel qu'il est.</strong>
    </div>

    {{-- ═══════════ SIGNATURE ═══════════ --}}
    <div class="signature-block">
        <div class="date-line">
            Fès le : <span class="dotted">{{ $currentDate ?? now()->format('d / m / Y') }}</span>
        </div>
        <div class="sig-label">Signature de l'étudiant(e) :</div>
        <br><br>
    </div>

    {{-- ═══════════ EMPREINTE NUMÉRIQUE DE SÉCURITÉ (ANTI-FRAUDE) ═══════════ --}}
    <div style="margin-top: 15px; padding: 6px 10px; border: 1px dashed #666; background-color: #fcfcfc; font-family: monospace; font-size: 7.5pt; color: #444;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="vertical-align: middle;">
                    <strong>🔒 EMPREINTE NUMÉRIQUE AUTHENTIFIÉE — ENCG FÈS</strong><br>
                    <span>Empreinte SHA-256 : <strong>{{ $digitalHash ?? 'ENCG-SEC-8F9B2A7C4D1E' }}</strong></span><br>
                    <span>Horodatage officiel : <strong>{{ $generationTimestamp ?? now()->format('d/m/Y H:i:s') }}</strong></span><br>
                    <span style="font-size: 6.5pt; color: #777;">Document généré électroniquement — Toute modification du texte annule la validité du تعهد.</span>
                </td>
                <td style="width: 75px; text-align: right; vertical-align: middle;">
                    @if(!empty($qrBase64))
                        <img src="{{ $qrBase64 }}" style="width: 65px; height: 65px;" alt="QR Code Sécurité">
                    @endif
                </td>
            </tr>
        </table>
    </div>

    {{-- ═══════════ PIED DE PAGE ═══════════ --}}
    <div class="footer-block">
        Route d'Imouzzer, &nbsp; BP 81A FES &nbsp; | &nbsp; FAX : 0535622930 &nbsp; | &nbsp; TEL : 0535622930 &nbsp; | &nbsp; فاس &nbsp; A 81 ص.ب &nbsp; | &nbsp; طريق إموزار<br>
        Site web : www.encgu.usmba.ac.ma &nbsp; | &nbsp; الهاتف : 0535622932
    </div>

</body>
</html>

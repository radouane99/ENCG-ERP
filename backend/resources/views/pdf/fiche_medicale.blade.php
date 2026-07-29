<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Fiche Médicale - {{ $studentName ?? 'Étudiant' }}</title>
    <style>
        @page { margin: 15mm 12mm 18mm 12mm; size: A4 portrait; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; line-height: 1.5; }

        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .header-table td { vertical-align: top; padding: 0; }
        .header-left { text-align: left; width: 38%; font-size: 9pt; line-height: 1.5; }
        .header-center { text-align: center; width: 24%; }
        .header-right { text-align: right; width: 38%; font-size: 9pt; line-height: 1.5; direction: rtl; font-family: 'Traditional Arabic', 'Arial', serif; }
        .header-center img { width: 70px; height: auto; }

        .separator { border-top: 2px solid #000; margin: 6px 0 10px 0; }

        .doc-title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            text-decoration: underline;
            margin: 10px 0 5px 0;
            letter-spacing: 1px;
        }
        .doc-subtitle {
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 15px;
        }

        .section-title {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 4px 10px;
            font-size: 11pt;
            font-weight: bold;
            margin: 12px 0 8px 0;
        }

        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
        .info-table td { padding: 4px 6px; font-size: 11pt; vertical-align: top; }
        .info-table .label { font-weight: bold; width: 35%; white-space: nowrap; }
        .info-table .value { border-bottom: 1px dotted #555; width: 65%; }

        .photo-box {
            width: 90px;
            height: 110px;
            border: 1.5px solid #000;
            text-align: center;
            line-height: 110px;
            font-size: 10pt;
            color: #888;
            float: right;
            margin-left: 10px;
        }

        .medical-box {
            border: 1.5px solid #000;
            padding: 10px;
            margin: 10px 0;
        }
        .medical-box table { width: 100%; border-collapse: collapse; }
        .medical-box td { padding: 5px 6px; font-size: 11pt; vertical-align: top; }
        .medical-box .med-label { font-weight: bold; width: 40%; }
        .medical-box .med-value { border-bottom: 1px dotted #555; }

        .checkbox { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; margin-right: 3px; vertical-align: middle; text-align: center; font-size: 9pt; line-height: 12px; }
        .checkbox.checked { background-color: #000; color: #fff; }

        .signature-block {
            margin-top: 25px;
            text-align: right;
            padding-right: 20px;
        }
        .signature-block .date-line { margin-bottom: 8px; font-size: 11pt; }
        .signature-block .sig-label { font-size: 11pt; font-weight: bold; }

        .footer-block {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1.5px solid #000;
            padding-top: 4px;
            font-size: 7.5pt;
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

    {{-- ═══════════ TITRE ═══════════ --}}
    <div class="doc-title">Fiche des renseignements médicaux</div>
    <div class="doc-subtitle">Année universitaire : {{ $academicYear ?? '2026 - 2027' }}</div>

    {{-- ═══════════ SECTION 1 : COORDONNÉES DE L'ÉTUDIANT(E) ═══════════ --}}
    <div class="section-title">✔ Coordonnées de l'étudiant(e)</div>

    <div class="photo-box">
        @if(!empty($photoBase64))
            <img src="{{ $photoBase64 }}" style="width:86px;height:106px;object-fit:cover;" alt="Photo">
        @else
            PHOTO
        @endif
    </div>

    <table class="info-table">
        <tr>
            <td class="label">Nom :</td>
            <td class="value">{{ $lastName ?? '................................................' }}</td>
        </tr>
        <tr>
            <td class="label">Prénom :</td>
            <td class="value">{{ $firstName ?? '................................................' }}</td>
        </tr>
        <tr>
            <td class="label">Adresse :</td>
            <td class="value">{{ $address ?? '................................................' }}</td>
        </tr>
        <tr>
            <td class="label">Tél. Personnel :</td>
            <td class="value">{{ $phone ?? '................................................' }}</td>
        </tr>
    </table>

    <div style="clear:both;"></div>

    {{-- ═══════════ SECTION 2 : PARENTS ═══════════ --}}
    <div class="section-title">✔ Coordonnées des parents de l'étudiant(e)</div>
    <table class="info-table">
        <tr>
            <td class="label">Nom et Prénom du père :</td>
            <td class="value">{{ $fatherName ?? '................................................' }}</td>
        </tr>
        <tr>
            <td class="label">Nom et Prénom de la mère :</td>
            <td class="value">{{ $motherName ?? '................................................' }}</td>
        </tr>
        <tr>
            <td class="label">Tél :</td>
            <td class="value">{{ $parentPhone ?? '................................................' }}</td>
        </tr>
    </table>

    {{-- ═══════════ SECTION 3 : PERSONNE D'URGENCE ═══════════ --}}
    <div class="section-title">✔ Coordonnées d'une tierce personne à joindre en cas d'urgence</div>
    <table class="info-table">
        <tr>
            <td class="label">Nom et Prénom :</td>
            <td class="value">{{ $emergencyName ?? '................................................' }}</td>
        </tr>
        <tr>
            <td class="label">Téléphone :</td>
            <td class="value">{{ $emergencyPhone ?? '................................................' }}</td>
        </tr>
    </table>

    {{-- ═══════════ SECTION 4 : ÉTAT DE SANTÉ ═══════════ --}}
    <div class="section-title">✔ État de santé (Afin de nous permettre de réagir efficacement en cas de trouble de santé veuillez remplir cette case par votre médecin)</div>

    <div class="medical-box">
        <table>
            <tr>
                <td class="med-label">Type d'allergie :</td>
                <td class="med-value">{{ $allergyType ?? '...............................................................................' }}</td>
            </tr>
            <tr>
                <td class="med-label">Cas nécessitant un suivi :</td>
                <td>
                    <span class="checkbox {{ ($hasFollowUp ?? false) ? 'checked' : '' }}">{{ ($hasFollowUp ?? false) ? '✓' : '' }}</span> Oui
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <span class="checkbox {{ !($hasFollowUp ?? false) ? 'checked' : '' }}">{{ !($hasFollowUp ?? false) ? '✓' : '' }}</span> Non
                </td>
            </tr>
            <tr>
                <td class="med-label">Médicament utilisé :</td>
                <td class="med-value">{{ $medication ?? '...............................................................................' }}</td>
            </tr>
            <tr>
                <td class="med-label">Coordonnées du médecin :</td>
                <td class="med-value">{{ $doctorInfo ?? '...............................................................................' }}</td>
            </tr>
            <tr>
                <td class="med-label">Signature du médecin :</td>
                <td class="med-value">&nbsp;</td>
            </tr>
        </table>
    </div>

    {{-- ═══════════ SIGNATURE ═══════════ --}}
    <div class="signature-block">
        <div class="date-line">La date : ............/............/................</div>
        <div class="sig-label">Signature de l'étudiant(e) :</div>
        <br><br>
    </div>

    {{-- ═══════════ EMPREINTE NUMÉRIQUE DE SÉCURITÉ (ANTI-FRAUDE) ═══════════ --}}
    <div style="margin-top: 10px; padding: 5px 8px; border: 1px dashed #666; background-color: #fcfcfc; font-family: monospace; font-size: 7pt; color: #444;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="vertical-align: middle;">
                    <strong>🔒 EMPREINTE NUMÉRIQUE MÉDICALE AUTHENTIFIÉE — ENCG FÈS</strong><br>
                    <span>Empreinte SHA-256 : <strong>{{ $digitalHash ?? 'ENCG-MED-8F9B2A7C4D1E' }}</strong></span><br>
                    <span>Horodatage officiel : <strong>{{ $generationTimestamp ?? now()->format('d/m/Y H:i:s') }}</strong></span><br>
                    <span style="font-size: 6pt; color: #777;">Données médicales confidentielles traitées sous la loi 09-08 (CNDP).</span>
                </td>
                <td style="width: 65px; text-align: right; vertical-align: middle;">
                    @if(!empty($qrBase64))
                        <img src="{{ $qrBase64 }}" style="width: 55px; height: 55px;" alt="QR Code Sécurité">
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

@extends('pdf.layouts.pdf_master')

@section('title', 'ORDRE DE MISSION — ENCG FÈS')

@section('content')
    <div style="position: relative; width: 100%; font-family: 'Helvetica', 'Arial', sans-serif;">

        <!-- Header Title Banner -->
        <div style="background-color: #0f2863; color: #ffffff; text-align: center; padding: 6px 12px; border-radius: 4px; margin-bottom: 12px;">
            <h2 style="font-size: 15px; font-weight: 900; letter-spacing: 1px; color: #ffffff; text-transform: uppercase; margin: 0;">
                ORDRE DE MISSION OFFICIEL
            </h2>
            <div style="font-size: 8pt; font-weight: bold; color: #93c5fd; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px;">
                Université Sidi Mohamed Ben Abdellah • École Nationale de Commerce et de Gestion de Fès
            </div>
        </div>

        <!-- Reference Box -->
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 5px 12px; margin-bottom: 12px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 8.5pt;">
                <tr>
                    <td width="60%">
                        <strong>Réf. Mission :</strong> <code style="font-family: monospace; font-weight: bold; color: #0f2863;">{{ $refCode ?? 'ODM-2026-0842' }}</code>
                    </td>
                    <td width="40%" style="text-align: right; color: #475569;">
                        Fès, le <strong>{{ $dateIssued ?? date('d/m/Y') }}</strong>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Text of Authorization -->
        <p style="margin-bottom: 12px; text-align: justify; line-height: 1.6; font-size: 9pt; color: #1e293b;">
            Le Directeur de l'École Nationale de Commerce et de Gestion (ENCG) de Fès autorise et ordonne à l'enseignant-chercheur désigné ci-après à accomplir la mission officielle suivante :
        </p>

        <!-- Mission & Professor Details Table -->
        <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 14px;">
            <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-size: 8.5pt;">
                <tr style="background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                    <td width="35%" style="font-weight: bold; color: #0f2863;">Nom &amp; Prénom de l'Enseignant :</td>
                    <td width="65%" style="font-weight: 900; color: #0f2863; font-size: 9.5pt; text-transform: uppercase;">
                        Pr. {{ $profName ?? 'ABDELHAK EL AMRANI' }}
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="font-weight: bold; color: #475569;">Grade &amp; Statut :</td>
                    <td style="font-weight: bold; color: #1e293b;">
                        Professeur de l'Enseignement Supérieur (Permanent)
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="font-weight: bold; color: #475569;">Département de Rattachement :</td>
                    <td style="font-weight: bold; color: #059669;">
                        {{ $deptName ?? 'Sciences de Gestion' }}
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9; background-color: #f8fafc;">
                    <td style="font-weight: bold; color: #0f2863;">Objet de la Mission :</td>
                    <td style="font-weight: bold; color: #1e293b;">
                        {{ $missionObject ?? 'Participation et communication à la Conférence Internationale sur la Finance et la Gouvernance / Jury de Thèse de Doctorat' }}
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                    <td style="font-weight: bold; color: #475569;">Lieu / Destination :</td>
                    <td style="font-weight: 900; color: #0f2863;">
                        {{ $destination ?? 'Casablanca / Rabat (Maroc)' }}
                    </td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9; background-color: #f8fafc;">
                    <td style="font-weight: bold; color: #475569;">Période de la Mission :</td>
                    <td style="font-weight: bold; color: #d97706;">
                        Du {{ $startDate ?? date('d/m/Y') }} au {{ $endDate ?? date('d/m/Y', strtotime('+2 days')) }}
                    </td>
                </tr>
                <tr>
                    <td style="font-weight: bold; color: #475569;">Moyen de Transport Utilisé :</td>
                    <td style="font-weight: bold; color: #1e293b;">
                        {{ $transportMode ?? 'Voiture Personnelle / Train ONCF (Al Boraq / Al Atlas) / Avion' }}
                    </td>
                </tr>
            </table>
        </div>

        <!-- Budget / Indemnités clause -->
        <div style="border: 1px dashed #0f2863; background-color: #f8fafc; border-radius: 4px; padding: 6px 10px; margin-bottom: 16px;">
            <div style="font-size: 8pt; font-weight: bold; color: #0f2863; text-transform: uppercase; margin-bottom: 2px;">
                PRISE EN CHARGE &amp; DISPOSITIONS RÉGLEMENTAIRES :
            </div>
            <div style="font-size: 7.5pt; color: #334155; line-height: 1.4;">
                • Les frais de déplacement, d'hébergement et de mission sont imputés sur le budget de fonctionnement de l'établissement conformément au décret N° 2-97-511.<br>
                • Les autorités civiles et militaires sont priées de prêter aide et assistance au titulaire du présent ordre de mission en cas de besoin.
            </div>
        </div>

        <!-- Dual Signatures (Professor & Direction) -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 10px; border-collapse: collapse;">
            <tr>
                <td width="50%" style="text-align: center; vertical-align: top; padding-right: 15px;">
                    <div style="font-size: 8pt; font-weight: bold; color: #475569;">L'Enseignant Bénéficiaire</div>
                    <div style="font-size: 8pt; color: #0f2863; font-weight: bold; margin-top: 2px;">Pr. {{ $profName ?? 'ABDELHAK EL AMRANI' }}</div>
                    <div style="margin-top: 6px;">
                        <svg width="110" height="30" viewBox="0 0 110 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10,24 C14,12 18,4 23,4 C27,4 25,20 28,22 C31,24 35,14 38,10 C42,6 45,18 49,16 C54,14 65,8 73,14 C78,10 83,6 90,6 C98,6 102,12 108,14" stroke="#0f2863" stroke-width="2" stroke-linecap="round"/>
                            <path d="M12,14 C25,13 45,12 65,13" stroke="#0f2863" stroke-width="1.6" stroke-linecap="round"/>
                        </svg>
                    </div>
                </td>

                <td width="50%" style="text-align: center; vertical-align: top; padding-left: 15px;">
                    <div style="font-size: 8pt; font-weight: bold; color: #475569;">Pour le Directeur et par délégation</div>
                    <div style="font-size: 8.5pt; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 2px;">LE SECRÉTAIRE GÉNÉRAL</div>
                    <div style="margin-top: 6px;">
                        <svg width="110" height="30" viewBox="0 0 110 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10,14 Q20,2 35,18 T55,6 T75,18 T90,10" stroke="#059669" stroke-width="2" fill="none" stroke-linecap="round"/>
                        </svg>
                    </div>
                    <div style="font-size: 6.5pt; color: #64748b; margin-top: 2px;">
                        [Signé électroniquement avec le Cachet de l'ENCG Fès]
                    </div>
                </td>
            </tr>
        </table>
    </div>
@endsection

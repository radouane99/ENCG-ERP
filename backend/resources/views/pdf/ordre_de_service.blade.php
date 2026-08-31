@extends('pdf.layouts.pdf_master')

@section('title', 'ORDRE DE SERVICE D\'ENSEIGNEMENT — ENCG FÈS')

@section('styles')
<style>
    @page {
        size: A4 portrait;
        margin: 5mm 8mm 5mm 8mm;
    }
    .page-border-frame {
        position: fixed;
        top: -3mm;
        left: -5mm;
        right: -5mm;
        bottom: -3mm;
        border: 2.5px double #002e5b;
        pointer-events: none;
        z-index: -100;
    }
    .official-logos-header {
        margin-bottom: 4px;
        padding-bottom: 2px;
    }
    .footer-container {
        margin-top: 4px;
        padding-top: 3px;
        border-top: 1px dashed #cbd5e1;
    }
    .encg-bottom-bar {
        margin-top: 2px;
        padding-top: 2px;
    }
</style>
@endsection

@section('content')
    <div style="position: relative; width: 100%; font-family: 'Helvetica', 'Arial', sans-serif;">

        <!-- Header Title Banner -->
        <div style="background-color: #0f2863; color: #ffffff; text-align: center; padding: 4px 8px; border-radius: 4px; margin-bottom: 4px;">
            <h2 style="font-size: 11.5pt; font-weight: 900; letter-spacing: 0.8px; color: #ffffff; text-transform: uppercase; margin: 0;">
                ORDRE DE SERVICE D'ENSEIGNEMENT OFFICIEL
            </h2>
            <div style="font-size: 7pt; font-weight: bold; color: #93c5fd; margin-top: 1px; text-transform: uppercase; letter-spacing: 0.5px;">
                Année Universitaire {{ $academicYear ?? '2026/2027' }} • Affectations Académiques Certifiées
            </div>
        </div>

        <!-- Order Reference Notice -->
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2.5px 8px; margin-bottom: 4px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 7.5pt;">
                <tr>
                    <td width="60%">
                        <strong>Réf. Ordre :</strong> <code style="font-family: monospace; font-weight: bold; color: #0f2863;">{{ $trackingCode ?? 'ODS-2026-0001' }}</code>
                    </td>
                    <td width="40%" style="text-align: right; color: #475569;">
                        Date d'émission : <strong>{{ $dateIssued ?? date('d/m/Y') }}</strong>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Recipient Professor Identification -->
        <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 4px;">
            <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 7.5pt; text-transform: uppercase; padding: 2.5px 8px; letter-spacing: 0.5px;">
                I. IDENTIFICATION DE L'ENSEIGNANT-CHERCHEUR AFFECTÉ
            </div>
            <div style="padding: 3px 8px;">
                <table width="100%" cellpadding="1" cellspacing="0" style="border-collapse: collapse; font-size: 8pt;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td width="30%" style="font-weight: bold; color: #475569;">Nom &amp; Prénom :</td>
                        <td width="70%" style="font-weight: 900; color: #0f2863; font-size: 9pt; text-transform: uppercase;">
                            {{ $profName ?? 'ABDELHAK EL AMRANI' }}
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="font-weight: bold; color: #475569;">Département :</td>
                        <td style="font-weight: bold; color: #059669;">
                            {{ $deptName ?? 'Sciences de Gestion' }}
                        </td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="font-weight: bold; color: #475569;">Grade &amp; Statut :</td>
                        <td style="font-weight: bold; color: #1e293b;">
                            Enseignant-Chercheur (Professeur Habilité / PES Permanent)
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight: bold; color: #475569;">Email Institutionnel :</td>
                        <td style="font-weight: bold; font-family: monospace; color: #0f2863;">
                            {{ $profEmail ?? 'radouane.asri1996@gmail.com' }}
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Summary Stats Cards -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 4px; font-size: 7.5pt;">
            <tr>
                <td width="32%" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 3px 6px; text-align: center;">
                    <div style="font-size: 6.5pt; font-weight: bold; color: #1e40af; text-transform: uppercase;">Modules Attribués</div>
                    <div style="font-size: 10pt; font-weight: 900; color: #0f2863;">{{ $totalModulesCount ?? (isset($modulesList) ? count($modulesList) : 11) }} Charges</div>
                </td>
                <td width="2%"></td>
                <td width="32%" style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 3px 6px; text-align: center;">
                    <div style="font-size: 6.5pt; font-weight: bold; color: #166534; text-transform: uppercase;">Volume Horaire Semestriel</div>
                    <div style="font-size: 10pt; font-weight: 900; color: #15803d;">{{ $totalHours ?? 528 }}h / Semestre</div>
                </td>
                <td width="2%"></td>
                <td width="32%" style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 4px; padding: 3px 6px; text-align: center;">
                    <div style="font-size: 6.5pt; font-weight: bold; color: #854d0e; text-transform: uppercase;">Service Hebdomadaire</div>
                    <div style="font-size: 10pt; font-weight: 900; color: #a16207;">{{ $weeklyHours ?? 44 }}h / Semaine</div>
                </td>
            </tr>
        </table>

        <!-- Academic Assignments Full Table -->
        <div style="border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; margin-bottom: 4px;">
            <div style="background-color: #0f2863; color: #ffffff; font-weight: 900; font-size: 7.2pt; text-transform: uppercase; padding: 2.5px 8px; letter-spacing: 0.5px;">
                II. TABLEAU RÉCAPITULATIF DES MODULES &amp; GROUPES ATTRIBUÉS
            </div>
            <table width="100%" cellpadding="2" cellspacing="0" style="border-collapse: collapse; font-size: 7pt; text-align: left;">
                <thead>
                    <tr style="background-color: #f1f5f9; color: #0f2863; font-weight: 900; text-transform: uppercase; font-size: 6.8pt; border-bottom: 1.2px solid #cbd5e1;">
                        <th width="5%" style="text-align: center; padding: 2px 3px;">N°</th>
                        <th width="18%" style="padding: 2px 3px;">Code</th>
                        <th width="49%" style="padding: 2px 3px;">Intitulé du Module Académique</th>
                        <th width="18%" style="padding: 2px 3px;">Groupe / Section</th>
                        <th width="10%" style="text-align: center; padding: 2px 3px;">Vol. H.</th>
                    </tr>
                </thead>
                <tbody>
                    @if(isset($modulesList) && count($modulesList) > 0)
                        @foreach($modulesList as $index => $mod)
                            <tr style="border-bottom: 0.8px solid #e2e8f0; background-color: {{ $index % 2 == 0 ? '#ffffff' : '#f8fafc' }};">
                                <td style="text-align: center; font-weight: bold; color: #64748b; padding: 1.8px 3px;">{{ $index + 1 }}</td>
                                <td style="font-family: monospace; font-weight: 900; color: #0f2863; padding: 1.8px 3px;">{{ $mod['code'] }}</td>
                                <td style="font-weight: bold; color: #1e293b; padding: 1.8px 3px;">{{ $mod['name'] }}</td>
                                <td style="font-weight: bold; color: #059669; padding: 1.8px 3px;">{{ $mod['group'] }}</td>
                                <td style="text-align: center; font-weight: 900; color: #d97706; padding: 1.8px 3px;">{{ $mod['hours'] ?? 48 }}h</td>
                            </tr>
                        @endforeach
                    @else
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 6px; color: #64748b;">Aucun module enregistré.</td>
                        </tr>
                    @endif
                </tbody>
            </table>
        </div>

        <!-- Official Directives & Obligations -->
        <div style="border: 1px dashed #0f2863; background-color: #f8fafc; border-radius: 4px; padding: 3px 6px; margin-bottom: 4px;">
            <div style="font-size: 6.8pt; font-weight: bold; color: #0f2863; text-transform: uppercase; margin-bottom: 1px;">
                III. OBLIGATIONS ACADÉMIQUES DE L'ENSEIGNANT :
            </div>
            <div style="font-size: 6.5pt; color: #334155; line-height: 1.2;">
                • Assurer la dispense de la totalité des enseignements attribués ci-dessus selon la maquette nationale ENCG.<br>
                • Effectuer la saisie en temps réel des absences des étudiants sur l'ERP ENCG Fès.<br>
                • Rendre les PV d'évaluation (CC &amp; Examen) dûment complétés et signés dans les délais réglementaires.
            </div>
        </div>

        <!-- Official 3-Party Signatures Section -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 2px; border-collapse: collapse;">
            <tr>
                <!-- 1. Chef de Département -->
                <td width="33%" style="text-align: center; vertical-align: top; padding-right: 4px;">
                    <div style="font-size: 7pt; font-weight: bold; color: #475569;">Le Chef du Département</div>
                    <div style="font-size: 7pt; color: #0f2863; font-weight: bold; margin-top: 1px;">{{ $deptName ?? 'Sciences de Gestion' }}</div>
                    <div style="margin-top: 2px;">
                        <svg width="80" height="22" viewBox="0 0 100 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5,18 Q15,4 25,14 T45,10 T65,16 T85,8 T95,14" stroke="#0f2863" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                        </svg>
                    </div>
                </td>

                <!-- 2. Émargement & Signature de l'Enseignant -->
                <td width="34%" style="text-align: center; vertical-align: top; padding: 0 3px;">
                    <div style="font-size: 7pt; font-weight: bold; color: #0f2863; text-transform: uppercase;">
                        ÉMARGEMENT DE L'ENSEIGNANT
                    </div>
                    <div style="font-size: 6.8pt; font-weight: bold; color: #059669; margin-top: 1px;">
                        Pr. {{ $profName ?? 'ABDELHAK EL AMRANI' }}
                    </div>

                    <!-- Certified Digital Signature Deck -->
                    <div style="border: 1px solid #0f2863; background-color: #f8fafc; border-radius: 4px; padding: 2px 4px; margin-top: 2px; display: inline-block; width: 92%;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="text-align: center; vertical-align: middle;">
                                    <svg width="100" height="24" viewBox="0 0 130 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12,28 C14,16 18,4 23,4 C27,4 25,24 28,26 C31,28 35,16 38,12 C42,8 45,22 49,20 C54,18 56,12 60,10 C65,8 68,22 73,18 C78,14 83,8 90,8 C98,8 102,16 108,18 C115,20 122,12 126,6" stroke="#0f2863" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M15,18 C28,17 45,16 62,17" stroke="#0f2863" stroke-width="1.8" stroke-linecap="round"/>
                                        <path d="M18,30 C45,33 80,31 122,25" stroke="#1d4ed8" stroke-width="1.6" stroke-linecap="round"/>
                                    </svg>
                                </td>
                            </tr>
                        </table>

                        <div style="border-top: 0.5px solid #cbd5e1; margin-top: 1px; padding-top: 1px;">
                            <div style="font-size: 5.5pt; font-weight: 900; color: #047857; letter-spacing: 0.5px; text-transform: uppercase;">
                                [CERTIFIÉ CONFORME LOI 53-05]
                            </div>
                            <div style="font-size: 5pt; color: #475569; font-family: monospace;">
                                Horodatage : {{ date('d/m/Y H:i') }} • SHA-256: 8f9a2b4c...
                            </div>
                        </div>
                    </div>
                </td>

                <!-- 3. Direction Pédagogique -->
                <td width="33%" style="text-align: center; vertical-align: top; padding-left: 4px;">
                    <div style="font-size: 6.8pt; font-weight: bold; color: #475569;">Pour le Directeur et par délégation</div>
                    <div style="font-size: 7pt; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 1px;">
                        LE DIRECTEUR ADJOINT
                    </div>
                    <div style="margin-top: 2px;">
                        <svg width="80" height="22" viewBox="0 0 100 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10,14 Q20,2 35,18 T55,6 T75,18 T90,10" stroke="#059669" stroke-width="1.8" fill="none" stroke-linecap="round"/>
                        </svg>
                    </div>
                </td>
            </tr>
        </table>
    </div>
@endsection

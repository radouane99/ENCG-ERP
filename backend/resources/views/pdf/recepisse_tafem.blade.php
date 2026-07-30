@extends('pdf.layouts.pdf_master')

@section('title', 'RÉCÉPISSÉ DE PRÉ-INSCRIPTION & CONVOCATION — CONCOURS TAFEM 2026')

@section('content')
    <div style="position: relative; width: 100%; font-family: Arial, sans-serif;">
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px; border-bottom: 2px solid #0f2863; padding-bottom: 10px;">
            <tr>
                <td width="70%">
                    <div style="font-size: 13px; font-weight: bold; color: #0f2863;">جامعة سيدي محمد بن عبد الله بفاس</div>
                    <div style="font-size: 11px; font-weight: bold; color: #0f2863;">UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH DE FÈS</div>
                    <div style="font-size: 13px; font-weight: bold; color: #990000; margin-top: 3px;">المدرسة الوطنية للتجارة والتسيير بفاس</div>
                    <div style="font-size: 11px; font-weight: bold; color: #990000;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                </td>
                <td width="30%" style="text-align: right;">
                    @if(!empty($qrBase64))
                        <img src="{{ $qrBase64 }}" style="width: 90px; height: 90px; border: 1px solid #cbd5e1; padding: 3px; background: #fff;" alt="QR Code Verification" />
                    @endif
                </td>
            </tr>
        </table>

        <!-- Document Title -->
        <div style="text-align: center; margin: 15px 0;">
            <h2 style="font-size: 16px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin: 0;">
                RÉCÉPISSÉ DE PRÉ-INSCRIPTION & CONVOCATION AU GUICHET
            </h2>
            <div style="font-size: 11px; font-weight: bold; color: #d97706; margin-top: 4px;">
                CONCOURS NATIONAL D'ACCÈS A L'ENCG (TAFEM 2026) — ENCG FÈS
            </div>
        </div>

        <!-- Candidate Identity Card -->
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin-bottom: 15px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-size: 11px;">
            <tr style="background-color: #0f2863; color: #ffffff;">
                <td colspan="2" style="font-weight: bold; font-size: 12px;">IDENTIFICATION DU CANDIDAT</td>
            </tr>
            <tr>
                <td width="35%"><strong>Nom et Prénom :</strong></td>
                <td width="65%" style="font-weight: 900; color: #0f2863; font-size: 12px;">{{ strtoupper($name ?? '') }}</td>
            </tr>
            <tr>
                <td><strong>Code MASSAR (CNE) :</strong></td>
                <td style="font-family: monospace; font-weight: bold; font-size: 12px; color: #0284c7;">{{ $cne ?? '' }}</td>
            </tr>
            <tr>
                <td><strong>Carte d'Identité (CNIE) :</strong></td>
                <td style="font-family: monospace; font-weight: bold;">{{ $cin ?? '—' }}</td>
            </tr>
            <tr>
                <td><strong>Filière / Affectation :</strong></td>
                <td style="font-weight: bold; color: #059669;">{{ $filiere ?? 'Deux années préparatoires (TAFEM S1)' }}</td>
            </tr>
            <tr>
                <td><strong>Résultat Admissibilité TAFEM :</strong></td>
                <td style="font-weight: bold; color: #16a34a;">
                    {{ $statusLabel ?? 'Admis sur Liste Principale' }} (Score: {{ $score ?? '150.00 pts' }})
                </td>
            </tr>
        </table>

        <!-- Appointment Details Box -->
        <div style="background-color: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; padding: 12px; margin-bottom: 15px;">
            <table width="100%" cellpadding="2" cellspacing="0" style="font-size: 11px;">
                <tr>
                    <td colspan="2" style="font-weight: 900; color: #b45309; font-size: 12px; text-transform: uppercase;">
                        📅 RDV DÉPÔT PHYSIQUE DU DOSSIER & VÉRIFICATION
                    </td>
                </tr>
                <tr>
                    <td width="30%"><strong>Date de Passage :</strong></td>
                    <td width="70%" style="font-weight: bold; color: #0f2863;">Mardi 01 Septembre 2026</td>
                </tr>
                <tr>
                    <td><strong>Horaire Autorisé :</strong></td>
                    <td style="font-weight: bold; color: #059669;">09:00 — 12:00 (Guichet Scolarité)</td>
                </tr>
                <tr>
                    <td><strong>Guichet D'Accueil :</strong></td>
                    <td style="font-weight: bold; color: #0f2863;">Guichet N° 2 — Service des Inscriptions ENCG Fès</td>
                </tr>
            </table>
        </div>

        <!-- Checklist Table -->
        <h3 style="font-size: 11px; font-weight: bold; color: #0f2863; margin-bottom: 8px;">
            📋 PIÈCES PHYSIQUES À FOURNIR IMPÉRATIVEMENT DANS L'ENVELOPPE :
        </h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
            <tr style="background-color: #e2e8f0; font-weight: bold; color: #334155;">
                <td width="5%">N°</td>
                <td width="75%">Intitulé du Document Requis</td>
                <td width="20%" style="text-align: center;">État Obligatoire</td>
            </tr>
            <tr>
                <td>1</td>
                <td>Original du Baccalauréat Général ou Technique</td>
                <td style="text-align: center; color: #dc2626; font-weight: bold;">ORIGINAL</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td>2</td>
                <td>Relevé de Notes Officiel du Baccalauréat (National et Régional)</td>
                <td style="text-align: center; color: #dc2626; font-weight: bold;">ORIGINAL</td>
            </tr>
            <tr>
                <td>3</td>
                <td>Copies de la Carte d'Identité Nationale Légalisées (x2)</td>
                <td style="text-align: center; color: #0284c7; font-weight: bold;">COPIE LÉGALISÉE</td>
            </tr>
            <tr style="background-color: #f8fafc;">
                <td>4</td>
                <td>Photos d'Identité Récentes Format 35x45 mm (x4)</td>
                <td style="text-align: center; color: #0284c7; font-weight: bold;">FORMAT OFFICIEL</td>
            </tr>
            <tr>
                <td>5</td>
                <td>Ce Présent Récépissé Imprimé et Signé par le Candidat</td>
                <td style="text-align: center; color: #16a34a; font-weight: bold;">IMPRIMÉ</td>
            </tr>
        </table>

        <!-- Signatures -->
        <table width="100%" style="margin-top: 15px; font-size: 10px;">
            <tr>
                <td width="50%" style="text-align: center;">
                    <strong>Signature du Candidat</strong><br><br><br>
                    <span style="font-size: 8px; color: #64748b;">Signature précédée de "Lu et approuvé"</span>
                </td>
                <td width="50%" style="text-align: center;">
                    <strong>Cachet de Scolarité & Contrôle d'Accès</strong><br>
                    <strong>Fait à Fès, le {{ date('d/m/Y') }}</strong><br><br><br>
                    <strong>Service des Inscriptions — ENCG Fès</strong>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div style="margin-top: 25px; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #cbd5e1; padding-top: 6px;">
            Récépissé de pré-inscription généré automatiquement via ENCG-ERP • Scanner le QR Code pour vérifier la validité à la porte d'entrée.
        </div>
    </div>
@endsection

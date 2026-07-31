@extends('pdf.layouts.pdf_master')

@section('title', 'RÉCÉPISSÉ DE DÉPÔT DE DOSSIER PHYSIQUE — ENCG FÈS')

@section('content')
    <div style="position: relative; width: 100%;">
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border-bottom: 2px solid #0f2863; padding-bottom: 10px;">
            <tr>
                <td width="70%">
                    <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">ROYAUME DU MAROC</div>
                    <div style="font-size: 12px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 2px;">UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH DE FÈS</div>
                    <div style="font-size: 12px; font-weight: 900; color: #990000; text-transform: uppercase; margin-top: 3px;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                </td>
                <td width="30%" style="text-align: right;">
                    <div style="font-size: 9px; font-family: monospace; font-weight: bold; color: #0f2863;">N° RÉCÉPISSÉ :</div>
                    <div style="font-size: 12px; font-family: monospace; font-weight: 900; color: #059669;">
                        REC-2026-{{ $cne ?? 'M145092428' }}
                    </div>
                </td>
            </tr>
        </table>


        <!-- Title -->
        <div style="text-align: center; margin: 20px 0;">
            <h2 style="font-size: 18px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin: 0; text-decoration: underline;">
                RÉCÉPISSÉ DE DÉPÔT DE DOSSIER PHYSIQUE
            </h2>
            <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-top: 4px;">
                Année Universitaire 2026/2027 • Service des Affaires Estudiantines
            </div>
        </div>

        <!-- Student Identity Summary -->
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #cbd5e1; font-size: 12px;">
            <tr>
                <td width="35%"><strong>Nom et Prénom :</strong></td>
                <td width="65%" style="font-weight: 900; color: #0f2863;">{{ strtoupper($studentName ?? 'ABEN HSSAIN SIHAM') }}</td>
            </tr>
            <tr>
                <td><strong>Code Massar / CNE :</strong></td>
                <td style="font-family: monospace; font-weight: bold;">{{ $cne ?? 'M145092428' }}</td>
            </tr>
            <tr>
                <td><strong>Carte d'Identité (CNIE) :</strong></td>
                <td style="font-family: monospace;">{{ $cin ?? 'UB121643' }}</td>
            </tr>
            <tr>
                <td><strong>Filière Affectée :</strong></td>
                <td style="font-weight: bold; color: #059669;">{{ $filiereName ?? 'DEUX ANNÉES PRÉPARATOIRES' }}</td>
            </tr>
        </table>

        <!-- Deposited Documents Checklist Table -->
        <h3 style="font-size: 12px; font-weight: bold; color: #0f2863; margin-bottom: 10px;">
            LISTE DES PIÈCES PHYSIQUES DÉPOSÉES AU GUICHET :
        </h3>

        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1; margin-bottom: 25px;">
            <tr style="background-color: #0f2863; color: #ffffff; font-weight: bold;">
                <td width="60%">Intitulé de la Pièce Justificative</td>
                <td width="20%" style="text-align: center;">Statut</td>
                <td width="20%" style="text-align: center;">Observation</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td>1. Original du Baccalauréat Général / Technique</td>
                <td style="text-align: center; color: #16a34a; font-weight: bold;">✓ DÉPOSÉ</td>
                <td style="text-align: center; color: #64748b;">Original Conforme</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td>2. Copie Légalisée de la CNIE (Carte d'Identité Nationale)</td>
                <td style="text-align: center; color: #16a34a; font-weight: bold;">✓ DÉPOSÉ</td>
                <td style="text-align: center; color: #64748b;">Conforme</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td>3. Relevé de Notes Officiel du Baccalauréat</td>
                <td style="text-align: center; color: #16a34a; font-weight: bold;">✓ DÉPOSÉ</td>
                <td style="text-align: center; color: #64748b;">Conforme</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td>4. Photos d'Identité Format 35 × 45 mm (x4)</td>
                <td style="text-align: center; color: #16a34a; font-weight: bold;">✓ DÉPOSÉ</td>
                <td style="text-align: center; color: #64748b;">Format Validé</td>
            </tr>
            <tr>
                <td>5. Enveloppe Timbrée portant l'adresse de l'étudiant</td>
                <td style="text-align: center; color: #16a34a; font-weight: bold;">✓ DÉPOSÉ</td>
                <td style="text-align: center; color: #64748b;">Conforme</td>
            </tr>
        </table>

        <!-- Signatures & Official Stamp -->
        <table width="100%" style="margin-top: 30px; font-size: 11px;">
            <tr>
                <td width="50%" style="text-align: center;">
                    <strong>Signature de l'Étudiant(e)</strong><br><br><br>
                    <span style="font-size: 9px; color: #64748b;">Lu et approuvé</span>
                </td>
                <td width="50%" style="text-align: center;">
                    <strong>Cachet & Signature du Agent de Scolarité</strong><br>
                    <strong>Fait à Fès, le {{ date('d/m/Y') }}</strong><br><br><br>
                    <strong>Guichet N° 2 — ENCG Fès</strong>
                </td>
            </tr>
        </table>

        <div style="margin-top: 40px; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #cbd5e1; pt-2;">
            Récépissé officiel délivré par le Système d'Information ENCG-ERP • Conservez ce document précieusement.
        </div>
    </div>
@endsection

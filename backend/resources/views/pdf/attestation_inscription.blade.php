@extends('pdf.layouts.pdf_master')

@section('title', 'ATTESTATION D\'INSCRIPTION OFFICIELLE')

@section('content')
    <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f2863;">
            ATTESTATION D'INSCRIPTION ACADÉMIQUE
        </h2>
        <p style="font-size: 11px; color: #64748b; margin-top: 4px;">
            Année Universitaire 2026/2027 • École Nationale de Commerce et de Gestion de Fès
        </p>
    </div>

    <div style="font-size: 12px; line-height: 1.8; color: #1e293b; margin-bottom: 25px;">
        <p>Le Directeur de l'École Nationale de Commerce et de Gestion de Fès certifie par la présente que l'étudiant(e) :</p>
        
        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin: 15px 0; background-color: #f8fafc; border: 1px solid #cbd5e1; font-size: 12px;">
            <tr>
                <td width="35%"><strong>Nom & Prénom :</strong></td>
                <td width="65%" style="color: #0f2863; font-weight: bold; font-size: 13px;">{{ strtoupper($studentName ?? 'SARA ALAMI') }}</td>
            </tr>
            <tr>
                <td><strong>Code CNE / Massar :</strong></td>
                <td style="font-family: monospace; font-weight: bold;">{{ $cne ?? 'N13809281' }}</td>
            </tr>
            <tr>
                <td><strong>Carte d'Identité (CIN) :</strong></td>
                <td style="font-family: monospace;">{{ $cin ?? 'CD729102' }}</td>
            </tr>
            <tr>
                <td><strong>Filière & Spécialité :</strong></td>
                <td style="font-weight: bold; color: #059669;">{{ $filiereName ?? 'Gestion Financière et Comptable (GFC)' }}</td>
            </tr>
            <tr>
                <td><strong>Niveau & Semestre :</strong></td>
                <td>{{ $semester ?? 'Semestre S1 (Tronc Commun Grande École)' }}</td>
            </tr>
            <tr>
                <td><strong>Groupe d'Affectation :</strong></td>
                <td><strong style="color: #0f2863;">{{ $groupName ?? 'TC-S1-G1' }}</strong></td>
            </tr>
        </table>

        <p>Est régulièrement inscrit(e) au titre de l'année académique <strong>2026/2027</strong> sous le régime de la formation initiale ordinaire.</p>
        <p>La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.</p>
    </div>

    <!-- SIGNATURE BLOCK -->
    <table width="100%" style="margin-top: 40px; font-size: 11px;">
        <tr>
            <td width="50%" style="text-align: center;">
                <strong>Fait à Fès, le {{ date('d/m/Y') }}</strong><br><br><br><br>
                <strong>Service des Affaires Estudiantines</strong><br>
                <span>ENCG Fès</span>
            </td>
            <td width="50%" style="text-align: center;">
                <strong>Pour le Directeur de l'ENCG Fès</strong><br>
                <em>Le Chef du Service de la Scolarité</em><br><br><br>
                <strong>Prof. Abdelhak EL AMRANI</strong>
            </td>
        </tr>
    </table>

    <div style="margin-top: 30px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; pt-2;">
        Empreinte Numérique Certifiée : SHA256-{{ strtoupper(md5($cne ?? 'INSCRIPTION')) }} • Vérification en ligne sur portail-encg.ma/verify
    </div>
@endsection

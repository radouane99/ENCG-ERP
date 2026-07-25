@extends('pdf.layouts.pdf_master')

@section('title', 'LISTE D\'ÉMARGEMENT OFFICIELLE — GROUPE')

@section('content')
    <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f2863;">
            LISTE D'ÉMARGEMENT ET DE PRÉSENCE DU GROUPE
        </h2>
        <p style="font-size: 14px; font-weight: bold; margin-top: 5px; color: #059669;">
            GROUPE : {{ $groupName ?? 'GFC-S5-G1' }} — {{ $filiereName ?? 'Gestion Financière et Comptable' }}
        </p>
        <p style="font-size: 11px; color: #64748b; margin-top: 3px;">
            ENCG Fès • Semestre {{ $semester ?? 'S5' }} • Année Académique 2026/2027
        </p>
    </div>

    <!-- METRICS TABLE -->
    <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px; font-size: 11px; background-color: #f8fafc; border: 1px solid #cbd5e1;">
        <tr>
            <td width="50%">
                <strong>Délégué de Classe :</strong> {{ $delegateName ?? 'Mehdi Alami (CNE: N13809281)' }}<br>
                <strong>Filière Rattachée :</strong> {{ $filiereName ?? 'Gestion Financière et Comptable' }}
            </td>
            <td width="50%" style="text-align: right;">
                <strong>Effectif Inscrit :</strong> {{ $studentCount ?? 28 }} / {{ $capacity ?? 30 }} Étudiants<br>
                <strong>Taux d'Occupation :</strong> <span style="color: #059669; font-weight: bold;">93% (Normal)</span>
            </td>
        </tr>
    </table>

    <!-- STUDENTS ATTENDANCE TABLE -->
    <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse; font-size: 10px; border: 1px solid #cbd5e1; margin-bottom: 20px;">
        <thead>
            <tr style="background-color: #0f2863; color: #ffffff;">
                <th style="border: 1px solid #0f2863; width: 5%;">N°</th>
                <th style="border: 1px solid #0f2863; width: 15%;">CNE / Massar</th>
                <th style="border: 1px solid #0f2863; width: 35%;">Nom & Prénom de l'Étudiant</th>
                <th style="border: 1px solid #0f2863; width: 25%; text-align: center;">Statut Inscription</th>
                <th style="border: 1px solid #0f2863; width: 20%; text-align: center;">Émargement / Empreinte</th>
            </tr>
        </thead>
        <tbody>
            @php
                $list = (isset($realStudents) && count($realStudents) > 0) ? $realStudents : [
                    ['cne' => 'N13809281', 'name' => 'Mehdi Alami (Délégué)', 'status' => 'Inscrit Régulier'],
                    ['cne' => 'N13409122', 'name' => 'Fatima-Zahra Benjelloun', 'status' => 'Inscrit Régulier'],
                    ['cne' => 'N13098177', 'name' => 'Othmane Berrada', 'status' => 'Inscrit Régulier'],
                    ['cne' => 'N13778129', 'name' => 'Salma El Idrissi', 'status' => 'Inscrit Régulier'],
                    ['cne' => 'N13221904', 'name' => 'Youssef Chraibi', 'status' => 'Inscrit Régulier'],
                    ['cne' => 'N13567812', 'name' => 'Kenza Tazi', 'status' => 'Inscrit Régulier'],
                    ['cne' => 'N13998123', 'name' => 'Amine Filali', 'status' => 'Inscrit Régulier'],
                    ['cne' => 'N13112344', 'name' => 'Zineb Bennani', 'status' => 'Inscrit Régulier'],
                ];
            @endphp

            @foreach($list as $index => $st)
                <tr style="background-color: {{ $index % 2 == 0 ? '#ffffff' : '#f8fafc' }};">
                    <td style="border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">{{ $index + 1 }}</td>
                    <td style="border: 1px solid #cbd5e1; font-family: monospace;">{{ $st['cne'] ?? 'N13800000' }}</td>
                    <td style="border: 1px solid #cbd5e1; font-weight: bold; color: #0f2863;">{{ $st['name'] ?? 'Étudiant' }}</td>
                    <td style="border: 1px solid #cbd5e1; text-align: center;"><span style="color: #059669; font-weight: bold;">{{ $st['status'] ?? 'Inscrit Régulier' }}</span></td>
                    <td style="border: 1px solid #cbd5e1; text-align: center; color: #94a3b8; font-style: italic;">__________________</td>
                </tr>
            @endforeach
        </tbody>

    </table>

    <!-- SIGNATURE BLOCK -->
    <table width="100%" style="margin-top: 25px; font-size: 11px;">
        <tr>
            <td width="50%" style="text-align: center;">
                <strong>L'Enseignant / Surveillant Séance</strong><br><br><br><br>
                _______________________
            </td>
            <td width="50%" style="text-align: center;">
                <strong>Visa du Service de la Scolarité</strong><br><br><br><br>
                <strong>ENCG Fès</strong>
            </td>
        </tr>
    </table>

    <div style="margin-top: 20px; text-align: center; font-size: 9px; color: #94a3b8;">
        Empreinte de Sécurité du Groupe : SHA256-{{ strtoupper(md5($groupName ?? 'GFC-S5-G1')) }} • Document Officiel Universitaire
    </div>
@endsection

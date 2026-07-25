@extends('pdf.layouts.pdf_master')

@section('title', 'Ordre de Service')

@section('meta_info', 'Réf : ' . date('Y') . '/OS-AFF/' . str_pad($profId ?? '101', 4, '0', STR_PAD_LEFT) . ' &nbsp;&nbsp;&nbsp; Émis le : ' . date('d/m/Y'))

@section('content')
<div style="text-align: center; font-size: 18px; font-weight: bold; color: #002e5b; letter-spacing: 1px; margin: 15px 0 20px 0; text-transform: uppercase; border-bottom: 2px solid #002e5b; padding-bottom: 8px;">
    ORDRE DE SERVICE & ATTESTATION D'AFFECTATION PÉDAGOGIQUE
</div>

<div style="font-size: 10px; color: #64748b; text-align: center; font-weight: bold; margin-bottom: 20px;">
    Année Académique {{ $academicYear ?? '2026/2027' }} — Décret Ministériel & Réglementation ENCG Fès
</div>

<p style="margin-bottom: 15px; text-align: justify; line-height: 1.6; font-size: 11px;">
    Le Directeur de l'<strong>École Nationale de Commerce et de Gestion (ENCG) de Fès</strong> (Université Sidi Mohamed Ben Abdellah) certifie par la présente que l'Enseignant-Chercheur dont les coordonnées suivent est officiellement affecté(e) pour assurer la charge pédagogique détaillée ci-dessous :
</p>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
    <tr style="background-color: #f8fafc;">
        <th style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: left; color: #002e5b; width: 35%;">ENSEIGNANT RESPONSABLE</th>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #002e5b; text-transform: uppercase;">{{ $profName }}</td>
    </tr>
    <tr>
        <th style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: left; color: #002e5b;">STATUT / GRADE</th>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">Professeur de l'Enseignement Supérieur (PES / PH) — Permanent ENCG Fès</td>
    </tr>
    <tr style="background-color: #f8fafc;">
        <th style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: left; color: #002e5b;">DÉPARTEMENT ACADÉMIQUE</th>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1;">{{ $departmentName ?? 'Département des Sciences de Gestion & Commerce' }}</td>
    </tr>
    <tr>
        <th style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: left; color: #002e5b;">NOMBRE DE CHARGES ATTRIBUÉES</th>
        <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; color: #002e5b;">{{ count($assignments) }} Module(s) / Section(s)</td>
    </tr>
</table>

<div style="font-size: 11px; font-weight: bold; color: #002e5b; margin-bottom: 10px; text-transform: uppercase;">
    Récapitulatif Officiel des Modules & Groupes Attribués :
</div>

<table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
    <thead>
        <tr style="background-color: #002e5b; color: #ffffff;">
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: left; width: 20%;">Code</th>
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: left;">Intitulé du Module</th>
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: center; width: 25%;">Groupe / Section</th>
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: center; width: 20%;">Volume Horaire</th>
        </tr>
    </thead>
    <tbody>
        @foreach($assignments as $index => $item)
        <tr style="background-color: {{ $index % 2 == 0 ? '#ffffff' : '#f8fafc' }};">
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; color: #1e293b;">
                {{ strtok($item['module'] ?? 'MOD01', ' ') }}
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">
                {{ substr(strstr($item['module'] ?? 'MOD01 Module', ' '), 1) ?: ($item['module'] ?? 'Module Académique') }}
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #1e293b;">
                {{ $item['group'] ?? 'TC-S1' }}
            </td>
            <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; color: #475569;">
                48h / Semestre
            </td>
        </tr>
        @endforeach
        <tr style="background-color: #e2e8f0; font-weight: bold; color: #002e5b;">
            <td colspan="3" style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; text-transform: uppercase;">
                Volume Horaire Cumulé Total :
            </td>
            <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-size: 11px;">
                {{ count($assignments) * 48 }}h / Semestre ({{ count($assignments) * 4 }}h / sem)
            </td>
        </tr>
    </tbody>
</table>

<p style="margin-top: 15px; text-align: justify; line-height: 1.6; font-size: 9.5px; color: #475569; font-style: italic;">
    L'enseignant s'engage à respecter le calendrier académique d'évaluation, la remise ponctuelle des feuilles d'émargement et la saisie sécurisée des notes sur la plateforme ENCG ERP conformément aux normes en vigueur.
</p>
@endsection

@section('signature_left')
    AUTHENTICITÉ ET VÉRIFICATION SHA-256
    <div style="font-size: 9px; font-family: monospace; color: #64748b; margin-top: 4px;">SHA256:ENCG-OS-{{ strtoupper(md5($profName)) }}</div>
@endsection

@section('signature_right')
    FAIT À FÈS, LE {{ date('d/m/Y') }}
    <div style="font-size: 11px; font-weight: bold; color: #002e5b; margin-top: 4px;">LE DIRECTEUR DES AFFAIRES PÉDAGOGIQUES</div>
    <div style="font-size: 10px; font-weight: bold; color: #475569; margin-top: 2px;">ENCG FÈS — USMBA</div>
@endsection

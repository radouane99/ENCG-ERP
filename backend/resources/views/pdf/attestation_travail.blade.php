@extends('pdf.layouts.pdf_master')

@section('title', 'Attestation de Travail')

@section('meta_info', 'Réf : ' . date('Y') . '/ATT-TRAV/' . str_pad($professor->id ?? '0001', 4, '0', STR_PAD_LEFT) . ' &nbsp;&nbsp;&nbsp; Émis le : ' . date('d/m/Y'))

@section('document_title', 'ATTESTATION DE TRAVAIL')
@section('title_color', 'blue')

@section('content')
<div style="text-align: center; font-size: 22px; font-weight: bold; color: #002e5b; letter-spacing: 2px; margin: 25px 0 35px 0; text-transform: uppercase; border-bottom: 2px solid #002e5b; padding-bottom: 12px;">
    ATTESTATION DE TRAVAIL
</div>

<p style="margin-bottom: 20px; text-align: justify; line-height: 1.8;">
    Le Secrétariat Général de l'<strong>École Nationale de Commerce et de Gestion (ENCG) de Fès</strong> certifie par la présente que la personne dont l'identité est précisée ci-dessous est bien employée en qualité de <strong>membre du corps enseignant</strong> au sein de notre établissement.
</p>

<table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px;">
    <tr style="background-color: #f8fafc;">
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; color: #002e5b; width: 35%;">NOM COMPLET</th>
        <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">{{ strtoupper($professor->last_name ?? '') }} {{ ucfirst($professor->first_name ?? '') }}</td>
    </tr>
    <tr>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; color: #002e5b;">CIN</th>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">{{ $professor->cin ?? 'N/A' }}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; color: #002e5b;">DÉPARTEMENT / SPÉCIALITÉ</th>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">{{ $professor->department->name ?? ($professor->specialty ?? 'Non spécifié') }}</td>
    </tr>
    <tr>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; color: #002e5b;">STATUT</th>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">Enseignant(e)-Chercheur(se) — Temps plein</td>
    </tr>
    <tr style="background-color: #f8fafc;">
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; color: #002e5b;">ÉTABLISSEMENT</th>
        <td style="padding: 10px; border: 1px solid #cbd5e1;">École Nationale de Commerce et de Gestion (ENCG) de Fès</td>
    </tr>
    <tr>
        <th style="padding: 10px; border: 1px solid #cbd5e1; text-align: left; color: #002e5b;">ANNÉE UNIVERSITAIRE</th>
        <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; color: #002e5b;">{{ $year }}</td>
    </tr>
</table>

<p style="margin-top: 30px; text-align: justify; line-height: 1.8;">
    Cette attestation est délivrée à l'intéressé(e) sur sa demande, pour servir et valoir ce que de droit, et ce sans aucune autre obligation de la part de notre institution.
</p>
@endsection

@section('signature_left')
    SIGNATURE DE L'INTÉRESSÉ(E)
    <div style="font-size: 11px; font-weight: bold; margin-top: 5px; color: #002e5b;">{{ strtoupper($professor->last_name ?? '') }} {{ ucfirst($professor->first_name ?? '') }}</div>
@endsection

@section('signature_right')
    FAIT À FÈS, LE {{ $date }}
    <div style="font-size: 11px; font-weight: bold; color: #1e293b; margin-top: 5px;">LE DIRECTEUR DES RESSOURCES HUMAINES</div>
@endsection

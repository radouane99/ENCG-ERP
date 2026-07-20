@extends('pdf.layouts.pdf_master')

@section('title', 'Attestation de Heures de Vacations')

@section('content')
<div style="text-align: center; font-size: 22px; font-weight: bold; color: #002e5b; letter-spacing: 2px; margin: 25px 0 35px 0; text-transform: uppercase; border-bottom: 2px solid #002e5b; padding-bottom: 12px;">
    ATTESTATION D'HEURES D'ENSEIGNEMENT (VACATIONS)
</div>

<div style="font-size: 14px; line-height: 2.2; text-align: justify; margin-bottom: 20px; font-family: 'Helvetica', sans-serif;">
    Le Directeur de l'École Nationale de Commerce et de Gestion de Fès atteste que le professeur vacataire :<br><br>
    
    <div style="text-align: center; margin: 20px 0; background-color: #f8fafc; padding: 18px; border-radius: 8px; border: 1.5px solid #002e5b;">
        <strong style="font-size: 20px; color: #002e5b;">{{ strtoupper($professor->last_name ?? '') }} {{ ucfirst($professor->first_name ?? '') }}</strong><br>
        <span style="font-size: 13px; color: #475569; display: inline-block; margin-top: 6px;">
            <strong>Spécialité / Département :</strong> {{ $professor->specialty ?? 'Management & Finance' }} &nbsp;&nbsp;|&nbsp;&nbsp; 
            <strong>CIN :</strong> {{ $professor->cin ?? 'N/A' }}
        </span>
    </div>
    
    a assuré les séances d'enseignement et d'encadrement ci-après au titre de l'année universitaire <strong>{{ $year }}</strong> :<br>
    
    <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; border: 1px solid #cbd5e1;">
        <thead>
            <tr style="background-color: #002e5b; color: white;">
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left;">MODULE / COURS</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">VOLUME HORAIRE EFFECTUÉ</th>
                <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">STATUT VALIDATION</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1;">Finance d'Entreprise & Audit (Master)</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">32 Heures</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; color: #059669; font-weight: bold;">Validé DAF</td>
            </tr>
            <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1;">Comptabilité Analytique & Contrôle de Gestion</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">24 Heures</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; color: #059669; font-weight: bold;">Validé DAF</td>
            </tr>
        </tbody>
    </table>
    
    <strong>Total des Heures Effectuées :</strong> <span style="font-size: 16px; color: #002e5b; font-weight: bold;">56 Heures Cours & TD</span>.<br>
    La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.
</div>
@endsection

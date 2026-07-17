@extends('pdf.layouts.pdf_master')

@section('title', 'Attestation de Réussite')

@section('content')
<div style="text-align: center; font-size: 24px; font-weight: bold; color: #002e5b; letter-spacing: 2px; margin: 30px 0 40px 0; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">
    {{ isset($documentRequest) && $documentRequest->documentType ? strtoupper($documentRequest->documentType->name) : 'ATTESTATION DE SCOLARITÉ' }}
</div>

<div style="font-size: 15px; line-height: 2.2; text-align: justify; margin-bottom: 20px; font-family: 'Helvetica', sans-serif;">
    Le Directeur de l'École Nationale de Commerce et de Gestion de Fès atteste par la présente que l'étudiant(e) :<br><br>
    
    <div style="text-align: center; margin: 25px 0; background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <strong style="font-size: 20px; color: #002e5b;">{{ strtoupper($student->last_name) }} {{ $student->first_name }}</strong><br>
        <span style="font-size: 13px; color: #64748b; display: inline-block; margin-top: 5px;">
            <strong>N° Apogée / Matricule:</strong> {{ $student->student_number ?? 'N/A' }} &nbsp;&nbsp;|&nbsp;&nbsp; 
            <strong>CNE / Massar:</strong> {{ $student->cne ?? 'N/A' }}
        </span>
    </div>
    
    est régulièrement inscrit(e) au sein de notre établissement en filière <strong style="font-size: 16px; color: #0f2863;">{{ $student->latestPathway ? $student->latestPathway->filiere->name : 'Tronc Commun' }}</strong> pour l'année universitaire en cours (<strong style="font-size: 16px; color: #0f2863;">{{ $year }}</strong>).<br><br>
    
    La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.
</div>
@endsection

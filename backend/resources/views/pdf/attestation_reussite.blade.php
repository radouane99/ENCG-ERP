@extends('pdf.layouts.pdf_master')

@section('title', 'Attestation de Réussite')

@section('content')
<div style="text-align: center; font-size: 22px; font-weight: bold; color: #002e5b; letter-spacing: 2px; margin: 25px 0 35px 0; text-transform: uppercase; border-bottom: 2px solid #002e5b; padding-bottom: 12px;">
    ATTESTATION DE RÉUSSITE
</div>

<div style="font-size: 14px; line-height: 2.2; text-align: justify; margin-bottom: 20px; font-family: 'Helvetica', sans-serif;">
    Le Directeur de l'École Nationale de Commerce et de Gestion de Fès (Université Sidi Mohamed Ben Abdellah) atteste que l'étudiant(e) :<br><br>
    
    <div style="text-align: center; margin: 20px 0; background-color: #f8fafc; padding: 18px; border-radius: 8px; border: 1.5px solid #002e5b;">
        <strong style="font-size: 20px; color: #002e5b;">{{ strtoupper($student->last_name ?? '') }} {{ ucfirst($student->first_name ?? '') }}</strong><br>
        <span style="font-size: 13px; color: #475569; display: inline-block; margin-top: 6px;">
            <strong>N° Apogée :</strong> {{ $student->student_number ?? 'N/A' }} &nbsp;&nbsp;|&nbsp;&nbsp; 
            <strong>CNE / Massar :</strong> {{ $student->cne ?? $student->student_number ?? 'N/A' }} &nbsp;&nbsp;|&nbsp;&nbsp; 
            <strong>CIN :</strong> {{ $student->cin ?? 'N/A' }}
        </span>
    </div>
    
    a été déclaré(e) définitivement <strong>ADMIS(E)</strong> aux épreuves du Diplôme de l'École Nationale de Commerce et de Gestion de Fès, en filière :<br><br>
    
    <div style="text-align: center; font-size: 18px; font-weight: bold; color: #0f2863; margin: 15px 0; text-transform: uppercase;">
        {{ $student->latestPathway ? $student->latestPathway->filiere->name : 'Management & Commerce International' }}
    </div>
    
    au titre de l'année universitaire <strong>{{ $year }}</strong>
    @if(!empty($mention))
    avec la mention <strong>{{ $mention }}</strong>
    @endif
    .<br><br>
    
    La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit en attendant l'établissement du diplôme définitif.
</div>
@endsection

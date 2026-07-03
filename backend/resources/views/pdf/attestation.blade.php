@extends('pdf.layouts.pdf_master')

@section('title', 'Attestation de Réussite')

@section('content')
<div style="text-align: center; font-size: 24px; font-weight: bold; color: #002e5b; letter-spacing: 2px; margin: 30px 0 40px 0; text-transform: uppercase;">
    Attestation de Réussite
</div>

<div style="font-size: 16px; line-height: 2.1; text-align: justify; margin-bottom: 20px;">
    Le Directeur de l'École Nationale de Commerce et de Gestion de Fès atteste que l'étudiant(e) :<br><br>
    
    <div style="text-align: center; margin: 25px 0;">
        <strong style="font-size: 18px; color: #002e5b;">{{ strtoupper($student->last_name) }} {{ $student->first_name }}</strong><br>
        <span style="font-size: 14px; color: #64748b;">N° Matricule: {{ $student->student_number ?? 'N/A' }} | CNE: {{ $student->cne ?? 'N/A' }}</span>
    </div>
    
    inscrit(e) en filière <strong style="font-size: 18px; color: #002e5b;">{{ $student->latestPathway ? $student->latestPathway->filiere->name : 'Non affecté' }}</strong> a validé son année universitaire <strong style="font-size: 18px; color: #002e5b;">{{ $year }}</strong> avec succès.<br><br>
    
    Fait pour valoir et servir ce que de droit.
</div>
@endsection

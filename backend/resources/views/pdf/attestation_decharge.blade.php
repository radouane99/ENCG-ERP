@extends('pdf.layouts.pdf_master')

@section('title', 'Attestation de Décharge')

@section('content')
<div style="text-align: center; font-size: 22px; font-weight: bold; color: #002e5b; letter-spacing: 2px; margin: 25px 0 35px 0; text-transform: uppercase; border-bottom: 2px solid #002e5b; padding-bottom: 12px;">
    ATTESTATION DE DÉCHARGE GLOBALE
</div>

<div style="font-size: 14px; line-height: 2.2; text-align: justify; margin-bottom: 20px; font-family: 'Helvetica', sans-serif;">
    Les services administratifs et académiques de l'École Nationale de Commerce et de Gestion de Fès certifient par la présente que :<br><br>
    
    <div style="text-align: center; margin: 20px 0; background-color: #f8fafc; padding: 18px; border-radius: 8px; border: 1.5px solid #002e5b;">
        <strong style="font-size: 20px; color: #002e5b;">{{ strtoupper($student->last_name ?? '') }} {{ ucfirst($student->first_name ?? '') }}</strong><br>
        <span style="font-size: 13px; color: #475569; display: inline-block; margin-top: 6px;">
            <strong>Matricule Apogée :</strong> {{ $student->student_number ?? 'N/A' }} &nbsp;&nbsp;|&nbsp;&nbsp; 
            <strong>CNE :</strong> {{ $student->cne ?? 'N/A' }}
        </span>
    </div>
    
    est entièrement <strong>QUITTÉ(E) DE TOUT ENGAGEMENT ET DÉTS</strong> envers l'établissement pour l'année universitaire <strong>{{ $year }}</strong>, notamment :<br>
    
    <ul style="margin-left: 30px; margin-top: 10px; margin-bottom: 15px; font-size: 13px; color: #334155;">
        <li>✔️ <strong>Bibliothèque & Médiathèque :</strong> Restitution complète de tous les ouvrages et matériels empruntés.</li>
        <li>✔️ <strong>Matériel Informatique & Badges :</strong> Restitution de la carte d'accès et équipements de laboratoire.</li>
        <li>✔️ <strong>Service de la Scolarité :</strong> Dossier administratif clos et régularisé.</li>
    </ul>
    
    En foi de quoi, la présente attestation de décharge lui est délivrée pour valoir la remise des originaux de ses diplômes.
</div>
@endsection

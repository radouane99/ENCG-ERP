@extends('pdf.layouts.pdf_master')

@section('title', 'Emploi du Temps des Examens - ENCG Fès')

@section('content')
<div style="text-align: center; font-size: 20px; font-weight: bold; color: #002e5b; letter-spacing: 1.5px; margin: 15px 0 25px 0; text-transform: uppercase; border-bottom: 2px solid #002e5b; padding-bottom: 10px;">
    CALENDRIER & PLANNING OFFICIEL DES EXAMENS — {{ strtoupper($session_name ?? 'SESSION NORMALE') }}
</div>

<div style="margin-bottom: 20px; padding: 12px 15px; border: 1.5px solid #002e5b; background-color: #f8fafc; border-radius: 8px; font-size: 11px;">
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="width: 25%; color: #64748b;"><strong>Établissement :</strong></td>
            <td style="font-weight: bold; color: #002e5b;">ENCG Fès (Université USMBA)</td>
            <td style="width: 25%; color: #64748b;"><strong>Année Académique :</strong></td>
            <td style="font-weight: bold; color: #002e5b;">{{ $academic_year ?? '2025/2026' }}</td>
        </tr>
        <tr>
            <td style="color: #64748b;"><strong>Filière / Niveau :</strong></td>
            <td style="font-weight: bold; color: #1e293b;">{{ $filiere_name ?? 'Toutes Filières (Tronc Commun & Spécialités)' }}</td>
            <td style="color: #64748b;"><strong>Session Examens :</strong></td>
            <td style="font-weight: bold; color: #059669;">{{ strtoupper($session_type ?? 'Normale (Ordinaire)') }}</td>
        </tr>
    </table>
</div>

<table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10px; border: 1px solid #002e5b;">
    <thead>
        <tr style="background-color: #002e5b; color: white;">
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: center; width: 15%;">DATE</th>
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: center; width: 15%;">HORAIRE</th>
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: left; width: 35%;">MODULE / ÉPREUVE</th>
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: left; width: 20%;">ENSEIGNANT RESP.</th>
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: center; width: 15%;">SALLES ASSIGNÉES</th>
        </tr>
    </thead>
    <tbody>
        @forelse($exams ?? [] as $exam)
            <tr>
                <td style="padding: 7px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #1e293b;">
                    {{ $exam['date'] }}
                </td>
                <td style="padding: 7px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #059669;">
                    {{ $exam['time'] }}
                </td>
                <td style="padding: 7px; border: 1px solid #cbd5e1; font-weight: bold; color: #002e5b;">
                    {{ $exam['module'] }} <br>
                    <span style="font-size: 8.5px; color: #64748b; font-weight: normal;">Filière: {{ $exam['filiere'] ?? 'Tronc Commun' }}</span>
                </td>
                <td style="padding: 7px; border: 1px solid #cbd5e1;">
                    {{ $exam['professor'] ?? 'Prof. Titulaire' }}
                </td>
                <td style="padding: 7px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">
                    {{ $exam['rooms'] ?? 'Amphi Ibn Khaldoun' }}
                </td>
            </tr>
        @empty
            <tr>
                <td colspan="5" style="padding: 15px; text-align: center; color: #64748b;">
                    Aucune épreuve planifiée pour cette session.
                </td>
            </tr>
        @endforelse
    </tbody>
</table>

<div style="margin-top: 25px; padding: 12px; border-left: 4px solid #002e5b; background-color: #f8fafc; font-size: 10px;">
    <p style="color: #002e5b; font-weight: bold; margin-top: 0;">Remarques importantes aux étudiants et enseignants :</p>
    <ul style="color: #334155; margin-bottom: 0; padding-left: 18px; line-height: 1.5;">
        <li>✔️ L'accès aux salles s'effectue sur présentation stricte de la convocation individuelle et de la carte d'étudiant.</li>
        <li>✔️ Aucun changement de salle ou de place nominative n'est autorisé sans accord de la Direction des Examens.</li>
    </ul>
</div>
@endsection

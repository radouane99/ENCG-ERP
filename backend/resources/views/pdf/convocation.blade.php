@extends('pdf.layouts.pdf_master')

@section('title', 'Convocation aux Examens - ENCG Fès')

@section('content')
<div style="text-align: center; font-size: 22px; font-weight: bold; color: #002e5b; letter-spacing: 2px; margin: 20px 0 30px 0; text-transform: uppercase; border-bottom: 2px solid #002e5b; padding-bottom: 10px;">
    CONVOCATION AUX EXAMENS — {{ strtoupper($session_type ?? 'SESSION ORDINAIRE') }}
</div>

<div style="margin-bottom: 20px; padding: 15px; border: 1.5px solid #002e5b; background-color: #f8fafc; border-radius: 8px;">
    <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
        <tr>
            <td style="width: 25%; color: #64748b;"><strong>Bénéficiaire :</strong></td>
            <td style="font-weight: bold; color: #002e5b; font-size: 13px;">{{ strtoupper($person_name ?? 'Étudiant ENCG') }}</td>
            <td style="width: 25%; color: #64748b;"><strong>Rôle :</strong></td>
            <td style="font-weight: bold; color: #002e5b;">{{ strtoupper($person_role ?? 'Étudiant') }}</td>
        </tr>
        <tr>
            <td style="color: #64748b;"><strong>N° Identifiant :</strong></td>
            <td style="font-weight: bold; color: #1e293b;">{{ $person_id ?? 'N/A' }}</td>
            <td style="color: #64748b;"><strong>Filière / Dép. :</strong></td>
            <td style="font-weight: bold; color: #1e293b;">{{ $filiere_name ?? 'Tronc Commun ENCG' }}</td>
        </tr>
        <tr>
            <td style="color: #64748b;"><strong>Session Examens :</strong></td>
            <td style="font-weight: bold; color: #059669;" colspan="3">
                {{ $session_name ?? 'Session de Fin de Semestre (S1 / S2)' }}
            </td>
        </tr>
    </table>
</div>

<h3 style="color: #002e5b; margin-top: 25px; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px;">
    📅 Planning des Épreuves Convocation ({{ strtoupper($session_type ?? 'ORDINAIRE') }})
</h3>

<table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; border: 1px solid #002e5b;">
    <thead>
        <tr style="background-color: #002e5b; color: white;">
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: left;">DATE & HEURE</th>
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: left;">MODULE / ÉPREUVE</th>
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: center;">SALLE / AMPHI</th>
            <th style="padding: 8px; border: 1px solid #002e5b; text-align: center;">N° PLACE / ROLE</th>
        </tr>
    </thead>
    <tbody>
        @forelse($exams ?? [] as $ex)
            <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e293b;">
                    {{ $ex['date'] }} <br>
                    <span style="font-size: 9px; color: #64748b;">{{ $ex['time'] }}</span>
                </td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; color: #002e5b;">
                    {{ $ex['module'] }}
                </td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">
                    {{ $ex['room'] }}
                </td>
                <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #059669;">
                    {{ $ex['seat'] ?? $ex['role'] ?? 'Place Assignée' }}
                </td>
            </tr>
        @empty
            <tr>
                <td colspan="4" style="padding: 12px; text-align: center; color: #64748b;">
                    Aucune épreuve programmée pour cette session.
                </td>
            </tr>
        @endforelse
    </tbody>
</table>

<div style="margin-top: 35px; padding: 15px; border-left: 4px solid #002e5b; background-color: #f8fafc; font-size: 10.5px;">
    <p style="color: #002e5b; font-weight: bold; margin-top: 0;">Règlement Intérieur & Anti-Fraude Examens :</p>
    <ul style="color: #334155; margin-bottom: 0; padding-left: 20px; line-height: 1.6;">
        <li>✔️ La présentation du badge étudiant/carte d'identité nationale (CIN) est strictement obligatoire.</li>
        <li>✔️ L'accès à la salle est interdit 15 minutes après le début de l'épreuve.</li>
        <li>❌ Les téléphones portables et montres connectées sont strictement interdits et passibles de Conseil de Discipline immediate.</li>
    </ul>
</div>
@endsection

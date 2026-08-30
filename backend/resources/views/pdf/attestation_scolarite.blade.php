@extends('pdf.layouts.pdf_master')

@section('title', 'Attestation de Scolarité — ENCG Fès')

@section('content')
<div style="position: relative; width: 100%; font-family: 'Helvetica', 'Arial', sans-serif;">

    <!-- Title Banner -->
    <div style="text-align: center; margin: 15px 0 25px 0;">
        <div style="font-size: 20pt; font-weight: 900; color: #002e5b; letter-spacing: 2px; text-transform: uppercase; border-bottom: 2.5px solid #002e5b; padding-bottom: 8px; display: inline-block;">
            ATTESTATION DE SCOLARITÉ
        </div>
        <div style="font-size: 9pt; font-weight: bold; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">
            ANNÉE UNIVERSITAIRE {{ $year ?? '2026-2027' }}
        </div>
    </div>

    <!-- Attestation Text -->
    <div style="font-size: 11pt; line-height: 2; text-align: justify; margin-bottom: 20px; color: #1e293b;">
        Le Directeur de l'École Nationale de Commerce et de Gestion de Fès (Université Sidi Mohamed Ben Abdellah) atteste que l'étudiant(e) :<br><br>

        <!-- Student Identification Card -->
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 10pt; border-collapse: collapse; background-color: #f8fafc; border: 1.5px solid #002e5b; border-radius: 8px; margin: 10px 0 20px 0;">
            <tr style="border-bottom: 1px solid #cbd5e1;">
                <td width="30%" style="font-weight: bold; color: #475569; background-color: #f1f5f9;">Nom et Prénom :</td>
                <td width="70%" style="font-weight: 900; color: #002e5b; font-size: 12pt; text-transform: uppercase;">
                    {{ $studentName ?? (strtoupper(($student->last_name ?? '') . ' ' . ($student->first_name ?? ''))) }}
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="font-weight: bold; color: #475569; background-color: #f1f5f9;">Né(e) le &amp; Lieu :</td>
                <td style="font-weight: bold; color: #1e293b;">
                    {{ $birthDate ?? ($student->birth_date ? \Carbon\Carbon::parse($student->birth_date)->format('d/m/Y') : '25/07/2008') }} à {{ strtoupper($birthCity ?? ($student->birth_place ?? 'OUJDA')) }}
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="font-weight: bold; color: #475569; background-color: #f1f5f9;">CNE / Code Massar :</td>
                <td style="font-weight: 900; font-family: monospace; font-size: 11pt; color: #059669;">
                    {{ $cne ?? ($student->cne ?? 'H148073298') }}
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="font-weight: bold; color: #475569; background-color: #f1f5f9;">Carte d'Identité (CIN) :</td>
                <td style="font-weight: bold; color: #1e293b; font-family: monospace;">
                    {{ $cin ?? ($student->cin ?? 'ZG195334') }}
                </td>
            </tr>
            <tr>
                <td style="font-weight: bold; color: #475569; background-color: #f1f5f9;">N° Apogée / Matricule :</td>
                <td style="font-weight: bold; color: #1e293b; font-family: monospace;">
                    {{ $student->student_number ?? ($student->id ?? '159') }}
                </td>
            </tr>
        </table>

        est régulièrement inscrit(e) à l'École Nationale de Commerce et de Gestion de Fès et y poursuit ses études au titre de l'année universitaire <strong>{{ $year ?? '2026-2027' }}</strong>.<br><br>

        <!-- Academic Affiliation -->
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 10pt; border-collapse: collapse; background-color: #ffffff; border: 1px solid #94a3b8; border-radius: 6px; margin-bottom: 20px;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td width="30%" style="font-weight: bold; color: #475569; background-color: #f8fafc;">Diplôme Préparé :</td>
                <td width="70%" style="font-weight: 800; color: #002e5b;">
                    Diplôme des Écoles Nationales de Commerce et de Gestion (Bac+5 / Grade Master)
                </td>
            </tr>
            <tr>
                <td style="font-weight: bold; color: #475569; background-color: #f8fafc;">Filière d'Études :</td>
                <td style="font-weight: 800; color: #002e5b;">
                    {{ $filiereName ?? ($student->latestPathway?->filiere?->name ?? 'DEUX ANNÉES PRÉPARATOIRES (TRONC COMMUN)') }}
                </td>
            </tr>
        </table>

        La présente attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.<br>
    </div>

</div>
@endsection

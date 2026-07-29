@extends('pdf.layouts.pdf_master')

@section('title', 'ÉTIQUETTE D\'ENVELOPPE PHYSIQUE — ARCHIVE ENCG FÈS')

@section('content')
    <div style="width: 100%; border: 3px dashed #0f2863; padding: 20px; border-radius: 12px; background-color: #ffffff;">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td width="70%">
                    <div style="font-size: 10px; font-weight: bold; color: #0f2863;">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
                    <div style="font-size: 8px; color: #64748b;">SERVICE DES AFFAIRES ESTUDIANTINES • ARCHIVE ACADÉMIQUE</div>
                    <h2 style="font-size: 16px; font-weight: 900; color: #0f2863; margin: 8px 0 2px 0; text-transform: uppercase;">
                        {{ $studentName ?? 'ABEN HSSAIN SIHAM' }}
                    </h2>
                    <div style="font-size: 11px; font-weight: bold; color: #059669;">
                        FILIÈRE : {{ $filiereName ?? 'DEUX ANNÉES PRÉPARATOIRES' }}
                    </div>
                </td>
                <td width="30%" style="text-align: right; vertical-align: top;">
                    <div style="font-size: 14px; font-weight: 900; color: #990000; border: 2px solid #990000; padding: 4px 8px; display: inline-block; border-radius: 6px;">
                        DOSSIER N° {{ $studentId ?? '8261' }}
                    </div>
                </td>
            </tr>
        </table>

        <div style="margin: 15px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 10px 0;">
            <table width="100%" style="font-size: 11px;">
                <tr>
                    <td width="33%"><strong>CNE / Massar :</strong> <span style="font-family: monospace; font-weight: bold; color: #0f2863;">{{ $cne ?? 'M145092428' }}</span></td>
                    <td width="33%"><strong>CNIE :</strong> <span style="font-family: monospace; font-weight: bold;">{{ $cin ?? 'UB121643' }}</span></td>
                    <td width="33%"><strong>Groupe :</strong> <strong style="color: #0f2863;">{{ $groupName ?? 'TC-S1-G1' }}</strong></td>
                </tr>
                <tr>
                    <td style="padding-top: 5px;"><strong>Année Bac :</strong> {{ $bacYear ?? '2026' }}</td>
                    <td style="padding-top: 5px;"><strong>Série Bac :</strong> {{ $bacSeries ?? 'Sciences Math B' }}</td>
                    <td style="padding-top: 5px;"><strong>Année Univ. :</strong> <strong style="color: #16a34a;">2026-2027</strong></td>
                </tr>
            </table>
        </div>

        <!-- High Resolution Barcode Footer -->
        <table width="100%" style="text-align: center; margin-top: 10px;">
            <tr>
                <td>
                    <div style="font-size: 24px; font-family: monospace; font-weight: bold; tracking-widest: 4px; letter-spacing: 6px; color: #0f2863;">
                        ||||||||||||||||||||||||||||||||||||||||||||||||||
                    </div>
                    <div style="font-size: 10px; font-family: monospace; font-weight: bold; color: #475569; margin-top: 2px;">
                        ENV-2026-{{ $cne ?? 'M145092428' }}
                    </div>
                </td>
            </tr>
        </table>
    </div>
@endsection

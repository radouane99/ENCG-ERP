@extends('pdf.layouts.pdf_master')

@section('title', 'ÉTIQUETTES DE TABLE CONCOURS TAFEM 2026')

@section('content')
    <div style="text-align: center; margin-bottom: 15px;">
        <h2 style="font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f2863;">
            CONCOURS NATIONAL TAFEM 2026 — ÉTIQUETTES DE PUPITRES
        </h2>
        <p style="font-size: 10px; color: #64748b; margin-top: 3px;">
            École Nationale de Commerce et de Gestion de Fès • Centre d'Examen Amphis & Salles
        </p>
    </div>

    <!-- GRID 2 COLUMNS x 4 ROWS = 8 LABELS PER A4 PAGE -->
    <table width="100%" cellpadding="6" cellspacing="6" style="border-collapse: separate; border-spacing: 6px;">
        @foreach(array_chunk($labels ?? [], 2) as $row)
            <tr>
                @foreach($row as $label)
                    <td width="50%" style="border: 2px dashed #0f2863; background-color: #f8fafc; border-radius: 8px; padding: 10px; vertical-align: top;">
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">
                            <strong style="font-size: 11px; color: #0f2863;">ENCG FÈS — TAFEM 2026</strong>
                            <span style="font-size: 11px; font-weight: bold; color: #e6007e;">TABLE N° {{ $label['table_number'] ?? rand(1, 450) }}</span>
                        </div>
                        
                        <div style="font-size: 12px; font-weight: bold; color: #1e293b; margin-bottom: 3px;">
                            {{ strtoupper($label['name'] ?? 'SARA ALAMI') }}
                        </div>
                        
                        <div style="font-size: 10px; font-family: monospace; color: #475569;">
                            CNE: {{ $label['cne'] ?? 'N13809281' }} | CIN: {{ $label['cin'] ?? 'CD729102' }}
                        </div>

                        <div style="font-size: 10px; font-weight: bold; color: #059669; margin-top: 4px;">
                            {{ $label['amphi'] ?? 'Amphi Al Khwarizmi' }}
                        </div>

                        <div style="font-size: 8px; color: #94a3b8; text-align: right; margin-top: 6px;">
                            Scan QR Emargement • SHA256-{{ strtoupper(md5($label['cne'] ?? 'TAFEM')) }}
                        </div>
                    </td>
                @endforeach
            </tr>
        @endforeach
    </table>
@endsection

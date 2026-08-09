@extends('pdf.layouts.pdf_master')

@section('title', 'ATTESTATION D\'INSCRIPTION OFFICIELLE — ENCG FÈS')

@section('content')
    <div style="position: relative; width: 100%;">

        {{-- Security Watermark background / Top Header Bar --}}
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border-b: 2px solid #0f2863; padding-bottom: 12px;">
            <tr>
                <td width="70%" style="vertical-align: top;">
                    <div style="font-size: 13px; font-weight: bold; color: #0f2863; font-family: 'Times New Roman', serif;">
                        جامعة سيدي محمد بن عبد الله بفاس
                    </div>
                    <div style="font-size: 11px; font-weight: bold; color: #0f2863; margin-top: 2px;">
                        UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH DE FES
                    </div>
                    <div style="font-size: 13px; font-weight: bold; color: #990000; margin-top: 4px; font-family: 'Times New Roman', serif;">
                        المدرسة الوطنية للتجارة والتسيير بفاس
                    </div>
                    <div style="font-size: 11px; font-weight: bold; color: #990000; margin-top: 2px;">
                        ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FES
                    </div>
                </td>
                <td width="30%" style="text-align: right; vertical-align: top;">
                    <div style="display: inline-block; padding: 6px; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center;">
                        @if(!empty($qrCodeBase64))
                            <img src="{{ $qrCodeBase64 }}" width="75" height="75" alt="QR Validation" style="display: block; margin: auto;" />
                        @else
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=85x85&data=https://e-etudiant.encg.usmba.ac.ma/verify-attestation?cne={{ $cne ?? 'M145092428' }}" width="75" height="75" alt="QR Verification" />
                        @endif
                        <div style="font-size: 7px; color: #64748b; font-family: monospace; margin-top: 2px;">VÉRIFICATION QR</div>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Main Title -->
        <div style="text-align: center; margin: 25px 0 30px 0;">
            <h2 style="font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #0f2863; text-transform: uppercase; margin: 0; text-decoration: underline;">
                ATTESTATION D'INSCRIPTION
            </h2>
            <div style="font-size: 10px; font-weight: bold; color: #059669; margin-top: 5px; text-transform: uppercase; tracking-widest: 1px;">
                DOCUMENT OFFICIEL CERTIFIÉ ET HORODATÉ ÉLECTRONIQUEMENT
            </div>
        </div>

        <!-- Student Photo & Identification Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
            <tr>
                <td width="78%" style="vertical-align: top;">
                    <p style="font-size: 12px; line-height: 1.6; color: #1e293b; margin: 0 0 15px 0;">
                        Le Directeur de l'École Nationale de Commerce et de Gestion de Fès atteste que l'étudiant(e) :
                    </p>

                    <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 12px; border-collapse: collapse;">
                        <tr>
                            <td width="36%" style="font-weight: bold; color: #475569;">Nom et prénom :</td>
                            <td width="64%" style="font-weight: 900; color: #0f2863; font-size: 13px; text-transform: uppercase;">
                                {{ $studentName ?? 'ABEN HSSAIN SIHAM' }}
                            </td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; color: #475569;">CODE MASSAR / CNE :</td>
                            <td style="font-weight: bold; font-family: monospace; font-size: 13px; color: #1e293b;">
                                {{ $cne ?? 'M145092428' }}
                            </td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; color: #475569;">CNIE :</td>
                            <td style="font-weight: bold; font-family: monospace; color: #1e293b;">
                                {{ $cin ?? 'UB121643' }}
                            </td>
                        </tr>
                        <tr>
                            <td style="font-weight: bold; color: #475569;">Né(e) le :</td>
                            <td style="color: #1e293b;">
                                <strong>{{ $birthDate ?? '13/12/2008' }}</strong> &nbsp; à &nbsp; <strong>{{ strtoupper($birthCity ?? 'ER-RICH MIDELT') }}</strong>
                            </td>
                        </tr>
                    </table>
                </td>

                <!-- Photo Box (35x45mm Ratio) -->
                <td width="22%" style="text-align: right; vertical-align: top;">
                    <div style="width: 105px; height: 135px; border: 2px solid #0f2863; border-radius: 8px; padding: 2px; background-color: #ffffff; display: inline-block; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                        @if(!empty($photoPath) && file_exists($photoPath))
                            <img src="{{ $photoPath }}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" alt="Photo Étudiant" />
                        @else
                            <div style="width: 100%; height: 100%; background-color: #f1f5f9; border-radius: 6px; text-align: center; line-height: 135px; font-size: 10px; color: #94a3b8; font-weight: bold;">
                                PHOTO 35×45
                            </div>
                        @endif
                    </div>
                </td>
            </tr>
        </table>

        <!-- Enrollment Details Section -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 25px; font-size: 12px; line-height: 1.8;">
            <p style="margin: 0 0 10px 0; color: #1e293b;">
                Est régulièrement inscrit(e) au <strong>{{ $semester ?? 'Semestre 1' }}</strong> des <strong>{{ $cycle ?? 'Deux années Préparatoires des Écoles Nationales de Commerce et Gestion' }}</strong> à l'E.N.C.G FÈS.
            </p>
            
            <p style="margin: 0 0 10px 0; color: #1e293b;">
                <strong>Filière :</strong> <span style="font-weight: 900; color: #0f2863; text-transform: uppercase;">{{ $filiereName ?? 'DEUX ANNÉES PRÉPARATOIRES' }}</span>
            </p>

            <p style="margin: 0; color: #1e293b;">
                <strong>Année Universitaire :</strong> <span style="font-weight: bold; color: #059669;">{{ $academicYear ?? '2026-2027' }}</span>
            </p>
        </div>

        <p style="font-size: 12px; line-height: 1.6; color: #334155; margin-bottom: 35px;">
            La présente attestation est délivrée suite à la demande de l'intéressé(e) pour servir et valoir ce que de droit.
        </p>

        <!-- Official Signatures & Digital Seal Block -->
        <table width="100%" style="margin-top: 20px; font-size: 11px;">
            <tr>
                <td width="45%" style="vertical-align: top;">
                    <div style="border: 1px dashed #cbd5e1; border-radius: 8px; padding: 10px; background-color: #fafafa; text-align: center;">
                        <div style="font-size: 9px; font-weight: bold; color: #64748b; text-transform: uppercase;">Sceau de Sécurité Électronique</div>
                        <div style="font-size: 10px; font-family: monospace; font-weight: bold; color: #0f2863; margin-top: 4px;">
                            ENCG-SEAL-{{ date('Y') }}-{{ strtoupper(md5($cne ?? 'VALIDATED')) }}
                        </div>
                        <div style="font-size: 8px; color: #16a34a; margin-top: 4px; font-weight: bold;">
                            ✓ CACHET ÉLECTRONIQUE SCELLÉ
                        </div>
                    </div>
                </td>
                <td width="55%" style="text-align: right; vertical-align: top; padding-right: 15px;">
                    <div style="font-size: 12px; font-weight: bold; color: #1e293b;">
                        Fait à Fès Le : <span style="color: #0f2863; text-decoration: underline;">{{ date('d/m/Y') }}</span>
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; font-weight: bold; color: #0f2863;">
                        Pour le Directeur de l'E.N.C.G Fès
                    </div>
                    <div style="font-size: 10px; font-style: italic; color: #64748b; margin-top: 2px;">
                        Le Chef du Service des Affaires Estudiantines
                    </div>
                    <div style="margin-top: 25px; font-size: 12px; font-weight: 900; color: #0f2863;">
                        Prof. Abdelhak EL AMRANI
                    </div>
                </td>
            </tr>
        </table>

        <!-- Footer Bar -->
        <div style="margin-top: 40px; padding-top: 12px; border-top: 1px solid #cbd5e1; text-align: center; font-size: 8.5px; color: #64748b; font-family: Arial, sans-serif;">
            <div style="font-weight: bold; color: #0f2863; margin-bottom: 2px;">
                Route d'Immuzzer, BP 81A FÈS · TEL : 0535622932 · FAX : 0535622930 · Site web : www.encg.usmba.ac.ma
            </div>
            <div>
                Document généré via le Système d'Information ENCG-ERP. Toute falsification est passible de sanctions conformément à la loi.
            </div>
        </div>

    </div>
@endsection

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Statut de votre demande - ENCG Fès</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #334155; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f2863 0%, #1d3d82 100%); padding: 30px; text-align: center; color: #ffffff; border-bottom: 4px solid #fbbf24; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fbbf24; }
    .header p { margin: 5px 0 0 0; font-size: 12px; color: #cbd5e1; font-weight: 600; }
    .content { padding: 30px; }
    .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 15px; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 13px; text-transform: uppercase; margin: 15px 0; }
    .status-approved { background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .status-rejected { background-color: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
    .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; }
    .field { margin-bottom: 10px; }
    .field:last-child { margin-bottom: 0; }
    .label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .value { font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    .btn { display: inline-block; background-color: #0f2863; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 20px; }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>ÉCOLE NATIONALE DE COMMERCE ET DE GESTION</h1>
      <p>UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH — FÈS</p>
    </div>

    <div class="content">
      <div class="greeting">Bonjour {{ $data['student_name'] ?? 'Cher(e) Étudiant(e)' }},</div>

      <p style="font-size: 14px; line-height: 1.6;">
        Nous vous informons de la mise à jour de votre demande de document administratif auprès du Guichet de la Scolarité ENCG Fès.
      </p>

      @if(in_array($data['status'] ?? '', ['ready', 'approved'], true))
        <div class="status-badge status-approved">
          ✓ Demande Accordée & Document Généré
        </div>
        <p style="font-size: 13px; color: #166534;">
          Votre document administratif est prêt et disponible en version numérique sécurisée. Vous pouvez le télécharger directement sur votre espace ERP.
        </p>
      @else
        <div class="status-badge status-rejected">
          ✕ Demande Non Accordée
        </div>
        @if(!empty($data['rejection_reason']))
          <div style="background-color: #fff1f2; border: 1px solid #fecdd3; padding: 12px; border-radius: 8px; font-size: 13px; color: #9f1239; margin-top: 10px;">
            <strong>Motif indiqué par l'administration :</strong> {{ $data['rejection_reason'] }}
          </div>
        @endif
      @endif

      <div class="details-box">
        <div class="field">
          <div class="label">Type de document</div>
          <div class="value">{{ $data['document_type'] ?? 'Document Administratif' }}</div>
        </div>
        <div class="field">
          <div class="label">N° de Référence</div>
          <div class="value">REF-{{ $data['request_id'] ?? 'ENCG' }}-2025</div>
        </div>
        <div class="field">
          <div class="label">Date de traitement</div>
          <div class="value">{{ date('d/m/Y H:i') }}</div>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="{{ url('/student/requests') }}" class="btn">Accéder au Portail Étudiant ERP</a>
      </div>
    </div>

    <div class="footer">
      Cet e-mail est généré automatiquement par le Portail ERP de l'ENCG Fès.<br>
      © {{ date('Y') }} ENCG Fès — Tous droits réservés.
    </div>
  </div>
</body>
</html>

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Nouvelle demande de document - ENCG Portail</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #334155; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #0f2863 0%, #1d3d82 100%); padding: 25px; text-align: center; color: #ffffff; border-bottom: 4px solid #fbbf24; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #fbbf24; }
    .header p { margin: 5px 0 0 0; font-size: 11px; color: #cbd5e1; font-weight: 600; }
    .content { padding: 25px; }
    .title { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 15px; }
    .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin: 15px 0; }
    .field { margin-bottom: 10px; }
    .field:last-child { margin-bottom: 0; }
    .label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .value { font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    .btn { display: inline-block; background-color: #0f2863; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 15px; }
    .footer { background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>ÉCOLE NATIONALE DE COMMERCE ET DE GESTION — FÈS</h1>
      <p>ALERTES DU GUICHET DE LA SCOLARITÉ</p>
    </div>

    <div class="content">
      <div class="title">🔔 Nouvelle Demande de Document Administratif</div>

      <p style="font-size: 13px; line-height: 1.6;">
        Un étudiant vient de soumettre une nouvelle demande de document administratif nécessitant la validation ou signature de l'administration.
      </p>

      <div class="details-box">
        <div class="field">
          <div class="label">Étudiant</div>
          <div class="value">{{ $data['student_name'] ?? 'Étudiant' }}</div>
        </div>
        <div class="field">
          <div class="label">CNE / CIN</div>
          <div class="value">{{ $data['student_cne'] ?? 'N/A' }}</div>
        </div>
        <div class="field">
          <div class="label">Document demandé</div>
          <div class="value">{{ $data['document_type'] ?? 'Attestation' }}</div>
        </div>
        <div class="field">
          <div class="label">Date de la demande</div>
          <div class="value">{{ date('d/m/Y H:i') }}</div>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="{{ url('/admin/requests') }}" class="btn">Traiter la demande sur l'ERP</a>
      </div>
    </div>

    <div class="footer">
      Système de Notification Automatisé ERP ENCG Fès.
    </div>
  </div>
</body>
</html>

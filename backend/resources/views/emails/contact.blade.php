<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: sans-serif; background-color: #f5f7fa; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; }
  h2 { color: #A80A0B; }
  .field { margin-bottom: 15px; }
  .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
  .value { font-size: 16px; color: #0f172a; margin-top: 5px; }
  .msg-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin-top: 10px; white-space: pre-wrap; }
</style>
</head>
<body>
  <div class="container">
    <h2>Nouveau message de contact</h2>
    
    <div class="field">
      <div class="label">Expéditeur</div>
      <div class="value">{{ $data['name'] }}</div>
    </div>
    
    <div class="field">
      <div class="label">Email</div>
      <div class="value">{{ $data['email'] }}</div>
    </div>
    
    <div class="field">
      <div class="label">Message</div>
      <div class="msg-box">{{ $data['message'] }}</div>
    </div>
  </div>
</body>
</html>

from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
p=root/'backend/app/Services/AI/GeminiApiService.php'
t=p.read_text(encoding='utf-8')
t=t.replace('Http::withoutVerifying()', 'Http::connectTimeout(3)')
t=re.sub(r'(Log::info\([^;\n]*), \$decoded[A-Za-z]*\);', r'\1);', t)
t=t.replace('$response->body()', "'provider_error'").replace('$resG->body()', "'provider_error'").replace('$gRes->body()', "'provider_error'")
t=t.replace("': '.$errBody", "': provider_error'")
p.write_text(t, encoding='utf-8')

from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]

def replace_method(path, name, body):
    p = root / path
    text = p.read_text(encoding='utf-8-sig')
    match = re.search(r'    public function '+re.escape(name)+r'\(', text)
    if not match:
        raise RuntimeError(f'Missing method {name} in {path}')
    begin = text.index('{', match.end())
    i, depth, quote = begin+1, 1, None
    while depth:
        c = text[i]
        if quote:
            if c == '\\': i += 2; continue
            if c == quote: quote = None
        elif text[i:i+2] == '//':
            i = text.index('\n', i); continue
        elif text[i:i+2] == '/*':
            i = text.index('*/', i)+2; continue
        elif c in "'\"": quote = c
        elif c == '{': depth += 1
        elif c == '}': depth -= 1
        i += 1
    text = text[:begin] + '{\n'+body+'\n    }' + text[i:]
    p.write_text(text, encoding='utf-8')

controller='backend/app/Http/Controllers/Api/AdmissionController.php'
methods={
'getTafemStats': 'return app(AdmissionWorkflowController::class)->stats($request);',
'runAutoRepartition': 'return app(AdmissionAppointmentController::class)->preview($request);',
'promoteWaitingList': 'return app(AdmissionWorkflowController::class)->promote($request);',
'getMinistryTafemList': 'return app(AdmissionWorkflowController::class)->listing($request);',
'verifyPhysicalDossier': "\\App\\Support\\AdmissionAccess::review($request);\n        $request->merge(['decision' => 'approved']);\n        return app(AdmissionWorkflowController::class)->decide($request);",
'submitOnlinePreinscription': 'return app(AdmissionWorkflowController::class)->submit($request);',
'scanEnvelopeQrCode': 'return app(AdmissionAppointmentController::class)->scan(request(), $token);',
'getEnrollmentStats': 'return app(AdmissionWorkflowController::class)->stats(request());',
'getSecurityDailyList': 'return app(AdmissionAppointmentController::class)->daily($request);',
'trackCandidateDossier': 'return app(AdmissionWorkflowController::class)->show($request);',
'promoteWaitingListCandidates': 'return app(AdmissionWorkflowController::class)->promote(request());',
'sendCandidateConvocationEmail': 'return app(AdmissionWorkflowController::class)->notify($request);',
'updateCandidateDossier': 'return app(AdmissionWorkflowController::class)->legacySave($request);',
'uploadCandidateDocument': 'return app(AdmissionWorkflowController::class)->upload($request);',
'deleteCandidateDocument': 'return app(AdmissionWorkflowController::class)->withdraw($request);',
'toggleLockCandidateDossier': "\\App\\Support\\AdmissionAccess::review($request);\n        abort(422, 'Utilisez la revue du dossier et sa checklist de validation.');",
'extractDocumentDataOcr': 'return app(AdmissionWorkflowController::class)->startOcr($request);',
}
for name, body in methods.items(): replace_method(controller,name,'        '+body)
# These delegates have narrower PHP return types than some legacy declarations.
p=root/controller
t=p.read_text(); t=t.replace('public function scanEnvelopeQrCode(string $token): JsonResponse','public function scanEnvelopeQrCode(string $token): JsonResponse')
p.write_text(t)
for name, body in {'exportRecepisseTafemPdf':'receipt','exportTafemDeliberationPdf':'list'}.items():
    replace_method('backend/app/Http/Controllers/Api/PdfExportController.php',name,f'        return app(AdmissionWorkflowPdfController::class)->{body}($request);')
replace_method('backend/app/Http/Controllers/Api/TafemMinistryImportController.php','importMinistryList', '        return app(AdmissionWorkflowController::class)->previewImport($request);')

# Bounded process execution for every active local OCR subprocess.
for name in ['TesseractEngine','PdfTextEngine','PdfBinaryEngine']:
    p=root/f'backend/app/OCR/Engines/{name}.php'; t=p.read_text(); t=t.replace('@exec(', '\\App\\OCR\\OcrProcess::run(')
    if name=='TesseractEngine':
        t=t.replace('array_slice(array_values($validScans), 0, 2)', "array_slice(array_values($validScans), 0, min(8, $this->config['max_pages']))")
        t=t.replace("'pdftoppm -png -r 200 -l 2 %s %s 2>/dev/null',", "'pdftoppm -png -r 200 -l %d %s %s 2>/dev/null',\n                min(8, $this->config['max_pages']),")
        t=t.replace('array_slice($pages, 0, 2)', "array_slice($pages, 0, min(8, $this->config['max_pages']))")
        t=t.replace("'max_pages' => 1", "'max_pages' => 2")
    p.write_text(t)

p=root/'backend/app/Services/AI/LocalOcrService.php'; t=p.read_text();
t=t.replace("$identifier.'_'.$modifiedTime.'_'.$fileSize.'_'.$docType", "hash_file('sha256', $filePath).'_'.$docType.'_parsers-v2_'.(auth()->id() ?? 'local')")
p.write_text(t)
p=root/'backend/app/Services/AI/GeminiApiService.php'; t=p.read_text(); t=t.replace('Http::withoutVerifying()', 'Http::connectTimeout(3)')
# Never log decoded document data or provider response bodies.
t=re.sub(r'(Log::info\([^;\n]*), \$decodedG?\);', r'\1);',t)
t=t.replace("$response->body()", "'provider_error'").replace("$resG->body()", "'provider_error'")
t=t.replace("$errBody", "'provider_error'") if False else t
# Remove logging contexts even if variable names differ in future branches.
t=re.sub(r'(Log::info\([^;\n]*), \$decoded[A-Za-z]*\);',r'\1);',t)
p.write_text(t)

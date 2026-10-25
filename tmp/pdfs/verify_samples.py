import hashlib
import json
import re
from pathlib import Path
from pypdf import PdfReader
import pdfplumber

root = Path(__file__).parent / 'latest'
results = []
for path in sorted(root.glob('*.pdf')):
    reader = PdfReader(path)
    with pdfplumber.open(path) as document:
        page_texts = [page.extract_text() or '' for page in document.pages]
    identifier = re.search(r'\b\d{18}\b', str(reader.metadata.subject)).group()
    fonts = set()
    for index, page in enumerate(reader.pages):
        assert identifier in page_texts[index], f'Missing reference: {path}, page {index + 1}'
        for font in (page.get('/Resources', {}).get('/Font', {})).values():
            fonts.add(str(font.get_object().get('/BaseFont')))
    if path.stem == 'rapport-multipage':
        all_text = '\n'.join(page_texts)
        for number in range(1, 91):
            assert f'TEST-{number}' in all_text, f'Lost report row {number}'
    results.append({'file': path.name, 'pages': len(reader.pages), 'identifier': identifier,
                    'width_pt': float(reader.pages[0].mediabox.width), 'height_pt': float(reader.pages[0].mediabox.height),
                    'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'fonts': sorted(fonts)})
report = Path(__file__).parents[2] / 'docs/audits/2026-10-25/pdf-samples-qa.json'
report.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding='utf-8')
print(json.dumps(results, indent=2, ensure_ascii=False))

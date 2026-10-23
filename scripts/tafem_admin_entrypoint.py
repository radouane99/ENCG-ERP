from pathlib import Path
root=Path(__file__).resolve().parents[1]
(root/'frontend/src/features/admin/pages/AdminTafem.tsx').write_text("export { default } from '@features/admissions/components/AdmissionAdminWorkbench'\n",encoding='utf-8')

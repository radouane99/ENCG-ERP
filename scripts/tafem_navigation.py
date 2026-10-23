from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'frontend/src/app/routes/RootRouter.tsx'; t=p.read_text(encoding='utf-8')
t=t.replace('<RequireGuest><InscriptionPage /></RequireGuest>', '<InscriptionPage />')
t=t.replace('            <Route path="/admin/tafem" element={<AdminTafem />} />\n','')
needle='          <Route path="/dashboard" element={<DashboardRouter />} />'
t=t.replace(needle,needle+'''
          <Route element={<ProtectedRoute roles={[...ADMIN_ROLES, 'scolarite']} />}>
            <Route path="/admin/tafem" element={<AdminTafem />} />
          </Route>
          <Route path="/admissions/mon-dossier" element={<InscriptionPage editMode />} />''')
p.write_text(t,encoding='utf-8')
p=root/'frontend/src/features/public/pages/MonInscriptionPage.tsx'; p.write_text("export { default } from './InscriptionPage'\n",encoding='utf-8')
p=root/'backend/app/Services/AI/GeminiApiService.php'; t=p.read_text(encoding='utf-8'); t=t.replace('$e->getMessage()', "'processing_error'").replace('$ex->getMessage()', "'processing_error'").replace('$gResText->body()', "'provider_error'");p.write_text(t,encoding='utf-8')
p=root/'backend/app/Http/Controllers/Api/StudentController.php'; t=p.read_text(encoding='utf-8')
start=t.index('    public function getInscriptionStatusPublic('); end=t.index('    public function validatePhotoQuality', start)
t=t[:start]+'''    public function getInscriptionStatusPublic(Request $request): JsonResponse
    {
        $request->validate(['cne' => 'required|string', 'cin' => 'required|string']);
        return app(AdmissionWorkflowController::class)->admissibility($request);
    }

'''+t[end:];p.write_text(t,encoding='utf-8')

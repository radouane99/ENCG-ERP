from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'backend/tests/Audit/TafemDeepScanAuditTest.php'; t=p.read_text(encoding='utf-8')
t=t.replace('->assertForbidden();','->assertStatus(401);',4)
# The receipt is deliberately not public. Absence of a dossier must never fabricate a PDF.
t=t.replace("['Accept' => 'application/json'])->assertNotFound();", "['Accept' => 'application/json'])->assertForbidden();")
needle="        $app = $this->applicationOnly();\n        StudentDocument::create(['cne' => 'Z999999999'"
t=t.replace(needle,"        $app = $this->applicationOnly();\n        $owner = User::factory()->create(['institution_id' => 1]);\n        $app->update(['owner_user_id' => $owner->id]);\n        \\Laravel\\Sanctum\\Sanctum::actingAs($owner);\n        StudentDocument::create(['cne' => 'Z999999999'")
t=t.replace('// Audit probes: security assertions express required behavior; the import probe\n// characterizes an intentional account-takeover guard and the missing activation journey.', '// Regression guarantees from the audit. Dossier details now require an authenticated owner.\n// Existing personal accounts retain the account-takeover guard; activation has dedicated feature tests.')
p.write_text(t,encoding='utf-8')

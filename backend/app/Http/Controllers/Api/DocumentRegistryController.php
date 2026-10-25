<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PdfDocumentRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DocumentRegistryController extends Controller
{
    private function records(Request $request)
    {
        abort_unless($request->user()->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'institution_admin', 'director', 'scolarite']), 403);
        return PdfDocumentRecord::where('institution_id', $request->user()->institution_id);
    }
    public function index(Request $request)
    {
        $data = $request->validate(['identifier' => 'nullable|string|max:32|regex:/^[0-9]+$/', 'status' => 'nullable|in:pending,issued,revoked']);
        return response()->json($this->records($request)->when($data['identifier'] ?? null, fn ($q, $id) => $q->where('digital_identifier', $id))->when($data['status'] ?? null, fn ($q, $status) => $q->where('status', $status))->latest('id')->paginate(20));
    }
    public function download(Request $request, int $id)
    {
        $record = $this->records($request)->whereKey($id)->firstOrFail();
        abort_unless($record->status === 'issued' && $record->file_path, 409, 'Document indisponible ou retiré.');
        $bytes = Storage::disk('private')->get($record->file_path);
        abort_unless(hash_equals($record->file_sha256, hash('sha256', $bytes)), 409, 'Archive incohérente.');
        return response($bytes, 200, ['Content-Type' => 'application/pdf', 'Content-Disposition' => 'attachment; filename="'.$record->digital_identifier.'.pdf"']);
    }
    public function revoke(Request $request, int $id)
    {
        if (is_string($request->input('reason'))) { $request->merge(['reason' => trim($request->input('reason'))]); }
        $data = $request->validate(['reason' => 'required|string|min:10|max:2000']);
        DB::transaction(function () use ($request, $id, $data) {
            $record = $this->records($request)->whereKey($id)->lockForUpdate()->firstOrFail();
            if ($record->status === 'revoked') { return; }
            $record->update(['status' => 'revoked', 'revoked_at' => now(), 'revoked_by' => $request->user()->id, 'revocation_reason' => $data['reason']]);
            activity()->causedBy($request->user())->performedOn($record)->withProperties(['reason' => $data['reason']])->log('pdf_document_revoked');
        });
        return response()->json(['message' => 'Référence retirée. L’archive et son historique sont conservés.']);
    }
}

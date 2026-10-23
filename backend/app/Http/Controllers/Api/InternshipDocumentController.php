<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\InternshipDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Storage};
class InternshipDocumentController extends Controller
{
    public function download(Request $request, int $id) {
        $document = InternshipDocument::with('internship.student')->findOrFail($id); $this->authorize('view', $document->internship);
        $media = $document->getFirstMedia('internship_documents') ?? $document->getFirstMedia();
        abort_unless($media && $media->disk === 'private' && Storage::disk($media->disk)->exists($media->getPathRelativeToRoot()), 404, 'Document privé introuvable.');
        return Storage::disk('private')->download($media->getPathRelativeToRoot(), $media->file_name, ['Cache-Control' => 'private, no-store']);
    }
    public function review(Request $request, int $id) {
        $data = $request->validate(['status' => 'required|in:approved,rejected', 'feedback' => 'required|string|min:5|max:2000']);
        $document = DB::transaction(function () use ($request, $id, $data) {
            $document = InternshipDocument::with('internship.student')->whereKey($id)->lockForUpdate()->firstOrFail();
            \App\Support\InternshipAccess::stage($request->user(), $document->internship);
            $document->update($data); activity()->causedBy($request->user())->performedOn($document)->withProperties(['status' => $data['status']])->log('internship_document_reviewed'); return $document;
        });
        return response()->json(['success' => true, 'data' => $document]);
    }
}

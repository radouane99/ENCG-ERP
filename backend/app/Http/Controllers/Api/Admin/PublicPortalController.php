<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Admission\SavePublicPortalAction;
use App\Actions\Admission\UploadPublicPortalPdfAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admission\SavePublicPortalRequest;
use App\Models\Institution;
use App\Services\Admissions\PublicPortalContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PublicPortalController extends Controller
{
    private function authorizeStaff(Request $request): void
    {
        abort_unless($request->user() && ($request->user()->can('system.settings') || $request->user()->hasAnyRole(['admin', 'super-admin', 'super_admin', 'institution-admin', 'director'])), 403);
    }

    public function content(Request $request, PublicPortalContent $service)
    {
        return response()->json(['data' => $service->read(Institution::findOrFail(config('erp.institution_id', 1)))])->header('Cache-Control', 'no-store, private');
    }

    public function show(Request $request, PublicPortalContent $service)
    {
        $this->authorizeStaff($request);

        return response()->json(['data' => $service->read(Institution::findOrFail($request->user()->institution_id), true)]);
    }

    public function save(SavePublicPortalRequest $request, SavePublicPortalAction $action, PublicPortalContent $service)
    {
        return response()->json(['data' => $service->read($action->execute($request->user(), $request->validated()), true)]);
    }

    public function upload(Request $request)
    {
        $this->authorizeStaff($request);
        $request->validate(['file' => 'required|file|mimes:pdf|max:10240']);

        return response()->json(app(UploadPublicPortalPdfAction::class)->execute($request->user(), $request->file('file')), 201);
    }

    public function attachment(string $id, PublicPortalContent $service)
    {
        $institution = Institution::findOrFail(config('erp.institution_id', 1));
        $config = $institution->settings['public_portal'] ?? [];
        abort_unless(collect($config['announcements'] ?? [])->contains(fn ($item) => ($item['attachment_id'] ?? null) === $id && $service->visible($item)), 404);

        return $this->downloadAttachment($institution, $id);
    }

    public function preview(Request $request, string $id)
    {
        $this->authorizeStaff($request);

        return $this->downloadAttachment(Institution::findOrFail($request->user()->institution_id), $id);
    }

    private function downloadAttachment(Institution $institution, string $id)
    {
        $config = $institution->settings['public_portal'] ?? [];
        $file = $config['attachments'][$id] ?? null;
        abort_unless($file && Storage::disk('private')->exists($file['path']), 404);
        abort_if(isset($file['sha256']) && ! hash_equals($file['sha256'], hash('sha256', Storage::disk('private')->get($file['path']))), 409, 'Ce fichier ne correspond plus à la version publiée.');

        return Storage::disk('private')->download($file['path'], 'communique-'.$id.'.pdf', ['Content-Type' => 'application/pdf', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}

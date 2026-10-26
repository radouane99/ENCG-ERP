<?php

namespace App\Http\Controllers\Api\Admin;

use App\Actions\Admission\SavePublicPortalAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admission\SavePublicPortalRequest;
use App\Models\Institution;
use App\Services\Admissions\PublicPortalContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
        $file = $request->file('file'); $id = (string) Str::uuid();
        $path = $file->store('public-portal/'.$request->user()->institution_id, 'private');
        try {
            DB::transaction(function () use ($request, $file, $id, $path) {
                $institution = Institution::whereKey($request->user()->institution_id)->lockForUpdate()->firstOrFail();
                $settings = $institution->settings ?? [];
                abort_if(count($settings['public_portal']['attachments'] ?? []) >= 100, 422, 'Limite de fichiers atteinte. Contactez le service technique.');
                $settings['public_portal']['attachments'][$id] = ['path' => $path, 'name' => Str::limit(basename($file->getClientOriginalName()), 180, '')];
                $institution->settings = $settings; $institution->save();
                activity()->causedBy($request->user())->performedOn($institution)->withProperties(['attachment_id' => $id])->log('public_portal_pdf_uploaded');
            });
        } catch (\Throwable $failure) { Storage::disk('private')->delete($path); throw $failure; }
        return response()->json(['id' => $id, 'name' => basename($file->getClientOriginalName())], 201);
    }

    public function attachment(string $id, PublicPortalContent $service)
    {
        $institution = Institution::findOrFail(config('erp.institution_id', 1));
        $config = $institution->settings['public_portal'] ?? [];
        abort_unless(collect($config['announcements'] ?? [])->contains(fn ($item) => ($item['attachment_id'] ?? null) === $id && $service->visible($item)), 404);
        $file = $config['attachments'][$id] ?? null;
        abort_unless($file && Storage::disk('private')->exists($file['path']), 404);
        return Storage::disk('private')->download($file['path'], 'communique-'.$id.'.pdf', ['Content-Type' => 'application/pdf', 'Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }
}

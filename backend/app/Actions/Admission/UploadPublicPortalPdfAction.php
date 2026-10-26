<?php

namespace App\Actions\Admission;

use App\Models\Institution;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class UploadPublicPortalPdfAction
{
    public function execute(User $actor, UploadedFile $file): array
    {
        $id = (string) Str::uuid();
        $path = $file->store('public-portal/'.$actor->institution_id, 'private');
        abort_unless(is_string($path) && $path !== '', 503, 'Le PDF n’a pas pu être stocké. Réessayez plus tard.');
        $name = Str::limit(basename($file->getClientOriginalName()), 180, '');
        $sha256 = hash_file('sha256', $file->getRealPath());
        try {
            DB::transaction(function () use ($actor, $id, $path, $name, $sha256) {
                $institution = Institution::whereKey($actor->institution_id)->lockForUpdate()->firstOrFail();
                $settings = $institution->settings ?? [];
                abort_if(count($settings['public_portal']['attachments'] ?? []) >= 100, 422, 'Limite de fichiers atteinte. Contactez le service technique.');
                $settings['public_portal']['attachments'][$id] = ['path' => $path, 'name' => $name, 'sha256' => $sha256];
                $institution->settings = $settings;
                $institution->save();
                activity()->causedBy($actor)->performedOn($institution)->withProperties(['attachment_id' => $id])->log('public_portal_pdf_uploaded');
            });
        } catch (\Throwable $failure) {
            Storage::disk('private')->delete($path);
            throw $failure;
        }

        return ['id' => $id, 'name' => $name];
    }
}

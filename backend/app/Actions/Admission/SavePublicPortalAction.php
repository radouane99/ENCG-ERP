<?php

namespace App\Actions\Admission;

use App\Models\Institution;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class SavePublicPortalAction
{
    public function execute(User $actor, array $data): Institution
    {
        return DB::transaction(function () use ($actor, $data) {
            $institution = Institution::whereKey($actor->institution_id)->lockForUpdate()->firstOrFail();
            $settings = $institution->settings ?? [];
            $previous = $settings['public_portal'] ?? [];
            abort_unless((int) ($previous['revision'] ?? 0) === $data['revision'], 409, __('La page a été modifiée. Rechargez avant de réessayer.'));
            foreach ($data['guides'] as $route => &$guide) {
                $guide += ['instructions_ar' => $previous['guides'][$route]['instructions_ar'] ?? null];
            }
            unset($guide);

            $previousAnnouncements = collect($previous['announcements'] ?? [])->keyBy('id');
            foreach ($data['announcements'] as &$item) {
                $item['id'] ??= (string) Str::uuid();
                $previousItem = $previousAnnouncements->get($item['id'], []);
                if (! array_key_exists('title_ar', $item) && ! array_key_exists('body_ar', $item)) {
                    $item += array_intersect_key($previousItem, array_flip(['title_ar', 'body_ar']));
                }
                abort_if(! empty($item['attachment_id']) && ! isset($previous['attachments'][$item['attachment_id']]), 422, __('PDF inconnu pour cet établissement.'));
            }
            unset($item);
            $settings['public_portal'] = array_merge($previous, $data, ['revision' => $data['revision'] + 1]);
            $institution->settings = $settings;
            $institution->save();
            activity()->causedBy($actor)->performedOn($institution)->withProperties(['announcements' => count($data['announcements']), 'revision' => $data['revision'] + 1])->log('public_portal_updated');

            return $institution;
        });
    }
}

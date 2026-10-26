<?php

namespace App\Services\Admissions;

use App\Domain\Admission\AdmissionEntryRules;
use App\Models\Institution;

final class PublicPortalContent
{
    public function visible(array $item): bool
    {
        $today = now(config('admissions.timezone'))->toDateString();

        return ($item['status'] ?? 'draft') === 'published' && ! empty($item['starts_on']) && ! empty($item['ends_on']) && $today >= $item['starts_on'] && $today <= $item['ends_on'];
    }

    public function read(Institution $institution, bool $admin = false): array
    {
        $config = $institution->settings['public_portal'] ?? [];
        $announcements = collect($config['announcements'] ?? []);
        if (! $admin) {
            $announcements = $announcements->filter(fn ($item) => $this->visible($item));
        }

        return ['revision' => (int) ($config['revision'] ?? 0), 'timezone' => config('admissions.timezone'),
            'contact' => ['name' => $institution->name, 'address' => $institution->address, 'email' => $institution->email, 'phone' => $institution->phone, 'hours' => $config['hours'] ?? ''],
            'guides' => collect(['tafem', 'cnaem'])->mapWithKeys(fn ($route) => [$route => ['instructions' => $config['guides'][$route]['instructions'] ?? '', 'documents' => AdmissionEntryRules::documents($route), 'physical_checklist' => array_values(AdmissionEntryRules::physicalChecklist($route))]])->all(),
            'announcements' => $announcements->values()->map(fn ($item) => array_merge(collect($item)->only(['id', 'title', 'body', 'status', 'starts_on', 'ends_on', 'attachment_id'])->all(), ['starts_on' => $item['starts_on'] ?? '', 'ends_on' => $item['ends_on'] ?? '']))->all(),
        ] + ($admin ? ['attachments' => collect($config['attachments'] ?? [])->map(fn ($file, $id) => ['id' => $id, 'name' => $file['name']])->values()->all()] : []);
    }
}

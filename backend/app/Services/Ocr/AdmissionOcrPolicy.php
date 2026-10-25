<?php

namespace App\Services\Ocr;

use App\Models\Institution;

final class AdmissionOcrPolicy
{
    public static function enabled(int $institutionId): bool
    {
        $settings = Institution::findOrFail($institutionId)->settings ?? [];

        return (bool) ($settings['admissions']['ocr_cloud_enabled'] ?? config('admissions.ocr_cloud_enabled', false));
    }

    public static function configured(): bool
    {
        return (bool) ((config('services.groq.key') ?: config('services.groq.api_key')) && config('services.groq.model'));
    }

    public static function available(int $institutionId): bool
    {
        return self::enabled($institutionId) && self::configured();
    }
}

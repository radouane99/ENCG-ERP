<?php

namespace App\Services\Library;

use Illuminate\Support\Facades\Http;

class KohaLibraryClient
{
    /**
     * @return list<array<string, mixed>>
     */
    public function loansForStudent(?string $cne): array
    {
        $base = rtrim((string) config('services.koha.base_url'), '/');
        if ($base === '') {
            return [];
        }

        $response = Http::timeout(8)
            ->withToken((string) config('services.koha.api_key'))
            ->get($base.'/api/v1/patrons/loans', ['userid' => $cne]);

        if (! $response->successful()) {
            return [];
        }

        return $response->json('loans') ?? $response->json() ?? [];
    }
}

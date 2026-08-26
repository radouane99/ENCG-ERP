<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;

final class CandidateDossierGate
{
    /**
     * @var list<string>
     */
    public const STAFF_ROLES = [
        'admin',
        'super-admin',
        'institution-admin',
        'director',
        'department-head',
        'filiere-head',
        'finance-officer',
        'hr-officer',
    ];

    public static function isStaff(?User $user): bool
    {
        return $user !== null && $user->hasAnyRole(self::STAFF_ROLES);
    }

    /**
     * Public lookups must prove CNE + CIN. Staff may look up with one identifier.
     * Authenticated students are scoped to their own account by the caller.
     *
     * @return array{cne: string, cin: string}
     */
    public static function requireIdentity(Request $request, bool $forMutation = false): array
    {
        $user = $request->user();
        $cne = strtoupper(trim((string) ($request->input('cne') ?: $request->query('cne', ''))));
        $cin = strtoupper(trim((string) ($request->input('cin') ?: $request->query('cin', ''))));

        if (self::isStaff($user)) {
            return ['cne' => $cne, 'cin' => $cin];
        }

        if ($user && ! $forMutation) {
            return ['cne' => $cne, 'cin' => $cin];
        }

        if ($cne === '' || $cin === '') {
            abort(422, 'CNE et CIN sont requis pour accéder au dossier.');
        }

        return ['cne' => $cne, 'cin' => $cin];
    }

    public static function cinMatches(string $expectedCin, ?string $recordCin, ?string $userCin): bool
    {
        $expectedCin = strtoupper(trim($expectedCin));
        if ($expectedCin === '') {
            return false;
        }

        foreach ([$recordCin, $userCin] as $candidate) {
            if ($candidate !== null && strtoupper(trim($candidate)) === $expectedCin) {
                return true;
            }
        }

        return false;
    }
}

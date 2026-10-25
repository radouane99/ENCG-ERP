<?php

namespace App\Support;

use App\Models\Internship;
use App\Models\Soutenance;
use App\Models\User;

final class InternshipAccess
{
    public static function staff(User $user): bool
    {
        return $user->hasAnyRole(['super-admin', 'institution-admin', 'admin', 'director', 'department-head', 'filiere-head', 'pedagogy_officer']);
    }

    public static function query(User $user)
    {
        $q = Internship::whereHas('student', fn ($s) => $s->where('institution_id', $user->institution_id));
        if (! self::staff($user)) {
            $profile = $user->professor?->id ?? -1;
            $q->where(fn ($q) => $q->where('supervisor_id', $profile)->orWhereHas('soutenance', fn ($s) => $s->where('president_id', $profile)->orWhere('examiner_id', $profile)->orWhere('supervisor_id', $profile)));
        }

        return $q;
    }

    public static function stage(User $user, Internship $stage): void
    {
        abort_unless((int) $stage->student->institution_id === (int) $user->institution_id, 404);
        abort_unless(self::staff($user) || ($user->professor && (int) $stage->supervisor_id === (int) $user->professor->id), 403, 'Stage non affecté à cet enseignant.');
    }

    public static function defense(User $user, Soutenance $s): void
    {
        abort_unless($s->internship && (int) $s->internship->student->institution_id === (int) $user->institution_id, 404);
        abort_unless(self::staff($user) || ($user->professor && in_array((int) $user->professor->id, array_map('intval', [$s->president_id, $s->examiner_id, $s->supervisor_id]), true)), 403, 'Vous ne faites pas partie du jury.');
    }
}

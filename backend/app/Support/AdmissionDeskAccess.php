<?php

namespace App\Support;

use App\Models\Application;
use Illuminate\Support\Facades\DB;

final class AdmissionDeskAccess
{
    /** Call only while holding the application row lock, shared with ticket claims. */
    public static function assertAvailable(Application $app, int $userId): void
    {
        abort_if(DB::table('admission_desk_tickets')->where('application_id', $app->id)
            ->where('status', 'serving')->where('served_by', '!=', $userId)->exists(),
            409, 'Ce dossier est en cours de traitement par un autre agent. Libérez le passage ou attendez sa clôture.');
    }
}

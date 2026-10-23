<?php

namespace App\Services\Admissions;

use App\Jobs\SendAdmissionNotificationJob;
use App\Models\Application;
use Illuminate\Support\Facades\DB;

class AdmissionNotificationService
{
    public function queue(Application $app, string $type, ?string $activationToken = null): ?int
    {
        if (! filter_var($app->email, FILTER_VALIDATE_EMAIL) || str_ends_with(strtolower($app->email), '@candidat.tafem.ma')) return null;
        $id = DB::table('admission_notifications')->insertGetId(['application_id' => $app->id,
            'type' => $type, 'recipient' => $app->email, 'status' => 'queued', 'attempts' => 0,
            'created_at' => now(), 'updated_at' => now()]);
        DB::afterCommit(fn () => SendAdmissionNotificationJob::dispatch($id, $activationToken));
        return $id;
    }
}

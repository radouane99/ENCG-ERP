<?php

namespace App\Jobs;

use App\Mail\AdmissionWorkflowMail;
use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SendAdmissionNotificationJob implements ShouldQueue, ShouldBeEncrypted
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    public int $tries = 3;
    public int $timeout = 30;
    public function backoff(): array { return [15, 60, 120]; }
    public function __construct(public int $notificationId, public ?string $activationToken = null) {}
    public function handle(): void
    {
        $n = DB::table('admission_notifications')->find($this->notificationId);
        if (! $n || $n->status === 'sent') return;
        DB::table('admission_notifications')->where('id', $n->id)->increment('attempts');
        $app = Application::findOrFail($n->application_id);
        $base = rtrim(config('app.frontend_url', config('app.url')), '/');
        $link = $base.($this->activationToken ? '/inscription?activation='.rawurlencode($this->activationToken) : '/dashboard');
        Mail::to($n->recipient)->send(new AdmissionWorkflowMail($app->reference_number, $n->type, $link));
        DB::table('admission_notifications')->where('id', $n->id)->update(['status' => 'sent', 'sent_at' => now(), 'updated_at' => now()]);
    }
    public function failed(?\Throwable $e): void
    {
        DB::table('admission_notifications')->where('id', $this->notificationId)->update(['status' => 'failed', 'updated_at' => now()]);
    }
}

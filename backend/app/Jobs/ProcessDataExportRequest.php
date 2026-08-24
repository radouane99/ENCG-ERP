<?php

namespace App\Jobs;

use App\Models\DataExportRequest;
use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class ProcessDataExportRequest implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $exportRequestId) {}

    public function handle(): void
    {
        $request = DataExportRequest::with('user')->find($this->exportRequestId);
        if (! $request || $request->status !== 'pending') {
            return;
        }

        if (($request->request_type ?? 'access') !== 'access') {
            return;
        }

        $request->update(['status' => 'processing']);

        $user = $request->user;
        $student = $user ? Student::where('user_id', $user->id)->first() : null;

        $payload = [
            'exported_at' => now()->toIso8601String(),
            'legal_basis' => 'Loi 09-08 CNDP — droit d\'accès (art. 7)',
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'cin' => $user->cin,
                'phone' => $user->phone,
            ] : null,
            'student' => $student ? [
                'cne' => $student->cne,
                'student_number' => $student->student_number,
                'status' => $student->status,
            ] : null,
        ];

        $path = 'privacy/exports/'.$request->id.'.json';
        Storage::disk('local')->put($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        $request->update([
            'status' => 'completed',
            'file_path' => $path,
            'processed_at' => now(),
        ]);
    }
}

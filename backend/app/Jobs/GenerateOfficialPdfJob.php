<?php

namespace App\Jobs;

use App\Services\Documents\OfficialPdfFactory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class GenerateOfficialPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>  $data
     */
    public function __construct(
        public string $view,
        public array $data,
        public string $outputPath,
        public string $disk = 'local'
    ) {}

    public function handle(OfficialPdfFactory $factory): void
    {
        $pdf = $factory->make($this->view, $this->data);
        Storage::disk($this->disk)->put($this->outputPath, $pdf->output());
    }
}

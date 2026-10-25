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
    public ?int $documentInstitutionId = null;
    public ?int $documentActorId = null;

    /**
     * @param  array<string, mixed>  $data
     */
    public function __construct(
        public string $view,
        public array $data,
        public string $outputPath,
        public string $disk = 'local'
    ) {
        $this->documentInstitutionId = auth()->user()?->institution_id;
        $this->documentActorId = auth()->id();
    }

    public function handle(OfficialPdfFactory $factory): void
    {
        $pdf = $factory->make($this->view, $this->data);
        if ($pdf instanceof \App\Services\Documents\RegisteredPdf) {
            $pdf->withDocumentContext($this->documentInstitutionId, $this->documentActorId);
        }
        Storage::disk($this->disk)->put($this->outputPath, $pdf->output());
    }
}

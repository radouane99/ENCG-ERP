<?php

namespace App\Services\Admissions;

use App\Models\Application;
use App\Models\StudentDocument;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AdmissionPreregistrationService
{
    public function render(Application $app): Response
    {
        $app->load('campaign.institution', 'campaign.filiere');
        $photo = StudentDocument::where('application_id', $app->id)->where('type', 'photo')
            ->where('is_current', true)->whereNull('withdrawn_at')->first();
        $photoData = null;
        if ($photo && in_array($photo->mime_type, ['image/jpeg', 'image/png', 'image/webp'], true)) {
            $disk = Storage::disk($photo->storage_disk);
            if ($disk->exists($photo->file_path)) {
                // DomPDF cannot render WEBP reliably. Re-encode the privately stored image locally.
                $image = @imagecreatefromstring($disk->get($photo->file_path));
                if ($image !== false) {
                    ob_start();
                    imagepng($image);
                    $bytes = ob_get_clean();
                    imagedestroy($image);
                    $photoData = 'data:image/png;base64,'.base64_encode($bytes);
                }
            }
        }
        $dossierUrl = rtrim(config('app.frontend_url') ?: config('app.url'), '/').'/academic/enrollments?'.http_build_query([
            'campaign_id' => $app->admission_campaign_id, 'application_id' => $app->id, 'cne' => $app->cne,
        ]);
        $qrData = 'data:image/svg+xml;base64,'.base64_encode(QrCode::format('svg')->size(180)->margin(2)->generate($dossierUrl));

        return Pdf::loadView('pdf.admission-preregistration', compact('app', 'photoData', 'qrData'))
            ->setPaper('a4')->stream('Preinscription-'.$app->reference_number.'.pdf')->header('Cache-Control', 'private, no-store');
    }
}

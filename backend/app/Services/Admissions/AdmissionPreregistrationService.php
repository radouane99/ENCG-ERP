<?php

namespace App\Services\Admissions;

use App\Models\Application;
use App\Models\StudentDocument;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class AdmissionPreregistrationService
{
    private function resolvePhotoBase64(Application $app): ?string
    {
        $photo = StudentDocument::where('application_id', $app->id)
            ->where('type', 'photo')
            ->where('is_current', true)
            ->whereNull('withdrawn_at')
            ->first();

        if ($photo && in_array($photo->mime_type, ['image/jpeg', 'image/png', 'image/webp'], true)) {
            $disk = Storage::disk($photo->storage_disk);
            if ($disk->exists($photo->file_path)) {
                $image = @imagecreatefromstring($disk->get($photo->file_path));
                if ($image !== false) {
                    ob_start();
                    imagepng($image);
                    $bytes = ob_get_clean();
                    imagedestroy($image);

                    return 'data:image/png;base64,'.base64_encode((string) $bytes);
                }
            }
        }

        return null;
    }

    private function resolveLogoBase64(): string
    {
        foreach (['logo-encg.png', 'images/encg_logo.png', 'images/logo-encg.png', 'images/logo.png'] as $candidate) {
            $path = public_path($candidate);
            if (file_exists($path)) {
                $mime = str_ends_with($path, '.png') ? 'image/png' : 'image/jpeg';

                return "data:{$mime};base64,".base64_encode((string) file_get_contents($path));
            }
        }

        return '';
    }

    public function render(Application $app): Response
    {
        $app->load('campaign.institution', 'campaign.filiere');
        $photoData = $this->resolvePhotoBase64($app);
        $logoBase64 = $this->resolveLogoBase64();

        $dossierUrl = rtrim(config('app.frontend_url') ?: config('app.url'), '/').'/academic/enrollments?'.http_build_query([
            'campaign_id' => $app->admission_campaign_id,
            'application_id' => $app->id,
            'cne' => $app->cne,
        ]);

        $qrData = 'data:image/svg+xml;base64,'.base64_encode(
            (string) QrCode::format('svg')->size(160)->margin(0)->generate($dossierUrl)
        );

        return Pdf::loadView('pdf.admission-preregistration', compact('app', 'photoData', 'qrData', 'logoBase64'))
            ->setPaper('a4', 'portrait')
            ->stream('Preinscription-'.$app->reference_number.'.pdf')
            ->header('Cache-Control', 'private, no-store');
    }

    public function renderEngagement(Application $app): Response
    {
        $app->load('campaign.institution', 'campaign.filiere', 'campaign.academicYear');
        $photoBase64 = $this->resolvePhotoBase64($app);
        $logoBase64 = $this->resolveLogoBase64();

        $lastName = strtoupper((string) ($app->profile['last_name'] ?? $app->last_name));
        $firstName = strtoupper((string) ($app->profile['first_name'] ?? $app->first_name));
        $studentName = trim("{$lastName} {$firstName}");

        $entrySemester = $app->campaign->entry_semester ?? 1;
        $semesterLabels = [
            1 => '1ère année (TC)',
            3 => '2ème année',
            5 => '3ème année (Passerelle)',
            7 => '4ème année (Master / Cycle)',
        ];
        $semesterLabel = $semesterLabels[$entrySemester] ?? "Semestre S{$entrySemester}";

        $timestamp = now()->timezone('Africa/Casablanca')->format('d/m/Y H:i:s');
        $digitalHash = 'ENCG-ENG-'.strtoupper(substr(hash('sha256', "{$app->cne}|{$app->cin}|{$timestamp}|ENGAGEMENT_ENCG"), 0, 16));
        $verifyUrl = rtrim(config('app.frontend_url') ?: config('app.url'), '/').'/verify/document/'.$digitalHash;

        $qrSvg = (string) QrCode::size(100)->margin(0)->generate($verifyUrl);
        $qrBase64 = 'data:image/svg+xml;base64,'.base64_encode($qrSvg);

        $birthDate = ! empty($app->profile['birth_date'])
            ? Carbon::parse($app->profile['birth_date'])->format('d/m/Y')
            : '—';

        $data = [
            'studentName' => $studentName,
            'birthDate' => $birthDate,
            'birthCity' => $app->profile['birth_city'] ?? '—',
            'cin' => $app->cin,
            'cne' => $app->cne,
            'semester' => "S{$entrySemester}",
            'semesterLabel' => $semesterLabel,
            'filiere' => $app->campaign->filiere?->name ?? 'Deux années préparatoires (Tronc Commun)',
            'academicYear' => $app->campaign->academicYear?->label ?? (date('Y').' - '.(date('Y') + 1)),
            'currentDate' => now()->format('d/m/Y'),
            'digitalHash' => $digitalHash,
            'generationTimestamp' => $timestamp,
            'verifyUrl' => $verifyUrl,
            'qrBase64' => $qrBase64,
            'logoBase64' => $logoBase64,
            'photoBase64' => $photoBase64,
            'photoPath' => null,
        ];

        return Pdf::loadView('pdf.engagement', $data)
            ->setPaper('a4', 'portrait')
            ->stream('Engagement-'.$app->reference_number.'.pdf')
            ->header('Cache-Control', 'private, no-store');
    }

    public function renderMedical(Application $app): Response
    {
        $app->load('campaign.institution', 'campaign.filiere', 'campaign.academicYear');
        $photoBase64 = $this->resolvePhotoBase64($app);
        $logoBase64 = $this->resolveLogoBase64();

        $lastName = strtoupper((string) ($app->profile['last_name'] ?? $app->last_name));
        $firstName = strtoupper((string) ($app->profile['first_name'] ?? $app->first_name));

        $timestamp = now()->timezone('Africa/Casablanca')->format('d/m/Y H:i:s');
        $digitalHash = 'ENCG-MED-'.strtoupper(substr(hash('sha256', "{$app->cne}|MED|{$timestamp}"), 0, 16));
        $verifyUrl = rtrim(config('app.frontend_url') ?: config('app.url'), '/').'/verify/document/'.$digitalHash;

        $qrSvg = (string) QrCode::size(100)->margin(0)->generate($verifyUrl);
        $qrBase64 = 'data:image/svg+xml;base64,'.base64_encode($qrSvg);

        $fatherName = trim(($app->profile['father_first_name'] ?? '').' '.($app->profile['father_last_name'] ?? ''));
        if (empty($fatherName)) {
            $fatherName = $lastName.' (Père / Tuteur Légal)';
        }

        $motherName = trim(($app->profile['mother_first_name'] ?? '').' '.($app->profile['mother_last_name'] ?? ''));
        if (empty($motherName)) {
            $motherName = 'Tutrice Légale (Mère)';
        }

        $data = [
            'lastName' => $lastName,
            'firstName' => $firstName,
            'address' => $app->profile['address'] ?? '—',
            'phone' => $app->profile['phone'] ?? $app->phone ?? '—',
            'fatherName' => $fatherName,
            'motherName' => $motherName,
            'parentPhone' => $app->profile['father_phone'] ?? $app->profile['mother_phone'] ?? $app->profile['emergency_contact_phone'] ?? '—',
            'emergencyName' => $app->profile['emergency_contact_name'] ?? 'Père / Tuteur Légal',
            'emergencyPhone' => $app->profile['emergency_contact_phone'] ?? '—',
            'allergyType' => $app->profile['allergy_type'] ?? 'Néant',
            'hasFollowUp' => (bool) ($app->profile['has_medical_followup'] ?? false),
            'medication' => $app->profile['medication_used'] ?? 'Aucun',
            'doctorInfo' => $app->profile['treating_doctor_info'] ?? 'Médecin Examinateur',
            'academicYear' => $app->campaign->academicYear?->label ?? (date('Y').' - '.(date('Y') + 1)),
            'photoBase64' => $photoBase64,
            'digitalHash' => $digitalHash,
            'generationTimestamp' => $timestamp,
            'verifyUrl' => $verifyUrl,
            'qrBase64' => $qrBase64,
            'logoBase64' => $logoBase64,
            'cin' => $app->cin,
            'cne' => $app->cne,
        ];

        return Pdf::loadView('pdf.fiche_medicale', $data)
            ->setPaper('a4', 'portrait')
            ->stream('Fiche-Medicale-'.$app->reference_number.'.pdf')
            ->header('Cache-Control', 'private, no-store');
    }
}

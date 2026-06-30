<?php

declare(strict_types=1);

namespace App\Domain\Document\Services;

use App\Domain\Document\Models\DocumentRequest;
use App\Domain\Document\Models\GeneratedDocument;
use App\Domain\Document\Models\DocumentTemplate;
use App\Domain\Student\Models\Student;
use App\Domain\HR\Models\VacataireContract;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * PdfGeneratorService
 *
 * Generates professional, QR-verified PDF documents:
 * - Student enrollment certificates (attestation d'inscription)
 * - School certificates (certificat de scolarité)
 * - Transcripts (relevé de notes)
 * - Professor work certificates
 * - Internship agreements
 * - Vacataire payment orders
 */
class PdfGeneratorService
{
    /**
     * Generate a PDF document from a document request.
     */
    public function generateFromRequest(DocumentRequest $request): GeneratedDocument
    {
        $template = $request->documentTemplate;
        $user = $request->user;
        $lang = $request->language;

        // Build the template data context
        $data = $this->buildTemplateData($request, $template, $user, $lang);

        // Render PDF
        $pdfContent = $this->renderPdf($template, $data, $lang);

        // Generate verification token and QR code
        $token = Str::uuid()->toString();
        $verificationUrl = route('document.verify', $token);
        $qrPath = $this->generateQrCode($verificationUrl, $token);

        // Re-render with QR code embedded
        $data['qr_code_base64'] = base64_encode(file_get_contents(Storage::path($qrPath)));
        $data['verification_url'] = $verificationUrl;
        $data['reference_number'] = $request->reference_number;
        $pdfContent = $this->renderPdf($template, $data, $lang);

        // Store PDF
        $fileName = sprintf(
            'documents/%s/%s/%s.pdf',
            $request->institution_id,
            now()->format('Y/m'),
            $request->reference_number
        );

        Storage::disk('private')->put($fileName, $pdfContent);

        // Create generated document record
        return GeneratedDocument::create([
            'document_request_id' => $request->id,
            'file_path'           => $fileName,
            'verification_token'  => $token,
            'verification_url'    => $verificationUrl,
            'qr_code_path'        => $qrPath,
            'expires_at'          => now()->addYear(),
        ]);
    }

    /**
     * Build the data context for a document template.
     */
    private function buildTemplateData(
        DocumentRequest $request,
        DocumentTemplate $template,
        $user,
        string $lang
    ): array {
        $institution = $request->institution;
        $baseData = [
            'institution_name'    => $institution->name,
            'institution_name_ar' => $institution->name_ar,
            'institution_logo'    => $institution->logo_path ? Storage::url($institution->logo_path) : null,
            'director_name'       => $institution->director_name,
            'issue_date'          => now()->locale($lang === 'ar' ? 'ar_MA' : 'fr_MA')->isoFormat('LL'),
            'issue_date_ar'       => now()->locale('ar_MA')->isoFormat('LL'),
            'academic_year'       => $this->getCurrentAcademicYear(),
        ];

        // Student-specific data
        if ($template->type === 'student') {
            $student = Student::where('user_id', $user->id)->first();
            if ($student) {
                $baseData = array_merge($baseData, [
                    'student_name'       => $student->full_name,
                    'student_name_ar'    => $student->full_name_ar,
                    'student_number'     => $student->student_number,
                    'cne'                => $student->cne,
                    'birth_date'         => $student->birth_date?->locale('fr_MA')->isoFormat('LL'),
                    'birth_city'         => $student->birth_city,
                    'filiere'            => $student->currentPathway?->filiere?->name,
                    'filiere_ar'         => $student->currentPathway?->filiere?->name_ar,
                    'semester'           => $student->currentPathway?->current_semester,
                    'group'              => $student->currentPathway?->group?->name,
                    'academic_status'    => $student->status,
                ]);
            }
        }

        // Merge additional data from the request
        return array_merge($baseData, $request->additional_data ?? []);
    }

    /**
     * Render PDF using DomPDF from a Blade template.
     */
    private function renderPdf(DocumentTemplate $template, array $data, string $lang): string
    {
        $html = $lang === 'ar'
            ? ($template->html_template_ar ?? $template->html_template)
            : $template->html_template;

        // Replace placeholders {{variable}} with actual values
        foreach ($data as $key => $value) {
            $html = str_replace('{{' . $key . '}}', (string) ($value ?? ''), $html);
        }

        $pdf = Pdf::loadHTML($html)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'dpi'            => 150,
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'defaultFont'    => $lang === 'ar' ? 'DejaVu Sans' : 'Arial',
            ]);

        return $pdf->output();
    }

    /**
     * Generate QR code PNG and store it.
     */
    private function generateQrCode(string $url, string $token): string
    {
        $qrContent = QrCode::format('png')
            ->size(150)
            ->errorCorrection('H')
            ->generate($url);

        $path = "qrcodes/{$token}.png";
        Storage::disk('private')->put($path, $qrContent);
        return $path;
    }

    /**
     * Generate a vacataire payment order PDF for bank export.
     */
    public function generatePaymentOrder(VacataireContract $contract, array $payments): string
    {
        $data = [
            'institution_name' => $contract->institution->name,
            'academic_year'    => $this->getCurrentAcademicYear(),
            'vacataire_name'   => "{$contract->first_name} {$contract->last_name}",
            'rib_number'       => $contract->rib_number,
            'bank_name'        => $contract->bank_name,
            'module'           => $contract->module->name,
            'total_hours'      => collect($payments)->sum('total_hours'),
            'hourly_rate'      => $contract->hourly_rate,
            'gross_amount'     => collect($payments)->sum('gross_amount'),
            'net_amount'       => collect($payments)->sum('net_amount'),
        ];

        $html = view('pdf.payment-order', $data)->render();
        $pdf = Pdf::loadHTML($html)->setPaper('A4');

        $path = "payments/{$contract->institution_id}/" . Str::uuid() . ".pdf";
        Storage::disk('private')->put($path, $pdf->output());
        return $path;
    }

    private function getCurrentAcademicYear(): string
    {
        $year = now()->month >= 9 ? now()->year : now()->year - 1;
        return "{$year}-" . ($year + 1);
    }
}

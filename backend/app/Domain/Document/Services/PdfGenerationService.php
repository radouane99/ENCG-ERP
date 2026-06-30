<?php

namespace App\Domain\Document\Services;

use App\Models\DocumentRequest;
use App\Models\DocumentTemplate;
use App\Models\GeneratedDocument;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Str;

class PdfGenerationService
{
    /**
     * Generate a PDF based on a Document Request.
     * 
     * @param DocumentRequest $request
     * @return GeneratedDocument
     */
    public function generateForRequest(DocumentRequest $request): GeneratedDocument
    {
        $template = $request->template;
        $student = $request->student;
        $user = $student->user;

        // Generate a unique verification code and QR code
        $verificationCode = strtoupper(Str::random(12));
        $qrCodeData = route('verify.document', ['code' => $verificationCode]);
        $qrCodeImage = base64_encode(QrCode::format('svg')->size(100)->generate($qrCodeData));

        // Prepare data payload for the template engine
        $data = [
            'student_name' => $user->name,
            'student_cne' => $student->cne,
            'student_apogee' => $student->apogee_number,
            'filiere' => $student->filiere->name ?? 'N/A',
            'date_generated' => now()->format('d/m/Y'),
            'academic_year' => $student->institution->academicYears()->where('is_current', true)->first()->name ?? '2025/2026',
            'qr_code' => $qrCodeImage,
            'verification_code' => $verificationCode,
            'institution_name' => $student->institution->name ?? 'ENCG Fès',
        ];

        // Ensure the directory exists
        $directory = 'documents/' . now()->format('Y/m');
        if (!Storage::disk('local')->exists($directory)) {
            Storage::disk('local')->makeDirectory($directory);
        }

        // Generate the PDF from a blade view string (using the template's HTML content)
        // Note: For advanced scenarios, we can parse HTML tags here.
        $pdf = Pdf::loadView('pdf.dynamic_template', [
            'html_content' => $this->parseVariables($template->html_content, $data)
        ]);

        $fileName = sprintf('%s_%s_%s.pdf', 
            Str::slug($template->name), 
            $student->cne, 
            now()->timestamp
        );

        $filePath = $directory . '/' . $fileName;

        // Store the file securely (can be moved to S3 / MinIO later)
        Storage::disk('local')->put($filePath, $pdf->output());

        // Create the Generated Document record
        $generatedDocument = GeneratedDocument::create([
            'document_request_id' => $request->id,
            'student_id' => $student->id,
            'template_id' => $template->id,
            'file_path' => $filePath,
            'verification_code' => $verificationCode,
            'generated_at' => now(),
            'expires_at' => now()->addMonths(3), // Attestations expire in 3 months
        ]);

        // Update the request status
        $request->update(['status' => 'approved']);

        return $generatedDocument;
    }

    /**
     * Parse and replace placeholder variables in the HTML content.
     *
     * @param string $content
     * @param array $data
     * @return string
     */
    private function parseVariables(string $content, array $data): string
    {
        foreach ($data as $key => $value) {
            // Replace placeholders like {{ student_name }}
            $content = preg_replace('/\{\{\s*' . preg_quote($key) . '\s*\}\}/', $value, $content);
        }
        return $content;
    }
}

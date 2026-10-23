<?php
namespace App\Http\Controllers\Api\Admin;
use App\Domain\Deliberation\LmdRules;
use App\Http\Controllers\Controller;
use App\Models\{AcademicYear, Institution};
use Illuminate\Http\{JsonResponse, Request};
use Illuminate\Support\Facades\{DB, Mail};
class InstitutionSettingsController extends Controller
{
    private function authorizeStaff(Request $request): void { abort_unless($request->user() && ($request->user()->can('system.settings') || $request->user()->hasAnyRole(['admin', 'super-admin', 'institution-admin', 'director'])), 403); }
    public function getSettings(Request $request): JsonResponse
    {
        $this->authorizeStaff($request); $institution = Institution::findOrFail($request->user()->institution_id); $settings = $institution->settings ?? [];
        return response()->json(['success' => true, 'institution' => ['id' => $institution->id, 'institutionName' => $institution->name, 'nameAr' => $institution->name_ar,
            'universityName' => $settings['university_name'] ?? '', 'directorName' => $institution->director_name, 'rectorName' => $institution->rector_name,
            'officialEmail' => $institution->email, 'supportPhone' => $institution->phone, 'address' => $institution->address, 'websiteUrl' => $institution->website,
            'cndpDeclaration' => $settings['cndp_declaration'] ?? '', 'passingGrade' => LmdRules::VALIDATION_THRESHOLD, 'eliminatoryGrade' => LmdRules::ELIMINATORY_THRESHOLD],
            'academic_year' => AcademicYear::where('institution_id', $institution->id)->where('is_current', true)->first(['id', 'label', 'is_locked']),
            'runtime' => ['mailer' => config('mail.default'), 'mail_from' => config('mail.from.address'), 'maintenance_mode' => app()->isDownForMaintenance(), 'token_expiration_minutes' => config('sanctum.expiration'), 'backup_self_service' => false],
            'academic_rules' => ['validation_threshold' => LmdRules::VALIDATION_THRESHOLD, 'eliminatory_threshold' => LmdRules::ELIMINATORY_THRESHOLD, 'paid_filiere_types' => LmdRules::PAID_FILIERE_TYPES]]);
    }
    public function updateSettings(Request $request): JsonResponse
    {
        $this->authorizeStaff($request);
        $validated = $request->validate(['institutionName' => 'sometimes|required|string|max:255', 'nameAr' => 'nullable|string|max:255', 'universityName' => 'nullable|string|max:255',
            'directorName' => 'nullable|string|max:255', 'rectorName' => 'nullable|string|max:255', 'officialEmail' => 'nullable|email|max:255', 'supportPhone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:1000', 'websiteUrl' => 'nullable|url|max:255', 'cndpDeclaration' => 'nullable|string|max:255', 'selectedYearId' => 'prohibited',
            'passingGrade' => 'prohibited', 'eliminatoryGrade' => 'prohibited', 'maintenanceMode' => 'prohibited', 'sessionTimeoutMinutes' => 'prohibited']);
        DB::transaction(function () use ($request, $validated) {
            $institution = Institution::whereKey($request->user()->institution_id)->lockForUpdate()->firstOrFail();
            foreach (['institutionName' => 'name', 'nameAr' => 'name_ar', 'directorName' => 'director_name', 'rectorName' => 'rector_name', 'officialEmail' => 'email', 'supportPhone' => 'phone', 'address' => 'address', 'websiteUrl' => 'website'] as $input => $column) if (array_key_exists($input, $validated)) $institution->$column = $validated[$input];
            $settings = $institution->settings ?? [];
            foreach (['universityName' => 'university_name', 'cndpDeclaration' => 'cndp_declaration'] as $input => $key) if (array_key_exists($input, $validated)) $settings[$key] = $validated[$input];
            $institution->settings = $settings; $institution->save(); activity()->causedBy($request->user())->performedOn($institution)->withProperties(['fields' => array_keys($validated)])->log('institution_profile_updated');
        });
        return $this->getSettings($request);
    }
    public function testResendEmail(Request $request): JsonResponse
    {
        $this->authorizeStaff($request); $email = $request->user()->email; abort_unless($email, 422, 'Votre compte ne possède pas d’adresse email.');
        Mail::to($email)->send(new \App\Mail\SystemTestMail($request->user()->name));
        return response()->json(['success' => true, 'message' => 'Message de test remis au transport '.config('mail.default').' pour votre adresse. La livraison doit être vérifiée dans votre boîte de réception.']);
    }
}
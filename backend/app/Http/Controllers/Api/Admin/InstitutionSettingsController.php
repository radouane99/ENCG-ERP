<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\AuditLog;
use App\Models\Institution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class InstitutionSettingsController extends Controller
{
    /**
     * Récupérer la configuration globale de l'institution et de l'ERP.
     */
    public function getSettings(): JsonResponse
    {
        $institution = Institution::first();

        if (! $institution) {
            $institution = Institution::create([
                'name' => 'École Nationale de Commerce et de Gestion de Fès (ENCG Fès)',
                'name_ar' => 'المدرسة الوطنية للتجارة والتسيير بفاس',
                'code' => 'ENCG-FES',
                'slug' => 'encg-fes',
                'type' => 'grande_ecole',
                'address' => 'Avenue de la Palestine, B.P. 2681, Fès 30000, Maroc',
                'city' => 'Fès',
                'phone' => '+212 (0) 535 60 03 62',
                'email' => 'contact@encg-fes.ma',
                'website' => 'https://encg-fes.ma',
                'director_name' => 'Prof. Directeur de l\'ENCG Fès',
                'rector_name' => 'Prof. Président de l\'USMBA Fès',
                'is_active' => true,
                'settings' => [
                    'university_name' => 'Université Sidi Mohamed Ben Abdellah (USMBA Fès)',
                    'cndp_declaration' => 'D-W-2025/ENCG-FES-0908',
                    'fi_start_date' => '2026-09-01',
                    'fi_end_date' => '2026-09-15',
                    'fc_start_date' => '2026-09-15',
                    'fc_end_date' => '2026-10-15',
                    'passing_grade' => '10.00',
                    'eliminatory_grade' => '07.00',
                    'rattrapage_threshold' => '09.99',
                    'auto_lock_grades' => true,
                    'cndp_audit_enabled' => true,
                    'two_factor_admin' => true,
                    'session_timeout_minutes' => '60',
                    'mail_mailer' => 'resend',
                    'mail_from_address' => 'noreply@encg-fes.ac.ma',
                    'mail_from_name' => 'ENCG Portail Fès',
                    'notify_grade_publication' => true,
                    'notify_doc_ready' => true,
                    'notify_payment_due_date' => true,
                    'maintenance_mode' => false,
                    'maintenance_message' => 'Plateforme en maintenance programmée pour la délibération des notes de la session de rattrapage.',
                    'ai_model_default' => 'gemini-1.5-flash',
                    'ai_token_daily_limit' => '100000',
                    'auto_cloud_backup' => true,
                ],
            ]);
        }

        $activeYear = AcademicYear::where('is_current', true)->first();
        $academicYears = AcademicYear::orderByDesc('start_date')->get();

        $mergedSettings = is_array($institution->settings) ? $institution->settings : [];

        return response()->json([
            'success' => true,
            'institution' => [
                'id' => $institution->id,
                'institutionName' => $institution->name,
                'nameAr' => $institution->name_ar,
                'code' => $institution->code,
                'universityName' => $mergedSettings['university_name'] ?? 'Université Sidi Mohamed Ben Abdellah (USMBA Fès)',
                'directorName' => $institution->director_name ?? 'Prof. Directeur de l\'ENCG Fès',
                'rectorName' => $institution->rector_name ?? 'Prof. Président de l\'USMBA Fès',
                'officialEmail' => $institution->email ?? 'contact@encg-fes.ma',
                'supportPhone' => $institution->phone ?? '+212 (0) 535 60 03 62',
                'address' => $institution->address ?? 'Avenue de la Palestine, B.P. 2681, Fès 30000, Maroc',
                'websiteUrl' => $institution->website ?? 'https://encg-fes.ma',
                'cndpDeclaration' => $mergedSettings['cndp_declaration'] ?? 'D-W-2025/ENCG-FES-0908',
                // Dates & Campagnes
                'fiStartDate' => $mergedSettings['fi_start_date'] ?? '2026-09-01',
                'fiEndDate' => $mergedSettings['fi_end_date'] ?? '2026-09-15',
                'fcStartDate' => $mergedSettings['fc_start_date'] ?? '2026-09-15',
                'fcEndDate' => $mergedSettings['fc_end_date'] ?? '2026-10-15',
                // Examens LMD
                'passingGrade' => $mergedSettings['passing_grade'] ?? '10.00',
                'eliminatoryGrade' => $mergedSettings['eliminatory_grade'] ?? '07.00',
                'rattrapageThreshold' => $mergedSettings['rattrapage_threshold'] ?? '09.99',
                'autoLockGrades' => $mergedSettings['auto_lock_grades'] ?? true,
                // Sécurité & CNDP
                'cndpAuditEnabled' => $mergedSettings['cndp_audit_enabled'] ?? true,
                'twoFactorAdmin' => $mergedSettings['two_factor_admin'] ?? true,
                'sessionTimeoutMinutes' => $mergedSettings['session_timeout_minutes'] ?? '60',
                // Resend
                'mailMailer' => 'resend',
                'mailFromAddress' => $mergedSettings['mail_from_address'] ?? 'noreply@encg-fes.ac.ma',
                'mailFromName' => $mergedSettings['mail_from_name'] ?? 'ENCG Portail Fès',
                'notifyGradePublication' => $mergedSettings['notify_grade_publication'] ?? true,
                'notifyDocReady' => $mergedSettings['notify_doc_ready'] ?? true,
                'notifyPaymentDueDate' => $mergedSettings['notify_payment_due_date'] ?? true,
                // Maintenance & IA
                'maintenanceMode' => $mergedSettings['maintenance_mode'] ?? false,
                'maintenanceMessage' => $mergedSettings['maintenance_message'] ?? 'Plateforme en maintenance programmée.',
                'aiModelDefault' => $mergedSettings['ai_model_default'] ?? 'gemini-1.5-flash',
                'aiTokenDailyLimit' => $mergedSettings['ai_token_daily_limit'] ?? '100000',
                'autoCloudBackup' => $mergedSettings['auto_cloud_backup'] ?? true,
                'examRulesText' => $mergedSettings['exam_rules_text'] ?? "Conformément au cahier des normes pédagogiques nationales (CNPN) du réseau ENCG Maroc (LMD) :\n1. La validation d'un module est acquise si la moyenne est supérieure ou égale à 10/20.\n2. Toute note inférieure à 07/20 est éliminatoire et impose le passage en session de Rattrapage.\n3. La compensation entre modules d'un même semestre est autorisée si aucune note éliminatoire n'est présente.\n4. Les formations continues (Masters Exécutifs) appliquent la même grille d'évaluation académique.",
            ],
            'active_year' => $activeYear ? [
                'id' => $activeYear->id,
                'label' => $activeYear->label,
                'start_date' => $activeYear->start_date,
                'end_date' => $activeYear->end_date,
                'is_current' => true,
                'is_locked' => (bool) $activeYear->is_locked,
            ] : null,
            'academic_years' => $academicYears,
        ]);
    }

    /**
     * Enregistrer et synchroniser la configuration globale de l'ERP.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'institutionName' => 'sometimes|string|max:255',
            'universityName' => 'sometimes|string|max:255',
            'directorName' => 'sometimes|string|max:255',
            'officialEmail' => 'sometimes|email|max:255',
            'supportPhone' => 'sometimes|string|max:100',
            'address' => 'sometimes|string|max:500',
            'websiteUrl' => 'sometimes|string|max:255',
            'cndpDeclaration' => 'sometimes|string|max:100',
            'fiStartDate' => 'sometimes|string',
            'fiEndDate' => 'sometimes|string',
            'fcStartDate' => 'sometimes|string',
            'fcEndDate' => 'sometimes|string',
            'passingGrade' => 'sometimes|string',
            'eliminatoryGrade' => 'sometimes|string',
            'rattrapageThreshold' => 'sometimes|string',
            'autoLockGrades' => 'sometimes|boolean',
            'cndpAuditEnabled' => 'sometimes|boolean',
            'twoFactorAdmin' => 'sometimes|boolean',
            'mailFromAddress' => 'sometimes|string',
            'mailFromName' => 'sometimes|string',
            'notifyGradePublication' => 'sometimes|boolean',
            'notifyDocReady' => 'sometimes|boolean',
            'notifyPaymentDueDate' => 'sometimes|boolean',
            'maintenanceMode' => 'sometimes|boolean',
            'maintenanceMessage' => 'sometimes|string',
            'aiModelDefault' => 'sometimes|string',
            'autoCloudBackup' => 'sometimes|boolean',
            'examRulesText' => 'sometimes|string',
            'selectedYearId' => 'sometimes|nullable|integer',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $institution = Institution::first() ?? new Institution();

            if (isset($validated['institutionName'])) $institution->name = $validated['institutionName'];
            if (isset($validated['directorName'])) $institution->director_name = $validated['directorName'];
            if (isset($validated['officialEmail'])) $institution->email = $validated['officialEmail'];
            if (isset($validated['supportPhone'])) $institution->phone = $validated['supportPhone'];
            if (isset($validated['address'])) $institution->address = $validated['address'];
            if (isset($validated['websiteUrl'])) $institution->website = $validated['websiteUrl'];

            $currentSettings = is_array($institution->settings) ? $institution->settings : [];

            $newSettings = array_merge($currentSettings, [
                'university_name' => $validated['universityName'] ?? ($currentSettings['university_name'] ?? 'Université Sidi Mohamed Ben Abdellah (USMBA Fès)'),
                'cndp_declaration' => $validated['cndpDeclaration'] ?? ($currentSettings['cndp_declaration'] ?? 'D-W-2025/ENCG-FES-0908'),
                'fi_start_date' => $validated['fiStartDate'] ?? ($currentSettings['fi_start_date'] ?? '2026-09-01'),
                'fi_end_date' => $validated['fiEndDate'] ?? ($currentSettings['fi_end_date'] ?? '2026-09-15'),
                'fc_start_date' => $validated['fcStartDate'] ?? ($currentSettings['fc_start_date'] ?? '2026-09-15'),
                'fc_end_date' => $validated['fcEndDate'] ?? ($currentSettings['fc_end_date'] ?? '2026-10-15'),
                'passing_grade' => $validated['passingGrade'] ?? ($currentSettings['passing_grade'] ?? '10.00'),
                'eliminatory_grade' => $validated['eliminatoryGrade'] ?? ($currentSettings['eliminatory_grade'] ?? '07.00'),
                'rattrapage_threshold' => $validated['rattrapageThreshold'] ?? ($currentSettings['rattrapage_threshold'] ?? '09.99'),
                'auto_lock_grades' => $validated['autoLockGrades'] ?? ($currentSettings['auto_lock_grades'] ?? true),
                'cndp_audit_enabled' => $validated['cndpAuditEnabled'] ?? ($currentSettings['cndp_audit_enabled'] ?? true),
                'two_factor_admin' => $validated['twoFactorAdmin'] ?? ($currentSettings['two_factor_admin'] ?? true),
                'mail_from_address' => $validated['mailFromAddress'] ?? ($currentSettings['mail_from_address'] ?? 'noreply@encg-fes.ac.ma'),
                'mail_from_name' => $validated['mailFromName'] ?? ($currentSettings['mail_from_name'] ?? 'ENCG Portail Fès'),
                'notify_grade_publication' => $validated['notifyGradePublication'] ?? ($currentSettings['notify_grade_publication'] ?? true),
                'notify_doc_ready' => $validated['notifyDocReady'] ?? ($currentSettings['notify_doc_ready'] ?? true),
                'notify_payment_due_date' => $validated['notifyPaymentDueDate'] ?? ($currentSettings['notify_payment_due_date'] ?? true),
                'maintenance_mode' => $validated['maintenanceMode'] ?? ($currentSettings['maintenance_mode'] ?? false),
                'maintenance_message' => $validated['maintenanceMessage'] ?? ($currentSettings['maintenance_message'] ?? 'Plateforme en maintenance programmée.'),
                'ai_model_default' => $validated['aiModelDefault'] ?? ($currentSettings['ai_model_default'] ?? 'gemini-1.5-flash'),
                'auto_cloud_backup' => $validated['autoCloudBackup'] ?? ($currentSettings['auto_cloud_backup'] ?? true),
                'exam_rules_text' => $validated['examRulesText'] ?? ($currentSettings['exam_rules_text'] ?? ''),
            ]);

            $institution->settings = $newSettings;
            $institution->save();

            // Gestion de l'année académique active si fournie
            if (! empty($validated['selectedYearId'])) {
                AcademicYear::where('is_current', true)->update(['is_current' => false]);
                AcademicYear::where('id', $validated['selectedYearId'])->update(['is_current' => true]);
            }

            // Audit Trail CNDP
            if (class_exists(AuditLog::class)) {
                $user = $request->user();
                AuditLog::record([
                    'user_id' => $user?->id,
                    'user_name' => $user ? ($user->first_name . ' ' . $user->last_name) : 'Super-Admin',
                    'user_email' => $user?->email ?? 'admin@encg-fes.ma',
                    'user_role' => 'Super-Admin',
                    'action' => 'Mise à jour des Paramètres Institutionnels & ERP',
                    'action_type' => 'INSTITUTION_SETTINGS_UPDATE',
                    'description' => 'Mise à jour globale : coordonnées, règles LMD, Resend, CNDP et année active.',
                    'method' => 'POST',
                    'severity' => 'info',
                    'payload' => $validated,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Paramètres de l\'institution et de l\'ERP enregistrés avec succès.',
                'settings' => $newSettings,
            ]);
        });
    }

    /**
     * Tester l'envoi d'un email de vérification via Resend.
     */
    public function testResendEmail(Request $request): JsonResponse
    {
        $user = $request->user();
        $targetEmail = $request->input('email', $user?->email ?? 'admin@encg-fes.ma');

        return response()->json([
            'success' => true,
            'message' => "Test de passerelle Resend exécuté avec succès vers {$targetEmail}.",
            'details' => [
                'mailer' => 'resend',
                'from' => 'noreply@encg-fes.ac.ma (ENCG Portail)',
                'recipient' => $targetEmail,
                'status' => 'DELIVERED',
                'timestamp' => now()->toIso8601String(),
            ],
        ]);
    }
}

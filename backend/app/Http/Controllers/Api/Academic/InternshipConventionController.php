<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Models\Internship;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InternshipConventionController extends Controller
{
    public function adminIndex(Request $request)
    {
        abort_unless(\App\Support\InternshipAccess::staff($request->user()) || $request->user()->hasRole('scolarite'), 403);
        return response()->json(['success' => true, 'data' => Internship::whereHas('student', fn ($q) => $q->where('institution_id', $request->user()->institution_id))->with('student.user', 'supervisor.user')->latest()->paginate(50)]);
    }
    /**
     * Liste des conventions de stage de l'étudiant connecté.
     */
    public function studentIndex(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::where('user_id', $user->id)->first();
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $internships = Internship::where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $internships,
        ]);
    }

    /**
     * Dépôt d'une demande de convention de stage tripartite.
     */
    public function studentStore(Request $request): JsonResponse
    {
        $user = $request->user();
        $student = Student::where('user_id', $user->id)->first();
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Profil étudiant introuvable.'], 403);
        }

        $validated = $request->validate([
            'type' => 'required|in:initiation,application,fin_etudes,pfe',
            'company_name' => 'required|string|max:255',
            'company_address' => 'nullable|string|max:255',
            'company_city' => 'nullable|string|max:100',
            'company_mentor_name' => 'required|string|max:255',
            'company_mentor_title' => 'nullable|string|max:255',
            'supervisor_email' => 'required|email|max:255',
            'supervisor_phone' => 'nullable|string|max:50',
            'position_title' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'monthly_allowance' => 'nullable|numeric|min:0',
            'insurance_policy_number' => 'nullable|string|max:100',
        ]);

        $internship = app(\App\Actions\Internship\ManageConventionAction::class)->create($student, $validated);
        return response()->json(['success' => true, 'message' => 'Demande de convention enregistrée ; assurance et visa en attente de contrôle.', 'data' => $internship], 201);
    }
    public function reviewConvention(Request $request, int $id)
    {
        $data = $request->validate(['insurance_policy_number' => 'required|string|max:100', 'insurance_company' => 'required|string|max:180',
            'insurance_verified' => 'required|accepted', 'reason' => 'required|string|min:10|max:2000']);
        return response()->json(['success' => true] + app(\App\Actions\Internship\ManageConventionAction::class)->approve($request->user(), $id, $data));
    }
    public function companyPreview(string $token)
    {
        $s = app(\App\Actions\Internship\ManageConventionAction::class)->resolveToken($token);
        return response()->json(['reference' => $s->convention_ref, 'company' => $s->company_name, 'start_date' => $s->start_date->toDateString(), 'end_date' => $s->end_date->toDateString()]);
    }
    public function publicSignCompany(Request $request, string $token): JsonResponse
    {
        // Validate the invitation before any decision, including legacy/cancelled links.
        app(\App\Actions\Internship\ManageConventionAction::class)->resolveToken($token);
        $data = $request->validate(['name' => 'required|string|min:3|max:150', 'email' => 'required|email|max:255', 'consent' => 'required|accepted']);
        $s = app(\App\Actions\Internship\ManageConventionAction::class)->sign($token, $data);
        return response()->json(['success' => true, 'message' => 'Acceptation de l’entreprise enregistrée.', 'reference' => $s->convention_ref]);
    }
    public function downloadConventionPdf(Request $request, int $id)
    {
        $internship = Internship::with(['student.user', 'student.filiere'])->findOrFail($id);
        $user = $request->user();
        $isStaff = $user && $user->hasAnyRole(['admin', 'super-admin', 'director', 'institution-admin', 'pedagogy_officer', 'department_head']);
        if (! $isStaff) {
            $student = $user?->student;
            if (! $student || (int) $internship->student_id !== (int) $student->id) {
                abort(403, 'Accès non autorisé à cette convention de stage.');
            }
        }

        $student = $internship->student;
        abort_unless((int) $student->institution_id === (int) $user->institution_id, 404);

        $trackingCode = $internship->convention_ref ?? ('CONV-ENCG-'.date('Y').'-'.str_pad($id, 4, '0', STR_PAD_LEFT));
        $pdf = Pdf::loadView('pdf.convention_stage', [
            'internship' => $internship,
            'student' => $student,
            'conventionRef' => $trackingCode,
            'academicYear' => (string) (\App\Models\AcademicYear::find($internship->academic_year_id)?->label ?? 'Non renseignée'),
            'startDateStr' => $internship->start_date?->format('d/m/Y') ?? 'Non renseignée',
            'endDateStr' => $internship->end_date?->format('d/m/Y') ?? 'Non renseignée',
            'qrBase64' => '',
        ]);

        return $pdf->stream("Convention_Stage_{$trackingCode}.pdf", ['Attachment' => false]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\RecommendationLetterMail;
use App\Models\Grade;
use App\Models\RecommendationRequest;
use App\Models\Student;
use App\Models\User;
use App\Services\AI\GeminiApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class RecommendationLetterController extends Controller
{
    public function __construct(
        private GeminiApiService $gemini
    ) {}

    /**
     * Soumettre une demande de lettre de recommandation.
     */
    public function submitRequest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professor_id'    => 'required|integer',
            'purpose'         => 'required|string',
            'delivery_method' => 'nullable|string|in:platform,email,both',
        ]);

        $student = Student::with('user')->where('user_id', auth()->id())->first()
            ?? Student::with('user')->where('id', auth()->id())->firstOrFail();
        $avgGrade  = Grade::where('student_id', $student->id)->avg('value') ?? 13.5;
        $absences  = \App\Models\Attendance::where('student_id', $student->id)->count();
        $eligibilityScore = min(100, max(50, round(($avgGrade * 5) - ($absences * 2))));

        $profName = User::find($validated['professor_id'])?->name ?? 'Enseignant Chercheur';

        $prompt = "Rédige une lettre de recommandation pour {$student->user->name} (Moyenne : {$avgGrade}/20) à l'attention de Pr. {$profName} pour : {$validated['purpose']}.";
        $aiDraft = $this->gemini->generateContent($prompt, [
            "Tu es l'assistant de rédaction officielle de l'ENCG Fès.",
        ]) ?? "Nous recommandons vivement {$student->user->name} pour son excellence académique à l'ENCG Fès.";

        $requestId = RecommendationRequest::create([
            'student_id'              => $student->id,
            'professor_id'            => $validated['professor_id'],
            'purpose'                 => $validated['purpose'],
            'status'                  => 'pending',
            'ai_eligibility_score'    => "{$eligibilityScore}%",
            'ai_recommendation_text'  => $aiDraft,
            'delivery_method'         => $validated['delivery_method'] ?? 'both',
        ])->id;

        return response()->json([
            'success'           => true,
            'message'           => 'Demande soumise au professeur.',
            'request_id'        => $requestId,
            'eligibility_score' => "{$eligibilityScore}%",
        ]);
    }

    /**
     * Demandes de l'étudiant connecté.
     */
    public function getStudentRequests(): JsonResponse
    {
        $student = Student::where('user_id', auth()->id())->first();
        $studentId = $student ? $student->id : auth()->id();

        $requests = RecommendationRequest::with('professor')
            ->where('student_id', $studentId)
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id'              => $r->id,
                'purpose'         => $r->purpose,
                'status'          => $r->status,
                'professor_name'  => $r->professor->name ?? 'N/A',
                'ai_eligibility_score' => $r->ai_eligibility_score,
                'created_at'      => $r->created_at->format('d/m/Y'),
            ]);

        return response()->json(['success' => true, 'requests' => $requests]);
    }

    /**
     * Demandes reçues par le professeur connecté.
     */
    public function getProfessorRequests(): JsonResponse
    {
        $requests = RecommendationRequest::with(['student.user', 'student.latestPathway.filiere'])
            ->where('professor_id', auth()->id())
            ->orWhereNull('professor_id')
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id'              => $r->id,
                'student_name'    => $r->student?->user?->name ?? 'N/A',
                'student_email'   => $r->student?->user?->email ?? 'N/A',
                'filiere_name'    => $r->student?->latestPathway?->filiere?->name ?? 'N/A',
                'purpose'         => $r->purpose,
                'status'          => $r->status,
                'ai_eligibility_score' => $r->ai_eligibility_score,
                'ai_recommendation_text' => $r->ai_recommendation_text,
                'created_at'      => $r->created_at->format('d/m/Y'),
            ]);

        return response()->json(['success' => true, 'requests' => $requests]);
    }

    /**
     * Approuver et signer une lettre de recommandation.
     */
    public function approveRequest(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'letter_content'  => 'required|string',
            'delivery_method' => 'nullable|string|in:platform,email,both',
        ]);

        $rec = RecommendationRequest::with(['student.user', 'professor'])->findOrFail($id);

        $rec->update([
            'status'                  => 'approved',
            'ai_recommendation_text'  => $validated['letter_content'],
            'delivery_method'         => $validated['delivery_method'] ?? 'both',
            'signed_at'               => now(),
        ]);

        $method = $validated['delivery_method'] ?? 'both';
        if (in_array($method, ['email', 'both']) && $rec->student->user->email) {
            try {
                Mail::to($rec->student->user->email)->send(new RecommendationLetterMail(
                    $rec->student->user->name,
                    $rec->professor->name ?? 'Professeur ENCG Fès',
                    $validated['letter_content'],
                    $rec->purpose
                ));
            } catch (\Exception $e) {
                Log::warning('Email lettre de recommandation échoué : ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Lettre signée et envoyée à l\'étudiant.',
        ]);
    }
}
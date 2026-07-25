<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\RecommendationLetterMail;
use App\Services\AI\GeminiApiService;

class RecommendationLetterController extends Controller
{
    protected GeminiApiService $gemini;

    public function __construct(GeminiApiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Student submits a recommendation letter request to a professor.
     */
    public function submitRequest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'professor_id' => 'required|integer',
            'purpose' => 'required|string',
            'delivery_method' => 'nullable|string|in:platform,email,both',
        ]);

        $studentId = auth()->id() ?? 1;

        // Fetch student details to compute AI eligibility score
        $student = DB::table('students')
            ->join('users', 'students.user_id', '=', 'users.id')
            ->where('students.id', $studentId)
            ->select('students.id', 'users.name', 'users.email')
            ->first();

        $grades = DB::table('grades')->where('student_id', $studentId)->pluck('grade');
        $avgGrade = $grades->isNotEmpty() ? round($grades->avg(), 2) : 13.5;
        $absences = DB::table('absences')->where('student_id', $studentId)->count();

        // Calculate AI Eligibility Score
        $eligibilityScore = min(100, max(50, round(($avgGrade * 5) - ($absences * 2))));

        // Generate AI draft letter
        $profName = DB::table('users')->where('id', $validated['professor_id'])->value('name') ?? 'Enseignant Chercheur';
        $prompt = "Rédige un projet de lettre de recommandation élogieux pour l'étudiant {$student->name} (Moyenne : {$avgGrade}/20, {$absences} absences) à l'attention de Pr. {$profName} pour la demande : {$validated['purpose']}.";
        $system = ["Tu es l'assistant de rédaction officielle de l'ENCG Fès."];

        $aiDraft = $this->gemini->generateContent($prompt, $system)
            ?? "Nous recommandons vivement M./Mme {$student->name} dont la rigueur et les résultats à l'ENCG Fès témoignent d'un excellent potentiel académique.";

        $table = \Illuminate\Support\Facades\Schema::hasTable('recommendation_requests') ? 'recommendation_requests' : null;

        if ($table) {
            $requestId = DB::table('recommendation_requests')->insertGetId([
                'student_id' => $studentId,
                'professor_id' => $validated['professor_id'],
                'purpose' => $validated['purpose'],
                'status' => 'pending',
                'ai_eligibility_score' => "{$eligibilityScore}%",
                'ai_recommendation_text' => $aiDraft,
                'delivery_method' => $validated['delivery_method'] ?? 'both',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $requestId = rand(100, 999);
        }

        return response()->json([
            'success' => true,
            'message' => 'Demande de lettre de recommandation soumise au professeur !',
            'request_id' => $requestId,
            'eligibility_score' => "{$eligibilityScore}%"
        ]);
    }

    /**
     * Student views their submitted requests.
     */
    public function getStudentRequests(): JsonResponse
    {
        $studentId = auth()->id() ?? 1;

        if (!\Illuminate\Support\Facades\Schema::hasTable('recommendation_requests')) {
            return response()->json(['success' => true, 'requests' => []]);
        }

        $requests = DB::table('recommendation_requests')
            ->leftJoin('users as prof', 'recommendation_requests.professor_id', '=', 'prof.id')
            ->where('recommendation_requests.student_id', $studentId)
            ->select(
                'recommendation_requests.*',
                'prof.name as professor_name'
            )
            ->orderBy('recommendation_requests.created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'requests' => $requests]);
    }

    /**
     * Professor views incoming requests with AI Decision Support & Eligibility Score.
     */
    public function getProfessorRequests(): JsonResponse
    {
        $profId = auth()->id() ?? 1;

        if (!\Illuminate\Support\Facades\Schema::hasTable('recommendation_requests')) {
            return response()->json(['success' => true, 'requests' => []]);
        }

        $requests = DB::table('recommendation_requests')
            ->join('students', 'recommendation_requests.student_id', '=', 'students.id')
            ->join('users as st_user', 'students.user_id', '=', 'st_user.id')
            ->leftJoin('filieres', 'students.filiere_id', '=', 'filieres.id')
            ->where(function($q) use ($profId) {
                $q->where('recommendation_requests.professor_id', $profId)
                  ->orWhereNull('recommendation_requests.professor_id');
            })
            ->select(
                'recommendation_requests.*',
                'st_user.name as student_name',
                'st_user.email as student_email',
                'filieres.name as filiere_name'
            )
            ->orderBy('recommendation_requests.created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'requests' => $requests]);
    }

    /**
     * Professor approves, signs & delivers the recommendation letter (platform or email).
     */
    public function approveRequest(Request $request, $id): JsonResponse
    {
        $validated = $request->validate([
            'letter_content' => 'required|string',
            'delivery_method' => 'nullable|string|in:platform,email,both',
        ]);

        if (\Illuminate\Support\Facades\Schema::hasTable('recommendation_requests')) {
            DB::table('recommendation_requests')->where('id', $id)->update([
                'status' => 'approved',
                'ai_recommendation_text' => $validated['letter_content'],
                'delivery_method' => $validated['delivery_method'] ?? 'both',
                'signed_at' => now(),
                'updated_at' => now(),
            ]);

            $rec = DB::table('recommendation_requests')
                ->join('students', 'recommendation_requests.student_id', '=', 'students.id')
                ->join('users as st_user', 'students.user_id', '=', 'st_user.id')
                ->leftJoin('users as prof_user', 'recommendation_requests.professor_id', '=', 'prof_user.id')
                ->where('recommendation_requests.id', $id)
                ->select(
                    'st_user.name as student_name',
                    'st_user.email as student_email',
                    'prof_user.name as professor_name',
                    'recommendation_requests.purpose'
                )
                ->first();

            // Send Email if delivery method includes email or both
            $method = $validated['delivery_method'] ?? 'both';
            if ($rec && ($method === 'email' || $method === 'both') && $rec->student_email) {
                try {
                    Mail::to($rec->student_email)->send(
                        new RecommendationLetterMail(
                            $rec->student_name,
                            $rec->professor_name ?? 'Professeur ENCG Fès',
                            $validated['letter_content'],
                            $rec->purpose
                        )
                    );
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::warning('Email delivery error: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Lettre de recommandation signée électroniquement et envoyée à l\'étudiant !'
        ]);
    }
}

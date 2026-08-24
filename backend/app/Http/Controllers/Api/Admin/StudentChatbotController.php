<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\DocumentRequest;
use App\Models\EvaluationCampaign;
use App\Models\Student;
use App\Models\User;
use App\Services\AI\GeminiApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentChatbotController extends Controller
{
    public function __construct(
        private GeminiApiService $gemini
    ) {}

    /**
     * Chatbot étudiant via Gemini AI.
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'context' => 'nullable|string',
        ]);

        $userMessage = $request->input('message');
        $userId = auth()->id();
        $context = $this->buildRealDbContext($userId);

        $systemInstructions = [
            "Tu es l'Assistant Officiel de l'ENCG Fès.",
            'Tu réponds exclusivement en français, de manière professionnelle et concise.',
            'Contexte actuel : '.$context,
            'RÈGLES :',
            '- 2-3 phrases maximum.',
            '- Documents → Guichet Électronique.',
            '- Notes → Mes Notes & Résultats.',
            '- Absences → Justification sous 48h.',
            '- Stages/PFE → Mes Stages & PFE.',
            '- Si tu ne sais pas → scolarite@encg-fes.ma',
        ];

        $reply = $this->gemini->generateContent($userMessage, $systemInstructions);

        return response()->json([
            'success' => true,
            'reply' => $reply ?? 'Je suis désolé, je rencontre une difficulté technique. Contactez scolarite@encg-fes.ma',
        ]);
    }

    /**
     * Construit le contexte réel pour le prompt Gemini.
     */
    private function buildRealDbContext(?int $userId): string
    {
        try {
            $stats = [
                'total_students' => Student::count(),
                'total_professors' => User::where('role', 'professor')->count(),
                'active_year' => AcademicYear::where('is_current', true)->value('label') ?? '2025-2026',
                'open_document_requests' => DocumentRequest::where('status', 'pending')->count(),
                'evaluation_status' => EvaluationCampaign::where('status', 'OPEN')->exists() ? 'OUVERTE' : 'FERMÉE',
            ];

            $contextParts = [
                "Année académique : {$stats['active_year']}",
                "Étudiants inscrits : {$stats['total_students']}",
                "Professeurs : {$stats['total_professors']}",
                "Demandes en attente : {$stats['open_document_requests']}",
                "Campagne d'évaluation : {$stats['evaluation_status']}",
            ];

            if ($userId) {
                $student = Student::where('user_id', $userId)->first();
                if ($student) {
                    $studentName = User::where('id', $userId)->value('name');
                    $absences = Attendance::where('student_id', $student->id)->count();
                    $pending = DocumentRequest::where('student_id', $student->id)->where('status', 'pending')->count();

                    $contextParts[] = "Étudiant connecté : {$studentName}";
                    $contextParts[] = "Ses absences : {$absences}";
                    $contextParts[] = "Ses demandes en cours : {$pending}";
                }
            }

            return implode('. ', $contextParts).'.';
        } catch (\Exception $e) {
            return 'Établissement ENCG Fès — système ERP actif.';
        }
    }
}

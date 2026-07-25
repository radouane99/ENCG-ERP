<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AI\GeminiApiService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StudentChatbotController extends Controller
{
    protected GeminiApiService $gemini;

    public function __construct(GeminiApiService $gemini)
    {
        $this->gemini = $gemini;
    }

    /**
     * Handle student chatbot messages via Gemini AI with real DB context.
     */
    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'context' => 'nullable|string',
        ]);

        $userMessage = $request->input('message');
        $userId = auth()->id();

        // Build rich context from real DB data
        $context = $this->buildRealDbContext($userId);

        $systemInstructions = [
            "Tu es l'Assistant Officiel de l'ENCG Fès (École Nationale de Commerce et de Gestion de Fès).",
            "Tu réponds exclusivement en français, de manière professionnelle, concise et bienveillante.",
            "Tu aides les étudiants, professeurs et administrateurs sur tout ce qui concerne l'ENCG Fès.",
            "Voici le contexte réel de l'établissement en ce moment : " . $context,
            "RÈGLES IMPORTANTES:",
            "- Réponds en 2-3 phrases maximum sauf si une liste est nécessaire.",
            "- Pour les demandes de documents, oriente vers le Guichet Électronique (espace étudiant).",
            "- Pour les notes, oriente vers Mes Notes & Résultats.",
            "- Pour les absences, explique la procédure de justification (48h max).",
            "- Pour les stages/PFE, oriente vers Mes Stages & PFE.",
            "- Ne donne jamais d'informations confidentielles d'autres étudiants.",
            "- Si tu ne sais pas, oriente vers scolarite@encg-fes.ma",
        ];

        $reply = $this->gemini->generateContent($userMessage, $systemInstructions);

        return response()->json([
            'success' => true,
            'reply' => $reply ?? "Je suis désolé, je rencontre une difficulté technique. Veuillez contacter la scolarité à scolarite@encg-fes.ma",
        ]);
    }

    /**
     * Build real DB context to inject into Gemini prompt.
     */
    private function buildRealDbContext(?int $userId): string
    {
        try {
            $stats = [];

            $stats['total_students'] = DB::table('students')->count();
            $stats['total_professors'] = DB::table('users')->where('role', 'professor')->count();
            $stats['active_year'] = DB::table('academic_years')->where('is_active', true)->value('label') ?? 'S5-S6 2025-2026';
            $stats['open_document_requests'] = DB::table('document_requests')->where('status', 'pending')->count();
            $stats['evaluation_status'] = DB::table('evaluation_campaigns')->where('status', 'OPEN')->exists() ? 'OUVERTE' : 'FERMÉE';

            // If authenticated student, add personal context
            if ($userId) {
                $student = DB::table('students')->where('user_id', $userId)->first();
                if ($student) {
                    $stats['student_name'] = DB::table('users')->where('id', $userId)->value('name');
                    $stats['student_absences'] = DB::table('absences')->where('student_id', $student->id)->count();
                    $stats['student_pending_requests'] = DB::table('document_requests')
                        ->where('student_id', $student->id)->where('status', 'pending')->count();
                }
            }

            $contextParts = [];
            $contextParts[] = "Année académique active: " . $stats['active_year'];
            $contextParts[] = "Nombre total d'étudiants inscrits: " . $stats['total_students'];
            $contextParts[] = "Nombre de professeurs: " . $stats['total_professors'];
            $contextParts[] = "Demandes de documents en attente: " . $stats['open_document_requests'];
            $contextParts[] = "Campagne d'évaluation: " . $stats['evaluation_status'];

            if (isset($stats['student_name'])) {
                $contextParts[] = "L'étudiant connecté se nomme: " . $stats['student_name'];
                $contextParts[] = "Ses absences enregistrées: " . $stats['student_absences'];
                $contextParts[] = "Ses demandes en cours: " . $stats['student_pending_requests'];
            }

            return implode('. ', $contextParts) . '.';
        } catch (\Exception $e) {
            return "Établissement ENCG Fès — système ERP actif.";
        }
    }
}

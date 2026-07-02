<?php

namespace App\Services\Core;

class AiService
{
    /**
     * Generate a QCM based on a given topic.
     * In a real-world app, this would make an API call to OpenAI/Anthropic/Gemini.
     */
    public function generateQuiz(string $topic, string $difficulty, int $questionsCount = 5): array
    {
        // Mocked AI Response
        $questions = [];
        for ($i = 1; $i <= $questionsCount; $i++) {
            $questions[] = [
                'question' => "Question {$i} générée par l'IA sur le sujet : {$topic} (Niveau: {$difficulty})",
                'options' => [
                    'A' => "Première option plausible",
                    'B' => "Deuxième option plausible",
                    'C' => "La bonne réponse détaillée",
                    'D' => "Une option erronée"
                ],
                'correct_answer' => 'C',
                'explanation' => "L'explication pédagogique générée par l'IA pour cette question."
            ];
        }

        return [
            'success' => true,
            'topic' => $topic,
            'difficulty' => $difficulty,
            'quiz' => $questions
        ];
    }

    /**
     * Chat with the virtual assistant.
     */
    public function chatWithAssistant(string $prompt): array
    {
        // Mocked AI Response
        $responses = [
            "C'est une excellente question concernant l'ERP de l'ENCG. En tant qu'assistant virtuel, je peux vous guider vers le module concerné.",
            "Voici les informations que j'ai trouvées dans la base de connaissances académique...",
            "Pourriez-vous préciser si votre demande concerne les absences ou les relevés de notes ?"
        ];
        
        $randomResponse = $responses[array_rand($responses)];

        return [
            'success' => true,
            'reply' => $randomResponse,
            'context' => 'assistant'
        ];
    }
}

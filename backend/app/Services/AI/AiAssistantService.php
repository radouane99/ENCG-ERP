<?php

namespace App\Services\AI;

use Illuminate\Support\Str;

class AiAssistantService
{
    /**
     * Simulate a RAG (Retrieval-Augmented Generation) response based on APOGEE rules
     */
    public function generateResponse(string $userMessage, int $studentId): string
    {
        $message = strtolower($userMessage);

        // RAG Simulation: Detect intent based on keywords
        if (Str::contains($message, ['compensation', 'validé', 'module', '7', '12'])) {
            return "D'après le règlement intérieur APOGEE (Article 14 - Compensation des modules) : \n\n" .
                   "Un semestre est validé par compensation si la moyenne générale du semestre est $\ge$ 10/20 ET qu'aucune note de module n'est strictement inférieure à **7/20**.\n\n" .
                   "Dans votre cas, avec 7 en Comptabilité et 12 en Fiscalité (Moyenne = 9.5), vous devez vous assurer que la moyenne globale de vos autres modules compense ce 9.5 pour atteindre 10. Si c'est le cas, **OUI**, votre module de Comptabilité sera compensé grâce à la note plancher respectée (7/20).";
        }

        if (Str::contains($message, ['rattrapage', 'session'])) {
            return "Les sessions de rattrapage sont ouvertes automatiquement pour tout étudiant ayant obtenu une moyenne de module inférieure à 10/20. \n\n" .
                   "Attention : la note conservée après le rattrapage sera toujours la meilleure des deux notes obtenues.";
        }
        
        if (Str::contains($message, ['absence', 'justification'])) {
            return "Selon le règlement intérieur (Article 6), toute absence doit être justifiée auprès du service scolarité dans un délai maximum de **48 heures ouvrables**. \n\n" .
                   "Plus de 3 absences non justifiées dans un même module entraînent l'exclusion de la session d'examen ordinaire de ce module.";
        }

        if (Str::contains($message, ['stage', 'pfe', 'convention'])) {
            return "La convention de stage doit être éditée via l'ERP, signée par l'entreprise d'accueil, puis déposée au service des stages avant le début effectif de votre mission. Un enseignant tuteur vous sera alors affecté automatiquement.";
        }

        return "Je suis l'Assistant Virtuel de l'Université (Propulsé par IA). \n\n" .
               "Je suis connecté à la base de données APOGEE et au règlement intérieur. Je peux répondre à vos questions concernant la validation, les compensations, les absences et les stages. Comment puis-je vous aider ?";
    }
}

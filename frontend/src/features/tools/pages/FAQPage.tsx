import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Comment accéder Ã  mon espace étudiant ?",
      answer: "Vous pouvez accéder Ã  votre espace étudiant en utilisant votre adresse email institutionnelle et le mot de passe fourni par l'administration lors de votre inscription. Si vous avez oublié votre mot de passe, utilisez la fonction 'Mot de passe oublié' sur la page de connexion."
    },
    {
      question: "Comment demander une attestation de scolarité ?",
      answer: "Les attestations de scolarité peuvent être demandées directement depuis le module 'Documents' de votre espace. Une fois générée, vous pourrez la télécharger au format PDF avec un cachet électronique."
    },
    {
      question: "Comment justifier une absence ?",
      answer: "Toute absence doit être justifiée dans les 48 heures ouvrables. Vous pouvez soumettre votre certificat médical ou justificatif via le portail étudiant dans la section 'Mes Absences' > 'Soumettre un justificatif'."
    },
    {
      question: "Comment consulter mes notes et mon relevé ?",
      answer: "Vos notes sont disponibles dans la rubrique 'Examens & Notes'. Les relevés officiels sont publiés Ã  la fin de chaque semestre après les délibérations du jury."
    },
    {
      question: "Comment contacter l'administration ?",
      answer: "Vous pouvez utiliser la Messagerie Interne de la plateforme pour contacter les différents services (Scolarité, Informatique, Direction) ou vous rendre directement aux guichets pendant les heures d'ouverture."
    },
    {
      question: "Comment changer la langue de l'interface ?",
      answer: "La langue peut être modifiée en haut Ã  droite de l'écran en cliquant sur le sélecteur de langue (FR/AR). Vos préférences seront sauvegardées pour vos prochaines connexions."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-12 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header */}
      <div className="text-center pt-8">
        <h1 className="text-xl font-black text-[#003a8c] italic mb-8">Questions Fréquentes (FAQ)</h1>
        <h2 className="text-4xl font-black text-white mb-4 italic">Besoin d'aide ?</h2>
        <p className="text-white/50">Trouvez rapidement les réponses aux questions les plus courantes.</p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div 
            key={idx} 
            className="bg-white rounded-2xl shadow-sm border border-white/5 overflow-hidden transition-all duration-300"
          >
            <button 
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
            >
              <span className="text-[14px] font-bold text-white">{faq.question}</span>
              <ChevronDown className={cn(
                "w-5 h-5 text-[#003a8c] transition-transform duration-300",
                openIndex === idx ? "transform rotate-180" : ""
              )} />
            </button>
            
            <div className={cn(
              "overflow-hidden transition-all duration-300",
              openIndex === idx ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="p-6 pt-0 text-sm text-white/70 leading-relaxed border-t border-gray-50 bg-white/[0.02]/50">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

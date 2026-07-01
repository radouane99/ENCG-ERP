import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "Comment accéder à mon espace étudiant ?",
      answer: "Votre espace étudiant est accessible via le menu latéral en utilisant vos identifiants institutionnels fournis par l'administration lors de votre inscription."
    },
    {
      question: "Comment demander une attestation de scolarité ?",
      answer: "Vous pouvez effectuer une demande dans la rubrique 'Demandes Administratives'. Sélectionnez 'Attestation de scolarité' et soumettez la demande. Vous serez notifié dès qu'elle sera prête."
    },
    {
      question: "Comment justifier une absence ?",
      answer: "Les absences doivent être justifiées dans les 48h ouvrables via le module 'Gestion des Absences' en fournissant un certificat médical ou un document officiel numérisé."
    },
    {
      question: "Comment consulter mes notes et mon relevé ?",
      answer: "Vos notes sont disponibles dans la rubrique 'Examens & Notes'. Les relevés finaux sont générés et téléchargeables au format PDF avec signature électronique."
    },
    {
      question: "Comment contacter l'administration ?",
      answer: "Vous pouvez utiliser la rubrique 'Messagerie' ou soumettre une requête via le module 'Réclamations' pour tout besoin administratif."
    },
    {
      question: "Comment changer la langue de l'interface ?",
      answer: "Le bouton de changement de langue se situe en haut à droite de l'écran, vous permettant de basculer entre le Français et l'Arabe."
    }
  ]

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="space-y-6 animate-in p-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-center mb-12">
        <h1 className="text-xl font-bold text-[#0f2863] italic">
          Questions Fréquentes (FAQ)
        </h1>
      </div>

      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-800 italic mb-2">Besoin d'aide ?</h2>
        <p className="text-sm text-slate-500">Trouvez rapidement les réponses aux questions les plus courantes.</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-200 hover:border-blue-200"
          >
            <button 
              onClick={() => toggleAccordion(index)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <span className="font-bold text-slate-700 text-sm">{faq.question}</span>
              <ChevronDown 
                className={cn(
                  "w-5 h-5 text-blue-500 transition-transform duration-300",
                  openIndex === index ? "rotate-180" : ""
                )} 
              />
            </button>
            <div 
              className={cn(
                "overflow-hidden transition-all duration-300",
                openIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="p-6 pt-0 text-slate-500 text-sm leading-relaxed border-t border-slate-50 mt-2">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const FAQ_RESPONSES: Record<string, string> = {
  'attestation': '📄 Pour demander une attestation de scolarité, rendez-vous sur **Guichet Électronique** → "Nouvelle demande" → Type : Attestation. Délai : 48-72h ouvrables. Vous recevrez un email de confirmation.',
  'inscription': '📋 La ré-inscription se fait chaque année entre **septembre et octobre** via le portail. Rendez-vous sur Année & Affectations → Inscriptions. Documents requis : CIN, photo, justificatif de paiement.',
  'notes': '📊 Vos notes sont disponibles sur votre espace étudiant → **Mes Notes & Résultats**. Les notes sont publiées 72h après délibération par le jury.',
  'convocation': '📨 Votre convocation d\'examen est téléchargeable dans **Mes Convocations PDF**. Elle est disponible 5 jours avant l\'examen. Scannez le QR Code à l\'entrée de la salle.',
  'stage': '🏢 Pour soumettre votre convention de stage, rendez-vous sur **Mes Stages & PFE** → "Nouveau Stage". Votre encadreur sera notifié automatiquement par email.',
  'pfe': '🎓 Le PFE se dépose sur **Cahier de Charges PFE** → "Soumettre un sujet". Étapes : dépôt → validation directeur → affectation encadreur → soutenance. Délai de validation : 5 jours ouvrables.',
  'absence': '⚠️ Toute absence doit être justifiée dans les **48h** via votre espace → Demandes de Documents → Justification d\'absence. Au-delà de 30% d\'absences, vous passez en "Étudiant à Risque".',
  'bibliothèque': '📚 La bibliothèque numérique est accessible via **Bibliothèque Numérique** dans votre espace. Pour les emprunts physiques, présentez votre carte étudiante numérique.',
  'clubs': '🎭 Pour rejoindre un club, allez sur **Clubs Étudiants** et cliquez sur "Rejoindre". L\'approbation se fait en 24-48h par le président du club.',
  'contact': '📞 Scolarité ENCG Fès : scolarite@encg-fes.ma | Tél: 0535 60 49 00 | Horaires : Lun-Ven 8h30-16h30',
  'dérogation': '🔄 Une demande de dérogation (réserviste) se fait via **Crédits & Dérogations**. Joignez un justificatif médical ou académique. Délai de traitement : 7 jours ouvrables.',
  'mobilité': '✈️ Les programmes de mobilité internationale (Erasmus+, conventions bilatérales) sont disponibles sur **Mobilité Internationale**. Dossiers ouverts généralement en mars.',
}

function detectIntent(message: string): string {
  const lower = message.toLowerCase()
  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    if (lower.includes(key)) return response
  }
  return null as any
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content: '👋 Bonjour ! Je suis l\'**Assistant IA ENCG Fès**.\n\nJe peux vous aider avec :\n• Attestations & Documents\n• Inscriptions & Notes\n• Stages & PFE\n• Absences & Dérogations\n• Clubs & Mobilité\n\nComment puis-je vous aider ?',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [msgIdCounter, setMsgIdCounter] = useState(1)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = { id: msgIdCounter, role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setMsgIdCounter(n => n + 1)
    setInput('')
    setIsTyping(true)

    await new Promise(r => setTimeout(r, 800))

    // Try local FAQ first
    const localResponse = detectIntent(text)

    if (localResponse) {
      setMessages(prev => [...prev, { id: msgIdCounter + 1, role: 'assistant', content: localResponse, timestamp: new Date() }])
      setMsgIdCounter(n => n + 2)
    } else {
      // Try backend AI endpoint
      try {
        const res = await api.post('/ai/chat', { message: text, context: 'student_assistant' })
        const reply = res.data?.reply || res.data?.message || 'Je n\'ai pas pu traiter votre demande. Contactez la scolarité : scolarite@encg-fes.ma'
        setMessages(prev => [...prev, { id: msgIdCounter + 1, role: 'assistant', content: reply, timestamp: new Date() }])
        setMsgIdCounter(n => n + 2)
      } catch {
        setMessages(prev => [...prev, {
          id: msgIdCounter + 1,
          role: 'assistant',
          content: '🤔 Je ne comprends pas encore cette demande. Essayez des mots-clés comme : **attestation**, **inscription**, **notes**, **stage**, **PFE**, **absence**, **clubs**.\n\nOu contactez la scolarité : scolarite@encg-fes.ma',
          timestamp: new Date()
        }])
        setMsgIdCounter(n => n + 2)
      }
    }

    setIsTyping(false)
  }

  const quickQuestions = ['Attestation de scolarité', 'Mes notes', 'Convocation examen', 'Stage PFE']

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300',
          isOpen
            ? 'bg-rose-600 hover:bg-rose-700 rotate-0'
            : 'bg-gradient-to-br from-[#0f2863] to-indigo-700 hover:scale-110'
        )}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-[#0f2863] to-indigo-700 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-white text-sm">Assistant IA ENCG Fès</h3>
              <p className="text-blue-200 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                En ligne — Répond instantanément
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn(
                  'w-7 h-7 rounded-2xl flex items-center justify-center shrink-0 text-xs font-black',
                  msg.role === 'assistant' ? 'bg-[#0f2863] text-amber-400' : 'bg-indigo-100 text-indigo-700'
                )}>
                  {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <div className={cn(
                  'max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed',
                  msg.role === 'assistant'
                    ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                    : 'bg-[#0f2863] text-white rounded-tr-sm'
                )}
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }}
                />
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-2xl bg-[#0f2863] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-amber-400" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Questions */}
          <div className="px-4 pb-2 flex gap-2 flex-wrap">
            {quickQuestions.map(q => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 cursor-pointer transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Posez votre question..."
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 bg-[#0f2863] hover:bg-indigo-800 text-white rounded-2xl flex items-center justify-center cursor-pointer transition-all disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

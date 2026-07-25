import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

const QUICK_QUESTIONS = [
  'Attestation de scolarité',
  'Mes notes d\'examens',
  'Convocation examen',
  'Soumettre un stage PFE',
  'Justifier une absence',
  'Contacter la scolarité',
]

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    id: 0,
    role: 'assistant',
    content: '👋 Bonjour ! Je suis l\'**Assistant IA ENCG Fès**, alimenté par **Google Gemini**.\n\nJe peux vous aider sur toutes vos questions administratives et académiques. Comment puis-je vous aider ?'
  }])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [counter, setCounter] = useState(1)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isTyping) return

    setMessages(prev => [...prev, { id: counter, role: 'user', content: msg }])
    setCounter(n => n + 1)
    setInput('')
    setIsTyping(true)

    try {
      const res = await api.post('/ai/chat', { message: msg, context: 'student_assistant' })
      const reply = res.data?.reply ?? 'Je rencontre une difficulté. Veuillez contacter scolarite@encg-fes.ma'
      setMessages(prev => [...prev, { id: counter + 1, role: 'assistant', content: reply }])
      setCounter(n => n + 2)
    } catch {
      setMessages(prev => [...prev, {
        id: counter + 1,
        role: 'assistant',
        content: '🔌 Service temporairement indisponible. Contactez la scolarité : **scolarite@encg-fes.ma**'
      }])
      setCounter(n => n + 2)
    } finally {
      setIsTyping(false)
    }
  }

  const renderContent = (content: string) =>
    content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110',
          isOpen ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gradient-to-br from-[#0f2863] to-indigo-700'
        )}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          style={{ height: '560px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0f2863] to-indigo-700 p-4 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-white text-sm">Assistant IA ENCG Fès</h3>
              <p className="text-blue-200 text-[10px] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" /> Gemini AI — Données réelles en temps réel
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-300">En ligne</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex gap-2 items-end', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn(
                  'w-7 h-7 rounded-2xl flex items-center justify-center shrink-0',
                  msg.role === 'assistant' ? 'bg-[#0f2863]' : 'bg-indigo-100 dark:bg-indigo-900'
                )}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-4 h-4 text-amber-400" />
                    : <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
                  }
                </div>
                <div
                  className={cn(
                    'max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed',
                    msg.role === 'assistant'
                      ? 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                      : 'bg-gradient-to-br from-[#0f2863] to-indigo-700 text-white rounded-tr-sm'
                  )}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-2xl bg-[#0f2863] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-amber-400" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-3 pb-2 flex gap-1.5 flex-wrap shrink-0">
            {QUICK_QUESTIONS.slice(0, 3).map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isTyping}
                className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 cursor-pointer transition-colors disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Posez votre question..."
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 bg-gradient-to-br from-[#0f2863] to-indigo-700 hover:opacity-90 text-white rounded-2xl flex items-center justify-center cursor-pointer transition-all disabled:opacity-40 shrink-0"
            >
              {isTyping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

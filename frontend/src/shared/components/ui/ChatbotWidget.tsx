import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader2, Mic, MicOff, Copy, Check, Volume2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
}

const QUICK_QUESTIONS = [
  '📋 Attestation de scolarité',
  '📊 Mes notes d\'examens',
  '📅 Plannings & Convocations',
  '💼 Stage PFE & Inscription',
  '🏥 Justifier une absence',
]

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    id: 0,
    role: 'assistant',
    content: '👋 **Bonjour !** Je suis l\'**Assistant Copilot IA de l\'ENCG Fès**, propulsé par **Gemini 1.5 Flash**.\n\nPosez-moi vos questions sur la scolarité, les plannings, les notes ou dictez directement votre demande au micro 🎙️ !'
  }])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [counter, setCounter] = useState(1)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isOpen])

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('La reconnaissance vocale n\'est pas supportée par votre navigateur.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'fr-FR'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => {
        setIsListening(true)
        toast.info('🎙️ Écoute vocale active... Parlez maintenant !')
      }

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
        toast.success(`Dictée reçue : "${transcript}"`)
      }

      recognition.onerror = () => {
        setIsListening(false)
        toast.error('Erreur lors de la reconnaissance vocale.')
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognition.start()
    } catch {
      setIsListening(false)
      toast.error('Erreur d\'activation du micro.')
    }
  }

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || isTyping) return

    setMessages(prev => [...prev, { id: counter, role: 'user', content: msg }])
    setCounter(n => n + 1)
    setInput('')
    setIsTyping(true)

    try {
      const res = await api.post('/ai/chat', { message: msg, context: 'student_assistant' })
      const reply = res.data?.reply ?? res.data?.message ?? 'Je suis à votre disposition. Pour toute assistance immédiate, contactez la scolarité à **scolarite@encg-fes.ma**.'
      setMessages(prev => [...prev, { id: counter + 1, role: 'assistant', content: reply }])
      setCounter(n => n + 2)
    } catch {
      setMessages(prev => [...prev, {
        id: counter + 1,
        role: 'assistant',
        content: '🔌 Service temporairement indisponible. Vous pouvez contacter la scolarité de l\'ENCG Fès : **scolarite@encg-fes.ma**'
      }])
      setCounter(n => n + 2)
    } finally {
      setIsTyping(false)
    }
  }

  const copyMessage = (id: number, text: string) => {
    navigator.clipboard.writeText(text.replace(/<[^>]*>?/gm, ''))
    setCopiedId(id)
    toast.success('Texte copié !')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const renderContent = (content: string) =>
    content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')

  return (
    <>
      {/* Floating Glowing Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer',
          isOpen
            ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/50'
            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-bounce-subtle'
        )}
        aria-label="Assistant IA ENCG"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-ping" />
            <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
        )}
      </button>

      {/* Chat Floating Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-indigo-500/30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          style={{ height: '580px' }}
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-4 flex items-center justify-between border-b border-indigo-800/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
                <Bot className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm tracking-tight flex items-center gap-1.5">
                  Copilot IA ENCG Fès
                  <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase">
                    Live
                  </span>
                </h3>
                <p className="text-indigo-200/80 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Gemini 1.5 Flash • Micro Vocale
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map(msg => (
              <div key={msg.id} className={cn('flex gap-2 items-end group', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn(
                  'w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-sm',
                  msg.role === 'assistant'
                    ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-emerald-400 border border-indigo-700/50'
                    : 'bg-indigo-600 text-white'
                )}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-4 h-4 text-emerald-400" />
                    : <User className="w-4 h-4" />
                  }
                </div>
                
                <div className="relative max-w-[80%]">
                  <div
                    className={cn(
                      'px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs',
                      msg.role === 'assistant'
                        ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-800'
                        : 'bg-indigo-600 text-white rounded-tr-xs'
                    )}
                    dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                  />

                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-5 left-1 text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === msg.id ? 'Copié' : 'Copier'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-end">
                <div className="w-8 h-8 rounded-2xl bg-indigo-950 border border-indigo-700/50 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl rounded-tl-xs border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Option Pills */}
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q.replace(/^[^\s]+\s/, ''))}
                disabled={isTyping}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-all shrink-0 cursor-pointer disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 shrink-0">
            <button
              onClick={toggleVoiceInput}
              title="Dictée Vocale IA"
              className={cn(
                'w-9 h-9 rounded-2xl flex items-center justify-center cursor-pointer transition-all shrink-0 border',
                isListening
                  ? 'bg-rose-500 text-white animate-pulse border-rose-600 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 border-slate-200 dark:border-slate-700'
              )}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-500" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={isListening ? 'Écoute en cours...' : 'Posez une question ou dictez...'}
              disabled={isTyping}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-slate-100 disabled:opacity-60"
            />

            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95 disabled:opacity-40 shrink-0"
            >
              {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

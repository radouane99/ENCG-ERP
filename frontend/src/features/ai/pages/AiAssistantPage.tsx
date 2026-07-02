import React, { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Sparkles, Send, BrainCircuit, MessageSquareText,
  FileQuestion, Lightbulb, GraduationCap, Copy, CheckCircle2
} from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'
import { toast } from 'sonner'

export default function AiAssistantPage() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: isRtl ? 'مرحباً! أنا المساعد الذكي لـ ENCG. كيف يمكنني مساعدتك اليوم؟' : 'Bonjour ! Je suis l\'assistant intelligent de l\'ENCG. Comment puis-je vous aider ?' }
  ])
  const [input, setInput] = useState('')
  const [qcmTopic, setQcmTopic] = useState('')
  const [qcmResult, setQcmResult] = useState<any>(null)
  const [isCopied, setIsCopied] = useState(false)

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Chat Mutation
  const chatMutation = useMutation({
    mutationFn: (message: string) => api.post('/chatbot/message', { message }),
    onSuccess: (res) => {
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ' : 'Erreur de connexion à l\'IA')
  })

  // QCM Mutation
  const qcmMutation = useMutation({
    mutationFn: (topic: string) => api.post('/professor/ai/generate-qcm', { topic, difficulty: 'intermediate' }),
    onSuccess: (res) => {
      setQcmResult(res.data.quiz)
      toast.success(isRtl ? 'تم إنشاء الاختبار' : 'QCM généré avec succès')
    },
    onError: () => toast.error(isRtl ? 'فشل التوليد' : 'Échec de la génération')
  })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    const msg = input.trim()
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setInput('')
    chatMutation.mutate(msg)
  }

  const handleCopyQcm = () => {
    navigator.clipboard.writeText(JSON.stringify(qcmResult, null, 2))
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-6 pb-20 animate-in fade-in" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1E1B4B] rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-500/20">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 start-10 w-40 h-40 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none"></div>
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white/5 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <BrainCircuit className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ENCG AI Engine</span>
              <Sparkles size={20} className="text-yellow-400" />
            </h1>
            <p className="text-indigo-200 font-medium text-sm">
              {isRtl ? 'المساعد الذكي وتوليد المحتوى الأكاديمي.' : 'Assistant intelligent & Générateur de contenu académique.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Chatbot Section */}
        <div className="xl:col-span-2 flex flex-col h-[600px] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-sm overflow-hidden relative">
          <div className="p-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/30)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
              <MessageSquareText size={20} />
            </div>
            <div>
              <h2 className="font-bold text-[hsl(var(--foreground))]">{isRtl ? 'المساعد الافتراضي' : 'Assistant Virtuel'}</h2>
              <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {isRtl ? 'متصل' : 'En ligne'}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('/assets/chat-bg.png')] bg-cover bg-center">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl p-4 shadow-sm",
                  msg.role === 'user' 
                    ? "bg-indigo-600 text-white rounded-br-sm" 
                    : "bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-bl-sm"
                )}>
                  {msg.role === 'assistant' && <BrainCircuit size={16} className="text-indigo-500 mb-2 opacity-50" />}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl rounded-bl-sm p-4 w-16 flex justify-center gap-1 shadow-sm">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
            <form onSubmit={handleSend} className="relative flex items-center gap-2">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRtl ? "اطرح سؤالك هنا..." : "Posez votre question à l'IA..."}
                className="w-full rounded-xl pe-12 bg-[hsl(var(--muted)/30)] border-[hsl(var(--border))]"
                disabled={chatMutation.isPending}
              />
              <Button 
                type="submit" 
                disabled={chatMutation.isPending || !input.trim()}
                className="absolute end-1 h-8 w-8 p-0 rounded-lg bg-indigo-600 hover:bg-indigo-700"
              >
                <Send size={16} className={isRtl ? 'rotate-180' : ''} />
              </Button>
            </form>
          </div>
        </div>

        {/* QCM Generator Section */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 text-[hsl(var(--foreground))] flex items-center gap-2">
              <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg"><FileQuestion size={18} /></div>
              {isRtl ? 'مولد الاختبارات (QCM)' : 'Générateur de QCM'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-[hsl(var(--foreground))] mb-1.5 block">
                  {isRtl ? 'موضوع الاختبار' : 'Sujet du QCM'}
                </label>
                <Input 
                  placeholder="Ex: Macroéconomie S2..." 
                  value={qcmTopic}
                  onChange={e => setQcmTopic(e.target.value)}
                  icon={<GraduationCap size={16}/>}
                />
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20"
                onClick={() => qcmMutation.mutate(qcmTopic)}
                isLoading={qcmMutation.isPending}
                disabled={!qcmTopic}
                icon={<Sparkles size={16} />}
              >
                {isRtl ? 'توليد بالذكاء الاصطناعي' : 'Générer avec l\'IA'}
              </Button>
            </div>
          </div>

          {/* QCM Result Area */}
          {qcmResult && (
            <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] p-6 shadow-sm overflow-hidden relative group">
              <div className="flex justify-between items-center mb-4 border-b border-[hsl(var(--border))] pb-3">
                <h4 className="font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-500" />
                  {isRtl ? 'النتيجة' : 'Résultat Généré'}
                </h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8" 
                  onClick={handleCopyQcm}
                  icon={isCopied ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                >
                  {isCopied ? (isRtl ? 'تم النسخ' : 'Copié') : (isRtl ? 'نسخ JSON' : 'Copier JSON')}
                </Button>
              </div>
              <div className="max-h-[300px] overflow-y-auto text-xs font-mono bg-[hsl(var(--muted)/50)] p-4 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--foreground))]">
                <pre className="whitespace-pre-wrap">{JSON.stringify(qcmResult, null, 2)}</pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

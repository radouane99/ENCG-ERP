import React, { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Sparkles, Send, BrainCircuit, MessageSquareText,
  FileQuestion, Lightbulb, GraduationCap, Copy, CheckCircle2,
  Mic, MicOff, Volume2, Square
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
  
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([])
  const [input, setInput] = useState('')
  const [qcmTopic, setQcmTopic] = useState('')
  const [qcmResult, setQcmResult] = useState<any>(null)
  const [isCopied, setIsCopied] = useState(false)
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch History
  useQuery({
    queryKey: ['chat-history'],
    queryFn: async () => {
      const res = await api.get('/chatbot/history')
      return res.data.messages
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setMessages(data)
      } else {
        setMessages([{ 
          role: 'assistant', 
          content: isRtl 
            ? 'مرحباً! أنا المساعد الذكي الخاص بك في ENCG. كيف يمكنني مساعدتك اليوم؟ يمكنك التحدث معي بصوتك أو بالكتابة.' 
            : 'Bonjour ! Je suis votre assistant intelligent personnel à l\'ENCG. Comment puis-je vous aider aujourd\'hui ? Vous pouvez me parler via le micro ou par texte.' 
        }])
      }
    }
  })

  // Chat Mutation
  const chatMutation = useMutation({
    mutationFn: (message: string) => api.post('/chatbot/message', { message }),
    onSuccess: (res) => {
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ' : 'Erreur de connexion à l\'IA')
  })

  // Transcribe Mutation
  const transcribeMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')
      const res = await api.post('/chatbot/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    },
    onSuccess: (data) => {
      if (data.success) {
        // Automatically send the transcribed text
        const text = data.text
        setMessages(prev => [...prev, { role: 'user', content: text }])
        chatMutation.mutate(text)
      } else {
        toast.error(data.text || (isRtl ? 'فشل التعرف على الصوت' : 'Échec de la transcription'))
      }
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ في الصوت' : 'Erreur audio')
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        transcribeMutation.mutate(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      toast.error(isRtl ? 'الرجاء السماح بالوصول للميكروفون' : 'Veuillez autoriser l\'accès au microphone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = isRtl ? 'ar-SA' : 'fr-FR'
      window.speechSynthesis.speak(utterance)
    } else {
      toast.error('Texte par synthèse vocale non supporté sur ce navigateur.')
    }
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
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">ENCG AI Engine PRO</span>
              <Sparkles size={20} className="text-yellow-400" />
            </h1>
            <p className="text-indigo-200 font-medium text-sm">
              {isRtl ? 'مساعدك الشخصي المعزز بالذكاء الاصطناعي والصوت.' : 'Votre assistant personnel augmenté par l\'IA et la reconnaissance vocale.'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Chatbot Section */}
        <div className="xl:col-span-2 flex flex-col h-[700px] bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-lg overflow-hidden relative">
          <div className="p-4 border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--muted)/30)] to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 relative">
                <MessageSquareText size={20} />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[hsl(var(--card))] rounded-full"></span>
              </div>
              <div>
                <h2 className="font-bold text-[hsl(var(--foreground))] text-lg">{isRtl ? 'المساعد الافتراضي' : 'Assistant IA'}</h2>
                <p className="text-xs text-slate-500 font-medium">
                  {isRtl ? 'جاهز للمساعدة' : 'Prêt à vous aider'}
                </p>
              </div>
            </div>
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-500 rounded-full animate-pulse">
                <Mic size={14} />
                <span className="text-xs font-bold uppercase">{isRtl ? 'جاري التسجيل...' : 'Enregistrement...'}</span>
              </div>
            )}
            {transcribeMutation.isPending && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-full animate-pulse">
                <BrainCircuit size={14} />
                <span className="text-xs font-bold uppercase">{isRtl ? 'جاري المعالجة...' : 'Traitement vocal...'}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('/assets/chat-bg.png')] bg-cover bg-center bg-opacity-20">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  "max-w-[85%] rounded-[1.5rem] p-5 shadow-sm relative group",
                  msg.role === 'user' 
                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-sm" 
                    : "bg-[hsl(var(--background))] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] rounded-bl-sm"
                )}>
                  {msg.role === 'assistant' && (
                    <div className="flex justify-between items-center mb-2">
                      <BrainCircuit size={18} className="text-indigo-500" />
                      <button 
                        onClick={() => speakText(msg.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-indigo-600"
                        title={isRtl ? "استمع" : "Écouter"}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  )}
                  <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-2xl rounded-bl-sm p-5 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <form onSubmit={handleSend} className="relative flex items-center gap-2 bg-[hsl(var(--muted)/50)] p-2 rounded-2xl border border-[hsl(var(--border))] focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
              <Input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRtl ? "اسأل مساعدك الشخصي..." : "Demandez à votre assistant personnel..."}
                className="w-full bg-transparent border-none shadow-none focus-visible:ring-0 text-base"
                disabled={chatMutation.isPending || transcribeMutation.isPending || isRecording}
              />
              
              <div className="flex items-center gap-1 shrink-0">
                {isRecording ? (
                  <Button
                    type="button"
                    onClick={stopRecording}
                    variant="destructive"
                    className="h-10 w-10 p-0 rounded-xl animate-pulse shadow-lg shadow-red-500/30"
                  >
                    <Square size={16} fill="currentColor" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={startRecording}
                    variant="ghost"
                    className="h-10 w-10 p-0 rounded-xl hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-colors"
                    disabled={chatMutation.isPending || transcribeMutation.isPending}
                    title={isRtl ? 'تحدث' : 'Parler'}
                  >
                    <Mic size={20} />
                  </Button>
                )}

                <Button 
                  type="submit" 
                  disabled={chatMutation.isPending || transcribeMutation.isPending || !input.trim() || isRecording}
                  className="h-10 w-10 p-0 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/20"
                >
                  <Send size={18} className={cn(isRtl && 'rotate-180', "ml-1")} />
                </Button>
              </div>
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
                  className="rounded-xl"
                />
              </div>
              <Button 
                className="w-full rounded-xl bg-[hsl(var(--card))] border-2 border-purple-500/20 hover:border-purple-500 text-purple-600 transition-colors"
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
                  variant="ghost" 
                  size="sm" 
                  className="h-8 rounded-lg hover:bg-slate-100" 
                  onClick={handleCopyQcm}
                  icon={isCopied ? <CheckCircle2 size={14} className="text-emerald-500"/> : <Copy size={14}/>}
                >
                  {isCopied ? (isRtl ? 'تم النسخ' : 'Copié') : (isRtl ? 'نسخ JSON' : 'Copier JSON')}
                </Button>
              </div>
              <div className="max-h-[300px] overflow-y-auto text-xs font-mono bg-slate-900 p-4 rounded-xl text-slate-300 shadow-inner">
                <pre className="whitespace-pre-wrap">{JSON.stringify(qcmResult, null, 2)}</pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

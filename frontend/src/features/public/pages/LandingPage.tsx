import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '@shared/lib/api';
import { 
  ShieldCheck, Sparkles, GraduationCap, ArrowRight, LogIn, BrainCircuit,
  Megaphone, UserCheck, Activity, QrCode, Database, BookOpen, Layers, BarChart3,
  Sun, Moon, X, MapPin, Phone, Mail, Send, CheckCircle2
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@stores/authStore';
import { useTheme } from '@shared/components/layout/ThemeProvider';
import MvpRoadmapSection from '@features/public/components/MvpRoadmapSection';
import RoleJourneySection from '@features/public/components/RoleJourneySection';
import BenefitsSection from '@features/public/components/BenefitsSection';
import TestimonialsSection from '@features/public/components/TestimonialsSection';
import ImpactSection from '@features/public/components/ImpactSection';
import ConversionSection from '@features/public/components/ConversionSection';
import FaqSection from '@features/public/components/FaqSection';

const dict = {
  fr: {
    font: 'font-sans',
    navVision: 'Vision', navEco: 'Écosystème', navAi: 'ENCG AI',
    navDash: 'Tableau de bord', navLogin: 'Connexion',
    badge1: 'Sécurité Étatique', badge2: '100% Cloud Native',
    heroTitle1: 'Le Management de Demain', heroTitle2: "S'invente Aujourd'hui.",
    heroDesc: "L'ENCG Fès déploie le premier ERP Universitaire 3.0 au Maroc. Une plateforme unifiée, intelligente et sans friction, propulsée par l'Intelligence Artificielle.",
    btnExplore: 'Explorer le Portail', btnRegister: "S'inscrire (Candidats)",
    popupTitle: "Session d'Inscription Ouverte ! 🎉",
    popupDesc: "Ne manquez pas l'opportunité de rejoindre l'ENCG Fès pour l'année universitaire 2025-2026. La plateforme d'admission est officiellement ouverte.",
    popupBtn: "S'inscrire maintenant",
    ecoTitle1: 'Un Écosystème,', ecoTitle2: 'Trois Dimensions.',
    ecoDesc: "Une architecture unifiée qui s'adapte contextuellement à votre rôle au sein de l'institution.",
    adminTitle: 'Tour de Contrôle Admin', adminDesc: "Pilotage stratégique en temps réel. Gérez les inscriptions, planifiez les examens et générez les PV de délibération.",
    adminTag1: 'Emplois du temps Auto', adminTag2: 'Statistiques Prédictives',
    profTitle: 'Espace Enseignant', profDesc: "Saisie de notes ultra-rapide, cahier de textes numérique et correction assistée par IA.",
    profTag1: 'Générateur QCM', profTag2: 'Suivi des Absences',
    studentTitle: 'Portail Étudiant 3.0', studentDesc: "Toute votre scolarité dans votre poche. Des notes certifiées aux documents administratifs.",
    studentTag1: 'Carte Digitale', studentTag2: 'Relevés Instantanés', studentTag3: 'Bourse Projets',
    aiBadge: 'ENCG LLaMA 3 Core', aiTitle1: "L'Intelligence", aiTitle2: "Artificielle", aiTitle3: "Au Service De L'Humain",
    aiDesc: "Notre IA intégrée analyse les résultats, répond aux étudiants 24/7 et assiste les professeurs.",
    aiBtn: "Découvrir les cas d'usage",
    aiChatUser: "Ai-je validé mon S1 ? J'ai 9.5 en Comptabilité et 14 en Management.",
    aiChatBot: "Bonjour ! D'après le règlement de l'ENCG, votre moyenne est de 11.75/20. ✅ Vous validez par compensation !",
    contactTitle: 'Entrez en Contact', contactSubtitle: 'Notre équipe est là pour vous',
    contactDesc: "Une question sur les admissions, la plateforme ou nos formations ? Envoyez-nous un message directement, nous vous répondrons dans les 24h.",
    formName: 'Votre nom complet', formEmail: 'Votre email', formSubject: 'Sujet du message', formMsg: 'Votre message...',
    formBtn: 'Envoyer le message', formSuccess: 'Message envoyé avec succès ! Nous vous répondrons très bientôt.',
    footerTagline: "Former les leaders et managers de demain.",
    footerLinks: 'Liens Rapides', footerPlatform: 'Plateforme', footerContact: 'Contact',
    rights: '© 2026 ENCG Fès ERP. Tous droits réservés.',
    madeBy: 'Fait avec passion au Maroc',
  },
  en: {
    font: 'font-sans',
    navVision: 'Vision', navEco: 'Ecosystem', navAi: 'ENCG AI',
    navDash: 'Dashboard', navLogin: 'Login',
    badge1: 'State Security', badge2: '100% Cloud Native',
    heroTitle1: 'The Management of Tomorrow', heroTitle2: 'Is Invented Today.',
    heroDesc: "ENCG Fes deploys the first University ERP 3.0 in Morocco. A unified, smart, and frictionless platform powered by Artificial Intelligence.",
    btnExplore: 'Explore Portal', btnRegister: 'Register (Candidates)',
    popupTitle: 'Enrollment Session Open! 🎉',
    popupDesc: "Don't miss the opportunity to join ENCG Fes for the 2025-2026 academic year. The admission platform is officially open.",
    popupBtn: 'Register now',
    ecoTitle1: 'One Ecosystem,', ecoTitle2: 'Three Dimensions.',
    ecoDesc: "A unified architecture that contextually adapts to your role within the institution.",
    adminTitle: 'Admin Control Tower', adminDesc: "Real-time strategic management. Manage enrollments, schedule exams, and generate deliberation reports.",
    adminTag1: 'Auto Scheduling', adminTag2: 'Predictive Stats',
    profTitle: 'Professor Space', profDesc: "Ultra-fast grading, digital logbook, and AI-assisted correction.",
    profTag1: 'Quiz Generator', profTag2: 'Absence Tracking',
    studentTitle: 'Student Portal 3.0', studentDesc: "Your entire education in your pocket. From certified grades to administrative documents.",
    studentTag1: 'Digital ID', studentTag2: 'Instant Transcripts', studentTag3: 'Project Board',
    aiBadge: 'ENCG LLaMA 3 Core', aiTitle1: "Artificial", aiTitle2: "Intelligence", aiTitle3: "Serving Humanity",
    aiDesc: "Our integrated AI analyzes results, answers students 24/7, and assists professors.",
    aiBtn: "Discover use cases",
    aiChatUser: "Did I pass S1? I got 9.5 in Accounting and 14 in Management.",
    aiChatBot: "Hello! According to ENCG rules, your average is 11.75/20. ✅ You pass by compensation!",
    contactTitle: 'Get in Touch', contactSubtitle: 'Our team is here for you',
    contactDesc: "A question about admissions, the platform or our programs? Send us a message directly, we will reply within 24 hours.",
    formName: 'Your full name', formEmail: 'Your email', formSubject: 'Message subject', formMsg: 'Your message...',
    formBtn: 'Send message', formSuccess: 'Message sent successfully! We will get back to you very soon.',
    footerTagline: "Training tomorrow's leaders and managers.",
    footerLinks: 'Quick Links', footerPlatform: 'Platform', footerContact: 'Contact',
    rights: '© 2026 ENCG Fes ERP. All rights reserved.',
    madeBy: 'Made with passion in Morocco',
  },
  ar: {
    font: "font-['Cairo']",
    navVision: 'الرؤية', navEco: 'النظام البيئي', navAi: 'الذكاء الاصطناعي',
    navDash: 'لوحة التحكم', navLogin: 'تسجيل الدخول',
    badge1: 'أمان حكومي', badge2: 'سحابي 100%',
    heroTitle1: 'إدارة الغد', heroTitle2: 'تُبتكر اليوم.',
    heroDesc: "المدرسة الوطنية للتجارة والتسيير بفاس تطلق أول نظام إدارة جامعي 3.0 في المغرب. منصة موحدة وذكية تعمل بالذكاء الاصطناعي.",
    btnExplore: 'اكتشف البوابة', btnRegister: 'التسجيل (للمرشحين)',
    popupTitle: 'فتح دورة التسجيل! 🎉',
    popupDesc: "لا تفوتوا فرصة الالتحاق بالمدرسة الوطنية للتجارة والتسيير بفاس للسنة الجامعية 2025-2026.",
    popupBtn: 'سجل الآن',
    ecoTitle1: 'نظام بيئي واحد،', ecoTitle2: 'ثلاثة أبعاد.',
    ecoDesc: "بنية موحدة تتكيف بشكل سياقي مع دورك داخل المؤسسة.",
    adminTitle: 'برج المراقبة الإداري', adminDesc: "إدارة استراتيجية في الوقت الفعلي. إدارة التسجيلات وجدولة الامتحانات وإنشاء محاضر المداولات.",
    adminTag1: 'جداول زمنية تلقائية', adminTag2: 'إحصاءات تنبؤية',
    profTitle: 'مساحة الأستاذ', profDesc: "إدخال سريع للنقاط، دفتر نصوص رقمي، وتصحيح مدعوم بالذكاء الاصطناعي.",
    profTag1: 'منشئ الاختبارات', profTag2: 'تتبع الغياب',
    studentTitle: 'بوابة الطالب 3.0', studentDesc: "مسارك الدراسي بالكامل في جيبك. من النقاط المعتمدة إلى الوثائق الإدارية.",
    studentTag1: 'بطاقة رقمية', studentTag2: 'كشوف فورية', studentTag3: 'بورصة المشاريع',
    aiBadge: 'نواة ENCG LLaMA 3', aiTitle1: "الذكاء", aiTitle2: "الاصطناعي", aiTitle3: "في خدمة الإنسان",
    aiDesc: "يقوم الذكاء الاصطناعي المدمج لدينا بتحليل النتائج والإجابة على الطلاب على مدار الساعة.",
    aiBtn: "اكتشف حالات الاستخدام",
    aiChatUser: "هل نجحت في الفصل الأول؟ حصلت على 9.5 في المحاسبة و14 في الإدارة.",
    aiChatBot: "مرحباً! وفقاً لقوانين المؤسسة، معدلك هو 11.75/20. ✅ لقد نجحت بالمقاصة!",
    contactTitle: 'تواصل معنا', contactSubtitle: 'فريقنا هنا لمساعدتك',
    contactDesc: "هل لديك سؤال حول القبول أو المنصة أو برامجنا؟ أرسل لنا رسالة مباشرة وسنرد عليك خلال 24 ساعة.",
    formName: 'الاسم الكامل', formEmail: 'بريدك الإلكتروني', formSubject: 'موضوع الرسالة', formMsg: 'رسالتك...',
    formBtn: 'إرسال الرسالة', formSuccess: 'تم إرسال رسالتك بنجاح! سنرد عليك قريباً جداً.',
    footerTagline: "تكوين قادة ومديري الغد.",
    footerLinks: 'روابط سريعة', footerPlatform: 'المنصة', footerContact: 'التواصل',
    rights: '© 2026 ENCG Fès ERP. جميع الحقوق محفوظة.',
    madeBy: 'صُنع بشغف في المغرب',
  },
};

type Lang = 'fr' | 'en' | 'ar';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<Lang>('fr');
  const [showPopup, setShowPopup] = useState(false);
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [formSent, setFormSent] = useState(false);
  const [formSending, setFormSending] = useState(false);

  const t = dict[lang];
  const isRTL = lang === 'ar';

  const currentTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const timer = setTimeout(() => setShowPopup(true), 1800);
    return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(timer); };
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSending(true);

    try {
      await api.post('/contact', {
        name: formState.name,
        email: formState.email,
        subject: formState.subject || 'Contact depuis ENCG ERP',
        message: formState.message,
      });
      setFormSending(false);
      setFormSent(true);
      setFormState({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Contact API error:', err);
      setFormSending(false);
      alert('Erreur lors de l\'envoi. Veuillez réessayer ou contacter contact@encgf-usmba.ac.ma');
    }
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(
        'min-h-screen transition-colors duration-500 overflow-x-hidden selection:bg-[#E60028] selection:text-white',
        'bg-slate-50 dark:bg-[#02060D] text-slate-900 dark:text-slate-200',
        t.font
      )}
    >
      {/* ── Fixed Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[70vw] h-[70vw] rounded-full bg-[#E60028]/10 blur-[150px] opacity-60 dark:opacity-40" />
        <div className="absolute bottom-0 left-0 w-[60vw] h-[60vw] rounded-full bg-blue-400/15 dark:bg-[#1F3A5F]/20 blur-[150px] opacity-70" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-black text-slate-900/[0.02] dark:text-white/[0.015] whitespace-nowrap pointer-events-none select-none">
          ENCG ERP
        </div>
      </div>

      {/* ── Registration Popup ── */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0A1220] border border-slate-200 dark:border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-red-100 dark:bg-[#E60028]/20 rounded-2xl flex items-center justify-center mb-6">
              <Megaphone className="w-8 h-8 text-[#E60028] animate-bounce" />
            </div>
            <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Session ouverte
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">{t.popupTitle}</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">{t.popupDesc}</p>
            <button
              onClick={() => { setShowPopup(false); navigate('/inscription'); }}
              className="w-full bg-gradient-to-r from-[#E60028] to-[#A80A0B] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#E60028]/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              {t.popupBtn} <ArrowRight className={cn('w-5 h-5', isRTL && 'rotate-180')} />
            </button>
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <nav className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-500', scrolled ? 'py-3' : 'py-5')}>
        <div className="max-w-7xl mx-auto px-6">
          <div className={cn(
            'flex items-center justify-between px-6 py-3 rounded-2xl transition-all duration-500',
            scrolled
              ? 'bg-white/80 dark:bg-[#0A1220]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-xl'
              : 'bg-transparent'
          )}>
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="h-10 bg-white rounded-xl shadow-md flex items-center px-1.5 py-1">
                <img src="/logo-encg.png" alt="ENCG Fès" className="h-full object-contain" onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }} />
              </div>
              <div className="hidden sm:block font-black text-xl tracking-tight text-slate-900 dark:text-white font-sans">
                ENCG Fès
              </div>
            </div>

            {/* Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#vision" className="text-slate-600 dark:text-slate-300 hover:text-[#E60028] dark:hover:text-white transition-colors">{t.navVision}</a>
              <a href="#ecosystem" className="text-slate-600 dark:text-slate-300 hover:text-[#E60028] dark:hover:text-white transition-colors">{t.navEco}</a>
              <a href="#ia" className="text-[#E60028] font-bold flex items-center gap-1 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                <BrainCircuit className="w-4 h-4" />{t.navAi}
              </a>
              <a href="#contact" className="text-slate-600 dark:text-slate-300 hover:text-[#E60028] dark:hover:text-white transition-colors">Contact</a>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Dark/Light toggle */}
              <button
                onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                {currentTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {/* Language switcher */}
              <div className="hidden sm:flex bg-slate-100 dark:bg-white/5 rounded-lg p-1 border border-slate-200 dark:border-white/10">
                {(['fr', 'en', 'ar'] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={cn(
                      'px-3 py-1 text-xs font-bold uppercase rounded-md transition-colors',
                      lang === l
                        ? 'bg-[#1F3A5F] text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-slate-900 dark:bg-white text-white dark:text-[#02060D] px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 shadow-lg"
                >
                  {t.navDash}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/login')}
                  className="bg-gradient-to-r from-[#E60028] to-[#A80A0B] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-[#E60028]/20 hover:shadow-[#E60028]/40 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <LogIn className={cn('w-4 h-4', isRTL && 'rotate-180')} />
                  {t.navLogin}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div id="vision" className="relative z-10 pt-28 pb-16 lg:pt-30 lg:pb-24 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-start">
            <div className={cn('flex flex-wrap items-center gap-3 mb-8', isRTL ? 'justify-center lg:justify-end' : 'justify-center lg:justify-start')}>
              <span className="bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-full px-4 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />{t.badge1}
              </span>
              <span className="bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-full px-4 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <Database className="w-4 h-4" />{t.badge2}
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-slate-900 dark:text-white mb-6 leading-[1.1]">
              {t.heroTitle1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E60028] to-[#FF4D6A]">
                {t.heroTitle2}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed font-light mx-auto lg:mx-0">
              {t.heroDesc}
            </p>
            <div className={cn('flex flex-col sm:flex-row items-center gap-4', isRTL ? 'justify-center lg:justify-end' : 'justify-center lg:justify-start')}>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-[#02060D] px-8 py-4 rounded-2xl font-bold shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
              >
                {t.btnExplore}
                <ArrowRight className={cn('w-5 h-5 transition-transform', isRTL ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1')} />
              </button>
              <button
                onClick={() => navigate('/inscription')}
                className="w-full sm:w-auto bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <GraduationCap className="w-5 h-5" />{t.btnRegister}
              </button>
            </div>
          </div>

          {/* Dashboard Mockup Visual */}
          <div className="flex-1 relative w-full aspect-square max-w-[480px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-[#E60028]/10 rounded-full blur-[60px] animate-pulse" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-white dark:bg-[#111827]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-6 transform -rotate-6 hover:rotate-0 transition-transform duration-700 shadow-slate-200/80 dark:shadow-none">
              <div className="flex justify-between items-center mb-5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-xs text-slate-400 font-mono font-bold">ENCG.OS v3.0</span>
              </div>
              <div className="space-y-4">
                {[
                  { Icon: UserCheck, color: 'bg-blue-100 dark:bg-[#1F3A5F]', iconColor: 'text-blue-700 dark:text-blue-300', bar: 'w-3/4 bg-emerald-400' },
                  { Icon: BarChart3, color: 'bg-red-100 dark:bg-[#E60028]/20', iconColor: 'text-[#E60028]', bar: 'w-1/2 bg-slate-300 dark:bg-white/20' },
                  { Icon: Activity, color: 'bg-emerald-100 dark:bg-emerald-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400', bar: 'w-5/6 bg-emerald-400' },
                ].map(({ Icon, color, iconColor, bar }, i) => (
                  <div key={i} className="h-12 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 flex items-center px-4 gap-4">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', color)}>
                      <Icon className={cn('w-4 h-4', iconColor)} />
                    </div>
                    <div className="flex-1 h-2.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', bar)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute top-[5%] right-[-5%] bg-white dark:bg-[#0A1220]/90 backdrop-blur-xl border border-red-200 dark:border-[#E60028]/30 p-4 rounded-2xl shadow-xl transform rotate-12 animate-bounce [animation-duration:4s]">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-[#E60028]" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">IA Active</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-[#E60028] to-[#FF4D6A]" />
              </div>
            </div>
            <div className="absolute bottom-[5%] left-[-5%] bg-white dark:bg-[#0A1220]/90 backdrop-blur-xl border border-blue-200 dark:border-blue-500/30 p-4 rounded-2xl shadow-xl transform -rotate-12 animate-bounce [animation-duration:5s]">
              <div className="flex items-center gap-3 mb-1">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">Blockchain ✓</span>
              </div>
              <p className="text-[10px] text-slate-500">Certificats & Relevés cryptés</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Ecosystem / 3 Universes ── */}
      <div id="ecosystem" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            {t.ecoTitle1} <span className="text-[#E60028]">{t.ecoTitle2}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">{t.ecoDesc}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Admin */}
          <div className="md:col-span-2 bg-white dark:bg-gradient-to-br dark:from-[#1F3A5F]/20 dark:to-[#0A1220] rounded-3xl p-10 border border-slate-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/30 transition-all group relative overflow-hidden shadow-lg shadow-slate-100 dark:shadow-none hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Layers className="w-48 h-48 text-blue-600" strokeWidth={0.5} />
            </div>
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-200 dark:border-blue-500/30 mb-6">
              <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{t.adminTitle}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md text-lg leading-relaxed mb-8">{t.adminDesc}</p>
            <div className="flex flex-wrap gap-3">
              <span className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-4 py-2 rounded-full text-xs font-bold text-blue-700 dark:text-blue-300">{t.adminTag1}</span>
              <span className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-4 py-2 rounded-full text-xs font-bold text-blue-700 dark:text-blue-300">{t.adminTag2}</span>
            </div>
          </div>
          {/* Professor */}
          <div className="md:col-span-1 bg-white dark:bg-gradient-to-br dark:from-[#E60028]/10 dark:to-[#0A1220] rounded-3xl p-10 border border-slate-200 dark:border-white/10 hover:border-[#E60028]/50 transition-all group relative overflow-hidden shadow-lg shadow-slate-100 dark:shadow-none hover:shadow-xl hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <BookOpen className="w-48 h-48 text-[#E60028]" strokeWidth={0.5} />
            </div>
            <div className="w-14 h-14 bg-red-100 dark:bg-[#E60028]/20 rounded-2xl flex items-center justify-center border border-red-200 dark:border-[#E60028]/30 mb-6">
              <BookOpen className="w-7 h-7 text-[#E60028]" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{t.profTitle}</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">{t.profDesc}</p>
            <ul className="space-y-3">
              {[t.profTag1, t.profTag2].map(tag => (
                <li key={tag} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <div className="w-2 h-2 rounded-full bg-[#E60028]" />{tag}
                </li>
              ))}
            </ul>
          </div>
          {/* Student */}
          <div className="md:col-span-3 bg-emerald-50/80 dark:bg-gradient-to-r dark:from-emerald-900/20 dark:via-[#0A1220] dark:to-[#0A1220] rounded-3xl p-10 border border-emerald-200 dark:border-emerald-500/10 hover:border-emerald-400 dark:hover:border-emerald-500/30 transition-all flex flex-col md:flex-row items-center justify-between gap-12 shadow-lg shadow-emerald-50 dark:shadow-none hover:shadow-xl hover:-translate-y-1">
            <div className="flex-1">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-200 dark:border-emerald-500/30 mb-6">
                <GraduationCap className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4">{t.studentTitle}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-8 max-w-xl">{t.studentDesc}</p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: t.studentTag1, Icon: QrCode },
                  { label: t.studentTag2, Icon: ArrowRight },
                  { label: t.studentTag3, Icon: ArrowRight },
                ].map(({ label, Icon }) => (
                  <span key={label} className="bg-white dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 shadow-sm">
                    <Icon className="w-4 h-4" />{label}
                  </span>
                ))}
              </div>
            </div>
            {/* Student Card Mockup */}
            <div className="w-full max-w-[300px] aspect-[1.6] bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl shadow-2xl p-6 text-white transform hover:scale-105 transition-transform flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-black text-xl">ENCG Fès</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-80">Carte Étudiant</div>
                </div>
                <QrCode className="w-12 h-12 opacity-90" />
              </div>
              <div>
                <div className="font-mono text-sm tracking-widest opacity-90 mb-1">2026 0045 8992</div>
                <div className="font-bold text-lg">Youssef Alaoui</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BenefitsSection lang={lang} isRTL={isRTL} />
      <MvpRoadmapSection />
      <RoleJourneySection lang={lang} isRTL={isRTL} />
      <TestimonialsSection lang={lang} isRTL={isRTL} />
      <ImpactSection lang={lang} isRTL={isRTL} />
      <ConversionSection lang={lang} isRTL={isRTL} />
      <FaqSection lang={lang} isRTL={isRTL} />

      {/* ── AI Section ── */}
      <div id="ia" className="relative z-10 bg-white dark:bg-[#0A1220] py-32 border-y border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-[#E60028]/10 border border-red-200 dark:border-[#E60028]/20 rounded-full px-4 py-1.5 mb-8">
              <BrainCircuit className="w-4 h-4 text-[#E60028] animate-pulse" />
              <span className="text-xs font-bold text-[#E60028] tracking-wider">{t.aiBadge}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
              {t.aiTitle1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E60028] to-[#FF4D6A]">{t.aiTitle2}</span><br />
              <span className="text-slate-400 font-light">{t.aiTitle3}.</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-10 leading-relaxed font-light">{t.aiDesc}</p>
            <button className="bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white px-8 py-4 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-sm">
              {t.aiBtn} <ArrowRight className={cn('w-5 h-5', isRTL && 'rotate-180')} />
            </button>
          </div>
          {/* AI Terminal Mockup */}
          <div className="bg-slate-900 border border-slate-700 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-black/20">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" /><div className="w-3 h-3 rounded-full bg-yellow-500/80" /><div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="mx-auto text-xs font-mono text-slate-400 flex items-center gap-2">
                <BrainCircuit className="w-3 h-3" /> ENCG_AI_Terminal
              </div>
            </div>
            <div className="p-6 h-[350px] flex flex-col gap-6">
              <div className={cn('flex', isRTL ? 'justify-start' : 'justify-end')}>
                <div className={cn('max-w-[85%] bg-blue-600 text-white px-5 py-4 text-sm shadow-md', isRTL ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-br-sm')}>
                  {t.aiChatUser}
                </div>
              </div>
              <div className={cn('flex', isRTL ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[90%] bg-white/5 text-slate-300 px-5 py-4 text-sm border border-white/10 shadow-md relative backdrop-blur-md', isRTL ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl rounded-bl-sm')}>
                  <div className={cn('absolute top-4 w-2 h-8 bg-[#E60028] rounded-full blur-[2px]', isRTL ? '-right-1' : '-left-1')} />
                  {t.aiChatBot}
                </div>
              </div>
              <div className={cn('flex', isRTL ? 'justify-end' : 'justify-start')}>
                <div className="bg-white/5 px-5 py-4 rounded-2xl border border-white/10 flex gap-2 items-center">
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTACT SECTION ── */}
      <div id="contact" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-1.5 mb-6">
              <Mail className="w-4 h-4 text-[#E60028]" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wider uppercase">Contact</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">{t.contactTitle}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">{t.contactSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Info Cards */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <div className="flex-1 bg-white dark:bg-[#0A1220] rounded-2xl p-7 border border-slate-200 dark:border-white/10 shadow-md dark:shadow-none">
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm mb-8">{t.contactDesc}</p>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-[#E60028]/10 flex items-center justify-center border border-red-200 dark:border-[#E60028]/20 shrink-0">
                      <MapPin className="w-5 h-5 text-[#E60028]" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">Adresse</div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">B.P. 81A, Route d'Imouzzer, Fès 30050</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center border border-blue-200 dark:border-blue-500/20 shrink-0">
                      <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">Téléphone</div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">+212 535 60 06 43</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                      <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">Email</div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">contact@encgf-usmba.ac.ma</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3 bg-white dark:bg-[#0A1220] rounded-2xl border border-slate-200 dark:border-white/10 shadow-md dark:shadow-none overflow-hidden">
              {formSent ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center border-4 border-emerald-200 dark:border-emerald-500/20">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t.formSuccess}</h3>
                  <button onClick={() => setFormSent(false)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-[#E60028] transition-colors underline underline-offset-2">
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="p-8 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="group">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">{t.formName}</label>
                      <input
                        type="text" required value={formState.name}
                        onChange={e => setFormState(s => ({ ...s, name: e.target.value }))}
                        placeholder="Mohammed Alaoui"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E60028]/30 focus:border-[#E60028] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">{t.formEmail}</label>
                      <input
                        type="email" required value={formState.email}
                        onChange={e => setFormState(s => ({ ...s, email: e.target.value }))}
                        placeholder="email@encgf-usmba.ac.ma"
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E60028]/30 focus:border-[#E60028] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">{t.formSubject}</label>
                    <select
                      value={formState.subject}
                      onChange={e => setFormState(s => ({ ...s, subject: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#E60028]/30 focus:border-[#E60028] transition-all"
                    >
                      <option value="">— Sélectionner un sujet —</option>
                      <option value="admission">Admission & Inscription</option>
                      <option value="platform">Problème Plateforme</option>
                      <option value="formation">Informations Formation</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">{t.formMsg}</label>
                    <textarea
                      rows={5} required value={formState.message}
                      onChange={e => setFormState(s => ({ ...s, message: e.target.value }))}
                      placeholder={t.formMsg}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#E60028]/30 focus:border-[#E60028] transition-all resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={formSending}
                    className="w-full bg-gradient-to-r from-[#E60028] to-[#A80A0B] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#E60028]/20 hover:shadow-[#E60028]/40 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {formSending ? (
                      <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi en cours...</>
                    ) : (
                      <><Send className="w-5 h-5" /> {t.formBtn}</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 bg-[#1F3A5F] dark:bg-[#030712] border-t border-[#1F3A5F] dark:border-white/5 text-slate-300">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-6">
          {/* Top grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-10 bg-white rounded-xl px-2 py-1 flex items-center shadow-md">
                  <img src="/logo-encg.png" alt="ENCG Fès" className="h-full object-contain" onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }} />
                </div>
                <div>
                  <div className="font-black text-xl text-white font-sans">ENCG Fès</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest">Smart ERP Platform</div>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
                {t.footerTagline} L'École Nationale de Commerce et de Gestion de Fès — USMBA.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                {['𝕏', 'in', 'f'].map((s) => (
                  <div key={s} className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer transition-colors">
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">{t.footerLinks}</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="https://encgf-usmba.ac.ma" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">Site Officiel ENCG</a></li>
                <li><a href="https://usmba.ac.ma" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-white transition-colors">Université USMBA</a></li>
                <li><Link to="/login" className="text-slate-400 hover:text-white transition-colors">Portail Étudiant</Link></li>
                <li><Link to="/login" className="text-slate-400 hover:text-white transition-colors">Espace Professeur</Link></li>
                <li><Link to="/login" className="text-slate-400 hover:text-white transition-colors">Administration</Link></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">{t.footerContact}</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#E60028] mt-0.5 shrink-0" />
                  <span className="text-slate-400 leading-relaxed">B.P. 81A, Route d'Imouzzer, Fès 30050</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#E60028] shrink-0" />
                  <span className="text-slate-400">+212 535 60 06 43</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#E60028] shrink-0" />
                  <span className="text-slate-400">contact@encgf-usmba.ac.ma</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10 mb-6" />

          {/* Bottom Row */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <p>{t.rights}</p>
            </div>
            <p className="flex items-center gap-1">
              {t.madeBy} <Sparkles className="w-3 h-3 text-[#E60028]" />
            </p>
          </div>
        </div>

        {/* Red accent bottom line */}
        <div className="h-1 bg-gradient-to-r from-[#E60028] via-[#FF4D6A] to-[#A80A0B]" />
      </footer>
    </div>
  );
}

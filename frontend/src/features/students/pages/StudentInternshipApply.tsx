import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft,Briefcase } from 'lucide-react';
import { InternshipApplyForm } from '../components/InternshipApplyForm';

export default function StudentInternshipApply() {
  const navigate = useNavigate();
  const { t } = useTranslation('internship');

  return (
    <div className="max-w-[1000px] mx-auto space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/students/internships')} 
          className="w-12 h-12 bg-white/10 text-white hover:bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-12 h-12 bg-primary/5 text-[#003a8c] rounded-2xl flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
          <Briefcase className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-white italic erp-page-title">{t('apply.title')}</h1>
          <p className="text-white/70 font-medium">{t('apply.subtitle')}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-8 shadow-sm border border-white/5 relative overflow-hidden text-foreground">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_2px_2px,_#000_1px,_transparent_0)] bg-[length:24px_24px]"></div>
        
        <div className="relative z-10">
          <InternshipApplyForm />
        </div>
      </div>

    </div>
  );
}

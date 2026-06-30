import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-qr-code';
import { Download, IdCard, Building2, User, Mail, Hash, BookOpen } from 'lucide-react';
import api from '@/shared/lib/api';

export default function DigitalCardPage() {
  const { t } = useTranslation('common');
  const cardRef = useRef<HTMLDivElement>(null);

  const { data: cardData, isLoading } = useQuery({
    queryKey: ['student-card'],
    queryFn: () => api.get('/v1/mobile/student/card').then((res) => res.data.data),
  });

  const handleDownloadPDF = () => {
    // In a real application, you would either use html2canvas + jsPDF 
    // or trigger a backend PDF generation endpoint.
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!cardData) return null;

  // The QR code URL would point to the public verification route
  const verificationUrl = `${window.location.origin}/verify/card/${cardData.qr_token}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <IdCard className="w-6 h-6 text-primary" />
            Carte d'Étudiant Digitale
          </h1>
          <p className="text-white/50 mt-1">
            Votre carte d'identité académique officielle.
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Télécharger PDF
        </button>
      </div>

      <div className="flex justify-center p-4">
        {/* Card Container */}
        <div
          ref={cardRef}
          className="relative w-full max-w-[340px] bg-card border border-white/10 shadow-2xl rounded-3xl overflow-hidden print:shadow-none print:border-slate-300"
        >
          {/* Header Area */}
          <div className="bg-primary p-6 text-center relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
            
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-white font-bold text-lg leading-tight uppercase tracking-wide">
                {cardData.institution.name}
              </h2>
              <p className="text-white/80 text-xs font-medium uppercase tracking-widest mt-1">
                Carte d'Étudiant
              </p>
            </div>
          </div>

          {/* Body Area */}
          <div className="p-6 space-y-6 relative">
            {/* Expiration Tag */}
            <div className="absolute top-4 right-4">
              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                {cardData.academic_year}
              </span>
            </div>

            <div className="flex gap-4">
              {/* Photo placeholder */}
              <div className="w-20 h-24 bg-white/5 rounded-xl border-2 border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {cardData.student.photo_url ? (
                  <img src={cardData.student.photo_url} alt="Photo" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white/50/50" />
                )}
              </div>
              
              <div className="space-y-1 pt-1">
                <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">Nom & Prénom</p>
                <p className="text-lg font-bold text-foreground leading-tight">
                  {cardData.student.name}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-white/50 mt-2">
                  <Hash className="w-3.5 h-3.5" />
                  <span className="font-mono">{cardData.student.cne}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 bg-white/5/50 p-2.5 rounded-lg border border-white/10/50">
                <BookOpen className="w-4 h-4 text-primary" />
                <div className="overflow-hidden">
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Filière</p>
                  <p className="text-sm font-semibold text-foreground truncate">{cardData.student.filiere}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/5/50 p-2.5 rounded-lg border border-white/10/50">
                <Mail className="w-4 h-4 text-primary" />
                <div className="overflow-hidden">
                  <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Email institutionnel</p>
                  <p className="text-xs font-semibold text-foreground truncate">{cardData.student.email}</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="pt-4 pb-2 flex flex-col items-center border-t border-dashed border-white/10">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 mb-2">
                <QRCode value={verificationUrl} size={100} level="H" />
              </div>
              <p className="text-[10px] text-white/50 font-medium text-center uppercase tracking-widest">
                Scannez pour vérifier l'authenticité
              </p>
              <p className="text-[10px] text-white/50 mt-1">
                Valable jusqu'au {new Date(cardData.expires_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

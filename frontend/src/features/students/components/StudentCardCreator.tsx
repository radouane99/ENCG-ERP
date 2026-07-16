import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Calendar, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Eye, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import api from '@/shared/lib/api';
import { Button } from '@/shared/components/ui/Button';
import { toast } from 'sonner';
import Barcode from './Barcode';

interface StudentCardCreatorProps {
  studentId?: string | number; // Required if Admin is creating for a student
  isAdmin?: boolean;
  onSuccess?: () => void;
}

export default function StudentCardCreator({ studentId, isAdmin = false, onSuccess }: StudentCardCreatorProps) {
  const { t } = useTranslation('common');
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Admin custom expiration date
  const [customExpiresAt, setCustomExpiresAt] = useState<string>('');
  
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  
  // The calculated preview data from the backend
  const [previewData, setPreviewData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and handle file select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate type (JPEG/PNG only)
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrorMsg('Seuls les formats JPEG et PNG sont acceptés.');
      toast.error('Format d\'image invalide');
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('La taille de l\'image ne doit pas dépasser 2 Mo.');
      toast.error('Image trop volumineuse');
      return;
    }

    // Generate local preview URL
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setPreviewData(null); // Reset calculated preview
  };

  // Call the backend to generate the card preview
  const handleGeneratePreview = async () => {
    if (!photoFile) {
      toast.error('Veuillez d\'abord sélectionner une photo.');
      return;
    }

    setLoadingPreview(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('photo', photoFile);
    
    if (studentId) {
      formData.append('student_id', studentId.toString());
    }
    if (customExpiresAt) {
      formData.append('expires_at', customExpiresAt);
    }

    try {
      const url = isAdmin ? '/student-cards/preview' : '/v1/student-portal/card/preview';
      const response = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      if (response.data.success) {
        setPreviewData(response.data.data);
        toast.success('Aperçu de la carte généré !');
      } else {
        setErrorMsg(response.data.message || 'Erreur lors de la génération de l\'aperçu.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Erreur serveur lors de la validation.';
      setErrorMsg(errMsg);
      toast.error(errMsg);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Persist the card to the database
  const handleSaveCard = async () => {
    if (!photoFile) return;

    setLoadingSubmit(true);
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    if (studentId) {
      formData.append('student_id', studentId.toString());
    }
    if (customExpiresAt) {
      formData.append('expires_at', customExpiresAt);
    }

    try {
      const url = isAdmin ? '/student-cards' : '/v1/student-portal/card';
      const response = await api.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success('Carte d\'étudiant enregistrée avec succès !');
        if (onSuccess) onSuccess();
      } else {
        toast.error(response.data.message || 'Erreur lors de la sauvegarde.');
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Erreur lors de l\'enregistrement de la carte.';
      toast.error(errMsg);
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          Générateur de Carte Étudiant Virtuelle
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Téléchargez une photo d'identité réglementaire pour générer et activer la carte digitale.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: Upload & Customization form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Photo d'identité (JPEG/PNG, max 2Mo)
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 transition-all rounded-xl p-6 text-center cursor-pointer bg-muted/30 flex flex-col items-center justify-center min-h-[160px] relative overflow-hidden group"
            >
              {photoPreview ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Upload className="w-6 h-6 text-white animate-bounce" />
                </div>
              ) : null}

              {photoPreview ? (
                <img src={photoPreview} alt="Aperçu local" className="max-h-[140px] rounded-lg object-contain" />
              ) : (
                <>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Cliquez pour choisir une photo</p>
                  <p className="text-xs text-muted-foreground mt-1">300x300px à 1200x1500px</p>
                </>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/jpeg,image/png" 
              className="hidden" 
            />
          </div>

          {/* Admin features */}
          {isAdmin && (
            <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3">
              <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                Options Administrateur
              </span>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Date d'expiration personnalisée (Optionnel)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    type="date" 
                    value={customExpiresAt}
                    onChange={(e) => setCustomExpiresAt(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Laisse vide pour appliquer la date d'expiration par défaut basée sur le niveau d'études.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 text-xs bg-destructive/10 text-destructive border border-destructive/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleGeneratePreview} 
              isLoading={loadingPreview}
              disabled={!photoFile || loadingSubmit}
              className="flex-1"
            >
              <Eye className="w-4 h-4" /> Aperçu
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveCard} 
              isLoading={loadingSubmit}
              disabled={!previewData || loadingPreview}
              className="flex-1"
            >
              <Check className="w-4 h-4" /> Activer la carte
            </Button>
          </div>
        </div>

        {/* Right Side: The Preview Card representation */}
        <div className="flex flex-col items-center justify-center bg-muted/10 rounded-2xl border border-border p-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
            {previewData ? 'Aperçu Réel (Généré)' : 'Aperçu de la Carte'}
          </span>

          {previewData ? (
            <div className="relative w-full max-w-[280px] bg-card border border-border shadow-lg rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="bg-primary p-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '12px 12px' }} />
                <h4 className="text-white font-bold text-xs leading-tight uppercase tracking-wider relative z-10">
                  {previewData.institution.name}
                </h4>
                <p className="text-white/80 text-[9px] font-semibold uppercase tracking-widest mt-0.5 relative z-10">
                  Carte d'Étudiant Digitale
                </p>
              </div>

              {/* Body */}
              <div className="p-4 space-y-4">
                <div className="absolute top-2 right-2">
                  <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">
                    {previewData.academic_year}
                  </span>
                </div>

                <div className="flex gap-3">
                  <div className="w-16 h-20 bg-muted rounded-lg border border-border flex items-center justify-center shrink-0 overflow-hidden">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] text-muted-foreground font-bold uppercase">Étudiant</p>
                    <p className="text-sm font-bold text-foreground leading-tight">{previewData.student.name}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">CNE: {previewData.student.cne}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border pt-3 text-xs">
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase block">Filière</span>
                    <span className="font-semibold text-foreground truncate block">{previewData.student.filiere}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase block">Groupe / Niveau</span>
                    <span className="font-semibold text-foreground block">{previewData.student.group || 'N/A'}</span>
                  </div>
                </div>

                {/* QR Section */}
                <div className="border-t border-dashed border-border pt-3 flex flex-col items-center">
                  <Barcode value={previewData.card_number} className="mb-2 bg-white/5 p-1 rounded-xl border border-border w-full" />
                  <div className="bg-white p-1 rounded-lg border border-border mb-1">
                    <QRCode value={`${window.location.origin}/verify/card/${previewData.qr_token}`} size={70} level="M" />
                  </div>
                  <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-widest text-center">
                    Authentification instantanée
                  </p>
                  <p className="text-[8px] text-muted-foreground text-center mt-1">
                    Expire le : {new Date(previewData.expires_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[280px] h-[340px] bg-muted/30 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <Upload className="w-8 h-8 mb-2 animate-pulse text-muted-foreground" />
              <p className="text-sm font-semibold">Aucun aperçu disponible</p>
              <p className="text-xs mt-1">Sélectionnez une photo et cliquez sur "Aperçu" pour générer la carte virtuelle.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

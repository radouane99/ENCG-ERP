import { useState } from 'react'
import { toast } from 'sonner'
import api from '@shared/lib/api'
import { useAuthStore } from '@stores/authStore'

interface CndpPrivacyModalProps {
  isOpen: boolean
  onClose: () => void
  lang?: string
}

export function CndpPrivacyModal({ isOpen, onClose, lang = 'fr' }: CndpPrivacyModalProps) {
  const [requesting, setRequesting] = useState(false)
  const token = useAuthStore((s) => s.token)

  if (!isOpen) return null
  const isAr = lang === 'ar'

  const requestExport = async () => {
    if (!token) {
      toast.info(isAr ? 'سجل الدخول لطلب نسخة من معطياتك.' : 'Connectez-vous pour demander une copie de vos données.')
      return
    }
    setRequesting(true)
    try {
      await api.post('/v1/privacy/export')
      toast.success(isAr ? 'تم تسجيل طلب الولوج (DSAR).' : 'Demande d’accès (DSAR) enregistrée. L’export sera disponible depuis votre profil.')
    } catch {
      toast.error(isAr ? 'تعذر تسجيل الطلب.' : 'Impossible d’enregistrer la demande DSAR.')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-card border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl pointer-events-auto max-h-[90vh] overflow-y-auto animate-scale-in" data-testid="cndp-privacy-modal">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-black text-foreground">
              {isAr ? 'حماية المعطيات ذات الطابع الشخصي (القانون 09-08)' : 'Protection des Données Personnelles — Loi 09-08'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-muted rounded-lg transition-colors pointer-events-auto"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 text-xs leading-relaxed text-muted-foreground">
            {isAr ? (
              <div className="space-y-3 text-right" dir="rtl">
                <p>تلتزم المدرسة الوطنية للتجارة والتسيير بفاس (ENCG Fès) بحماية خصوصيتك ومعطياتك الشخصية وفقًا لمقتضيات القانون رقم 09-08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي.</p>
                <p><strong>الغرض من المعالجة:</strong> يتم جمع المعطيات لتدبير ملفات الترشيح، التسجيل، تتبع المسار الدراسي والأنشطة الأكاديمية والمالية داخل المؤسسة.</p>
                <p><strong>حقوقك:</strong> بموجب القانون 09-08، تتوفرون على حق الولوج، التصحيح، والتعرض على معالجة معطياتكم الشخصية لأسباب مشروعة.</p>
                <p><strong>الاتصال:</strong> لممارسة هذه الحقوق، يرجى الاتصال بمصلحة الشؤون الطلابية أو عبر البريد الإلكتروني: <a href="mailto:cndp-privacy@encg-fes.ma" className="text-primary hover:underline">cndp-privacy@encg-fes.ma</a>.</p>
                <p className="border-t border-border pt-2 text-[10px] text-slate-500">تم التصريح بهذا المعالجة لدى اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي (CNDP) تحت رقم الترخيص: A-I-ENCG-0908.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p>L'École Nationale de Commerce et de Gestion de Fès (ENCG Fès) s'engage à protéger la vie privée des étudiants et des utilisateurs de sa plateforme conformément aux dispositions de la <strong>loi n° 09-08</strong> relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel.</p>
                <p><strong>Finalités du traitement :</strong> Les informations recueillies sur ce portail sont destinées exclusivement à la gestion des candidatures, des inscriptions administratives, du suivi pédagogique et de la scolarité.</p>
                <p><strong>Droits des utilisateurs :</strong> Conformément à la loi n° 09-08, vous bénéficiez d'un droit d'accès, de rectification et d'opposition pour des motifs légitimes aux informations qui vous concernent.</p>
                <p><strong>Exercice des droits :</strong> Vous pouvez exercer ces droits en vous adressant directement par écrit auprès du Service de Scolarité de l'ENCG Fès ou en envoyant un courriel à <a href="mailto:cndp-privacy@encg-fes.ma" className="text-primary hover:underline">cndp-privacy@encg-fes.ma</a>.</p>
                <p className="border-t border-border pt-2 text-[10px] text-slate-500">Ce traitement a été notifié et déclaré auprès de la Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP) sous le numéro de Déclaration/Autorisation N° A-I-ENCG-0908.</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={requestExport}
              disabled={requesting}
              className="w-full bg-slate-900 text-white font-bold py-2 rounded-xl text-xs hover:bg-slate-800 transition-colors pointer-events-auto disabled:opacity-60"
            >
              {requesting
                ? (isAr ? 'جاري الإرسال…' : 'Envoi…')
                : (isAr ? 'طلب نسخة من معطياتي (حق الولوج)' : 'Demander une copie de mes données (droit d’accès)')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-xl text-xs hover:bg-primary/90 transition-colors pointer-events-auto"
            >
              {isAr ? 'إغلاق' : 'Fermer'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

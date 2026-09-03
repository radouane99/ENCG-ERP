import { Link, useSearchParams } from 'react-router-dom'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'

export default function AdminPrintProfessorsConvocationPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id') || searchParams.get('sessionId') || '1'
  const targetProfId = searchParams.get('professor_id')

  const { data: convData, isLoading } = useQuery({
    queryKey: ['admin-print-professors-convocations', sessionId],
    queryFn: async () => {
      const res = await api.get(`/convocations/session/${sessionId}/list`)
      return res.data?.data || res.data || {}
    }
  })

  const allSurveillants = convData?.surveillants || []
  
  const filteredSurveillances = targetProfId
    ? allSurveillants.filter((s: any) => String(s.professor_id) === String(targetProfId))
    : allSurveillants

  const profName = filteredSurveillances[0]?.professor_name || 'Corps Professoral ENCG'
  const profEmail = filteredSurveillances[0]?.professor_email || ''
  const profCin = filteredSurveillances[0]?.cin || '—'
  const refCode = filteredSurveillances[0]?.qr_token || 'SURV-ENCG'

  return (
    <div className="min-h-screen bg-slate-100 p-8 pb-20 flex flex-col items-center font-sans">
      <div className="w-full max-w-[210mm] mb-6 flex justify-between items-center print:hidden">
        <Link to="/admin/convocations" className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <button 
          onClick={() => window.print()}
          className="h-10 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Imprimer / PDF
        </button>
      </div>

      {/* A4 Paper Container */}
      <div className="bg-white w-[210mm] min-h-[297mm] shadow-lg p-12 print:shadow-none print:w-auto print:h-auto print:p-0 flex flex-col relative border-x-4 border-yellow-500 print:border-none">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[#0f2863] pb-4 mb-8">
          <div className="w-1/3">
            <p className="text-[7px] font-bold text-[#0f2863] uppercase leading-tight">ROYAUME DU MAROC<br/>UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH<br/>ENCG FÈS</p>
          </div>
          <div className="w-1/3 text-center flex flex-col items-center">
            <img src="/logo-encg.png" alt="ENCG Fès" className="h-12 object-contain mb-2" />
            <h1 className="text-[10px] font-black text-[#0f2863] uppercase">ENCG FÈS</h1>
          </div>
          <div className="w-1/3 text-right">
            <p className="text-[7px] font-bold text-red-600 uppercase leading-tight">المملكة المغربية<br/>جامعة سيدي محمد بن عبد الله<br/>المدرسة الوطنية للتجارة والتسيير بفاس</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-[#0f2863] uppercase tracking-widest mb-2">CONVOCATION DE SURVEILLANCE D'EXAMENS</h2>
          <p className="text-sm font-bold text-slate-700">Année Académique : {new Date().getFullYear()}/{new Date().getFullYear() + 1} — Session d'Examens</p>
        </div>

        {/* Prof Info */}
        <div className="border border-yellow-500 rounded-lg p-6 mb-8 flex justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">NOM & PRÉNOM</p>
              <p className="text-lg font-black text-[#0f2863] uppercase">{profName}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">CIN & CONTACT</p>
              <p className="text-[11px] font-semibold text-slate-600">{profCin} {profEmail ? `• ${profEmail}` : ''}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-400 uppercase font-bold">Direction des Études</p>
            <p className="text-lg font-black text-blue-500">★ ENCG ★</p>
          </div>
        </div>

        <p className="text-sm italic text-slate-600 mb-4">
          Vous êtes prié(e) d'assurer la surveillance des épreuves d'examen aux dates et horaires indiqués ci-dessous :
        </p>

        {/* Table */}
        <div className="mb-12">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement des épreuves assignées...
            </div>
          ) : filteredSurveillances.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed rounded-xl">
              Aucune épreuve de surveillance enregistrée pour cette session.
            </div>
          ) : (
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr className="bg-[#0f2863] text-white">
                  <th className="py-3 px-3 font-bold text-center border border-[#0f2863]">DATE</th>
                  <th className="py-3 px-3 font-bold text-center border border-[#0f2863]">HORAIRE</th>
                  <th className="py-3 px-3 font-bold text-left border border-[#0f2863]">MODULE / MATIÈRE</th>
                  <th className="py-3 px-3 font-bold text-center border border-[#0f2863]">SALLE</th>
                  <th className="py-3 px-3 font-bold text-center border border-[#0f2863]">RÔLE</th>
                </tr>
              </thead>
              <tbody>
                {filteredSurveillances.map((sv: any, idx: number) => (
                  <tr key={idx} className="border border-[#0f2863]/20">
                    <td className="py-4 px-3 text-center border border-[#0f2863]/20 font-bold">{sv.exam_date || '—'}</td>
                    <td className="py-4 px-3 text-center font-bold border border-[#0f2863]/20">{sv.start_time || '—'}</td>
                    <td className="py-4 px-3 font-bold text-[#0f2863] border border-[#0f2863]/20">{sv.exam_name || '—'}</td>
                    <td className="py-4 px-3 text-center font-bold text-rose-700 border border-[#0f2863]/20">{sv.room_name || '—'}</td>
                    <td className="py-4 px-3 text-center font-black text-[#0f2863] border border-[#0f2863]/20">{sv.role || 'Surveillant'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Instructions */}
        <div className="border-l-4 border-yellow-500 bg-yellow-50/50 p-6 mb-12">
          <h3 className="font-bold text-[#0f2863] mb-4 uppercase tracking-wider text-sm">INSTRUCTIONS DE SURVEILLANCE AUX EXAMENS</h3>
          <ul className="list-disc pl-5 space-y-2 text-[10px] text-slate-700 font-medium">
            <li>Le surveillant <strong className="text-slate-900">principal</strong> est responsable de la distribution des sujets, de l'émargement des étudiants et du rassemblement des copies.</li>
            <li>Le surveillant <strong className="text-slate-900">assistant</strong> veille au maintien de l'ordre et à la bonne marche de l'épreuve.</li>
            <li>Veuillez vous présenter <strong className="text-slate-900">15 minutes avant le début de chaque épreuve</strong> pour retirer l'enveloppe de surveillance.</li>
            <li>Aucun étudiant ne peut entrer en salle après 20 minutes de retard après le début de l'épreuve.</li>
            <li>Tout incident (fraude, retard, problème de comportement) doit faire l'objet d'un rapport immédiat à la Scolarité.</li>
            <li>Les téléphones portables et appareils électroniques personnels ne sont pas autorisés en cours d'utilisation active dans la salle de surveillance.</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end mt-auto pt-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-800 rounded flex items-center justify-center text-white text-[10px] font-bold">
              QR
            </div>
            <div>
              <p className="text-[8px] font-bold text-slate-500">Vérification Officielle Surveillance ENCG Fès</p>
              <p className="text-[7px] text-slate-400">Réf : {refCode}</p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-[11px] font-bold text-[#0f2863] underline mb-4">La Direction des Études</p>
            <div className="w-24 h-24 rounded-full border-2 border-blue-500 mx-auto flex items-center justify-center flex-col">
              <p className="text-[6px] text-blue-500 font-bold uppercase mb-1">ENCG FÈS</p>
              <p className="text-lg font-black text-blue-500">★ ENCG ★</p>
              <p className="text-[6px] text-blue-500 font-bold uppercase mt-1">SCOLARITÉ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

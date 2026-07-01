import { Link } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'

export default function AdminPrintProfessorsConvocationPage() {
  const surveillances = [
    { date: '01/07/2026', time: '09:00 - 10:30', module: 'Introduction - Génie Informatique', groupe: 'Génie Informatique - Groupe 1', salle: 'Amphi Al Khwarizmi', role: 'Principal' },
    { date: '01/07/2026', time: '11:00 - 12:30', module: 'Avancé - Génie Informatique', groupe: 'Génie Informatique - Groupe 2', salle: 'Amphi Al Khwarizmi', role: 'Principal' },
    { date: '01/07/2026', time: '14:30 - 16:00', module: 'Introduction - Économie & Gestion', groupe: 'Économie & Gestion - Groupe 1', salle: 'Salle TD 01', role: 'Principal' },
    { date: '01/07/2026', time: '16:30 - 18:00', module: 'Avancé - Économie & Gestion', groupe: 'Économie & Gestion - Groupe 2', salle: 'Salle TD 01', role: 'Principal' },
    { date: '02/07/2026', time: '09:00 - 10:30', module: 'Avancé - Marketing & Commerce', groupe: 'Marketing & Commerce - Groupe 2', salle: 'Salle TD 02', role: 'Principal' },
  ]

  return (
    <div className="min-h-screen bg-slate-100 p-8 pb-20 flex flex-col items-center font-sans">
      <div className="w-full max-w-[210mm] mb-6 flex justify-between items-center print:hidden">
        <Link to="/admin/convocations" className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <button 
          onClick={() => window.print()}
          className="h-10 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" /> Imprimer / PDF
        </button>
      </div>

      {/* A4 Paper Container */}
      <div className="bg-white w-[210mm] min-h-[297mm] shadow-lg p-12 print:shadow-none print:w-auto print:h-auto print:p-0 flex flex-col relative border-x-4 border-yellow-500 print:border-none">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-[#0f2863] pb-4 mb-8">
          <div className="w-1/3">
            <p className="text-[7px] font-bold text-[#0f2863] uppercase leading-tight">ROYAUME DU MAROC<br/>UNIVERSITÉ PRIVÉE DE FÈS<br/>SERVICE DE LA SCOLARITÉ</p>
          </div>
          <div className="w-1/3 text-center flex flex-col items-center">
            <img src="/logo-encg.png" alt="UPF" className="h-12 object-contain mb-2" />
            <h1 className="text-[10px] font-black text-[#0f2863] uppercase">UNIVERSITÉ PRIVÉE DE FÈS</h1>
          </div>
          <div className="w-1/3 text-right">
            <p className="text-[7px] font-bold text-red-600 uppercase leading-tight">المملكة المغربية<br/>الجامعة الخاصة لفاس<br/>مصلحة الشؤون الطلابية</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-[#0f2863] uppercase tracking-widest mb-2">CONVOCATION DE SURVEILLANCE D'EXAMENS</h2>
          <p className="text-sm font-bold text-slate-700">Année Académique : 2025/2026 — Session : Normale Automne</p>
        </div>

        {/* Prof Info */}
        <div className="border border-yellow-500 rounded-lg p-6 mb-8 flex justify-between">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">NOM & PRÉNOM</p>
              <p className="text-lg font-black text-[#0f2863] uppercase">PROF. HICHAM ALAOUI</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">ADRESSE EMAIL</p>
              <p className="text-sm font-bold text-slate-700">hicham.alaoui@usmba.ac.ma</p>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">DÉPARTEMENT</p>
            <p className="text-base font-bold text-slate-800">Marketing</p>
          </div>
        </div>

        <p className="text-sm italic text-slate-600 mb-4">
          Vous êtes prié(e) d'assurer la surveillance des épreuves d'examen aux dates et horaires indiqués ci-dessous :
        </p>

        {/* Table */}
        <div className="mb-12">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#0f2863] text-white">
                <th className="py-3 px-3 font-bold text-center border border-[#0f2863]">DATE</th>
                <th className="py-3 px-3 font-bold text-center border border-[#0f2863]">HORAIRE</th>
                <th className="py-3 px-3 font-bold text-left border border-[#0f2863]">MODULE / MATIÈRE</th>
                <th className="py-3 px-3 font-bold text-left border border-[#0f2863]">GROUPE</th>
                <th className="py-3 px-3 font-bold text-center border border-[#0f2863]">SALLE</th>
                <th className="py-3 px-3 font-bold text-center border border-[#0f2863]">RÔLE</th>
              </tr>
            </thead>
            <tbody>
              {surveillances.map((sv, idx) => (
                <tr key={idx} className="border border-[#0f2863]/20">
                  <td className="py-4 px-3 text-center border border-[#0f2863]/20">{sv.date}</td>
                  <td className="py-4 px-3 text-center font-bold border border-[#0f2863]/20">{sv.time}</td>
                  <td className="py-4 px-3 font-bold text-[#0f2863] border border-[#0f2863]/20">{sv.module}</td>
                  <td className="py-4 px-3 text-slate-600 border border-[#0f2863]/20">{sv.groupe}</td>
                  <td className="py-4 px-3 text-center font-bold text-rose-700 border border-[#0f2863]/20">{sv.salle}</td>
                  <td className="py-4 px-3 text-center font-black text-[#0f2863] border border-[#0f2863]/20">{sv.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <div className="w-16 h-16 bg-slate-800 rounded">
               {/* Mock QR Code */}
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=UPF-SURV-2026-000001`} alt="QR" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[8px] font-bold text-slate-500">Vérification Officielle Surveillance UPF</p>
              <p className="text-[7px] text-slate-400">Réf : SURV-2026-000001</p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-[11px] font-bold text-[#0f2863] underline mb-4">La Direction des Études</p>
            <div className="w-24 h-24 rounded-full border-2 border-blue-500 mx-auto flex items-center justify-center flex-col">
              <p className="text-[6px] text-blue-500 font-bold uppercase mb-1">UNIVERSITÉ PRIVÉE</p>
              <p className="text-lg font-black text-blue-500">★ UPF ★</p>
              <p className="text-[6px] text-blue-500 font-bold uppercase mt-1">SCOLARITÉ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

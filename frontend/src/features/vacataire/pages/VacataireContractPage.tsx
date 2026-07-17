import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Download, CheckCircle, Clock, Printer } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { Spinner } from '@shared/components/ui/Spinner'
import { toast } from 'sonner'

export default function VacataireContractPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: vacataire, isLoading } = useQuery({
    queryKey: ['hr-vacataires', id],
    queryFn: () => api.get(`/admin/hr/vacataires/${id}`).then(res => res.data.data),
    enabled: !!id
  })

  const markSignedMutation = useMutation({
    mutationFn: () => api.put(`/admin/hr/vacataires/${id}`, { status: 'signed' }),
    onSuccess: () => {
      toast.success('Contrat marqué comme signé')
      queryClient.invalidateQueries({ queryKey: ['hr-vacataires', id] })
    }
  })

  if (isLoading) return <div className="p-12 flex justify-center"><Spinner className="w-8 h-8 text-primary" /></div>

  const contract = vacataire?.vacation_contracts?.[0] || vacataire?.contract || {}
  return (
    <div className="space-y-6 animate-in p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/hr/vacataires')} className="p-2 bg-card border rounded-lg hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contrat de Vacation N° CT-{new Date().getFullYear()}-{id}</h1>
            <p className="text-muted-foreground text-sm mt-1">Génération et signature du contrat d'engagement.</p>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="px-4 py-2 bg-card border rounded-lg font-medium hover:bg-muted text-sm flex items-center gap-2">
             <Printer className="w-4 h-4" /> Imprimer
           </button>
           <button onClick={() => {
              window.open(api.defaults.baseURL?.replace('/api', '') + `/api/admin/hr/vacataires/${id}/contract-pdf`, '_blank');
           }} className="px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm flex items-center gap-2">
             <Download className="w-4 h-4" /> Télécharger PDF
           </button>
        </div>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm p-8">
         <div className="text-center mb-8">
            <h2 className="text-xl font-bold uppercase underline mb-2">CONTRAT DE VACATION</h2>
            <p className="text-sm font-medium">Année Universitaire 2025/2026</p>
         </div>
         
          <div className="space-y-6 text-sm leading-relaxed">
            <p>
              Entre les soussignés : <br/>
              L'École Nationale de Commerce et de Gestion (ENCG), représentée par son Directeur, d'une part,
            </p>
            <p>
              Et : <br/>
              <span className="font-bold">M. / Mme :</span> {vacataire?.first_name} {vacataire?.last_name} <br/>
              <span className="font-bold">CIN :</span> {vacataire?.cin || 'Non renseigné'} <br/>
              <span className="font-bold">Adresse :</span> {vacataire?.address || 'Non renseigné'} <br/>
              D'autre part,
            </p>
            
            <p className="font-bold border-b pb-2 mt-6">Il a été convenu ce qui suit :</p>
            
            <div>
              <p className="font-bold mb-2">Article 1 : Objet de l'engagement</p>
              <p>Le vacataire s'engage à assurer un enseignement de : <span className="font-bold">{contract?.module?.name || 'Non spécifié'}</span> (Volume horaire : {contract?.agreed_hours || 0}h).</p>
            </div>
            
            <div>
              <p className="font-bold mb-2">Article 2 : Rémunération</p>
              <p>En contrepartie, le vacataire percevra une indemnité calculée sur la base du taux horaire réglementaire en vigueur, soit <span className="font-bold">{contract?.hourly_rate || 0} DH net / heure</span>, payable après service fait et signature des fiches d'émargement.</p>
            </div>
            
            <div>
              <p className="font-bold mb-2">Article 3 : Résiliation</p>
              <p>Le présent contrat peut être résilié de plein droit par l'Administration en cas de manquement grave aux obligations pédagogiques.</p>
            </div>
         </div>
         
         <div className="mt-12 pt-8 border-t flex justify-between px-10">
            <div className="text-center">
              <p className="font-bold mb-8">Signature du Vacataire</p>
              <p className="text-muted-foreground italic text-xs">Lu et approuvé</p>
            </div>
            <div className="text-center">
              <p className="font-bold mb-8">Le Directeur de l'ENCG</p>
              <p className="text-muted-foreground italic text-xs">Cachet et signature</p>
            </div>
         </div>
      </div>
      
      <div className={cn("flex items-center justify-between border p-4 rounded-xl", contract?.status === 'signed' ? "bg-green-50 text-green-800 border-green-200" : "bg-blue-50 text-blue-800 border-blue-200")}>
         <div className="flex items-center gap-3">
            <CheckCircle className={cn("w-5 h-5", contract?.status === 'signed' ? "text-green-600" : "text-blue-600")} />
            <div>
               <p className="font-bold text-sm">Statut du contrat : {contract?.status === 'signed' ? 'Signé' : 'Généré et en attente de signature'}</p>
               <p className="text-xs mt-0.5 opacity-80">Généré le {new Date(contract?.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
         </div>
         {contract?.status !== 'signed' && (
           <button onClick={() => markSignedMutation.mutate()} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Marquer comme signé
           </button>
         )}
      </div>
    </div>
  )
}

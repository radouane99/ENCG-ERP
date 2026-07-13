import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  FileText, ShieldCheck, Printer, Download, Clock,
  Search, CheckCircle2, XCircle, FileBadge, GripVertical
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { Input } from '@shared/components/ui/Input'
import { toast } from 'sonner'

export default function DocumentsAttestationsPage() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const [search, setSearch] = useState('')
  const [selectedDoc, setSelectedDoc] = useState<{url: string, title: string} | null>(null)

  // Mutations
  const generatePdfMutation = useMutation({
    mutationFn: ({ studentId, type }: { studentId: number, type: string }) => 
      api.post('/documents/generate-attestation', { student_id: studentId, type }),
    onSuccess: (res) => {
      toast.success(res.data.message || (isRtl ? 'تم إنشاء الوثيقة بنجاح' : 'Document PDF généré avec succès'))
      refetch()
    },
    onError: () => toast.error(isRtl ? 'حدث خطأ أثناء الإنشاء' : 'Erreur lors de la génération du document')
  })

  // Fetch requests from backend
  const { data: fetchRequestsRes, isLoading, refetch } = useQuery({
    queryKey: ['admin-document-requests'],
    queryFn: () => api.get('/admin/document-requests').then(res => res.data)
  })

  const requests = fetchRequestsRes?.data || [];

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const reqId = parseInt(draggableId.split('-')[1]);
    const newStatus = destination.droppableId; // 'approved' or 'rejected'

    let rejection_reason;
    if (newStatus === 'rejected') {
      rejection_reason = prompt(isRtl ? 'سبب الرفض:' : 'Raison du rejet:') || undefined;
      if (!rejection_reason && newStatus === 'rejected') {
        toast.error("Raison de rejet obligatoire");
        return;
      }
    }

    try {
      await api.patch('/admin/document-requests/' + reqId + '/status', {
        status: newStatus === 'approved' ? 'ready' : 'rejected',
        admin_notes: newStatus === 'rejected' ? { rejection_reason } : undefined
      });
      toast.success(isRtl ? 'تم التحديث بنجاح' : 'Mis à jour avec succès');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const pendingRequests = requests.filter((r: any) => r.status === 'pending');
  const approvedRequests = requests.filter((r: any) => r.status === 'approved' || r.status === 'ready' || r.status === 'processed');
  const rejectedRequests = requests.filter((r: any) => r.status === 'rejected');


  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
      case 'ready': 
      case 'processed': return <Badge className="bg-emerald-500/10 text-emerald-600 border-none"><CheckCircle2 size={12} className="me-1"/> {isRtl ? 'مُعالج' : 'Traité'}</Badge>
      case 'rejected': return <Badge className="bg-red-500/10 text-red-600 border-none"><XCircle size={12} className="me-1"/> {isRtl ? 'مرفوض' : 'Rejeté'}</Badge>
      default: return <Badge className="bg-amber-500/10 text-amber-600 border-none"><Clock size={12} className="me-1"/> {isRtl ? 'قيد الانتظار' : 'En attente'}</Badge>
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-6 pb-20 animate-in fade-in" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#1F3A5F] to-[#2A4D7C] rounded-[2rem] p-8 text-white shadow-xl shadow-[#1F3A5F]/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay pointer-events-none"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center border border-white/20">
            <FileBadge className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 tracking-tight">
              {isRtl ? 'إصدار الوثائق (مضادة للتزوير)' : 'Guichet Unique : Documents Officiels'}
            </h1>
            <p className="text-white/80 font-medium text-sm">
              {isRtl ? 'طلبات الطلاب، الشواهد، ورمز التحقق (QR)' : 'Traitement des demandes étudiantes et sécurisation anti-fraude (QR Code).'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Anti-Fraud Banner */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
            <div className="absolute -end-4 -top-4 opacity-10 pointer-events-none"><ShieldCheck size={120} className="text-emerald-500" /></div>
            <h3 className="font-bold text-lg mb-2 text-emerald-800 dark:text-emerald-400 flex items-center gap-2 relative z-10">
              <ShieldCheck size={20} />
              {isRtl ? 'نظام مكافحة التزوير' : 'Système Anti-Fraude'}
            </h3>
            <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mb-6 relative z-10">
              {isRtl ? 'جميع الوثائق الصادرة تحمل رمز استجابة سريعة (QR Code) مشفرًا لضمان صحتها.' : 'Tous les documents émis incluent un QR Code certifié garantissant leur authenticité lors d\'une vérification externe.'}
            </p>
            <Button variant="outline" className="w-full bg-[hsl(var(--background))] border-emerald-200 text-emerald-700 hover:bg-emerald-50 relative z-10">
              {isRtl ? 'تجربة التحقق من وثيقة' : 'Tester la vérification PDF'}
            </Button>
          </div>

          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] p-6 shadow-sm">
            <h3 className="font-bold text-[hsl(var(--foreground))] mb-4">{isRtl ? 'إصدار سريع' : 'Édition Rapide'}</h3>
            <div className="space-y-3">
              <Input placeholder={isRtl ? 'CNE أو رقم الطالب...' : 'CNE ou Numéro Étudiant...'} />
              <select className="w-full border border-[hsl(var(--border))] rounded-xl px-4 py-2.5 text-sm font-semibold bg-[hsl(var(--background))] focus:ring-2 focus:ring-[hsl(var(--color-primary))/20] outline-none">
                <option value="scolarite">{isRtl ? 'شهادة مدرسية' : 'Attestation de scolarité'}</option>
                <option value="releve">{isRtl ? 'كشف النقط' : 'Relevé de notes global'}</option>
              </select>
              <Button 
                variant="primary" 
                className="w-full" 
                onClick={() => generatePdfMutation.mutate({ studentId: 1, type: 'scolarite' })}
                isLoading={generatePdfMutation.isPending}
                icon={<Printer size={16} />}
              >
                {isRtl ? 'توليد PDF' : 'Générer PDF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="lg:col-span-2">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-[hsl(var(--border))] flex flex-wrap gap-4 items-center justify-between bg-[hsl(var(--muted)/30)]">
              <h2 className="font-bold text-lg text-[hsl(var(--foreground))] px-2">
                {isRtl ? 'الطلبات الواردة من بوابة الطالب' : 'Demandes entrantes (Portail Étudiant)'}
              </h2>
              <div className="w-64">
                <Input 
                  placeholder={isRtl ? 'بحث برقم الطالب، الاسم...' : 'Rechercher par Matricule, Nom...'} 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  icon={<Search size={16}/>}
                />
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm text-start">
                <thead className="bg-[hsl(var(--muted)/50)] text-[hsl(var(--muted-foreground))] font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4">{isRtl ? 'الطالب' : 'Étudiant'}</th>
                    <th className="px-6 py-4">{isRtl ? 'الوثيقة' : 'Document'}</th>
                    <th className="px-6 py-4">{isRtl ? 'تاريخ الطلب' : 'Date Demande'}</th>
                    <th className="px-6 py-4">{isRtl ? 'الحالة' : 'Statut'}</th>
                    <th className="px-6 py-4 text-end">{isRtl ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                        Chargement des demandes...
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[hsl(var(--muted-foreground))]">
                        Aucune demande trouvée
                      </td>
                    </tr>
                  ) : requests.map((req: any) => (
                    <tr key={req.id} className="hover:bg-[hsl(var(--muted)/30)] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-[hsl(var(--foreground))]">{req.person}</p>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-medium">{req.role}</p>
                      </td>
                      <td className="px-6 py-4 font-medium text-[hsl(var(--foreground))]">
                        {req.type}
                      </td>
                      <td className="px-6 py-4 text-[hsl(var(--muted-foreground))] text-xs">
                        {req.time}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(req.status)}
                      </td>
                      <td className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {req.status === 'pending' ? (
                            <>
                              <button onClick={() => generatePdfMutation.mutate({ studentId: req.id, type: req.type })} className="p-2 text-blue-600 hover:bg-blue-50 bg-blue-500/10 rounded-lg transition-colors" title="Générer & Traiter">
                                <Printer size={16} />
                              </button>
                              <button className="p-2 text-red-600 hover:bg-red-50 bg-red-500/10 rounded-lg transition-colors" title="Rejeter">
                                <XCircle size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => setSelectedDoc({url: req.url || '', title: req.type})} className="p-2 text-blue-600 hover:bg-blue-50 bg-blue-500/10 rounded-lg transition-colors" title="Aperçu">
                                <Search size={16} />
                              </button>
                              <a href={req.url} download className="p-2 text-emerald-600 hover:bg-emerald-50 bg-emerald-500/10 rounded-lg transition-colors" title="Télécharger copie">
                                <Download size={16} />
                              </a>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl h-[80vh] flex flex-col rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold">{selectedDoc.title}</h3>
              <button onClick={() => setSelectedDoc(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><XCircle size={20}/></button>
            </div>
            <iframe src={selectedDoc.url} className="flex-1 w-full h-full" />
          </div>
        </div>
      )}
    </div>
  )
}

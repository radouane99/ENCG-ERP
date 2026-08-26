import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Kanban, MoreVertical, Plus, MessageSquare, Paperclip, Calendar as CalendarIcon, Move, CheckCircle2, User, Building, Search, Filter } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import { toast } from 'sonner';

export default function ProfessorProjectsKanban() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: internships = [], isLoading } = useQuery({
    queryKey: ['professor-internships'],
    queryFn: async () => {
      const res = await api.get('/professor/internships/supervised');
      return res.data.internships || [];
    }
  });

  // Mutation to persist status on drag and drop
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number | string; status: string }) => {
      const res = await api.post('/professor/internships/update-status', {
        internship_id: Number(id),
        status,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Statut du projet PFE mis à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['professor-internships'] });
    }
  });

  const columnsMap: Record<string, { title: string; color: string; status: string }> = {
    'col-1': { title: 'Sujet Validé', color: 'bg-blue-100 text-blue-900 border-blue-200', status: 'approved' },
    'col-2': { title: 'En Rédaction / Stage', color: 'bg-amber-100 text-amber-900 border-amber-200', status: 'active' },
    'col-3': { title: 'Rapport Déposé', color: 'bg-purple-100 text-purple-900 border-purple-200', status: 'submitted' },
    'col-4': { title: 'Prêt pour Soutenance', color: 'bg-emerald-100 text-emerald-900 border-emerald-200', status: 'completed' },
  };

  const initialColumns = React.useMemo(() => {
    const cols = [
      { id: 'col-1', title: 'Sujet Validé', color: 'bg-blue-100 text-blue-900', status: 'approved', cards: [] as any[] },
      { id: 'col-2', title: 'En Rédaction / Stage', color: 'bg-amber-100 text-amber-900', status: 'active', cards: [] as any[] },
      { id: 'col-3', title: 'Rapport Déposé', color: 'bg-purple-100 text-purple-900', status: 'submitted', cards: [] as any[] },
      { id: 'col-4', title: 'Prêt pour Soutenance', color: 'bg-emerald-100 text-emerald-900', status: 'completed', cards: [] as any[] }
    ];

    const sourceData = internships;

    sourceData.forEach((internship: any) => {
      const studentName = internship.student ? `${internship.student.first_name} ${internship.student.last_name}` : 'Étudiant ENCG';
      const card = {
        id: internship.id.toString(),
        title: internship.topic || (internship.company_name ? `Stage chez ${internship.company_name}` : 'Projet de Fin d\'Études'),
        company: internship.company_name || 'Entreprise Partenaire',
        student: studentName,
        date: internship.updated_at ? new Date(internship.updated_at).toLocaleDateString('fr-FR') : ''
      };

      if (internship.status === 'pending' || internship.status === 'approved') {
        cols[0].cards.push(card);
      } else if (internship.status === 'active') {
        cols[1].cards.push(card);
      } else if (internship.status === 'submitted') {
        cols[2].cards.push(card);
      } else {
        cols[3].cards.push(card);
      }
    });

    return cols;
  }, [internships]);

  const [columns, setColumns] = useState(initialColumns);

  React.useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const [draggedCard, setDraggedCard] = useState<{ colId: string; cardId: string } | null>(null);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8 text-[#003a8c]" /></div>;
  }

  const handleDragStart = (e: React.DragEvent, colId: string, cardId: string) => {
    setDraggedCard({ colId, cardId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (!draggedCard || draggedCard.colId === targetColId) return;

    const targetStatus = columns.find(c => c.id === targetColId)?.status || 'approved';

    setColumns(prevCols => {
      const newCols = [...prevCols];
      const sourceColIdx = newCols.findIndex(c => c.id === draggedCard.colId);
      const targetColIdx = newCols.findIndex(c => c.id === targetColId);
      const cardIdx = newCols[sourceColIdx].cards.findIndex(c => c.id === draggedCard.cardId);
      const card = newCols[sourceColIdx].cards[cardIdx];

      newCols[sourceColIdx] = {
        ...newCols[sourceColIdx],
        cards: newCols[sourceColIdx].cards.filter(c => c.id !== draggedCard.cardId)
      };

      newCols[targetColIdx] = {
        ...newCols[targetColIdx],
        cards: [...newCols[targetColIdx].cards, card]
      };

      return newCols;
    });

    updateStatusMutation.mutate({ id: draggedCard.cardId, status: targetStatus });
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 font-sans animate-in fade-in duration-500 flex flex-col space-y-6 pb-28">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Kanban className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Kanban de Suivi des Projets de Fin d'Études (PFE)</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Glissez et déposez les cartes pour mettre à jour l'état d'avancement des étudiants encadrés.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder:text-slate-400 outline-none backdrop-blur-md focus:bg-white/20 transition-all w-60"
            />
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
        {columns.map(col => {
          const filteredCards = col.cards.filter(c => 
            !searchTerm || c.student.toLowerCase().includes(searchTerm.toLowerCase()) || c.title.toLowerCase().includes(searchTerm.toLowerCase())
          );

          return (
            <div 
              key={col.id} 
              className="bg-slate-50/80 rounded-3xl border border-slate-200/80 flex flex-col min-h-[500px] p-4 space-y-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2">
                  <span className={cn("px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider", col.color)}>
                    {col.title}
                  </span>
                  <span className="text-xs font-black text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                    {filteredCards.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {filteredCards.map(card => (
                  <div 
                    key={card.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, col.id, card.id)}
                    onDragEnd={handleDragEnd}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg uppercase tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3" /> {card.student}
                      </span>
                      <Move className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                    
                    <h3 className="font-black text-sm text-slate-900 leading-snug">
                      {card.title}
                    </h3>
                    
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" /> {card.company}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" /> {card.date}
                      </span>
                      <span className="text-emerald-600 font-extrabold">ENCG Fès</span>
                    </div>
                  </div>
                ))}

                {filteredCards.length === 0 && (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-xs font-bold text-slate-400">
                    Glissez un projet ici
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Kanban, MoreVertical, Plus, MessageSquare, Paperclip, Calendar as CalendarIcon, Move } from 'lucide-react';
import { cn } from '@shared/lib/utils';

import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';

export default function ProfessorProjectsKanban() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const isRtl = i18n.language === 'ar';
  const { data: internships, isLoading } = useQuery({
    queryKey: ['professor-internships'],
    queryFn: async () => {
      const res = await api.get('/professor/internships/supervised');
      return res.data.internships;
    }
  });
  const initialColumns = React.useMemo(() => {
    const cols = [
      { id: 'col-1', title: 'Sujet Validé', color: 'bg-blue-100 text-blue-800', cards: [] as any[] },
      { id: 'col-2', title: 'En Développement', color: 'bg-amber-100 text-amber-800', cards: [] as any[] },
      { id: 'col-3', title: 'Rapport Soumis', color: 'bg-purple-100 text-purple-800', cards: [] as any[] },
      { id: 'col-4', title: 'Prêt pour Soutenance', color: 'bg-emerald-100 text-emerald-800', cards: [] as any[] }
    ];

    if (internships) {
      internships.forEach((internship: any) => {
        const card = {
          id: internship.id.toString(),
          title: internship.company_name ? `Projet chez ${internship.company_name}` : 'Projet',
          team: internship.student ? `${internship.student.first_name} ${internship.student.last_name}` : 'Étudiant',
          members: 1,
          date: internship.updated_at ? new Date(internship.updated_at).toLocaleDateString() : 'Récent'
        };

        if (internship.status === 'pending' || internship.status === 'approved') {
          cols[0].cards.push(card);
        } else if (internship.status === 'active') {
          cols[1].cards.push(card);
        } else if (internship.status === 'completed') {
          cols[3].cards.push(card);
        } else {
          cols[2].cards.push(card);
        }
      });
    }
    return cols;
  }, [internships]);

  const [columns, setColumns] = useState(initialColumns);

  React.useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const [draggedCard, setDraggedCard] = useState<{colId: string, cardId: string} | null>(null);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="w-8 h-8 text-[#003a8c]" /></div>;
  }

  const handleDragStart = (e: React.DragEvent, colId: string, cardId: string) => {
    setDraggedCard({ colId, cardId });
    e.dataTransfer.effectAllowed = 'move';
    // Small delay to allow the drag image to be generated before styling
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.style.opacity = '0.5';
      }
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.style.opacity = '1';
    }
    setDraggedCard(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    if (!draggedCard) return;

    if (draggedCard.colId === targetColId) return;

    setColumns(prevCols => {
      const newCols = [...prevCols];
      
      const sourceColIdx = newCols.findIndex(c => c.id === draggedCard.colId);
      const targetColIdx = newCols.findIndex(c => c.id === targetColId);
      
      const cardIdx = newCols[sourceColIdx].cards.findIndex(c => c.id === draggedCard.cardId);
      const card = newCols[sourceColIdx].cards[cardIdx];

      // Remove from source
      newCols[sourceColIdx] = {
        ...newCols[sourceColIdx],
        cards: newCols[sourceColIdx].cards.filter(c => c.id !== draggedCard.cardId)
      };

      // Add to target
      newCols[targetColIdx] = {
        ...newCols[targetColIdx],
        cards: [...newCols[targetColIdx].cards, card]
      };

      return newCols;
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto p-6 font-sans animate-in fade-in zoom-in duration-500 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#001A4B] to-[#1a365d] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Kanban className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#001A4B] italic">Kanban des Projets (PFE)</h1>
            <p className="text-sm text-white/50">Gérez l'avancement des projets de fin d'études et mini-projets de vos groupes.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <select className="bg-white border border-white/10 text-sm font-bold rounded-xl px-4 py-2 outline-none shadow-sm">
            <option>Semestre 6 - PFE</option>
            <option>Semestre 4 - Mini Projets</option>
          </select>
          <button className="bg-[#e6007e] text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-[#cc006f] transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nouveau Groupe
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto custom-scrollbar pb-4 flex gap-6">
        {columns.map(col => (
          <div 
            key={col.id} 
            className="w-80 shrink-0 flex flex-col bg-white/[0.02]/50 rounded-3xl border border-white/5"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className={cn("px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest", col.color)}>
                  {col.title}
                </span>
                <span className="text-xs font-bold text-gray-400">{col.cards.length}</span>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-white/50">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Cards Container */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
              {col.cards.map(card => (
                <div 
                  key={card.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, col.id, card.id)}
                  onDragEnd={handleDragEnd}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-white/5 cursor-move hover:shadow-md transition-all group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-[#e6007e] bg-pink-50 px-2 py-1 rounded-md uppercase tracking-wider">
                      {card.team}
                    </span>
                    <Move className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <h3 className="font-bold text-white leading-snug mb-4">{card.title}</h3>
                  
                  <div className="flex items-center justify-between text-gray-400">
                    <div className="flex -space-x-2">
                      {Array.from({ length: card.members }).map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white/70">
                          E{i+1}
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> 2
                      </div>
                      <div className="flex items-center gap-1">
                        <Paperclip className="w-3 h-3" /> 1
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <CalendarIcon className="w-3 h-3" /> Dérniere Maj: {card.date}
                  </div>
                </div>
              ))}

              {/* Empty Drop Zone visually */}
              {col.cards.length === 0 && (
                <div className="h-24 border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-400">Glissez une carte ici</span>
                </div>
              )}
            </div>

            {/* Add Card Button */}
            <div className="p-4 border-t border-white/5">
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-white rounded-xl border border-white/10 text-sm font-bold text-white/50 hover:text-white hover:border-gray-300 transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

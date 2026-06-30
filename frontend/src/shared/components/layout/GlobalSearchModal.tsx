import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, BookOpen, MapPin, ChevronRight, X, User } from 'lucide-react';
import api from '@/shared/lib/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await api.get(`/dashboard/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'student': return <Users className="w-5 h-5 text-blue-500" />;
      case 'professor': return <User className="w-5 h-5 text-indigo-500" />;
      case 'module': return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case 'room': return <MapPin className="w-5 h-5 text-amber-500" />;
      default: return <Search className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 sm:px-6">
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none px-4 text-foreground placeholder:text-muted-foreground"
            placeholder="Rechercher des étudiants, professeurs, modules..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="ml-2 px-2 py-1 bg-muted rounded text-[10px] text-muted-foreground font-mono font-medium hidden sm:block">
            ESC
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.url)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Aucun résultat trouvé pour "{query}"</p>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">Recherches Récentes</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span onClick={() => setQuery('Fatima')} className="px-3 py-1.5 bg-muted/50 text-muted-foreground text-xs rounded-full cursor-pointer hover:bg-muted transition-colors">Fatima ALAOUI</span>
                <span onClick={() => setQuery('Analyse')} className="px-3 py-1.5 bg-muted/50 text-muted-foreground text-xs rounded-full cursor-pointer hover:bg-muted transition-colors">Analyse Financière</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

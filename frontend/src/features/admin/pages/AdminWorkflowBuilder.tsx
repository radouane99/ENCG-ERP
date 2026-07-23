import React, { useState, useRef } from 'react';
import { 
  Network, Plus, Play, Settings, Save, AlertCircle, Check, 
  GitBranch, Bell, Database, Zap, Trash2, X, Sliders, RefreshCw, Layers 
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  color: 'blue' | 'purple' | 'indigo' | 'rose' | 'emerald';
  title: string;
  subtitle: string;
  expression: string;
  x: number;
  y: number;
}

export default function AdminWorkflowBuilder() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'node-1',
      type: 'trigger',
      color: 'blue',
      title: 'Justificatif Médical Reçu',
      subtitle: 'Portail Étudiant',
      expression: "payload.type === 'MEDICAL'",
      x: 60,
      y: 80,
    },
    {
      id: 'node-2',
      type: 'condition',
      color: 'purple',
      title: 'Validation Médecin',
      subtitle: 'Service Santé',
      expression: "document.status === 'VALIDATED'",
      x: 440,
      y: 80,
    },
    {
      id: 'node-3',
      type: 'action',
      color: 'indigo',
      title: 'Mise à jour Absences',
      subtitle: 'Base de données',
      expression: 'absence.status = "JUSTIFIED"',
      x: 840,
      y: 30,
    },
    {
      id: 'node-4',
      type: 'action',
      color: 'rose',
      title: 'Notification Refus',
      subtitle: 'Email & Push',
      expression: 'notify(student, "Justificatif refusé")',
      x: 840,
      y: 230,
    },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-1');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeSimStep, setActiveSimStep] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings State
  const [workflowName, setWorkflowName] = useState('Gestion des Justificatifs Médicaux');
  const [autoExecute, setAutoExecute] = useState(true);
  const [logLevel, setLogLevel] = useState('detailed');

  // Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedNodeId(id);
    setDraggingNodeId(id);
    const node = nodes.find(n => n.id === id);
    if (node) {
      dragOffset.current = {
        x: e.clientX - node.x,
        y: e.clientY - node.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(rect.width - 320, e.clientX - dragOffset.current.x));
    const newY = Math.max(10, Math.min(rect.height - 180, e.clientY - dragOffset.current.y));

    setNodes(prev => prev.map(node => node.id === draggingNodeId ? { ...node, x: newX, y: newY } : node));
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  const addNode = (type: 'trigger' | 'condition' | 'action', title: string, color: 'blue' | 'purple' | 'indigo' | 'rose' | 'emerald') => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      color,
      title,
      subtitle: type === 'trigger' ? 'Source système' : type === 'condition' ? 'Filtre automatique' : 'Exécution',
      expression: type === 'condition' ? 'condition === true' : 'action.execute()',
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    showToast(`Nœud "${title}" ajouté au workflow`);
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
    setSelectedNodeId(null);
    showToast('Nœud supprimé avec succès');
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  const runSimulation = () => {
    setIsSimulating(true);
    setActiveSimStep(0);

    setTimeout(() => setActiveSimStep(1), 1000);
    setTimeout(() => setActiveSimStep(2), 2000);
    setTimeout(() => {
      setIsSimulating(false);
      setActiveSimStep(null);
      showToast('✓ Simulation exécutée avec succès (Flux Validé)');
    }, 3200);
  };

  const getNodeBorderColor = (color: string) => {
    switch (color) {
      case 'blue': return 'border-blue-500 hover:border-blue-600';
      case 'purple': return 'border-purple-500 hover:border-purple-600';
      case 'indigo': return 'border-indigo-500 hover:border-indigo-600';
      case 'rose': return 'border-rose-500 hover:border-rose-600';
      case 'emerald': return 'border-emerald-500 hover:border-emerald-600';
      default: return 'border-slate-300';
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-6 font-sans animate-in fade-in zoom-in duration-500 pb-24 h-[calc(100vh-80px)] flex flex-col">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#0f2863] text-white px-5 py-3 rounded-2xl shadow-2xl border border-blue-400/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shrink-0 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#0f2863]/10 text-[#0f2863] rounded-2xl flex items-center justify-center border border-[#0f2863]/20 shadow-sm">
            <Network className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#0f2863] tracking-tight">{workflowName}</h1>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-200">
                ACTIF
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm">Déplacez les nœuds, ajoutez des actions et simulez l'exécution en temps réel</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-50"
          >
            <Play className={cn("w-4 h-4", isSimulating && "animate-spin")} /> 
            {isSimulating ? 'Simulation en cours...' : 'Simuler le Workflow'}
          </button>
          
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4 text-slate-500" /> Paramètres
          </button>
          
          <button 
            onClick={() => showToast('✓ Workflow sauvegardé et déployé avec succès!')}
            className="flex items-center gap-2 bg-[#0f2863] text-white px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#091b44] transition-colors shadow-md"
          >
            <Save className="w-4 h-4" /> ENREGISTRER
          </button>
        </div>
      </div>

      {/* Builder Workspace */}
      <div className="flex-1 bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner flex relative">
        
        {/* Sidebar palette */}
        <div className="w-80 bg-white border-r border-slate-200 p-5 flex flex-col h-full shadow-sm z-10 shrink-0 overflow-y-auto">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> DÉCLENCHEURS (TRIGGERS)
          </h3>
          <div className="space-y-3 mb-6">
            <button
              onClick={() => addNode('trigger', 'Justificatif Médical', 'blue')}
              className="w-full text-left p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3 hover:border-blue-500 hover:bg-blue-50/50 transition-all shadow-sm group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">+ Justificatif Médical</p>
                <p className="text-[10px] text-slate-500">Cliquer pour ajouter</p>
              </div>
            </button>

            <button
              onClick={() => addNode('trigger', 'Nouvelle Inscription', 'emerald')}
              className="w-full text-left p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all shadow-sm group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">+ Nouvelle Inscription</p>
                <p className="text-[10px] text-slate-500">Cliquer pour ajouter</p>
              </div>
            </button>
          </div>

          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <GitBranch className="w-3.5 h-3.5 text-indigo-500" /> ACTIONS & CONDITIONS
          </h3>
          <div className="space-y-3 mb-8">
            <button
              onClick={() => addNode('condition', 'Règle Conditionnelle', 'purple')}
              className="w-full text-left p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3 hover:border-purple-500 hover:bg-purple-50/50 transition-all shadow-sm group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">+ Condition (Si/Sinon)</p>
                <p className="text-[10px] text-slate-500">Cliquer pour ajouter</p>
              </div>
            </button>

            <button
              onClick={() => addNode('action', 'Envoyer Notification', 'rose')}
              className="w-full text-left p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3 hover:border-rose-500 hover:bg-rose-50/50 transition-all shadow-sm group"
            >
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">+ Notification Alert</p>
                <p className="text-[10px] text-slate-500">Cliquer pour ajouter</p>
              </div>
            </button>

            <button
              onClick={() => addNode('action', 'Mise à jour BDD', 'indigo')}
              className="w-full text-left p-3.5 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-3 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all shadow-sm group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">+ Action Base de Données</p>
                <p className="text-[10px] text-slate-500">Cliquer pour ajouter</p>
              </div>
            </button>
          </div>

          {/* Node Properties Editor Panel */}
          {selectedNode && (
            <div className="mt-auto pt-4 border-t border-slate-200 space-y-3 bg-slate-50 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" /> Éditeur de Nœud
                </span>
                <button onClick={deleteSelectedNode} className="text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg transition-colors" title="Supprimer le nœud">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Titre du Nœud</label>
                <input
                  type="text"
                  value={selectedNode.title}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, title: val } : n));
                  }}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Expression / Payload</label>
                <input
                  type="text"
                  value={selectedNode.expression}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, expression: val } : n));
                  }}
                  className="w-full mt-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div 
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="flex-1 relative overflow-hidden bg-slate-50/70 select-none" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #cbd5e1 1.5px, transparent 0)', backgroundSize: '28px 28px' }}
        >
          {/* Dynamic SVG Curves */}
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
            {nodes.map((node, idx) => {
              if (idx === nodes.length - 1) return null;
              const nextNode = nodes[idx + 1];
              const startX = node.x + 320;
              const startY = node.y + 60;
              const endX = nextNode.x;
              const endY = nextNode.y + 60;
              const controlX1 = startX + (endX - startX) / 2;
              const controlX2 = startX + (endX - startX) / 2;

              const isStepActive = activeSimStep === idx;

              return (
                <path
                  key={`path-${node.id}-${nextNode.id}`}
                  d={`M ${startX} ${startY} C ${controlX1} ${startY}, ${controlX2} ${endY}, ${endX} ${endY}`}
                  fill="none"
                  stroke={isStepActive ? '#10b981' : '#94a3b8'}
                  strokeWidth={isStepActive ? '4' : '3'}
                  strokeDasharray="6,6"
                  className={cn(isStepActive && "animate-[dash_0.8s_linear_infinite]")}
                />
              );
            })}
          </svg>

          {/* Interactive Nodes */}
          {nodes.map((node, index) => {
            const isSelected = selectedNodeId === node.id;
            const isSimActive = activeSimStep === index;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                className={cn(
                  "absolute w-80 bg-white rounded-2xl shadow-xl border-2 transition-all cursor-grab active:cursor-grabbing overflow-hidden",
                  getNodeBorderColor(node.color),
                  isSelected && "ring-4 ring-blue-500/20 shadow-2xl scale-[1.02]",
                  isSimActive && "ring-4 ring-emerald-500 scale-[1.03] shadow-emerald-500/20"
                )}
              >
                <div className={cn(
                  "px-4 py-3 border-b flex items-center justify-between",
                  node.color === 'blue' && "bg-blue-50 border-blue-100",
                  node.color === 'purple' && "bg-purple-50 border-purple-100",
                  node.color === 'indigo' && "bg-indigo-50 border-indigo-100",
                  node.color === 'rose' && "bg-rose-50 border-rose-100",
                  node.color === 'emerald' && "bg-emerald-50 border-emerald-100"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg text-white flex items-center justify-center font-bold text-xs shadow-sm",
                      node.color === 'blue' && "bg-blue-600",
                      node.color === 'purple' && "bg-purple-600",
                      node.color === 'indigo' && "bg-indigo-600",
                      node.color === 'rose' && "bg-rose-600",
                      node.color === 'emerald' && "bg-emerald-600"
                    )}>
                      {node.type === 'trigger' && <AlertCircle className="w-4 h-4" />}
                      {node.type === 'condition' && <GitBranch className="w-4 h-4" />}
                      {node.type === 'action' && <Database className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        node.color === 'blue' && "text-blue-700",
                        node.color === 'purple' && "text-purple-700",
                        node.color === 'indigo' && "text-indigo-700",
                        node.color === 'rose' && "text-rose-700",
                        node.color === 'emerald' && "text-emerald-700"
                      )}>
                        {node.type}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 leading-tight">{node.title}</h4>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white space-y-2">
                  <p className="text-xs font-semibold text-slate-600">{node.subtitle}</p>
                  <div className="bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800 font-semibold truncate">
                    {node.expression}
                  </div>
                </div>

                {/* Input Connector */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-slate-400 rounded-full z-10 shadow-sm"></div>

                {/* Output Connector */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full z-10 shadow-sm"></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-extrabold text-[#0f2863] flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" /> Paramètres du Workflow
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Nom du Workflow</label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <p className="text-sm font-bold text-slate-900">Exécution Automatique</p>
                  <p className="text-xs text-slate-500">Déclencher automatiquement lors des événements système</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoExecute}
                  onChange={(e) => setAutoExecute(e.target.checked)}
                  className="w-5 h-5 accent-[#0f2863] rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">Niveau de Journalisation (Logs)</label>
                <select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="basic">Minimal (Erreurs uniquement)</option>
                  <option value="detailed">Détaillé (Tous les événements)</option>
                  <option value="audit">Audit Légal (Conformité PFA/ENCG)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  showToast('Paramètres mis à jour avec succès');
                }}
                className="px-6 py-2.5 rounded-xl bg-[#0f2863] text-white font-bold text-sm hover:bg-[#091b44] transition-colors shadow-md"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

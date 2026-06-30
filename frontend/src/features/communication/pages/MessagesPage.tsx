import { useState } from 'react'
import { Search, Send, User } from 'lucide-react'

export default function MessagesPage() {
  const [contacts] = useState([
    { id: 1, name: 'Scolarité ENCG', lastMsg: 'Votre demande est traitée.', time: '10:30' },
    { id: 2, name: 'Pr. Tazi', lastMsg: 'N\'oubliez pas le rendu du projet.', time: 'Hier' },
    { id: 3, name: 'Support IT', lastMsg: 'Le problème WiFi est résolu.', time: '20 Juin' },
  ])

  return (
    <div className="h-[calc(100vh-100px)] animate-in p-6">
      <div className="bg-card border rounded-2xl shadow-sm h-full flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r flex flex-col bg-muted/10">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg mb-4">Messagerie</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Rechercher une conversation..." className="w-full pl-9 pr-4 py-2 bg-background border rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {contacts.map(c => (
              <div key={c.id} className="p-4 border-b hover:bg-muted/50 cursor-pointer flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-sm truncate">{c.name}</h4>
                    <span className="text-xs text-muted-foreground">{c.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMsg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          <div className="p-4 border-b flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">S</div>
             <div>
               <h3 className="font-bold">Scolarité ENCG</h3>
               <p className="text-xs text-green-500">En ligne</p>
             </div>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none max-w-[70%] shadow-sm">
                 <p className="text-sm">Bonjour, j'aimerais savoir si mon attestation est prête ?</p>
                 <span className="text-[10px] opacity-70 mt-1 block text-right">10:15</span>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-2xl rounded-tl-none max-w-[70%] shadow-sm">
                 <p className="text-sm">Bonjour, oui votre demande est traitée. Vous pouvez passer la récupérer.</p>
                 <span className="text-[10px] text-muted-foreground mt-1 block">10:30</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t bg-muted/5">
            <div className="flex items-center gap-2">
              <input type="text" placeholder="Écrivez votre message..." className="flex-1 bg-background border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
              <button className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  )
}

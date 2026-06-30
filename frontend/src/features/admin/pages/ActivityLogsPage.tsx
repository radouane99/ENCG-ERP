import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@shared/lib/utils';

// Mock data reflecting the screenshot
const mockLogs = [
  { id: 1, user: 'Radouane El Asri', action: 'Login', type: 'User', description: 'Double authentification 2FA réussie pour...', ip: '79.127.178.81', date: '24/06/2026 22:25' },
  { id: 2, user: 'Radouane El Asri', action: 'Updated', type: 'Student', description: 'Affectation automatique équilibrée de 1...', ip: '79.127.178.81', date: '24/06/2026 14:05' },
  { id: 3, user: 'Radouane El Asri', action: 'Login', type: 'User', description: 'Double authentification 2FA réussie pour...', ip: '79.127.178.82', date: '24/06/2026 13:48' },
  { id: 4, user: 'Radouane El Asri', action: 'Login', type: 'User', description: 'Double authentification 2FA réussie pour...', ip: '79.127.178.82', date: '22/06/2026 22:24' },
  { id: 5, user: 'Radouane El Asri', action: 'Login', type: 'User', description: 'Double authentification 2FA réussie pour...', ip: '79.127.178.81', date: '11/06/2026 10:20' },
  { id: 6, user: 'Radouane El Asri', action: 'Login', type: 'User', description: 'Double authentification 2FA réussie pour...', ip: '79.127.178.81', date: '10/06/2026 11:11' },
  { id: 7, user: 'Radouane El Asri', action: 'Login', type: 'User', description: 'Double authentification 2FA réussie pour...', ip: '79.127.178.81', date: '10/06/2026 09:16' },
  { id: 8, user: 'Radouane El Asri', action: 'Login', type: 'User', description: 'Double authentification 2FA réussie pour...', ip: '79.127.178.81', date: '10/06/2026 08:18' },
  { id: 9, user: 'Radouane El Asri', action: 'Login', type: 'User', description: 'Double authentification 2FA réussie pour...', ip: '79.127.178.82', date: '10/06/2026 08:14' },
  { id: 10, user: 'Radouane El Asri', action: 'Updated', type: 'Setting', description: 'La campagne d\'évaluation anonyme de...', ip: '79.127.178.82', date: '09/06/2026 12:25' },
];

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#e6007e]">Journal d'Activité</h1>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-white/5/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] uppercase text-white/50 font-bold border-b border-white/5">
              <tr>
                <th className="px-4 py-4">Utilisateur</th>
                <th className="px-4 py-4">Action</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Description</th>
                <th className="px-4 py-4">IP</th>
                <th className="px-4 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {mockLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 last:border-0 hover:bg-white/[0.02]/50 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e6007e] text-white flex items-center justify-center font-bold text-xs">
                        {log.user.charAt(0)}
                      </div>
                      <span className="font-semibold text-white">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold",
                      log.action === 'Login' ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-600"
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="font-bold text-[#e6007e] text-xs">
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-white/50 truncate max-w-[200px]">
                    {log.description}
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs">
                    {log.ip}
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs">
                    {log.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

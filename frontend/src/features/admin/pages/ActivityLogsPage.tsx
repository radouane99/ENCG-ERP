import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@shared/lib/utils';

import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logsData } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => api.get('/admin/activity-logs').then(res => res.data.data || res.data || [])
  })

  const logs = logsData || [];

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
              {logs.map((log: any) => (
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

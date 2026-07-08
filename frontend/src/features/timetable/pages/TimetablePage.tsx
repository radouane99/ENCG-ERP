import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Clock, MapPin, User, Search, Filter, Plus } from 'lucide-react';
import api from '@/shared/lib/api';
import { format, addDays, startOfWeek } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import { Button } from '@shared/components/ui/Button';
import { Input } from '@shared/components/ui/Input';

interface ScheduleSession {
  id: number;
  module_name: string;
  professor_name: string;
  room_name: string;
  group_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  type: 'CM' | 'TD' | 'TP' | 'EXAM';
}

const MOCK_SCHEDULE: ScheduleSession[] = [
  { id: 1, module_name: 'Comptabilité Approfondie', professor_name: 'Pr. BENCHEKROUN', room_name: 'Amphi A', group_name: 'GFC', day_of_week: 1, start_time: '08:00', end_time: '10:00', type: 'CM' },
  { id: 2, module_name: 'Marketing Stratégique', professor_name: 'Pr. ALAOUI', room_name: 'Salle 201', group_name: 'MCM-G1', day_of_week: 1, start_time: '10:15', end_time: '12:15', type: 'TD' },
  { id: 3, module_name: 'Finance d\'Entreprise', professor_name: 'Dr. TAZI', room_name: 'Amphi B', group_name: 'GFC', day_of_week: 2, start_time: '14:00', end_time: '16:00', type: 'CM' },
  { id: 4, module_name: 'Droit du Travail', professor_name: 'Me. BENNIS', room_name: 'Salle 105', group_name: 'GRH-G1', day_of_week: 3, start_time: '08:00', end_time: '10:00', type: 'TD' },
];

const DAYS = [1, 2, 3, 4, 5, 6]; // Lundi Ã  Samedi
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const TYPE_COLORS = {
  CM: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  TD: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  TP: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  EXAM: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const TimetablePage: React.FC = () => {
  const { t, i18n } = useTranslation('timetable');
  const [targetType, setTargetType] = useState<'group' | 'professor' | 'room'>('group');
  const [targetId, setTargetId] = useState<string>('GFC');
  const dateLocale = i18n.language === 'ar' ? ar : fr;

  const { data } = useQuery({
    queryKey: ['timetable', targetType, targetId],
    queryFn: () => api.get(`/timetable/${targetType}/${targetId}`).then(r => r.data),
    placeholderData: { data: MOCK_SCHEDULE }
  });

  const sessions: ScheduleSession[] = data?.data ?? MOCK_SCHEDULE;

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarIcon size={20} className="text-purple-400" />
            {t('title')}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">{t('week_of')} {format(currentWeekStart, 'dd MMMM yyyy', { locale: dateLocale })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white border-none shadow-none">
            <Plus size={14} className="mr-1.5" /> {t('add_session')}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
        <select 
          value={targetType} 
          onChange={e => setTargetType(e.target.value as any)}
          className="bg-white/5 border border-white/10 rounded-xl text-sm text-white px-3 py-2 outline-none focus:border-purple-500/50"
        >
          <option value="group">{t('filters.group')}</option>
          <option value="professor">{t('filters.professor')}</option>
          <option value="room">{t('filters.room')}</option>
        </select>

        <div className="flex-1 min-w-[200px]">
          <Input
            icon={<Search size={15} />}
            placeholder={t('filters.search')}
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
          />
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
            <div className="p-3 text-center text-white/40 text-xs font-semibold border-r border-white/10">{t('grid.hour')}</div>
            {DAYS.map((day, i) => (
              <div key={day} className="p-3 text-center border-r border-white/10 last:border-0">
                <p className="text-white/60 text-xs font-semibold uppercase">{format(addDays(currentWeekStart, i), 'EEEE', { locale: dateLocale })}</p>
                <p className="text-white/40 text-xs">{format(addDays(currentWeekStart, i), 'dd/MM')}</p>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="relative" style={{ height: `${(18 - 8) * 80}px` }}>
            {/* Horizontal lines */}
            {Array.from({ length: 11 }).map((_, i) => (
              <div key={i} className="absolute w-full border-t border-white/5 flex" style={{ top: `${i * 80}px` }}>
                <div className="w-[14.28%] text-xs text-white/30 text-center -mt-2 bg-[#0f172a] pr-2">{i + 8}:00</div>
              </div>
            ))}

            {/* Vertical lines */}
            {DAYS.map((day, i) => (
              <div key={day} className="absolute h-full border-l border-white/5" style={{ left: `${(i + 1) * 14.28}%` }} />
            ))}

            {/* Sessions */}
            {sessions.map(session => {
              const startHour = parseInt(session.start_time.split(':')[0]) + parseInt(session.start_time.split(':')[1]) / 60;
              const endHour = parseInt(session.end_time.split(':')[0]) + parseInt(session.end_time.split(':')[1]) / 60;
              const top = (startHour - 8) * 80;
              const height = (endHour - startHour) * 80;
              const left = `${session.day_of_week * 14.28}%`;
              const width = '14.28%';

              return (
                <div
                  key={session.id}
                  className="absolute p-1 transition-transform hover:scale-[1.02] cursor-pointer z-10"
                  style={{ top: `${top}px`, height: `${height}px`, left, width }}
                >
                  <div className={`h-full rounded-xl p-2 border flex flex-col gap-1 overflow-hidden ${TYPE_COLORS[session.type]}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-1.5 rounded bg-black/20">{session.type}</span>
                      <span className="text-[10px] opacity-70">{session.start_time} - {session.end_time}</span>
                    </div>
                    <p className="text-xs font-bold leading-tight line-clamp-2 mt-0.5 text-white/90">
                      {session.module_name}
                    </p>
                    <div className="mt-auto space-y-0.5">
                      <div className="flex items-center gap-1 opacity-80">
                        <User size={10} />
                        <span className="text-[10px] truncate">{session.professor_name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-80">
                        <MapPin size={10} />
                        <span className="text-[10px] truncate">{session.room_name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetablePage;

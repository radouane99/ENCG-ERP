import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'amber' | 'purple' | 'emerald' | string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendUp,
  color = 'blue'
}) => {
  const colorStyles: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  const iconBg = colorStyles[color] || 'bg-gray-50 text-gray-600';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`rounded-xl p-3 ${iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      {(description || trend) && (
        <div className="mt-4 flex items-center text-sm">
          {trend && (
            <span
              className={`font-medium ${
                trendUp ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {trend}
            </span>
          )}
          {description && (
            <span className={`${trend ? 'ml-2' : ''} text-gray-500`}>
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

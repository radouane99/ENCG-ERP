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
    blue: 'bg-primary/10 text-primary',
    amber: 'bg-warning/10 text-[var(--warning-text)]',
    purple: 'bg-primary/10 text-primary',
    emerald: 'bg-success/10 text-success',
  };

  const iconBg = colorStyles[color] || 'bg-muted text-muted-foreground';

  return (
    <div className="erp-surface p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tabular-nums text-foreground">{value}</h3>
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
                trendUp ? 'text-success' : 'text-destructive'
              }`}
            >
              {trend}
            </span>
          )}
          {description && (
            <span className={`${trend ? 'ms-2' : ''} text-muted-foreground`}>
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

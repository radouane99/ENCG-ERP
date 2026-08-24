import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export type RoleQuickAction = {
  to: string
  label: string
  icon?: LucideIcon
  testId?: string
  variant?: 'primary' | 'default' | 'tile'
  color?: string
}

export default function RoleQuickActions({
  actions,
  layout = 'tiles',
  className,
}: {
  actions: RoleQuickAction[]
  layout?: 'tiles' | 'chips'
  className?: string
}) {
  if (layout === 'chips') {
    return (
      <div data-testid="role-quick-actions" className="flex flex-wrap items-center gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={`${action.to}-${action.label}`}
              to={action.to}
              data-testid={action.testId}
              className={cn(
                'flex items-center gap-2 min-h-11 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors border',
                action.variant === 'primary'
                  ? 'bg-primary text-white border-primary hover:opacity-90'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-border hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              {Icon ? <Icon className="w-4 h-4" /> : null}
              {action.label}
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div
      data-testid="role-quick-actions"
      className={cn('grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5', className)}
    >
      {actions.map((action, index) => {
        const Icon = action.icon
        const gradient = action.color || defaultTileColors[index % defaultTileColors.length]
        return (
          <Link
            key={`${action.to}-${action.label}`}
            to={action.to}
            data-testid={action.testId}
            className={cn(
              'flex flex-col items-center justify-center min-h-11 gap-2 p-3.5 rounded-2xl bg-gradient-to-br text-white font-black text-xs shadow-md hover:scale-[1.02] transition-transform text-center',
              gradient
            )}
          >
            {Icon ? <Icon className="w-5 h-5" /> : null}
            <span className="leading-tight">{action.label}</span>
          </Link>
        )
      })}
    </div>
  )
}

const defaultTileColors = [
  'from-primary to-blue-800 shadow-blue-500/20',
  'from-emerald-600 to-teal-600 shadow-emerald-500/20',
  'from-amber-500 to-orange-600 shadow-amber-500/20',
  'from-purple-600 to-pink-600 shadow-purple-500/20',
  'from-slate-700 to-slate-900 shadow-slate-500/20',
]

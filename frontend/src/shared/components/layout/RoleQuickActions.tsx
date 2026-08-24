import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export type RoleQuickAction = {
  to: string
  label: string
  icon?: LucideIcon
  testId?: string
  variant?: 'primary' | 'default'
}

export default function RoleQuickActions({ actions }: { actions: RoleQuickAction[] }) {
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
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors border',
              action.variant === 'primary'
                ? 'bg-[#001A4B] text-white border-[#001A4B] hover:bg-[#000d26]'
                : 'bg-white text-slate-700 border-border hover:bg-slate-50'
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

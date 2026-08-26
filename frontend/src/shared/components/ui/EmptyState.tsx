import type { LucideIcon } from 'lucide-react'
import { cn } from '@shared/lib/utils'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-10 px-4 space-y-3', className)}>
      {Icon && <Icon className="w-8 h-8 mx-auto text-muted-foreground" />}
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center min-h-11 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

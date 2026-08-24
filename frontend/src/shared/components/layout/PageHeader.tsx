import type { ReactNode } from 'react'
import { cn } from '@shared/lib/utils'

export default function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6', className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

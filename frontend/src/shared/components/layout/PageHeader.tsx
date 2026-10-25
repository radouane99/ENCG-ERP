import type { ReactNode } from 'react'
import { cn } from '@shared/lib/utils'

export default function PageHeader({
  title,
  subtitle,
  actions,
  className,
  titleLang,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
  titleLang?: string
}) {
  return (
    <div className={cn('erp-page-header', className)}>
      <div className="min-w-0">
        <h1 lang={titleLang} className="erp-page-title text-foreground">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

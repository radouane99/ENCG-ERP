import type { ReactNode } from 'react'
import { cn } from '@shared/lib/utils'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
  titleLang?: string
  variant?: 'default' | 'banner'
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  titleLang,
  variant = 'default',
}: PageHeaderProps) {
  const isBanner = variant === 'banner'

  return (
    <div
      className={cn(
        'erp-page-header',
        isBanner && 'erp-page-banner p-6 sm:p-8',
        className
      )}
    >
      <div className="min-w-0">
        <h1
          lang={titleLang}
          className={cn(
            'erp-page-title',
            isBanner ? 'text-white' : 'text-foreground'
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              'text-sm mt-1',
              isBanner ? 'text-white/80' : 'text-muted-foreground'
            )}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}

export default PageHeader

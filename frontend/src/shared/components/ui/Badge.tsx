/**
 * <Badge> — ENCG ERP Design System
 * Status/label indicator with 6 semantic variants.
 * RTL-safe, WCAG AA contrast.
 */
import React from 'react'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@shared/lib/utils'
import { badgeVariants } from './badgeVariants'

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional dot indicator before the text */
  dot?: boolean
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'inline-block h-1.5 w-1.5 rounded-full flex-shrink-0',
              {
                'bg-[var(--color-primary)]':   variant === 'default',
                'bg-[hsl(142_71%_45%)]':             variant === 'success',
                'bg-[hsl(38_92%_50%)]':              variant === 'warning',
                'bg-[var(--color-destructive)]':variant === 'destructive',
                'bg-[var(--muted-foreground)]': variant === 'secondary',
              }
            )}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

export { Badge }
export default Badge

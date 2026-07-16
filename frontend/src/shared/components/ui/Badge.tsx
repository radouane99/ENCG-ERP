/**
 * <Badge> — ENCG ERP Design System
 * Status/label indicator with 6 semantic variants.
 * RTL-safe, WCAG AA contrast.
 */
import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@shared/lib/utils'

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1.5',
    'px-2.5 py-0.5 rounded-full',
    'text-xs font-semibold leading-none',
    'border border-transparent',
    'transition-colors duration-150',
    'select-none whitespace-nowrap',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-[color-mix(in srgb, var(--color-primary) 0.100%, transparent)]',
          'text-[var(--color-primary)]',
          'border-[color-mix(in srgb, var(--color-primary) 0.200%, transparent)]',
        ],
        secondary: [
          'bg-[var(--muted)]',
          'text-[var(--muted-foreground)]',
        ],
        success: [
          'bg-[hsl(142_71%_45%/0.12)]',
          'text-[hsl(142_71%_35%)]',
          'border-[hsl(142_71%_45%/0.25)]',
        ],
        warning: [
          'bg-[hsl(38_92%_50%/0.12)]',
          'text-[hsl(38_92%_38%)]',
          'border-[hsl(38_92%_50%/0.25)]',
        ],
        destructive: [
          'bg-[color-mix(in srgb, var(--color-destructive) 0.1200%, transparent)]',
          'text-[var(--color-destructive)]',
          'border-[color-mix(in srgb, var(--color-destructive) 0.2500%, transparent)]',
        ],
        outline: [
          'bg-transparent',
          'text-[var(--foreground)]',
          'border-[var(--border)]',
        ],
        navy: [
          'bg-[hsl(215_51%_25%/0.12)]',
          'text-[hsl(215_51%_25%)]',
          'border-[hsl(215_51%_25%/0.2)]',
        ],
      },
      size: {
        sm: 'text-[10px] px-2 py-px',
        md: 'text-xs px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

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

export { Badge, badgeVariants }

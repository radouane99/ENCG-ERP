/**
 * <Alert> — ENCG ERP Design System
 * Contextual message banner for info / success / warning / error.
 * Uses role="alert" and aria-live for screen reader announcements.
 */
import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@shared/lib/utils'
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
} from 'lucide-react'

const alertVariants = cva(
  [
    'relative flex gap-3 w-full rounded-xl border p-4',
    'text-sm leading-relaxed',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        info: [
          'bg-blue-50 border-blue-200 text-blue-900',
          'dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-100',
        ],
        success: [
          'bg-emerald-50 border-emerald-200 text-emerald-900',
          'dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-100',
        ],
        warning: [
          'bg-amber-50 border-amber-200 text-amber-900',
          'dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-100',
        ],
        destructive: [
          'bg-red-50 border-red-200 text-red-900',
          'dark:bg-red-950/50 dark:border-red-800 dark:text-red-100',
        ],
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  }
)

const iconMap = {
  info:        Info,
  success:     CheckCircle2,
  warning:     AlertTriangle,
  destructive: XCircle,
} as const

const iconColorMap = {
  info:        'text-blue-500 dark:text-blue-400',
  success:     'text-emerald-500 dark:text-emerald-400',
  warning:     'text-amber-500 dark:text-amber-400',
  destructive: 'text-red-500 dark:text-red-400',
} as const

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /** Alert heading */
  title?: string
  /** Callback to dismiss the alert — renders close button if provided */
  onDismiss?: () => void
  /** Override default icon */
  icon?: React.ReactNode
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', title, children, onDismiss, icon, ...props }, ref) => {
    const IconComponent = iconMap[variant ?? 'info']

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(alertVariants({ variant, className }))}
        {...props}
      >
        {/* Icon — RTL-safe: shrink-0, no margin */}
        <span className={cn('mt-0.5 shrink-0', iconColorMap[variant ?? 'info'])} aria-hidden="true">
          {icon ?? <IconComponent className="h-5 w-5" />}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold mb-0.5">{title}</p>
          )}
          {children && (
            <div className="text-sm opacity-90">{children}</div>
          )}
        </div>

        {/* Dismiss button — RTL-safe: ms-auto */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Fermer l'alerte"
            className={cn(
              'ms-auto shrink-0 self-start',
              'h-6 w-6 rounded flex items-center justify-center',
              'opacity-60 hover:opacity-100 transition-opacity duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current'
            )}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = 'Alert'

export { Alert, alertVariants }

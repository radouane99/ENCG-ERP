/**
 * <Alert> — ENCG ERP Design System
 * Contextual message banner for info / success / warning / error.
 * Uses role="alert" and aria-live for screen reader announcements.
 */
import React from 'react'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@shared/lib/utils'
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
} from 'lucide-react'
import { alertVariants } from './alertVariants'

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

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
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
        <span className={cn('mt-0.5 shrink-0', iconColorMap[variant ?? 'info'])} aria-hidden="true">
          {icon ?? <IconComponent className="h-5 w-5" />}
        </span>

        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold mb-0.5">{title}</p>
          )}
          {children && (
            <div className="text-sm opacity-90">{children}</div>
          )}
        </div>

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

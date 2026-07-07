/**
 * ENCG ERP — UI Component Library
 * Central barrel export. Import from '@shared/components/ui' everywhere.
 *
 * Usage: import { Button, Input, Modal, Badge } from '@shared/components/ui'
 */

// ── Primitives ───────────────────────────────────────────────────
export { Button, buttonVariants }   from './Button'
export type { ButtonProps }         from './Button'

export { Input }                    from './Input'
export type { InputProps }          from './Input'

export { Modal }                    from './Modal'
export type { ModalProps }          from './Modal'

export { Badge, badgeVariants }     from './Badge'
export type { BadgeProps }          from './Badge'

export { Alert, alertVariants }     from './Alert'
export type { AlertProps }          from './Alert'

export { Spinner, Skeleton }        from './Spinner'
export type { SpinnerProps, SkeletonProps } from './Spinner'

// ── Existing components (preserved) ──────────────────────────────
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './Card'

export { LoadingScreen }            from './LoadingScreen'
export { Table }                    from './Table'
export { StatCard }                 from './StatCard'

// ── Design tokens ────────────────────────────────────────────────
export * from '@shared/design-system/tokens'

/**
 * ENCG ERP — UI Component Library
 * Central barrel export. Import from '@shared/components/ui' everywhere.
 *
 * Usage: import { Button, Input, Modal, Badge } from '@shared/components/ui'
 */

// ── Primitives ───────────────────────────────────────────────────
export { Button } from './Button'
export { buttonVariants } from './buttonVariants'
export type { ButtonProps } from './Button'

export { Input }                    from './Input'
export type { InputProps }          from './Input'

export { Modal }                    from './Modal'
export type { ModalProps }          from './Modal'

export { Badge }                    from './Badge'
export { badgeVariants }             from './badgeVariants'
export type { BadgeProps }          from './Badge'

export { Alert } from './Alert'
export { alertVariants } from './alertVariants'
export type { AlertProps } from './Alert'

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

export { CustomSelect }             from './CustomSelect'
export type { CustomSelectProps, SelectOption } from './CustomSelect'

export { DatePicker }               from './DatePicker'

// ── Design tokens ────────────────────────────────────────────────
export * from '@shared/design-system/tokens'

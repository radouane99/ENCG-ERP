/**
 * <Button> — ENCG ERP Design System
 *
 * Features:
 * - 5 variants: primary, secondary, destructive, outline, ghost, link
 * - 4 sizes: sm, md, lg, icon
 * - Loading state with accessible aria-busy
 * - RTL-safe: uses me-* (margin-end) instead of mr-*
 * - WCAG AA: min 44×44pt touch target, focus ring, disabled semantics
 * - prefers-reduced-motion: disables scale transform
 */
import React from 'react'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@shared/lib/utils'
import { Loader2 } from 'lucide-react'
import { buttonVariants } from './buttonVariants'

// ── Props ────────────────────────────────────────────────────────
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Show spinner and disable interaction. Sets aria-busy="true". */
  isLoading?: boolean
  /** Label shown to screen readers during loading (replaces children). */
  loadingText?: string
  /** Icon placed at the START of the button (RTL-aware). */
  leadingIcon?: React.ReactNode
  /** Icon placed at the END of the button (RTL-aware). */
  trailingIcon?: React.ReactNode
  /**
   * Alias for `leadingIcon` — accepted for backwards compatibility with
   * pages written before the leadingIcon/trailingIcon split.
   * @deprecated Use `leadingIcon` instead.
   */
  icon?: React.ReactNode
}

// ── Component ────────────────────────────────────────────────────
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      loadingText,
      leadingIcon,
      trailingIcon,
      // icon is accepted as an alias for leadingIcon
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {/* Loading spinner — RTL-safe: me-* instead of mr-* */}
        {isLoading && (
          <Loader2
            className="h-4 w-4 animate-spin me-1 shrink-0"
            aria-hidden="true"
          />
        )}

        {/* Leading icon / icon alias (when not loading) — RTL-safe spacing */}
        {!isLoading && (leadingIcon ?? icon) && (
          <span className="shrink-0 me-0.5" aria-hidden="true">
            {leadingIcon ?? icon}
          </span>
        )}

        {/* Content */}
        <span className={cn(isLoading && 'opacity-80')}>
          {isLoading && loadingText ? loadingText : children}
        </span>

        {/* Trailing icon — RTL-safe spacing */}
        {trailingIcon && !isLoading && (
          <span className="shrink-0 ms-0.5" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'

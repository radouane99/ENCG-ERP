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
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@shared/lib/utils'
import { Loader2 } from 'lucide-react'

// ── CVA Variant Definition ───────────────────────────────────────
const buttonVariants = cva(
  // Base — shared across ALL variants
  [
    'relative inline-flex items-center justify-center gap-2',
    'rounded-md text-sm font-semibold tracking-[-0.01em]',
    'select-none cursor-pointer whitespace-nowrap',
    'border border-transparent',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
    // Scale on active — respects prefers-reduced-motion via CSS
    'motion-safe:active:scale-[0.97]',
  ],
  {
    variants: {
      variant: {
        // Primary — ENCG Red, main CTA
        primary: [
          'bg-[hsl(var(--color-primary))] text-[hsl(var(--color-primary-foreground))]',
          'hover:bg-[hsl(var(--color-primary)/0.88)]',
          'shadow-sm',
        ],
        // Secondary — Navy Blue
        secondary: [
          'bg-[hsl(var(--color-secondary))] text-[hsl(var(--color-secondary-foreground))]',
          'hover:bg-[hsl(var(--color-secondary)/0.88)]',
          'shadow-sm',
        ],
        // Destructive — Error red
        destructive: [
          'bg-[hsl(var(--color-destructive))] text-[hsl(var(--color-destructive-foreground))]',
          'hover:bg-[hsl(var(--color-destructive)/0.88)]',
          'shadow-sm',
        ],
        // Outline — transparent with border
        outline: [
          'border-[hsl(var(--border))] bg-transparent text-[hsl(var(--foreground))]',
          'hover:bg-[hsl(var(--muted))] hover:border-[hsl(var(--muted-foreground)/0.3)]',
        ],
        // Ghost — no border, subtle hover
        ghost: [
          'bg-transparent text-[hsl(var(--foreground))]',
          'hover:bg-[hsl(var(--muted))]',
        ],
        // Link — looks like a link, minimal chrome
        link: [
          'bg-transparent text-[hsl(var(--color-primary))]',
          'underline underline-offset-4',
          'hover:text-[hsl(var(--color-primary)/0.8)]',
          'hover:no-underline',
        ],
        // Success
        success: [
          'bg-[hsl(var(--color-success))] text-[hsl(var(--color-success-foreground))]',
          'hover:bg-[hsl(var(--color-success)/0.88)]',
          'shadow-sm',
        ],
      },
      size: {
        sm:   'min-h-[36px] px-3 text-xs rounded-md',
        md:   'min-h-[44px] px-4 text-sm rounded-md',
        lg:   'min-h-[48px] px-6 text-base rounded-lg',
        xl:   'min-h-[56px] px-8 text-base rounded-lg',
        icon: 'min-h-[44px] w-[44px] rounded-md p-0',
        'icon-sm': 'min-h-[36px] w-[36px] rounded-md p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

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
}

// ── Component ────────────────────────────────────────────────────
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      loadingText,
      leadingIcon,
      trailingIcon,
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

        {/* Leading icon (when not loading) — RTL-safe spacing */}
        {!isLoading && leadingIcon && (
          <span className="shrink-0 me-0.5" aria-hidden="true">
            {leadingIcon}
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

export { Button, buttonVariants }

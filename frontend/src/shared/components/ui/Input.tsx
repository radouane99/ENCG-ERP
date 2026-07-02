/**
 * <Input> — ENCG ERP Design System
 *
 * Features:
 * - Integrated label + helper text + error message
 * - RTL-safe: icon padding uses ps-* (padding-start), not pl-*
 * - WCAG AA: <label for> association, role="alert" on error
 * - 3 sizes: sm, md, lg
 * - Leading icon and trailing addon support
 * - Required indicator (asterisk)
 *
 * Backward compatibility:
 * - `icon` prop is an alias for `leadingIcon`
 * - `error` accepts both string (message) and boolean (flag only)
 */
import React, { useId } from 'react'
import { cn } from '@shared/lib/utils'
import { AlertCircle } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────
type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label text */
  label?: string
  /** Helper text below the input */
  helper?: string
  /**
   * Error message or boolean flag.
   * - string: shows message text below input
   * - true: highlights border in red (no message shown)
   */
  error?: string | boolean
  /** Icon rendered at the START of the input (RTL-aware) */
  leadingIcon?: React.ReactNode
  /**
   * @deprecated Use `leadingIcon` instead.
   * Kept for backward compatibility with existing usages.
   */
  icon?: React.ReactNode
  /** Static text or icon at the END of the input */
  trailingAddon?: React.ReactNode
  /** Compact (sm), default (md), or large (lg) */
  inputSize?: InputSize
  /** Explicitly mark field as required (shows asterisk in label) */
  isRequired?: boolean
  /** Override for the container div */
  containerClassName?: string
}

// ── Size maps ────────────────────────────────────────────────────
const sizeMap: Record<InputSize, string> = {
  sm: 'min-h-[36px] text-xs px-3 rounded-md',
  md: 'min-h-[44px] text-sm px-3 rounded-md',
  lg: 'min-h-[48px] text-base px-4 rounded-lg',
}

const iconSizeMap: Record<InputSize, string> = {
  sm: 'ps-8',
  md: 'ps-10',
  lg: 'ps-11',
}

const iconPositionMap: Record<InputSize, string> = {
  sm: 'start-2.5 h-3.5 w-3.5',
  md: 'start-3 h-4 w-4',
  lg: 'start-3.5 h-5 w-5',
}

// ── Component ────────────────────────────────────────────────────
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helper,
      error,
      leadingIcon,
      icon,            // ← backward compat alias
      trailingAddon,
      inputSize = 'md',
      isRequired,
      containerClassName,
      className,
      type = 'text',
      id: externalId,
      disabled,
      ...props
    },
    ref
  ) => {
    // Auto-generate stable ID for label association (WCAG)
    const generatedId = useId()
    const id = externalId ?? generatedId
    const errorId = `${id}-error`
    const helperId = `${id}-helper`

    // Normalize: `icon` is a legacy alias for `leadingIcon`
    const resolvedLeadingIcon = leadingIcon ?? icon

    // Normalize: `error` can be string or boolean
    const hasError = Boolean(error)
    const errorMessage = typeof error === 'string' ? error : undefined

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', containerClassName)}>
        {/* ── Label ── */}
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'text-sm font-medium leading-none select-none',
              hasError
                ? 'text-[hsl(var(--color-destructive))]'
                : 'text-[hsl(var(--foreground))]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {label}
            {(isRequired ?? props.required) && (
              <span
                className="text-[hsl(var(--color-destructive))] ms-0.5"
                aria-label="requis"
              >
                *
              </span>
            )}
          </label>
        )}

        {/* ── Input wrapper ── */}
        <div className="relative flex items-center w-full">
          {/* Leading icon — RTL-safe absolute position */}
          {resolvedLeadingIcon && (
            <span
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]',
                'pointer-events-none',
                iconPositionMap[inputSize]
              )}
              aria-hidden="true"
            >
              {resolvedLeadingIcon}
            </span>
          )}

          {/* Input element */}
          <input
            ref={ref}
            id={id}
            type={type}
            disabled={disabled}
            required={isRequired ?? props.required}
            aria-required={isRequired ?? props.required}
            aria-invalid={hasError}
            aria-describedby={
              hasError && errorMessage
                ? errorId
                : helper
                ? helperId
                : undefined
            }
            className={cn(
              // Base styles
              'w-full border bg-[hsl(var(--background))] text-[hsl(var(--foreground))]',
              'placeholder:text-[hsl(var(--muted-foreground))]',
              'transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0',
              // Normal state
              !hasError && [
                'border-[hsl(var(--border))]',
                'focus-visible:border-[hsl(var(--ring))]',
                'focus-visible:ring-[hsl(var(--ring)/0.2)]',
              ],
              // Error state
              hasError && [
                'border-[hsl(var(--color-destructive))]',
                'focus-visible:border-[hsl(var(--color-destructive))]',
                'focus-visible:ring-[hsl(var(--color-destructive)/0.2)]',
                'bg-[hsl(var(--color-destructive)/0.03)]',
              ],
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[hsl(var(--muted))]',
              // Size
              sizeMap[inputSize],
              // Leading icon padding — RTL-safe
              resolvedLeadingIcon && iconSizeMap[inputSize],
              // Trailing addon padding
              trailingAddon && 'pe-10',
              className
            )}
            {...props}
          />

          {/* Trailing icon/addon — error icon takes priority only when there's a message */}
          {(trailingAddon || (hasError && errorMessage)) && (
            <span
              className={cn(
                'absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none',
                hasError
                  ? 'text-[hsl(var(--color-destructive))]'
                  : 'text-[hsl(var(--muted-foreground))]'
              )}
              aria-hidden="true"
            >
              {hasError && errorMessage ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                trailingAddon
              )}
            </span>
          )}
        </div>

        {/* ── Error message — announced by screen readers ── */}
        {hasError && errorMessage && (
          <p
            id={errorId}
            role="alert"
            aria-live="polite"
            className="text-xs text-[hsl(var(--color-destructive))] flex items-center gap-1.5 mt-0.5"
          >
            {errorMessage}
          </p>
        )}

        {/* ── Helper text ── */}
        {!hasError && helper && (
          <p
            id={helperId}
            className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5"
          >
            {helper}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }

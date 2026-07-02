/**
 * <Spinner> — ENCG ERP Design System
 * Accessible loading indicator.
 * Uses aria-label for screen readers.
 */
import React from 'react'
import { cn } from '@shared/lib/utils'

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<SpinnerSize, string> = {
  xs: 'h-3 w-3 border',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-[3px]',
  xl: 'h-12 w-12 border-4',
}

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize
  /** Screen reader label */
  label?: string
  /** Color variant */
  variant?: 'primary' | 'white' | 'muted'
}

const colorMap = {
  primary: 'border-[hsl(var(--color-primary)/0.2)] border-t-[hsl(var(--color-primary))]',
  white:   'border-white/30 border-t-white',
  muted:   'border-[hsl(var(--border))] border-t-[hsl(var(--muted-foreground))]',
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  label = 'Chargement...',
  variant = 'primary',
  className,
  ...props
}) => {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn('inline-block', className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block rounded-full animate-spin',
          sizeMap[size],
          colorMap[variant]
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
Spinner.displayName = 'Spinner'

export { Spinner }

// ─────────────────────────────────────────────────────────────────

/**
 * <Skeleton> — Placeholder loading state
 * Replaces content while data is loading.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Mimic a circle (avatar) or rectangle (text/card) */
  variant?: 'rectangle' | 'circle' | 'text'
  /** Override width */
  width?: string | number
  /** Override height */
  height?: string | number
  /** Number of text line skeletons to render */
  lines?: number
}

const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangle',
  width,
  height,
  lines,
  className,
  style,
  ...props
}) => {
  const base = cn(
    'animate-pulse bg-[hsl(var(--muted))] rounded',
    variant === 'circle' && 'rounded-full',
    variant === 'text'   && 'h-4 rounded-sm',
    className
  )

  if (variant === 'text' && lines && lines > 1) {
    return (
      <div className="space-y-2" aria-hidden="true" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(base, i === lines - 1 && 'w-3/4')}
            style={{ width: i < lines - 1 ? '100%' : '75%', height: height ?? 16 }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={base}
      style={{
        width:  typeof width  === 'number' ? `${width}px`  : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  )
}
Skeleton.displayName = 'Skeleton'

export { Skeleton }

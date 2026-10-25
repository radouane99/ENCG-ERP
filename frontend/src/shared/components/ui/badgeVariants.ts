import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
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
          'bg-primary/10',
          'text-primary',
          'border-primary/20',
        ],
        secondary: [
          'bg-[var(--muted)]',
          'text-[var(--muted-foreground)]',
        ],
        success: [
          'bg-success/10',
          'text-success',
          'border-success/25',
        ],
        warning: [
          'bg-warning/10',
          'text-[var(--warning-text)]',
          'border-warning/25',
        ],
        destructive: [
          'bg-destructive/10',
          'text-destructive',
          'border-destructive/25',
        ],
        outline: [
          'bg-transparent',
          'text-[var(--foreground)]',
          'border-[var(--border)]',
        ],
        navy: [
          'bg-primary/10',
          'text-primary',
          'border-primary/20',
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

import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
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
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90',
          'shadow-sm',
        ],
        // Secondary — Navy Blue
        secondary: [
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary/90',
          'shadow-sm',
        ],
        // Destructive — Error red
        destructive: [
          'bg-destructive text-destructive-foreground',
          'hover:bg-destructive/90',
          'shadow-sm',
        ],
        // Outline — transparent with border
        outline: [
          'border border-border bg-transparent text-foreground',
          'hover:bg-muted hover:border-muted-foreground/30',
        ],
        // Ghost — no border, subtle hover
        ghost: [
          'bg-transparent text-foreground',
          'hover:bg-muted',
        ],
        // Link — looks like a link, minimal chrome
        link: [
          'bg-transparent text-primary',
          'underline underline-offset-4',
          'hover:text-primary/80',
          'hover:no-underline',
        ],
        // Success
        success: [
          'bg-success text-success-foreground',
          'hover:bg-success/90',
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

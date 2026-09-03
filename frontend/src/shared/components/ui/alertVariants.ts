import { cva } from 'class-variance-authority'

export const alertVariants = cva(
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

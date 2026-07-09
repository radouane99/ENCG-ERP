/**
 * <Modal> / <Dialog> — ENCG ERP Design System
 *
 * Features:
 * - WCAG AA: aria-modal, aria-labelledby, aria-describedby
 * - Focus trap: first focusable element gets focus on open
 * - Keyboard: Escape to close
 * - Backdrop click to close (configurable)
 * - RTL-safe: logical properties throughout
 * - Smooth enter/exit animation (respects prefers-reduced-motion)
 * - 3 sizes: sm, md, lg, xl, full
 * - Scroll-lock on body when open
 */
import React, { useEffect, useRef, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@shared/lib/utils'
import { X } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  /** Controls open/closed state */
  open: boolean
  /**
   * Alias for `open` — accepted for backwards compatibility.
   * @deprecated Use `open` instead.
   */
  isOpen?: boolean
  /** Called when modal should close */
  onClose: () => void
  /** Modal title — rendered in header, linked to aria-labelledby */
  title?: string
  /** Description — linked to aria-describedby */
  description?: string
  /** Modal body content */
  children: React.ReactNode
  /** Footer slot — typically contains action buttons */
  footer?: React.ReactNode
  /** Prevent closing when clicking the backdrop */
  preventBackdropClose?: boolean
  /** Prevent closing on Escape key */
  preventEscapeClose?: boolean
  /** Width preset */
  size?: ModalSize
  /** Additional class for the dialog panel */
  className?: string
  /** Hide the close (×) button in the header */
  hideCloseButton?: boolean
}

// ── Size map ─────────────────────────────────────────────────────
const sizeMap: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)]',
}

// ── Focusable elements query ──────────────────────────────────────
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// ── Component ────────────────────────────────────────────────────
const Modal: React.FC<ModalProps> = ({
  open: openProp,
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  preventBackdropClose = false,
  preventEscapeClose = false,
  size = 'md',
  className,
  hideCloseButton = false,
}) => {
  // Support isOpen alias for backwards compatibility
  const open = openProp ?? isOpen ?? false
  const titleId = useId()
  const descId  = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // ── Store element that had focus before modal opened ──
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement
      // Scroll lock
      document.body.style.overflow = 'hidden'
      // Focus first focusable element inside dialog
      requestAnimationFrame(() => {
        const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)
        first?.focus()
      })
    } else {
      document.body.style.overflow = ''
      // Restore focus to previously focused element
      previousFocusRef.current?.focus()
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // ── Escape key ────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape' && !preventEscapeClose) {
        e.stopPropagation()
        onClose()
      }

      // ── Focus trap: cycle Tab/Shift+Tab within dialog ──
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last  = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [onClose, preventEscapeClose]
  )

  const handleBackdropClick = useCallback(() => {
    if (!preventBackdropClose) onClose()
  }, [onClose, preventBackdropClose])

  // ── Do not render when closed ─────────────────────────────────
  if (!open) return null

  // ── Render via Portal ─────────────────────────────────────────
  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'motion-safe:animate-fade-in'
      )}
      // ARIA: mark entire overlay as dialog region
      role="presentation"
    >
      {/* ── Backdrop / Scrim — 50% black (WCAG modal legibility) ── */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={handleBackdropClick}
      />

      {/* ── Dialog panel ── */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        onKeyDown={handleKeyDown}
        tabIndex={-1} // Make div focusable for initial focus
        className={cn(
          // Positioning
          'relative z-10 w-full',
          sizeMap[size],
          // Surface
          'bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]',
          'border border-[hsl(var(--border))]',
          'rounded-2xl shadow-2xl',
          // Entrance animation
          'motion-safe:animate-scale-in',
          // Max height with scroll
          'max-h-[calc(100vh-2rem)] flex flex-col',
          className
        )}
      >
        {/* ── Header ── */}
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-[hsl(var(--border))] shrink-0">
            <div className="flex-1 min-w-0">
              {title && (
                <h2
                  id={titleId}
                  className="text-base font-semibold leading-tight text-[hsl(var(--foreground))] truncate"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id={descId}
                  className="mt-1 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed"
                >
                  {description}
                </p>
              )}
            </div>

            {/* Close button — RTL-safe: ms-auto */}
            {!hideCloseButton && (
              <button
                onClick={onClose}
                aria-label="Fermer la fenêtre"
                className={cn(
                  'shrink-0 h-8 w-8 rounded-md flex items-center justify-center',
                  'text-[hsl(var(--muted-foreground))]',
                  'hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'transition-colors duration-150',
                  'ms-auto'
                )}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* ── Body — scrollable ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* ── Footer ── */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)] rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

Modal.displayName = 'Modal'
export { Modal }

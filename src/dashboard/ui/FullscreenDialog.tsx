import { useEffect, useRef, type ReactNode } from 'react'

type FullscreenDialogProps = {
  open: boolean
  /** Esc: quien lo usa decide si cierra (p.ej. confirmar cambios sin guardar). */
  onRequestClose: () => void
  /** id del título visible, para `aria-labelledby`. */
  labelledBy: string
  children: ReactNode
}

/**
 * Diálogo a pantalla completa sobre `<dialog>` nativo, con el mismo comportamiento que Modal:
 * Esc, foco atrapado y fondo inerte; al abrirse enfoca `[data-autofocus]` y al cerrarse devuelve el foco.
 * Ocupa 100dvw × 100dvh y respeta las zonas seguras del móvil.
 */
export function FullscreenDialog({ open, onRequestClose, labelledBy, children }: FullscreenDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
      openerRef.current?.focus()
    }
  }, [open])

  // Sin scroll de la página de fondo mientras está abierto (iOS lo permite aunque el diálogo sea modal).
  useEffect(() => {
    if (!open) return
    const previous = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = previous
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault()
        onRequestClose()
      }}
      className={[
        'fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none overflow-hidden bg-sheet p-0 text-ink',
        'backdrop:bg-scrim',
        'opacity-0 transition-[opacity,display,overlay] duration-150 ease-out transition-discrete',
        'open:opacity-100 starting:open:opacity-0',
      ].join(' ')}
    >
      <div className="flex h-full flex-col pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
        {children}
      </div>
    </dialog>
  )
}

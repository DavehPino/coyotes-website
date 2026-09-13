import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import { CloseIcon } from './icons'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** Texto pequeño encima del título (p.ej. tipo o fecha). */
  eyebrow?: ReactNode
  children: ReactNode
}

/**
 * Diálogo modal sobre `<dialog>` nativo: Esc, foco atrapado y fondo inerte sin código extra.
 * Al cerrarse devuelve el foco al elemento que lo abrió.
 */
export function Modal({ open, onClose, title, eyebrow, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
      openerRef.current?.focus()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clic en el fondo (fuera del panel): el propio <dialog> es el objetivo.
        if (event.target === event.currentTarget) onClose()
      }}
      className={[
        'm-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-coyote-night p-0 text-coyote-silver shadow-border',
        'backdrop:bg-coyote-black/75',
        // Entrada y salida suaves: opacidad + desplazamiento corto, ease-out en ambas.
        'translate-y-2 opacity-0 transition-[opacity,translate,display,overlay] duration-200 ease-out transition-discrete',
        'open:translate-y-0 open:opacity-100 starting:open:translate-y-2 starting:open:opacity-0',
        'backdrop:opacity-0 backdrop:transition-opacity backdrop:duration-200 open:backdrop:opacity-100 starting:open:backdrop:opacity-0',
      ].join(' ')}
    >
      <div className="flex max-h-[85dvh] flex-col">
        <header className="flex items-start gap-3 p-4 pb-2 pl-5">
          <div className="min-w-0 flex-1">
            {eyebrow && <div className="mb-1.5 flex flex-wrap items-center gap-1.5">{eyebrow}</div>}
            <h2 id={titleId} className="text-3xl leading-none text-coyote-gold">
              {title}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar" className="-mt-1 -mr-1">
            <CloseIcon strokeWidth={2} />
          </Button>
        </header>
        <div className="overflow-y-auto px-5 pt-2 pb-5">{children}</div>
      </div>
    </dialog>
  )
}

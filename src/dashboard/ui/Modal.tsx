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
  /** Pie fijo bajo el contenido desplazable (botones de acción). */
  footer?: ReactNode
  /** false: ni Esc, ni clic en el fondo, ni botón de cerrar (p.ej. durante una subida). */
  dismissible?: boolean
  /** Al cambiar, el contenido vuelve arriba (p.ej. al pasar de paso en un formulario). */
  scrollResetKey?: string | number
  /** `lg`: panel ancho (48 rem) para tablas y gráficos. */
  size?: 'md' | 'lg'
}

const SIZES = { md: 'max-w-lg', lg: 'max-w-3xl' } as const

/**
 * Diálogo modal sobre `<dialog>` nativo: Esc, foco atrapado y fondo inerte sin código extra.
 * Al abrirse enfoca el elemento con `data-autofocus`; al cerrarse devuelve el foco a quien lo abrió.
 */
export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  dismissible = true,
  scrollResetKey,
  size = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

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

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 })
  }, [scrollResetKey])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Esc: el cierre lo decide el estado de React, nunca el navegador por su cuenta.
        event.preventDefault()
        if (dismissible) onClose()
      }}
      onClose={onClose}
      onClick={(event) => {
        // Clic en el fondo (fuera del panel): el propio <dialog> es el objetivo.
        if (dismissible && event.target === event.currentTarget) onClose()
      }}
      className={[
        `m-auto w-[calc(100%-2rem)] ${SIZES[size]} rounded-2xl bg-coyote-night p-0 text-coyote-silver shadow-border`,
        'backdrop:bg-coyote-black/75',
        // Entrada y salida suaves: opacidad + desplazamiento corto, ease-out en ambas.
        'translate-y-2 opacity-0 transition-[opacity,translate,display,overlay] duration-200 ease-out transition-discrete',
        'open:translate-y-0 open:opacity-100 starting:open:translate-y-2 starting:open:opacity-0',
        'backdrop:opacity-0 backdrop:transition-opacity backdrop:duration-200 open:backdrop:opacity-100 starting:open:backdrop:opacity-0',
      ].join(' ')}
    >
      <div className="flex max-h-[85dvh] flex-col">
        <header className="flex min-h-14 items-start gap-3 p-4 pb-2 pl-5">
          <div className="min-w-0 flex-1">
            {eyebrow && <div className="mb-1.5 flex flex-wrap items-center gap-1.5">{eyebrow}</div>}
            <h2 id={titleId} className="text-3xl leading-none text-coyote-gold">
              {title}
            </h2>
          </div>
          {dismissible && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar" className="-mt-1 -mr-1">
              <CloseIcon strokeWidth={2} />
            </Button>
          )}
        </header>
        <div ref={contentRef} className="overflow-y-auto px-5 pt-2 pb-5">
          {children}
        </div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-coyote-steel/60 px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  )
}

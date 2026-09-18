import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import { CloseIcon } from './icons'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** Nota bajo el título (paso del formulario, procedencia, aviso). Nunca encima: el título manda. */
  meta?: ReactNode
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
  meta,
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
        `m-auto w-[calc(100%-2rem)] ${SIZES[size]} on-surface rounded-md bg-surface p-0 text-ink shadow-dialog`,
        'backdrop:bg-scrim/70',
        // Entrada y salida suaves: opacidad + desplazamiento corto, ease-out en ambas.
        'translate-y-2 opacity-0 transition-[opacity,translate,display,overlay] duration-200 ease-out transition-discrete',
        'open:translate-y-0 open:opacity-100 starting:open:translate-y-2 starting:open:opacity-0',
        // Movimiento reducido: solo el fundido, sin desplazamiento.
        'motion-reduce:translate-y-0 motion-reduce:starting:open:translate-y-0',
        'backdrop:opacity-0 backdrop:transition-opacity backdrop:duration-200 open:backdrop:opacity-100 starting:open:backdrop:opacity-0',
      ].join(' ')}
    >
      <div className="flex max-h-[85dvh] flex-col">
        <header className="flex min-h-14 shrink-0 items-start gap-3 p-4 pb-2 pl-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-3xl leading-none text-ink">
              {title}
            </h2>
            {meta && <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-ink-soft">{meta}</div>}
          </div>
          {dismissible && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar" className="-mt-1 -mr-1">
              <CloseIcon strokeWidth={2} />
            </Button>
          )}
        </header>
        <div ref={contentRef} className="relative overflow-y-auto px-5 pt-2 pb-5">
          {children}
        </div>
        {footer && (
          // En móvil los botones se apilan a lo ancho con la acción principal arriba; desde `sm`, en fila a la derecha.
          // La acción apartada a la izquierda (`mr-auto`, p.ej. «Eliminar» en un diálogo de lectura) no se estira: queda
          // la última, compacta y separada, para que borrar no pese más que todo lo demás.
          <footer
            className={[
              'flex shrink-0 flex-col-reverse gap-2 border-t border-ink/15 px-5 py-3',
              'max-sm:[&>*]:mr-0 max-sm:[&>*]:w-full',
              'max-sm:[&>.mr-auto]:mt-2 max-sm:[&>.mr-auto]:w-auto max-sm:[&>.mr-auto]:self-start',
              'sm:flex-row sm:flex-wrap sm:items-center sm:justify-end',
            ].join(' ')}
          >
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  )
}
